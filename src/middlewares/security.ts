import helmet from 'helmet';
import cors from 'cors';
import { RequestHandler } from 'express';

export const security = [
    helmet(),                                  // bảo vệ header
    cors({ origin: true, credentials: true }), // mở CORS cho mobile app
] as RequestHandler[];