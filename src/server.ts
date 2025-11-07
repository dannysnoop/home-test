import 'reflect-metadata';
import { createApp } from './app';
import { env } from './config/env';
import { AppDataSource } from './db/data-source';
import http from 'http';
import { initWebsocket } from './realtime/ws';

(async () => {
    try {
        await AppDataSource.initialize();          // ✅ KHỞI TẠO DB TRƯỚC
        const app = createApp();
        const server = http.createServer(app);
        initWebsocket(server); // ← enables Socket.IO
        app.listen(env.PORT, () => {
            console.log(`[server] http://localhost:${env.PORT}`);
        });
    } catch (e) {
        console.error('Failed to start:', e);
        process.exit(1);
    }
})();