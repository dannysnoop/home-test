import { Router } from 'express';
import { z } from 'zod';
import { AppDataSource } from '../db/data-source';
import { FavoriteService } from '../services/favorite.service';
import { authGuard } from '../middlewares/auth';

const router = Router();
const svc = new FavoriteService(AppDataSource);
const uuid = z.string().uuid();

router.use(authGuard);

router.post('/users/me/favorites/:storeId', async (req, res, next) => {
    try {
        const user = (req as any).user as { sub: string };
        const p = uuid.safeParse(req.params.storeId);
        if (!p.success) return res.status(400).json({ error: 'Invalid storeId' });
        const out = await svc.add(user.sub, p.data);
        res.status(out.created ? 201 : 200).json({ ok: true, created: out.created });
    } catch (e) { next(e); }
});

router.delete('/users/me/favorites/:storeId', async (req, res, next) => {
    try {
        const user = (req as any).user as { sub: string };
        const p = uuid.safeParse(req.params.storeId);
        if (!p.success) return res.status(400).json({ error: 'Invalid storeId' });
        await svc.remove(user.sub, p.data);
        res.json({ ok: true });
    } catch (e) { next(e); }
});

router.get('/users/me/favorites', async (req, res, next) => {
    try {
        const user = (req as any).user as { sub: string };
        const limit = Number(req.query.limit ?? 50);
        const offset = Number(req.query.offset ?? 0);
        const result = await svc.list(user.sub, { limit, offset });
        res.json(result);
    } catch (e) { next(e); }
});

export default router;
