import { Router } from 'express';
import { z } from 'zod';
import { authGuard } from '../middlewares/auth';
import { validate } from '../middlewares/validator';
import { AppDataSource } from '../db/data-source';
import { LocationService } from '../services/location.service';
import { Request, Response, NextFunction } from 'express';

const router = Router();
const svc = new LocationService(AppDataSource); // pass AppDataSource OR omit to disable SQL history


const Body = z.object({
    body: z.object({
        lat: z.string(),
        lon: z.string()
    }),
});

// POST /v1/users/me/location  -> update latest in Redis (+ optional SQL history) and emit realtime
router.post('/users/me/location', authGuard, validate(Body), async ( req: Request,
                                                                     res: Response,
                                                                     next: NextFunction) => {
    try {
        const user = (req as any).user as { sub: string }; // UUID from your JWT
        const { lat, lon } = req.body
        await svc.updateUserLocation(user.sub, lat, lon);
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
});

// GET /v1/users/:id/latest-location -> read from Redis
router.get('/users/:id/latest-location', authGuard, async (    req: Request,
                                                               res: Response,
                                                               next: NextFunction) => {
    try {
        // TODO: add authorization if needed
        const latest = await svc.getLatest(String(req.params.id));
        if (!latest) return res.status(404).json({ error: 'Not found' });
        res.json(latest);
    } catch (err) {
        next(err);
    }
});

// GET /v1/users/nearby?lat=..&lon=..&radiusKm=..&count=..
router.get('/users/nearby', authGuard, async ( req: Request,
                                               res: Response,
                                               next: NextFunction) => {
    try {
        const lat = Number(req.query.lat);
        const lon = Number(req.query.lon);
        const radiusKm = Number(req.query.radiusKm || 5);
        const count = Number(req.query.count || 100);
        if (Number.isNaN(lat) || Number.isNaN(lon)) return res.status(400).json({ error: 'lat/lon required' });

        const results = await svc.findNearby(lat, lon, radiusKm, count);
        res.json({ count: results.length, results });
    } catch (err) {
        next(err);
    }
});

export default router;
