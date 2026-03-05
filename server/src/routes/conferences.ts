import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { createConferenceSchema, updateConferenceSchema } from '@opencrisis/shared';
import { Conference, User, Committee } from '../models';
import { authenticate, requireAdmin, validateBody, asyncHandler } from '../middleware';

const router = Router();

// GET /api/conferences - List user's conferences
router.get(
    '/',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
        const user = req.user!;

        let conferences;
        if (user.role === 'admin') {
            // Admins see all conferences
            conferences = await Conference.find().populate('createdBy', 'name email').sort({ createdAt: -1 });
        } else {
            // Others see only conferences they belong to
            conferences = await Conference.find({ _id: { $in: user.conferences } })
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 });
        }

        res.json({
            success: true,
            data: conferences,
        });
    })
);

// POST /api/conferences - Create conference (admin only)
router.post(
    '/',
    authenticate,
    requireAdmin,
    validateBody(createConferenceSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const user = req.user!;

        const conference = await Conference.create({
            ...req.body,
            createdBy: user._id,
        });

        // Add conference to admin's conferences
        await User.findByIdAndUpdate(user._id, {
            $push: { conferences: conference._id },
        });

        res.status(201).json({
            success: true,
            data: conference,
        });
    })
);

// GET /api/conferences/:id - Get conference details
router.get(
    '/:id',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
        const user = req.user!;
        const { id } = req.params;

        const conference = await Conference.findById(id).populate('createdBy', 'name email');

        if (!conference) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Conference not found' },
            });
            return;
        }

        // Check access
        if (user.role !== 'admin' && !user.conferences.some((c) => c.toString() === id)) {
            res.status(403).json({
                success: false,
                error: { code: 'FORBIDDEN', message: 'You do not have access to this conference' },
            });
            return;
        }

        // Get committees for this conference
        const committees = await Committee.find({ conference: id })
            .select('name type description')
            .sort({ name: 1 });

        res.json({
            success: true,
            data: { ...conference.toObject(), committees },
        });
    })
);

// PUT /api/conferences/:id - Update conference (admin only)
router.put(
    '/:id',
    authenticate,
    requireAdmin,
    validateBody(updateConferenceSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        const conference = await Conference.findByIdAndUpdate(
            id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!conference) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Conference not found' },
            });
            return;
        }

        res.json({
            success: true,
            data: conference,
        });
    })
);

// DELETE /api/conferences/:id - Delete conference (admin only)
router.delete(
    '/:id',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        const conference = await Conference.findByIdAndDelete(id);

        if (!conference) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Conference not found' },
            });
            return;
        }

        // Remove conference from all users
        await User.updateMany(
            { conferences: id },
            { $pull: { conferences: id } }
        );

        // Delete all committees in this conference
        await Committee.deleteMany({ conference: id });

        res.json({
            success: true,
            data: { message: 'Conference deleted successfully' },
        });
    })
);

export default router;
