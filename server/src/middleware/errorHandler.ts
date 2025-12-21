import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export interface AppError extends Error {
    statusCode?: number;
    code?: string;
}

export const errorHandler = (
    err: AppError,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    logger.error({
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    const statusCode = err.statusCode || 500;
    const code = err.code || 'INTERNAL_ERROR';
    const message = statusCode === 500 ? 'Internal server error' : err.message;

    res.status(statusCode).json({
        success: false,
        error: {
            code,
            message,
        },
    });
};

// Not found handler
export const notFoundHandler = (req: Request, res: Response): void => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`,
        },
    });
};

// Async handler wrapper to catch async errors
export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export default errorHandler;
