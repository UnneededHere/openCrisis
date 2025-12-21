import { Router, Request, Response } from 'express';
import { loginSchema, registerSchema, refreshTokenSchema } from '@opencrisis/shared';
import { authService } from '../services';
import { authenticate, validateBody, asyncHandler } from '../middleware';

const router = Router();

// POST /api/auth/register
router.post(
    '/register',
    validateBody(registerSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const result = await authService.register(req.body);
        res.status(201).json({
            success: true,
            data: result,
        });
    })
);

// POST /api/auth/login
router.post(
    '/login',
    validateBody(loginSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const result = await authService.login(req.body);
        res.json({
            success: true,
            data: result,
        });
    })
);

// POST /api/auth/refresh
router.post(
    '/refresh',
    validateBody(refreshTokenSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { refreshToken } = req.body;
        const result = await authService.refresh(refreshToken);
        res.json({
            success: true,
            data: result,
        });
    })
);

// POST /api/auth/logout
router.post(
    '/logout',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
        const { refreshToken } = req.body;
        await authService.logout(req.user!, refreshToken);
        res.json({
            success: true,
            data: { message: 'Logged out successfully' },
        });
    })
);

// GET /api/auth/me
router.get(
    '/me',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
        const user = req.user!;
        res.json({
            success: true,
            data: {
                _id: user._id.toString(),
                email: user.email,
                name: user.name,
                role: user.role,
                conferences: user.conferences,
            },
        });
    })
);

export default router;
