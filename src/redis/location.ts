import { redis } from './client';
import { env } from '../config/env';

const GEO_KEY = env.GEO_KEY;

export async function setLatestLocation(userId: string, lat: number, lon: number) {
    // 1) add/update in geoset (lon, lat order!)
    await redis.geoadd(GEO_KEY, lon, lat, userId);
    // 2) store a small hash for quick read
    const ts = new Date().toISOString();
    await redis.hset(`user:last:${userId}`, { lat: String(lat), lon: String(lon), ts });
}

export async function getLatestLocation(userId: string) {
    const [h, pos] = await Promise.all([
        redis.hgetall(`user:last:${userId}`),
        redis.geopos(GEO_KEY, userId),
    ]);

    if (!h || !h.lat || !pos || !pos[0]) return null;

    const [lonStr, latStr] = pos[0] as unknown as [string, string];
    return {
        userId,
        lat: Number(h.lat ?? latStr),
        lon: Number(h.lon ?? lonStr),
        ts:  h.ts ?? null,
    };
}

export async function findNearbyUsers(lat: number, lon: number, radiusKm: number, count = 100) {
    // Redis 6.2+ GEOSEARCH
    // returns just member names; we can enrich with HGETALL if needed.
    const members = await redis.geosearch(
        GEO_KEY,
        'FROMLONLAT', lon, lat,
        'BYRADIUS', radiusKm, 'km',
        'ASC',
        'COUNT', count
    );

    // optional: fetch hashes for each user to include lat/lon/ts
    if (!members.length) return [];

    const pipeline = redis.pipeline();
    for (const m of members) pipeline.hgetall(`user:last:${m}`);
    const results = (await pipeline.exec())?.map(([, val]) => val) as Array<Record<string,string>>;

    const out = [];
    for (let i = 0; i < members.length; i++) {
        const meta = results[i] || {};
        out.push({
            userId: members[i],
            lat: meta.lat ? Number(meta.lat) : undefined,
            lon: meta.lon ? Number(meta.lon) : undefined,
            ts: meta.ts || null,
        });
    }
    return out;
}
