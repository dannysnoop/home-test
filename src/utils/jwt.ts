import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
    id: string;
    username: string;
}

export function verifyToken(token: string): JwtPayload | null {
    try {
        const payload = jwt.verify(token, env.JWT_SECRET);
        if (
            typeof payload === 'object' &&
            payload
        ) {
            return {
                id: payload.id,
                username: payload.username,
            };
        }
        return null;
    } catch {
        return null;
    }
}