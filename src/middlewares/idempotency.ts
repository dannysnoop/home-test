import { Request, Response, NextFunction } from 'express';
import { redis } from '../redis/client';

/**
 * Makes POST/PUT/PATCH idempotent when client sends Idempotency-Key header.
 * Caches the final JSON response for 30 minutes.
 */
export async function idempotency(req: Request, res: Response, next: NextFunction) {
    if (!['POST', 'PUT', 'PATCH'].includes(req.method)) return next();
    const key = req.header('Idempotency-Key');
    if (!key) return next();

    const cacheKey = `idem:${req.method}:${req.path}:${key}`;
    const cached = await redis.get(cacheKey);
    if (cached) return res.status(200).json(JSON.parse(cached));

    const json = res.json.bind(res);
    (res as any).json = (body: any) => {
        redis.set(cacheKey, JSON.stringify(body), 'EX', 60 * 30).catch(() => {});
        return json(body);
    };

    next();
}
