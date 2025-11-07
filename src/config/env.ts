import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(8080),
    DB_HOST: z.string(),
    DB_PORT: z.coerce.number().default(3306),
    DB_USER: z.string(),
    DB_PASSWORD: z.string(),
    DB_NAME: z.string(),
    JWT_SECRET: z.string(),
    JWT_EXPIRES_IN: z.string(),
    JWT_RESET_SECRET: z.string(),
    JWT_RESET_EXPIRES: z.string(),
    SMTP_HOST: z.string(),
    SMTP_USER: z.string(),
    SMTP_FROM: z.string(),
    SMTP_PASS: z.string(),
    SMTP_PORT: z.string(),
    BASE_URL: z.string(),
    REDIS_URL: z.string().default('redis://localhost:6379'),
    GEO_KEY: z.string().default('geo:users:latest'),
});

export const env = EnvSchema.parse(process.env);

