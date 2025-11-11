import { AppDataSource } from '../db/data-source';

export type StoreSearchParams = {
    lat?: number;
    lon?: number;
    radiusKm?: number;
    name?: string;
    serviceType?: string;
    north?: number; south?: number; east?: number; west?: number;
    limit?: number;
    offset?: number;
};

export type StoreSearchRow = {
    id: string;
    name: string;
    address: string | null;
    serviceType: string;
    lat: number;
    lon: number;
    distance_m?: number;
};

export class StoreSearchService {
    async search(params: StoreSearchParams): Promise<{ count: number; results: StoreSearchRow[] }> {
        const {
            lat, lon, radiusKm = 5,
            name, serviceType,
            north, south, east, west,
            limit = 50, offset = 0,
        } = params;

        const runner = AppDataSource.createQueryRunner();
        await runner.connect();

        try {
            const lim = Math.min(200, Math.max(1, Math.floor(limit)));
            const off = Math.max(0, Math.floor(offset));

            const where: string[] = ['1=1'];
            const args: any[] = [];

            let selectDistance = '';
            let orderBy = 'ORDER BY s.name ASC';

            // name (case-insensitive)
            if (name?.trim()) {
                where.push('LOWER(s.name) LIKE ?');
                args.push(`%${name.trim().toLowerCase()}%`);
            }

            // serviceType (case-insensitive)
            if (serviceType?.trim()) {
                where.push('LOWER(t.name) = ?');
                args.push(serviceType.trim().toLowerCase());
            }

            // viewport (auto-fix reversed bounds)
            const hasBox = [north, south, east, west].every(v => Number.isFinite(v as number));
            if (hasBox) {
                const n = Math.max(north as number, south as number);
                const s = Math.min(north as number, south as number);
                const e = Math.max(east as number, west as number);
                const w = Math.min(east as number, west as number);
                where.push('s.lat BETWEEN ? AND ?');
                where.push('s.lon BETWEEN ? AND ?');
                args.push(s, n, w, e);
            }

            // center + radius (Haversine, NO bbox prefilter)
            const hasCenter = Number.isFinite(lat) && Number.isFinite(lon);
            if (hasCenter) {
                // distance expression (meters), clamped to [-1,1]
                const distExpr = `
        (6371000 * ACOS(
          GREATEST(-1, LEAST(1,
            COS(RADIANS(?)) * COS(RADIANS(s.lat)) *
            COS(RADIANS(s.lon) - RADIANS(?)) +
            SIN(RADIANS(?)) * SIN(RADIANS(s.lat))
          ))
        ))
      `;

                // select distance for ordering/return value
                selectDistance = `, ${distExpr} AS distance_m`;

                // WHERE distance <= radius
                where.push(`${distExpr} <= ?`);

                // order of placeholders for each distExpr is: lat, lon, lat
                // we use it twice (once in SELECT, once in WHERE), so push twice
                args.push(lat as number, lon as number, lat as number); // for SELECT
                args.push(lat as number, lon as number, lat as number); // for WHERE
                args.push((radiusKm ?? 5) * 1000); // radius meters

                orderBy = 'ORDER BY distance_m ASC, s.name ASC';
            }

            args.push(lim, off);

            const sql = `
                SELECT
                    s.id, s.name, s.address,
                    COALESCE(t.name, '') AS serviceType,
                    s.lat AS lat, s.lon AS lon
                    ${selectDistance}
                FROM stores s
                         LEFT JOIN service_types t ON t.id = s.service_type_id
                WHERE ${where.join(' AND ')}
                    ${orderBy}
      LIMIT ? OFFSET ?
            `;

            const rows: StoreSearchRow[] = await runner.query(sql, args);
            return { count: rows.length, results: rows };
        } finally {
            await runner.release();
        }
    }
}
