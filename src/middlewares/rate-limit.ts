import { RateLimiterRedis } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';
import { redis } from '../redis/client';
import {ERRORS} from "../constants/errors";

const limiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'rl:global',
    points: 300,   // requests
    duration: 60   // per 60s
});

export async function rateLimit(req: Request, res: Response, next: NextFunction) {
    try {
        await limiter.consume(req.ip || 'anon');
        next();
    } catch {
        res.status(429).json({ error: ERRORS.TOO_MANY_REQ } );
    }
}
