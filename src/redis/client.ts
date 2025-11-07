import IORedis from 'ioredis';
import { env } from '../config/env';

export const redis = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
});

redis.on('connect', () => console.log('[redis] connected'));
redis.on('error', (e) => console.error('[redis] error', e));
