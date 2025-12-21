import { Router, Request, Response } from 'express';
import { createCommitteeSchema, updateCommitteeSchema, assignCommitteeSchema, committeeQuerySchema } from '@opencrisis/shared';
import { Committee, Conference, User } from '../models';
import { authenticate, requireAdmin, requireStaff, validateBody, validateQuery, asyncHandler } from '../middleware';

const router = Router();

// GET /api/committees - List committees (filter by conference)
router.get(
    '/',
    authenticate,
    validateQuery(committeeQuerySchema),
    asyncHandler(async (req: Request, res: Response) => {
        const user = req.user!;
        const conference = req.query.conference as string | undefined;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;

        const query: Record<string, unknown> = {};

        if (conference) {
            query.conference = conference;
        } else if (user.role !== 'admin') {
            // Non-admins only see committees from their conferences
            query.conference = { $in: user.conferences };
        }

        const skip = (page - 1) * limit;

        const [committees, total] = await Promise.all([
            Committee.find(query)
                .populate('conference', 'name code')
                .skip(skip)
                .limit(limit)
                .sort({ name: 1 }),
            Committee.countDocuments(query),
        ]);

        res.json({
            success: true,
            data: committees,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    })
);

// POST /api/committees - Create committee (admin only)
router.post(
    '/',
    authenticate,
    requireAdmin,
    validateBody(createCommitteeSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { conference: conferenceId } = req.body;

        // Verify conference exists
        const conference = await Conference.findById(conferenceId);
        if (!conference) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Conference not found' },
            });
            return;
        }

        const committee = await Committee.create(req.body);

        res.status(201).json({
            success: true,
            data: committee,
        });
    })
);

// GET /api/committees/:id - Get committee details
router.get(
    '/:id',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
        const user = req.user!;
        const { id } = req.params;

        const committee = await Committee.findById(id)
            .populate('conference', 'name code')
            .populate('members', 'name email role')
            .populate('staff', 'name email role');

        if (!committee) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Committee not found' },
            });
            return;
        }

        // Check access - must be admin, committee member/staff, or conference member
        const isAdmin = user.role === 'admin';
        const isMember = committee.members.some((m: { _id: { toString: () => string } }) => m._id.toString() === user._id.toString());
        const isStaff = committee.staff.some((s: { _id: { toString: () => string } }) => s._id.toString() === user._id.toString());
        const isConferenceMember = user.conferences.some((c) => c.toString() === committee.conference._id.toString());

        if (!isAdmin && !isMember && !isStaff && !isConferenceMember) {
            res.status(403).json({
                success: false,
                error: { code: 'FORBIDDEN', message: 'You do not have access to this committee' },
            });
            return;
        }

        res.json({
            success: true,
            data: committee,
        });
    })
);

// PUT /api/committees/:id - Update committee (admin/staff)
router.put(
    '/:id',
    authenticate,
    requireStaff,
    validateBody(updateCommitteeSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        const committee = await Committee.findByIdAndUpdate(
            id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!committee) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Committee not found' },
            });
            return;
        }

        res.json({
            success: true,
            data: committee,
        });
    })
);

// POST /api/committees/:id/assign - Assign user to committee (admin only)
router.post(
    '/:id/assign',
    authenticate,
    requireAdmin,
    validateBody(assignCommitteeSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const { userId, role } = req.body;

        const committee = await Committee.findById(id);
        if (!committee) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Committee not found' },
            });
            return;
        }

        const targetUser = await User.findById(userId);
        if (!targetUser) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'User not found' },
            });
            return;
        }

        // Add user to appropriate array
        const arrayField = role === 'staff' ? 'staff' : 'members';
        const otherField = role === 'staff' ? 'members' : 'staff';

        // Remove from other array if present
        await Committee.findByIdAndUpdate(id, {
            $pull: { [otherField]: userId },
        });

        // Add to correct array (if not already there)
        await Committee.findByIdAndUpdate(id, {
            $addToSet: { [arrayField]: userId },
        });

        // Also add user to the conference if not already
        await User.findByIdAndUpdate(userId, {
            $addToSet: { conferences: committee.conference },
        });

        const updatedCommittee = await Committee.findById(id)
            .populate('members', 'name email role')
            .populate('staff', 'name email role');

        res.json({
            success: true,
            data: updatedCommittee,
        });
    })
);

// DELETE /api/committees/:id/assign/:userId - Remove user from committee (admin only)
router.delete(
    '/:id/assign/:userId',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const { id, userId } = req.params;

        const committee = await Committee.findById(id);
        if (!committee) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Committee not found' },
            });
            return;
        }

        await Committee.findByIdAndUpdate(id, {
            $pull: { members: userId, staff: userId },
        });

        res.json({
            success: true,
            data: { message: 'User removed from committee' },
        });
    })
);

export default router;
