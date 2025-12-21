import { Router, Request, Response } from 'express';
import { createCrisisUpdateSchema, paginationSchema } from '@opencrisis/shared';
import { CrisisUpdate, Committee, AuditLog } from '../models';
import { authenticate, requireStaff, validateBody, validateQuery, asyncHandler } from '../middleware';

const router = Router();

// GET /api/updates - List updates for a committee
router.get(
    '/',
    authenticate,
    validateQuery(paginationSchema.extend({
        committee: require('zod').z.string().optional(),
    })),
    asyncHandler(async (req: Request, res: Response) => {
        const user = req.user!;
        const { committee, page = 1, limit = 20 } = req.query as {
            committee?: string;
            page: number;
            limit: number;
        };

        if (!committee) {
            res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Committee ID is required' },
            });
            return;
        }

        // Verify committee exists and user has access
        const committeeDoc = await Committee.findById(committee);
        if (!committeeDoc) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Committee not found' },
            });
            return;
        }

        const query: Record<string, unknown> = { committee };

        // For delegates, filter to only public updates or private updates targeted to them
        if (user.role === 'delegate') {
            query.$or = [
                { visibility: 'public' },
                { visibility: 'private', targetDelegates: user._id },
            ];
        }

        const skip = (page - 1) * limit;

        const [updates, total] = await Promise.all([
            CrisisUpdate.find(query)
                .populate('postedBy', 'name')
                .populate('committee', 'name')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }),
            CrisisUpdate.countDocuments(query),
        ]);

        res.json({
            success: true,
            data: updates,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    })
);

// POST /api/updates - Create update (staff only)
router.post(
    '/',
    authenticate,
    requireStaff,
    validateBody(createCrisisUpdateSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const user = req.user!;
        const { committee: committeeId, visibility, targetDelegates } = req.body;

        // Verify committee exists
        const committee = await Committee.findById(committeeId);
        if (!committee) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Committee not found' },
            });
            return;
        }

        // Private updates require target delegates
        if (visibility === 'private' && (!targetDelegates || targetDelegates.length === 0)) {
            res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Private updates require target delegates' },
            });
            return;
        }

        const update = await CrisisUpdate.create({
            ...req.body,
            postedBy: user._id,
        });

        const populated = await CrisisUpdate.findById(update._id)
            .populate('postedBy', 'name')
            .populate('committee', 'name');

        // Log the action
        await AuditLog.create({
            action: 'update.created',
            entityType: 'update',
            entityId: update._id,
            performedBy: user._id,
            details: { title: update.title, visibility: update.visibility },
        });

        res.status(201).json({
            success: true,
            data: populated,
        });
    })
);

// GET /api/updates/:id - Get update detail
router.get(
    '/:id',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
        const user = req.user!;
        const { id } = req.params;

        const update = await CrisisUpdate.findById(id)
            .populate('postedBy', 'name')
            .populate('committee', 'name');

        if (!update) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Update not found' },
            });
            return;
        }

        // Check access for private updates
        if (update.visibility === 'private' && user.role === 'delegate') {
            const isTargeted = update.targetDelegates?.some(
                (d) => d.toString() === user._id.toString()
            );
            if (!isTargeted) {
                res.status(403).json({
                    success: false,
                    error: { code: 'FORBIDDEN', message: 'You do not have access to this update' },
                });
                return;
            }
        }

        res.json({
            success: true,
            data: update,
        });
    })
);

export default router;
