import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    role: z.enum(['admin', 'staff', 'delegate'] as const).optional().default('delegate'),
});

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Conference schemas
export const createConferenceSchema = z.object({
    name: z.string().min(2).max(200),
    description: z.string().max(1000).optional(),
});

export const updateConferenceSchema = z.object({
    name: z.string().min(2).max(200).optional(),
    description: z.string().max(1000).optional(),
    isActive: z.boolean().optional(),
});

export const joinConferenceSchema = z.object({
    code: z.string().min(1, 'Conference code is required'),
});

// Committee schemas
export const createCommitteeSchema = z.object({
    name: z.string().min(2).max(200),
    conference: z.string().min(1, 'Conference ID is required'),
    description: z.string().max(1000).optional(),
    type: z.enum(['crisis', 'general', 'specialized'] as const).default('crisis'),
});

export const updateCommitteeSchema = z.object({
    name: z.string().min(2).max(200).optional(),
    description: z.string().max(1000).optional(),
    type: z.enum(['crisis', 'general', 'specialized'] as const).optional(),
});

export const assignCommitteeSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    role: z.enum(['member', 'staff'] as const),
    characterName: z.string().min(1).max(200).optional(), // Required for members
});

// Directive schemas (updated types: personal, joint, cabinet)
export const createDirectiveSchema = z.object({
    title: z.string().min(2).max(200),
    body: z.string().min(10).max(10000),
    type: z.enum(['personal', 'joint', 'cabinet'] as const).default('personal'),
    committee: z.string().min(1, 'Committee ID is required'),
    // For joint directives - IDs of other delegates to co-sign
    coSigners: z.array(z.string()).optional(),
});

export const updateDirectiveStatusSchema = z.object({
    status: z.enum([
        'submitted',
        'opened',
        'processing',
        'needs_revision',
        'approved',
        'denied',
        'executed',
    ] as const),
    outcome: z.string().max(2000).optional(),
});

export const addDirectiveFeedbackSchema = z.object({
    feedback: z.string().min(1).max(2000),
});

// Message schemas (moderated delegate-to-delegate)
export const createMessageSchema = z.object({
    to: z.string().min(1, 'Recipient ID is required'),
    committee: z.string().min(1, 'Committee ID is required'),
    content: z.string().min(1).max(5000),
});

export const moderateMessageSchema = z.object({
    action: z.enum(['approve', 'deny'] as const),
    rejectionReason: z.string().max(500).optional(),
});

// Announcement schemas
export const createAnnouncementSchema = z.object({
    title: z.string().min(2).max(200),
    body: z.string().min(10).max(10000),
    type: z.enum(['media_notice', 'breaking_news', 'general'] as const).default('general'),
    committee: z.string().min(1, 'Committee ID is required'),
    targetDelegates: z.array(z.string()).optional(),
    priority: z.enum(['normal', 'high', 'urgent'] as const).default('normal'),
});

// Crisis Update schemas (legacy)
export const createCrisisUpdateSchema = z.object({
    title: z.string().min(2).max(200),
    body: z.string().min(10).max(10000),
    committee: z.string().min(1, 'Committee ID is required'),
    visibility: z.enum(['public', 'private'] as const).default('public'),
    targetDelegates: z.array(z.string()).optional(),
});

// Crisis Note schemas (legacy)
export const createCrisisNoteSchema = z.object({
    content: z.string().min(1).max(5000),
    committee: z.string().min(1, 'Committee ID is required'),
    to: z.string().min(1, 'Recipient ID is required'),
    replyTo: z.string().optional(),
});

// Query params schemas
export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const directiveQuerySchema = paginationSchema.extend({
    committee: z.string().optional(),
    status: z.enum([
        'submitted',
        'opened',
        'processing',
        'needs_revision',
        'approved',
        'denied',
        'executed',
    ] as const).optional(),
    submittedBy: z.string().optional(),
    type: z.enum(['personal', 'joint', 'cabinet'] as const).optional(),
});

export const messageQuerySchema = paginationSchema.extend({
    committee: z.string().optional(),
    status: z.enum(['pending', 'approved', 'denied'] as const).optional(),
});

export const announcementQuerySchema = paginationSchema.extend({
    committee: z.string().optional(),
    type: z.enum(['media_notice', 'breaking_news', 'general'] as const).optional(),
});

export const committeeQuerySchema = paginationSchema.extend({
    conference: z.string().optional(),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type CreateConferenceInput = z.infer<typeof createConferenceSchema>;
export type UpdateConferenceInput = z.infer<typeof updateConferenceSchema>;
export type JoinConferenceInput = z.infer<typeof joinConferenceSchema>;
export type CreateCommitteeInput = z.infer<typeof createCommitteeSchema>;
export type UpdateCommitteeInput = z.infer<typeof updateCommitteeSchema>;
export type AssignCommitteeInput = z.infer<typeof assignCommitteeSchema>;
export type CreateDirectiveInput = z.infer<typeof createDirectiveSchema>;
export type UpdateDirectiveStatusInput = z.infer<typeof updateDirectiveStatusSchema>;
export type AddDirectiveFeedbackInput = z.infer<typeof addDirectiveFeedbackSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type ModerateMessageInput = z.infer<typeof moderateMessageSchema>;
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type CreateCrisisUpdateInput = z.infer<typeof createCrisisUpdateSchema>;
export type CreateCrisisNoteInput = z.infer<typeof createCrisisNoteSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type DirectiveQueryInput = z.infer<typeof directiveQuerySchema>;
export type MessageQueryInput = z.infer<typeof messageQuerySchema>;
export type AnnouncementQueryInput = z.infer<typeof announcementQuerySchema>;
export type CommitteeQueryInput = z.infer<typeof committeeQuerySchema>;
