import { AppDataSource } from '../db/data-source';

export type StoreSearchParams = {
    lat?: number;        // center latitude (optional)
    lon?: number;        // center longitude (optional)
    radiusKm?: number;   // default 5
    name?: string;       // partial match
    serviceType?: string;// exact name of service type
    north?: number; south?: number; east?: number; west?: number; // optional viewport box
    limit?: number;      // default 50, max 200
    offset?: number;     // default 0
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

        const qb = AppDataSource.createQueryRunner();
        await qb.connect();

        try {
            const sqlParams: any = {
                lim: Math.min(200, Math.max(1, Math.floor(limit))),
                off: Math.max(0, Math.floor(offset)),
            };

            let where = '1=1';
            let selectDistance = '';
            let havingDistance = '';
            let orderBy = 'ORDER BY s.name ASC';

            if (name && name.trim()) {
                sqlParams.name = `%${name.trim()}%`;
                where += ' AND s.name LIKE :name';
            }
            if (serviceType && serviceType.trim()) {
                sqlParams.serviceType = serviceType.trim();
                where += ' AND t.name = :serviceType';
            }

            // viewport bounding box (for map)
            const hasBox = [north, south, east, west].every(v => typeof v === 'number' && Number.isFinite(v as number));
            if (hasBox) {
                sqlParams.north = north; sqlParams.south = south; sqlParams.east = east; sqlParams.west = west;
                where += ' AND ST_Y(s.location) BETWEEN :south AND :north';
                where += ' AND ST_X(s.location) BETWEEN :west AND :east';
            }

            // circle radius (precise distance ordering if lat/lon provided)
            const hasCenter = typeof lat === 'number' && typeof lon === 'number' && Number.isFinite(lat) && Number.isFinite(lon);
            if (hasCenter) {
                sqlParams.lat = lat; sqlParams.lon = lon; sqlParams.radiusMeters = (radiusKm ?? 5) * 1000;
                selectDistance = ', ST_Distance_Sphere(POINT(:lon, :lat), s.location) AS distance_m';
                havingDistance = ' HAVING distance_m <= :radiusMeters';
                orderBy = 'ORDER BY distance_m ASC';
            }

            const rows: StoreSearchRow[] = await qb.query(
                `
        SELECT
          s.id, s.name, s.address,
          t.name AS serviceType,
          ST_Y(s.location) AS lat,
          ST_X(s.location) AS lon
          ${selectDistance}
        FROM stores s
        JOIN service_types t ON t.id = s.service_type_id
        WHERE ${where}
        ${havingDistance}
        ${orderBy}
        LIMIT :lim OFFSET :off
        `,
                sqlParams
            );

            return { count: rows.length, results: rows };
        } finally {
            await qb.release();
        }
    }
}
