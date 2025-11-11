import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { ERRORS } from '../constants/errors';

export type JwtUser = { id: string; username: string; scope?: string };

export function authGuard(requiredScopes: string[] = []) {
    return (req: Request, res: Response, next: NextFunction) => {
        const h = req.headers.authorization;
        if (!h?.startsWith('Bearer ')) return res.status(401).json({ error:  ERRORS.UNAUTHORIZED });
        try {
            const user = jwt.verify(h.slice(7), env.JWT_SECRET) as JwtUser;
            (req as any).user = user;

            if (requiredScopes.length) {
                const have = new Set((user.scope || '').split(' ').filter(Boolean));
                const ok = requiredScopes.every(s => have.has(s));
                if (!ok) return res.status(403).json({ error: 'Forbidden' });
            }
            next();
        } catch {
            return res.status(401).json({ error: 'Invalid token' });
        }
    };
}
