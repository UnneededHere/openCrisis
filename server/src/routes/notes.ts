import { Router, Request, Response } from 'express';
import { createCrisisNoteSchema, paginationSchema } from '@opencrisis/shared';
import { CrisisNote, Committee, User } from '../models';
import { authenticate, validateBody, validateQuery, asyncHandler } from '../middleware';
import { z } from 'zod';

const router = Router();

// GET /api/notes - List notes for a user in a committee
router.get(
    '/',
    authenticate,
    validateQuery(paginationSchema.extend({
        committee: z.string().optional(),
    })),
    asyncHandler(async (req: Request, res: Response) => {
        const user = req.user!;
        const { committee, page = 1, limit = 20 } = req.query as {
            committee?: string;
            page: number;
            limit: number;
        };

        const query: Record<string, unknown> = {
            $or: [
                { from: user._id },
                { to: user._id },
            ],
        };

        if (committee) {
            query.committee = committee;
        }

        const skip = (page - 1) * limit;

        const [notes, total] = await Promise.all([
            CrisisNote.find(query)
                .populate('from', 'name role')
                .populate('to', 'name role')
                .populate('committee', 'name')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }),
            CrisisNote.countDocuments(query),
        ]);

        res.json({
            success: true,
            data: notes,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    })
);

// POST /api/notes - Send a note
router.post(
    '/',
    authenticate,
    validateBody(createCrisisNoteSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const user = req.user!;
        const { committee: committeeId, to: recipientId, replyTo } = req.body;

        // Verify committee exists
        const committee = await Committee.findById(committeeId);
        if (!committee) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Committee not found' },
            });
            return;
        }

        // Verify recipient exists
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Recipient not found' },
            });
            return;
        }

        // Delegates can only send to staff, staff can send to anyone
        if (user.role === 'delegate') {
            const isRecipientStaff = committee.staff.some(
                (s) => s.toString() === recipientId
            );
            if (!isRecipientStaff && recipient.role !== 'admin') {
                res.status(403).json({
                    success: false,
                    error: { code: 'FORBIDDEN', message: 'Delegates can only send notes to staff' },
                });
                return;
            }
        }

        // If replying, verify the original note exists
        if (replyTo) {
            const originalNote = await CrisisNote.findById(replyTo);
            if (!originalNote) {
                res.status(404).json({
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Original note not found' },
                });
                return;
            }
        }

        const note = await CrisisNote.create({
            ...req.body,
            from: user._id,
        });

        const populated = await CrisisNote.findById(note._id)
            .populate('from', 'name role')
            .populate('to', 'name role')
            .populate('committee', 'name');

        res.status(201).json({
            success: true,
            data: populated,
        });
    })
);

// PUT /api/notes/:id/read - Mark note as read
router.put(
    '/:id/read',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
        const user = req.user!;
        const { id } = req.params;

        const note = await CrisisNote.findById(id);

        if (!note) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Note not found' },
            });
            return;
        }

        // Only recipient can mark as read
        if (note.to.toString() !== user._id.toString()) {
            res.status(403).json({
                success: false,
                error: { code: 'FORBIDDEN', message: 'Only the recipient can mark a note as read' },
            });
            return;
        }

        note.read = true;
        await note.save();

        res.json({
            success: true,
            data: { message: 'Note marked as read' },
        });
    })
);

// GET /api/notes/unread - Get unread note count
router.get(
    '/unread/count',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
        const user = req.user!;

        const count = await CrisisNote.countDocuments({
            to: user._id,
            read: false,
        });

        res.json({
            success: true,
            data: { count },
        });
    })
);

export default router;
