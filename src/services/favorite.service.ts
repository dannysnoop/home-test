import { DataSource, Repository } from 'typeorm';
import { Favorite } from '../entities/Favorite';
import { Store } from '../entities/Store';

export type FavoriteListItem = {
    id: string;                // store id
    name: string;
    address: string | null;
    lat: number;
    lon: number;
    serviceType: string;
    favoritedAt: string;       // ISO string
};

export type FavoriteListResult = {
    count: number;
    results: FavoriteListItem[];
};

export class FavoriteService {
    private favRepo: Repository<Favorite>;
    private storeRepo: Repository<Store>;

    constructor(private readonly db: DataSource) {
        this.favRepo = db.getRepository(Favorite);
        this.storeRepo = db.getRepository(Store);
    }

    /**
     * Idempotent add: returns { created: true } if a new row was added,
     * or { created: false } if it already existed.
     */
    async add(userId: string, storeId: string): Promise<{ created: boolean }> {
        const exists = await this.favRepo.exist({ where: { userId, storeId } });
        if (exists) return { created: false };

        const fav = this.favRepo.create({ userId, storeId });
        await this.favRepo.save(fav).catch((e) => {
            // Handle race condition on PK (userId, storeId)
            if ((e as any)?.code !== 'ER_DUP_ENTRY') throw e;
        });
        return { created: true };
    }

    /** Remove favorite (no error if it wasn't there). */
    async remove(userId: string, storeId: string): Promise<void> {
        await this.favRepo.delete({ userId, storeId });
    }

    /** Toggle favorite; returns new state. */
    async toggle(userId: string, storeId: string): Promise<{ favorite: boolean }> {
        const exists = await this.favRepo.exist({ where: { userId, storeId } });
        if (exists) {
            await this.favRepo.delete({ userId, storeId });
            return { favorite: false };
        }
        const fav = this.favRepo.create({ userId, storeId });
        await this.favRepo.save(fav).catch((e) => {
            if ((e as any)?.code !== 'ER_DUP_ENTRY') throw e;
        });
        return { favorite: true };
    }

    /** Check if a store is favorited by user. */
    async exists(userId: string, storeId: string): Promise<boolean> {
        return this.favRepo.exist({ where: { userId, storeId } });
    }

    /** List favorites with store data (paginated, newest first). */
    async list(
        userId: string,
        opts?: { limit?: number; offset?: number }
    ): Promise<FavoriteListResult> {
        const limit = Math.min(200, Math.max(1, Math.floor(opts?.limit ?? 50)));
        const offset = Math.max(0, Math.floor(opts?.offset ?? 0));

        const rows: FavoriteListItem[] = await this.db.query(
            `
      SELECT
        f.store_id AS id,
        s.name,
        s.address,
        s.lat,
        s.lon,
        st.name AS serviceType,
        DATE_FORMAT(f.created_at, '%Y-%m-%dT%H:%i:%sZ') AS favoritedAt
      FROM favorites f
      JOIN stores s ON s.id = f.store_id
      JOIN service_types st ON st.id = s.service_type_id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
      `,
            [userId, limit, offset]
        );

        return { count: rows.length, results: rows };
    }

    /** (Optional) List just the IDs, useful for client-side “heart” states. */
    async listIds(userId: string): Promise<string[]> {
        const rows = await this.favRepo.find({
            select: { storeId: true },
            where: { userId },
            order: { createdAt: 'DESC' as any },
        });
        return rows.map((r) => r.storeId);
    }
}
