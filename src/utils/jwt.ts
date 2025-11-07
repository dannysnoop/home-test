import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
    sub: number;
    username: string;
}

export function verifyToken(token: string): JwtPayload | null {
    try {
        const payload = jwt.verify(token, env.JWT_SECRET);
        if (
            typeof payload === 'object' &&
            payload &&
            'sub' in payload &&
            'username' in payload
        ) {
            return {
                sub: Number((payload as any).sub),
                username: String((payload as any).username),
            };
        }
        return null;
    } catch {
        return null;
    }
}