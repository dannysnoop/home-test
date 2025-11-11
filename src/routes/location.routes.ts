import { Router } from 'express';
import { z } from 'zod';
import { authGuard } from '../middlewares/auth';
import { AppDataSource } from '../db/data-source';
import { LocationService } from '../services/location.service';
import { Request, Response, NextFunction } from 'express';
import { User } from "../types/express";

const router = Router();
const svc = new LocationService(AppDataSource);

router.use(authGuard());

const Body = z.object({
    lat: z.number(),
    lon: z.number(),
});

const NearbyQuery = z.object({
    lat: z.string(),
    lon: z.string(),
    radiusKm: z.string().optional().default("5"),
    count: z.string().optional().default("100"),
});

// POST /v1/users/me/location -> update latest in Redis (+ optional SQL history) and emit realtime
router.post('/users/me/location', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user as User;
        const { lat, lon } = Body.parse(req.body);

        await svc.updateUserLocation(user.id, lat, lon);
        res.json({ message: 'User location updated successfully' });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: err.flatten() });
        }
        next(err);
    }
});

// GET /v1/users/:id/latest-location -> read from Redis
router.get('/users/latest-location', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user as User;
        const latest = await svc.getLatest(String(user.id));

        if (!latest) return res.status(404).json({ error: 'Not found' });
        res.json(latest);
    } catch (err) {
        next(err);
    }
});

// GET /v1/users/nearby?lat=..&lon=..&radiusKm=..&count=..
router.get('/users/nearby', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { lat, lon, radiusKm, count } = NearbyQuery.parse(req.query);

        const results = await svc.findNearby(
            Number(lat),
            Number(lon),
            Number(radiusKm),
            Number(count)
        );

        res.json({ count: results.length, results });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: err.flatten() });
        }
        next(err);
    }
});

export default router;