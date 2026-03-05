import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { adminCreateUserSchema, changePasswordSchema } from '@opencrisis/shared';
import { User, AuditLog } from '../models';
import { authenticate, requireAdmin, validateBody, asyncHandler } from '../middleware';

const router = Router();

// GET /api/users - List all users (admin only)
router.get(
    '/',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const users = await User.find({})
            .select('email name role createdAt')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: users,
        });
    })
);

// POST /api/users - Create a new user (admin only)
router.post(
    '/',
    authenticate,
    requireAdmin,
    validateBody(adminCreateUserSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { email, password, name, role } = req.body;

        // Check for duplicate email
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            res.status(400).json({
                success: false,
                error: { code: 'EMAIL_EXISTS', message: 'Email already registered' },
            });
            return;
        }

        const user = await User.create({
            email: email.toLowerCase(),
            password,
            name,
            role,
        });

        // Log the admin-created user
        await AuditLog.create({
            action: 'user.admin_created',
            entityType: 'user',
            entityId: user._id,
            performedBy: req.user!._id,
            details: { role: user.role, email: user.email },
        });

        res.status(201).json({
            success: true,
            data: {
                _id: user._id.toString(),
                email: user.email,
                name: user.name,
                role: user.role,
                createdAt: user.createdAt,
            },
        });
    })
);

// PUT /api/users/me/password - Change currently logged in user's password
router.put(
    '/me/password',
    authenticate,
    validateBody(changePasswordSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const user = req.user!;
        const { currentPassword, newPassword } = req.body;

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            res.status(401).json({
                success: false,
                error: { code: 'INVALID_CREDENTIALS', message: 'Current password is incorrect' },
            });
            return;
        }

        // Update password (the pre-save hook on User schema will hash it automatically)
        user.password = newPassword;
        await user.save();

        // Optional: log the password change
        await AuditLog.create({
            action: 'USER_LOGIN', // Using existing valid type as we don't have PASSWORD_CHANGE
            user: user._id,
            details: { message: 'User changed their password' },
            ipAddress: req.ip,
        });

        res.json({
            success: true,
            data: { message: 'Password changed successfully' },
        });
    })
);

export default router;
