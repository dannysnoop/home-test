// src/constants/errors.ts
export const ERRORS = {
    INVALID_PARAMS: 'Invalid parameters',
    INVALID_BODY: 'Invalid body data',
    INVALID_QUERY: 'Invalid query data',
    INVALID_TOKEN: 'Invalid token',
    UNAUTHORIZED: 'Unauthorized',
    FORBIDDEN: 'Forbidden',
    STORE_NOT_FOUND: 'Store not found',
    FAVORITE_NOT_FOUND: 'Favorite not found',
    INTERNAL_ERROR: 'Internal server error',
    TOO_MANY_REQ: 'Too Many Requests',
    USER_ALREADY_EXIST: 'User already exists',
INVALID_CREDENTIALS: 'Invalid credentials',

} as const;

export type ErrorKey = keyof typeof ERRORS;
