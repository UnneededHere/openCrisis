import { Router, Request, Response } from 'express';
import { createAnnouncementSchema, announcementQuerySchema } from '@opencrisis/shared';
import { Announcement, Committee, AuditLog } from '../models';
import { authenticate, requireStaff, validateBody, validateQuery, asyncHandler } from '../middleware';

const router = Router();

// GET /api/announcements - List announcements for a committee
router.get(
    '/',
    authenticate,
    validateQuery(announcementQuerySchema),
    asyncHandler(async (req: Request, res: Response) => {
        const user = req.user!;
        const committee = req.query.committee as string | undefined;
        const type = req.query.type as string | undefined;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;

        if (!committee) {
            res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Committee ID is required' },
            });
            return;
        }

        const query: Record<string, unknown> = { committee };

        if (type) {
            query.type = type;
        }

        // For delegates, filter to announcements they can see
        if (user.role === 'delegate') {
            query.$or = [
                { targetDelegates: { $size: 0 } }, // Empty array = all can see
                { targetDelegates: user._id },
            ];
        }

        const skip = (page - 1) * limit;

        const [announcements, total] = await Promise.all([
            Announcement.find(query)
                .populate('postedBy', 'name')
                .populate('committee', 'name')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }),
            Announcement.countDocuments(query),
        ]);

        res.json({
            success: true,
            data: announcements,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    })
);

// GET /api/announcements/:id - Get announcement detail
router.get(
    '/:id',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
        const user = req.user!;
        const { id } = req.params;

        const announcement = await Announcement.findById(id)
            .populate('postedBy', 'name')
            .populate('committee', 'name');

        if (!announcement) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Announcement not found' },
            });
            return;
        }

        // Check access for delegates
        if (user.role === 'delegate') {
            const isTargeted = announcement.targetDelegates.length === 0 ||
                announcement.targetDelegates.some((d) => d.toString() === user._id.toString());

            if (!isTargeted) {
                res.status(403).json({
                    success: false,
                    error: { code: 'FORBIDDEN', message: 'You do not have access to this announcement' },
                });
                return;
            }
        }

        res.json({
            success: true,
            data: announcement,
        });
    })
);

// POST /api/announcements - Create announcement (staff only)
router.post(
    '/',
    authenticate,
    requireStaff,
    validateBody(createAnnouncementSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const user = req.user!;
        const { committee: committeeId } = req.body;

        // Verify committee exists
        const committee = await Committee.findById(committeeId);
        if (!committee) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Committee not found' },
            });
            return;
        }

        const announcement = await Announcement.create({
            ...req.body,
            postedBy: user._id,
        });

        const populated = await Announcement.findById(announcement._id)
            .populate('postedBy', 'name')
            .populate('committee', 'name');

        // Log the action
        await AuditLog.create({
            action: 'announcement.created',
            entityType: 'announcement',
            entityId: announcement._id,
            performedBy: user._id,
            details: {
                title: announcement.title,
                type: announcement.type,
                priority: announcement.priority,
            },
        });

        res.status(201).json({
            success: true,
            data: populated,
        });
    })
);

// DELETE /api/announcements/:id - Delete announcement (staff only)
router.delete(
    '/:id',
    authenticate,
    requireStaff,
    asyncHandler(async (req: Request, res: Response) => {
        const user = req.user!;
        const { id } = req.params;

        const announcement = await Announcement.findById(id);

        if (!announcement) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Announcement not found' },
            });
            return;
        }

        await Announcement.findByIdAndDelete(id);

        // Log the action
        await AuditLog.create({
            action: 'announcement.deleted',
            entityType: 'announcement',
            entityId: id,
            performedBy: user._id,
            details: { title: announcement.title },
        });

        res.json({
            success: true,
            data: { message: 'Announcement deleted' },
        });
    })
);

export default router;
