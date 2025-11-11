// src/routes/favorite.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppDataSource } from '../db/data-source';
import { FavoriteService } from '../services/favorite.service';
import { authGuard } from '../middlewares/auth';
import { User } from "../types/express";

const router = Router();
const svc = new FavoriteService(AppDataSource);

// Schemas
const ParamsStoreId = z.object({
    storeId: z.string().uuid('storeId must be a valid UUID'),
});

const QueryList = z.object({
    limit: z.coerce.number().int().min(1).max(200).default(50),
    offset: z.coerce.number().int().min(0).default(0),
});

// Protect all routes under this router
router.use(authGuard());

/**
 * POST /users/me/favorites/:storeId
 * Idempotent add. 201 if created, 200 if already there.
 */
router.post(
    '/users/me/favorites/:storeId',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = req.user as User;
            const { storeId } = ParamsStoreId.parse(req.params);

            const out = await svc.add(user.id, storeId);
            return res.status(out.created ? 201 : 200).json({ ok: true, created: out.created });
        } catch (e) {
            if (e instanceof z.ZodError) {
                return res.status(400).json({ error: e.flatten() });
            }
            next(e);
        }
    }
);

/**
 * DELETE /users/me/favorites/:storeId
 * Idempotent remove. Always 204 on success.
 */
router.delete(
    '/users/me/favorites/:storeId',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = req.user as User;
            const { storeId } = ParamsStoreId.parse(req.params);

            await svc.remove(user.id, storeId);
            return res.status(200).json({ message: 'Favorite removed successfully' });        }

        catch (e) {
            if (e instanceof z.ZodError) {
                return res.status(400).json({ error: e.flatten() });
            }
            next(e);
        }
    }
);

/**
 * GET /users/me/favorites
 * List current user's favorites with pagination.
 */
router.get(
    '/users/me/favorites',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = req.user as User;
            const { limit, offset } = QueryList.parse(req.query);

            const result = await svc.list(user.id, { limit, offset });
            return res.json(result);
        } catch (e) {
            if (e instanceof z.ZodError) {
                return res.status(400).json({ error: e.flatten() });
            }
            next(e);
        }
    }
);

export default router;