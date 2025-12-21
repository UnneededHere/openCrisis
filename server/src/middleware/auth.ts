import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User, IUser } from '../models';
import { logger } from '../config/logger';

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}

interface JwtPayload {
    userId: string;
    role: string;
    iat: number;
    exp: number;
}

export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'No token provided',
                },
            });
            return;
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

            const user = await User.findById(decoded.userId);

            if (!user) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'User not found',
                    },
                });
                return;
            }

            req.user = user;
            next();
        } catch (jwtError) {
            if (jwtError instanceof jwt.TokenExpiredError) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'TOKEN_EXPIRED',
                        message: 'Token has expired',
                    },
                });
                return;
            }

            res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Invalid token',
                },
            });
        }
    } catch (error) {
        logger.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Authentication failed',
            },
        });
    }
};

// Optional authentication - doesn't fail if no token, but attaches user if present
export const optionalAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        next();
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
        const user = await User.findById(decoded.userId);
        if (user) {
            req.user = user;
        }
    } catch {
        // Ignore errors for optional auth
    }

    next();
};

export default authenticate;
