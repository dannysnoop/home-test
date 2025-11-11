import express from "express";

export interface User {
    id: string;
    username: string;
}

declare global {
    namespace Express {
        interface Request {
            user?:User
        }
    }
}