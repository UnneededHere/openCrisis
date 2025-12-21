import { Request, Response, NextFunction } from 'express';
import type { UserRole } from '@opencrisis/shared';

type RoleCheck = UserRole | UserRole[];

export const requireRole = (allowedRoles: RoleCheck) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required',
                },
            });
            return;
        }

        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        if (!roles.includes(req.user.role as UserRole)) {
            res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Insufficient permissions',
                },
            });
            return;
        }

        next();
    };
};

// Convenience middlewares for common role checks
export const requireAdmin = requireRole('admin');
export const requireStaff = requireRole(['admin', 'staff']);
export const requireDelegate = requireRole('delegate');
export const requireAnyRole = requireRole(['admin', 'staff', 'delegate']);

export default requireRole;
