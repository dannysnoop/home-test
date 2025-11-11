// src/services/location.service.ts
import { DataSource, Repository } from 'typeorm';
import { redis } from '../redis/client';
import { env } from '../config/env';
import { emitUserLocationUpdate } from '../realtime/emitter';

// OPTIONAL: keep if you want SQL history. Remove if not needed.
import { UserLocation } from '../entities/UserLocation';

type Latest = { userId: string; lat: number; lon: number; ts: string };

const GEO_KEY = env.GEO_KEY;                 // e.g. "geo:users:latest"
const KEY_USER_LAST = (id: string) => `user:last:${id}`;
const HASH_TTL_SECONDS = 24 * 60 * 60;       // optional 24h TTL (tweak or remove)

export class LocationService {
    private readonly db?: DataSource;
    private readonly historyRepo?: Repository<UserLocation>;

    constructor(db?: DataSource) {
        this.db = db;
        if (db) this.historyRepo = db.getRepository(UserLocation);
    }

    /**
     * Update user's latest position (UUID userId)
     * - Atomic Redis update (GEOSET + HASH)
     * - Optional SQL history append
     * - Realtime emit
     */
    async updateUserLocation(userId: string, lat: number, lon: number): Promise<void> {
        // Validate basic ranges to avoid garbage writes
        if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
            throw Object.assign(new Error('Invalid coordinates'), { status: 400 });
        }

        const ts = new Date().toISOString();

        // 1) Redis: atomic multi (lon,lat order for GEO*)
        await redis
            .multi()
            .geoadd(GEO_KEY, lon, lat, userId)
            .hset(KEY_USER_LAST(userId), { lat: String(lat), lon: String(lon), ts })
            .expire(KEY_USER_LAST(userId), HASH_TTL_SECONDS) // optional: auto-expire stale users
            .exec();

        // 2) Optional history (don’t fail the request if it errors)
        if (this.historyRepo) {
            try {
                const rec = this.historyRepo.create({ userId, lat, lon });
                await this.historyRepo.save(rec);

            } catch (e) {
                console.warn('[LocationService] history write failed:', e);
            }
        }

    }

    /** Read user's latest from Redis (hash-first; no need to call GEOPOS if hash exists) */
    async getLatest(userId: string): Promise<Latest | null> {
        const h = await redis.hgetall(KEY_USER_LAST(userId));
        if (h && h.lat && h.lon) {
            return { userId, lat: Number(h.lat), lon: Number(h.lon), ts: h.ts ?? '' };
        }

        // Fallback: if hash missing but member is in geoset
        const pos = await redis.geopos(GEO_KEY, userId);
        const p = pos?.[0];
        if (!p) return null;
        const [lonStr, latStr] = p as unknown as [string, string];
        return { userId, lat: Number(latStr), lon: Number(lonStr), ts: '' };
    }

    /**
     * Find nearby users using Redis GEOSEARCH
     * Returns user IDs with metadata from their HASH if present.
     */
    async findNearby(lat: number, lon: number, radiusKm: number, count = 100): Promise<Latest[]> {
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
            throw Object.assign(new Error('lat/lon required'), { status: 400 });
        }

        const limit = Math.min(Math.max(1, Math.floor(count)), 500);

        const members = await redis.geosearch(
            GEO_KEY,
            'FROMLONLAT', lon, lat,
            'BYRADIUS', radiusKm, 'km',
            'ASC',
            'COUNT', limit
        );

        if (!members.length) return [];

        // batch fetch HASH meta
        const pipe = redis.pipeline();
        for (const id of members) pipe.hgetall(KEY_USER_LAST(id as string));
        const exec = await pipe.exec();

        const out: Latest[] = [];
        for (let i = 0; i < members.length; i++) {
            const meta = (exec?.[i]?.[1] as Record<string, string>) || {};
            out.push({
                userId: members[i] as string,
                lat: meta.lat ? Number(meta.lat) : NaN,
                lon: meta.lon ? Number(meta.lon) : NaN,
                ts: meta.ts ?? '',
            });
        }
        return out;
    }

    /** Optional: mark user as offline / remove from latest set */
    async removeLatest(userId: string): Promise<void> {
        await redis.multi()
            .zrem(GEO_KEY, userId)
            .del(KEY_USER_LAST(userId))
            .exec();
    }
}
