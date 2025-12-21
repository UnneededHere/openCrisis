import { Router, Request, Response } from 'express';
import { createMessageSchema, moderateMessageSchema, messageQuerySchema } from '@opencrisis/shared';
import { Message, Committee, User, AuditLog } from '../models';
import { authenticate, requireDelegate, requireStaff, validateBody, validateQuery, asyncHandler } from '../middleware';

const router = Router();

// GET /api/messages - List messages
// Delegates see their own sent/received approved messages
// Staff sees pending messages for moderation
router.get(
    '/',
    authenticate,
    validateQuery(messageQuerySchema),
    asyncHandler(async (req: Request, res: Response) => {
        const user = req.user!;
        const committee = req.query.committee as string | undefined;
        const status = req.query.status as string | undefined;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;

        const query: Record<string, unknown> = {};

        if (committee) {
            query.committee = committee;
        }

        if (user.role === 'delegate') {
            // Delegates see their own messages (approved only)
            query.$or = [
                { from: user._id },
                { to: user._id },
            ];
            query.status = 'approved';
        } else {
            // Staff/admin can filter by status (for moderation queue)
            if (status) {
                query.status = status;
            }
        }

        const skip = (page - 1) * limit;

        const [messages, total] = await Promise.all([
            Message.find(query)
                .populate('from', 'name')
                .populate('to', 'name')
                .populate('committee', 'name')
                .populate('moderatedBy', 'name')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }),
            Message.countDocuments(query),
        ]);

        res.json({
            success: true,
            data: messages,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    })
);

// GET /api/messages/pending - Get pending messages count (staff only)
router.get(
    '/pending/count',
    authenticate,
    requireStaff,
    asyncHandler(async (req: Request, res: Response) => {
        const committee = req.query.committee as string | undefined;

        const query: Record<string, unknown> = { status: 'pending' };
        if (committee) {
            query.committee = committee;
        }

        const count = await Message.countDocuments(query);

        res.json({
            success: true,
            data: { count },
        });
    })
);

// POST /api/messages - Send a message (delegate only, goes to pending)
router.post(
    '/',
    authenticate,
    requireDelegate,
    validateBody(createMessageSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const user = req.user!;
        const { to: recipientId, committee: committeeId, content } = req.body;

        // Verify committee exists
        const committee = await Committee.findById(committeeId);
        if (!committee) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Committee not found' },
            });
            return;
        }

        // Verify sender is a member
        if (!committee.members.some((m) => m.user.toString() === user._id.toString())) {
            res.status(403).json({
                success: false,
                error: { code: 'FORBIDDEN', message: 'You are not a member of this committee' },
            });
            return;
        }

        // Verify recipient exists and is a delegate in the same committee
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Recipient not found' },
            });
            return;
        }

        if (!committee.members.some((m) => m.user.toString() === recipientId)) {
            res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Recipient is not a member of this committee' },
            });
            return;
        }

        // Can't send message to yourself
        if (recipientId === user._id.toString()) {
            res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Cannot send a message to yourself' },
            });
            return;
        }

        const message = await Message.create({
            from: user._id,
            to: recipientId,
            committee: committeeId,
            content,
            status: 'pending',
        });

        const populated = await Message.findById(message._id)
            .populate('from', 'name')
            .populate('to', 'name')
            .populate('committee', 'name');

        res.status(201).json({
            success: true,
            data: populated,
        });
    })
);

// PATCH /api/messages/:id/moderate - Approve or deny a message (staff only)
router.patch(
    '/:id/moderate',
    authenticate,
    requireStaff,
    validateBody(moderateMessageSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const user = req.user!;
        const { id } = req.params;
        const { action, rejectionReason } = req.body;

        const message = await Message.findById(id);

        if (!message) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Message not found' },
            });
            return;
        }

        if (message.status !== 'pending') {
            res.status(400).json({
                success: false,
                error: { code: 'INVALID_STATE', message: 'Message has already been moderated' },
            });
            return;
        }

        message.status = action === 'approve' ? 'approved' : 'denied';
        message.moderatedBy = user._id;
        message.moderatedAt = new Date();
        if (action === 'deny' && rejectionReason) {
            message.rejectionReason = rejectionReason;
        }

        await message.save();

        // Log the action
        await AuditLog.create({
            action: `message.${action}d`,
            entityType: 'message',
            entityId: message._id,
            performedBy: user._id,
            details: { from: message.from, to: message.to, action },
        });

        const populated = await Message.findById(id)
            .populate('from', 'name')
            .populate('to', 'name')
            .populate('committee', 'name')
            .populate('moderatedBy', 'name');

        res.json({
            success: true,
            data: populated,
        });
    })
);

// PATCH /api/messages/:id/read - Mark message as read (recipient only)
router.patch(
    '/:id/read',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
        const user = req.user!;
        const { id } = req.params;

        const message = await Message.findById(id);

        if (!message) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Message not found' },
            });
            return;
        }

        // Only recipient can mark as read
        if (message.to.toString() !== user._id.toString()) {
            res.status(403).json({
                success: false,
                error: { code: 'FORBIDDEN', message: 'Only the recipient can mark a message as read' },
            });
            return;
        }

        message.readAt = new Date();
        await message.save();

        res.json({
            success: true,
            data: { message: 'Message marked as read' },
        });
    })
);

export default router;
