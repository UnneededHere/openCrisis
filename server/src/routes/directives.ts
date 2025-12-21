import { Router, Request, Response } from 'express';
import { createDirectiveSchema, updateDirectiveStatusSchema, addDirectiveFeedbackSchema, directiveQuerySchema } from '@opencrisis/shared';
import { Directive, Committee, AuditLog } from '../models';
import { authenticate, requireDelegate, requireStaff, validateBody, validateQuery, asyncHandler } from '../middleware';

const router = Router();

// GET /api/directives - List directives (filtered by committee, status, etc.)
router.get(
    '/',
    authenticate,
    validateQuery(directiveQuerySchema),
    asyncHandler(async (req: Request, res: Response) => {
        const user = req.user!;
        const committee = req.query.committee as string | undefined;
        const status = req.query.status as string | undefined;
        const submittedBy = req.query.submittedBy as string | undefined;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;

        const query: Record<string, unknown> = {};

        // Filter by committee
        if (committee) {
            query.committee = committee;
        }

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Delegates can only see their own directives
        if (user.role === 'delegate') {
            query.submittedBy = user._id;
        } else if (submittedBy) {
            query.submittedBy = submittedBy;
        }

        const skip = (page - 1) * limit;

        const [directives, total] = await Promise.all([
            Directive.find(query)
                .populate('submittedBy', 'name email')
                .populate('assignedTo', 'name email')
                .populate('committee', 'name')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }),
            Directive.countDocuments(query),
        ]);

        res.json({
            success: true,
            data: directives,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    })
);

// POST /api/directives - Create directive (delegate only)
router.post(
    '/',
    authenticate,
    requireDelegate,
    validateBody(createDirectiveSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const user = req.user!;
        const { committee: committeeId } = req.body;

        // Verify committee exists and user is a member
        const committee = await Committee.findById(committeeId);
        if (!committee) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Committee not found' },
            });
            return;
        }

        if (!committee.members.some((m) => m.toString() === user._id.toString())) {
            res.status(403).json({
                success: false,
                error: { code: 'FORBIDDEN', message: 'You are not a member of this committee' },
            });
            return;
        }

        const directive = await Directive.create({
            ...req.body,
            submittedBy: user._id,
            status: 'submitted',
        });

        const populated = await Directive.findById(directive._id)
            .populate('submittedBy', 'name email')
            .populate('committee', 'name');

        // Log the action
        await AuditLog.create({
            action: 'directive.created',
            entityType: 'directive',
            entityId: directive._id,
            performedBy: user._id,
            details: { title: directive.title, type: directive.type },
        });

        res.status(201).json({
            success: true,
            data: populated,
        });
    })
);

// GET /api/directives/:id - Get directive detail
router.get(
    '/:id',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
        const user = req.user!;
        const { id } = req.params;

        const directive = await Directive.findById(id)
            .populate('submittedBy', 'name email')
            .populate('assignedTo', 'name email')
            .populate('committee', 'name');

        if (!directive) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Directive not found' },
            });
            return;
        }

        // Check access - staff/admin can see all, delegates only their own
        const isOwner = directive.submittedBy._id.toString() === user._id.toString();
        const isStaffOrAdmin = user.role === 'admin' || user.role === 'staff';

        if (!isOwner && !isStaffOrAdmin) {
            res.status(403).json({
                success: false,
                error: { code: 'FORBIDDEN', message: 'You do not have access to this directive' },
            });
            return;
        }

        res.json({
            success: true,
            data: directive,
        });
    })
);

// PUT /api/directives/:id/status - Update directive status (staff only)
router.put(
    '/:id/status',
    authenticate,
    requireStaff,
    validateBody(updateDirectiveStatusSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const user = req.user!;
        const { id } = req.params;
        const { status, outcome } = req.body;

        const directive = await Directive.findById(id);

        if (!directive) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Directive not found' },
            });
            return;
        }

        const previousStatus = directive.status;

        directive.status = status;
        directive.assignedTo = user._id;
        if (outcome) {
            directive.outcome = outcome;
        }
        await directive.save();

        // Log the action
        await AuditLog.create({
            action: 'directive.status_change',
            entityType: 'directive',
            entityId: directive._id,
            performedBy: user._id,
            details: { from: previousStatus, to: status, outcome },
        });

        const populated = await Directive.findById(id)
            .populate('submittedBy', 'name email')
            .populate('assignedTo', 'name email')
            .populate('committee', 'name');

        res.json({
            success: true,
            data: populated,
        });
    })
);

// PUT /api/directives/:id/feedback - Add feedback to directive (staff only)
router.put(
    '/:id/feedback',
    authenticate,
    requireStaff,
    validateBody(addDirectiveFeedbackSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const user = req.user!;
        const { id } = req.params;
        const { feedback } = req.body;

        const directive = await Directive.findById(id);

        if (!directive) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Directive not found' },
            });
            return;
        }

        directive.feedback = feedback;
        directive.assignedTo = user._id;
        await directive.save();

        // Log the action
        await AuditLog.create({
            action: 'directive.feedback_added',
            entityType: 'directive',
            entityId: directive._id,
            performedBy: user._id,
            details: { feedbackLength: feedback.length },
        });

        const populated = await Directive.findById(id)
            .populate('submittedBy', 'name email')
            .populate('assignedTo', 'name email')
            .populate('committee', 'name');

        res.json({
            success: true,
            data: populated,
        });
    })
);

export default router;
