import {ZodObject } from 'zod';
import { Request, Response, NextFunction } from 'express';

export function validate(schema: ZodObject) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (err: any) {
            res.status(400).json({ error: JSON.parse(err.message)  });
        }
    };
}
