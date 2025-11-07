import express from 'express';
import pino from 'pino';
import pinoHttp from 'pino-http';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import { security } from './middlewares/security';
import { errorHandler } from './middlewares/error';
import locationRoutes from './routes/location.routes';
import storeRoutes from './routes/store.routes';
import favoriteRoutes from "./routes/favorite.routes";
import { rateLimit } from './middlewares/rate-limit';



export function createApp() {
    const app = express();

    // app.use(pinoHttp({ logger }));
    app.use(express.json());
    app.use(...security);
    app.use(rateLimit);

    app.use('/v1', healthRoutes);
    app.use('/v1/auth', authRoutes);
    app.use('/v1', locationRoutes);
    app.use('/v1', storeRoutes);
    app.use('/v1', favoriteRoutes);

    app.use((_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND' } }));
    app.use(errorHandler);

    return app;
}
