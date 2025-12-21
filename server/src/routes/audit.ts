import { Router, Request, Response } from 'express';
import { paginationSchema } from '@opencrisis/shared';
import { AuditLog } from '../models';
import { authenticate, requireStaff, validateQuery, asyncHandler } from '../middleware';
import { z } from 'zod';

const router = Router();

const auditQuerySchema = paginationSchema.extend({
    entityType: z.enum(['directive', 'update', 'note', 'user', 'conference', 'committee']).optional(),
    entityId: z.string().optional(),
    action: z.string().optional(),
});

// GET /api/audit - List audit log entries (staff/admin only)
router.get(
    '/',
    authenticate,
    requireStaff,
    validateQuery(auditQuerySchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { entityType, entityId, action, page = 1, limit = 50 } = req.query as {
            entityType?: string;
            entityId?: string;
            action?: string;
            page: number;
            limit: number;
        };

        const query: Record<string, unknown> = {};

        if (entityType) query.entityType = entityType;
        if (entityId) query.entityId = entityId;
        if (action) query.action = { $regex: action, $options: 'i' };

        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            AuditLog.find(query)
                .populate('performedBy', 'name email role')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }),
            AuditLog.countDocuments(query),
        ]);

        res.json({
            success: true,
            data: logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    })
);

export default router;
