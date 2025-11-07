import { Router } from 'express';
import { z } from 'zod';
import {StoreSearchService} from "./store-search.service";

const router = Router();
const service = new StoreSearchService();

const QuerySchema = z.object({
    lat: z.coerce.number().optional(),
    lon: z.coerce.number().optional(),
    radiusKm: z.coerce.number().optional(),        // default handled in service
    name: z.string().optional(),
    serviceType: z.string().optional(),
    north: z.coerce.number().optional(),
    south: z.coerce.number().optional(),
    east: z.coerce.number().optional(),
    west: z.coerce.number().optional(),
    limit: z.coerce.number().optional(),
    offset: z.coerce.number().optional(),
});

router.get('/stores/search', async (req, res) => {
    const parsed = QuerySchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const data = parsed.data;
    const result = await service.search({
        lat: data.lat,
        lon: data.lon,
        radiusKm: data.radiusKm ?? 5,
        name: data.name,
        serviceType: data.serviceType,
        north: data.north, south: data.south, east: data.east, west: data.west,
        limit: data.limit ?? 50,
        offset: data.offset ?? 0,
    });

    res.json(result);
});

export default router;
