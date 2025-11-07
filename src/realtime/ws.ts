import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { verifyToken } from '../utils/jwt';

type JwtUser = { sub: string; username: string };

let io: Server | null = null;

export function initWebsocket(server: HttpServer) {
    io = new Server(server, {
        cors: { origin: true, credentials: true }, // allow your mobile/web client
    });

    // JWT auth for sockets
    io.use((socket, next) => {
        try {
            const token = (socket.handshake.auth?.token || socket.handshake.query?.token) as string | undefined;
            if (!token) return next(new Error('auth required'));
            const user = verifyToken(token) as JwtUser | null;
            if (!user) return next(new Error('invalid token'));
            socket.data.user = user;            // stash the user on the socket
            next();
        } catch {
            next(new Error('invalid token'));
        }
    });

    io.on('connection', (socket) => {
        const user = socket.data.user as JwtUser;
        const room = `user:${user.sub}`;

        // each user gets their own room for targeted pushes
        socket.join(room);
        socket.emit('ready', { userId: user.sub });

        // optional: allow clients to follow other users (add your own auth checks)
        socket.on('subscribe:user', (targetId: string) => socket.join(`user:${targetId}`));
        socket.on('unsubscribe:user', (targetId: string) => socket.leave(`user:${targetId}`));

        socket.on('disconnect', () => {
            // cleanup/logging if needed
        });
    });

    return io;
}

// Push a location update to a user’s room
export function emitUserLocationUpdate(userId: string, payload: unknown) {
    if (!io) return;
    io.to(`user:${userId}`).emit('location:update', payload);
}

// (optional) access to io elsewhere
export function getIO() {
    return io ?? undefined;
}
