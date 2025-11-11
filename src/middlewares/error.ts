import { NextFunction, Request, Response } from 'express';
import {ERRORS} from "../constants/errors";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
    const status = err.status || 500;
    const code = err.code || ERRORS.INTERNAL_ERROR
    const message = err.message || 'Internal Server Error';
    if (process.env.NODE_ENV !== 'test') {
        // log đơn giản; sau nâng cấp pino/otel
        // eslint-disable-next-line no-console
        console.error(err);
    }
    res.status(status).json({ error: { code, message } });
}
