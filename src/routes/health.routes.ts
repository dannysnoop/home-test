import { Router } from 'express';
import { AppDataSource } from '../db/data-source';

const router = Router();

router.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        uptimeSec: Math.round(process.uptime()),
        ts: new Date().toISOString(),
    });
});


router.get('/health/db', async (_req, res, next) => {
    try {
        await AppDataSource.query('SELECT 1');
        res.json({ db: 'ok' });
    } catch (e) {
        next(e);
    }
})

export default router;
