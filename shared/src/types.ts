// User roles
export type UserRole = 'admin' | 'staff' | 'delegate';

// Committee types
export type CommitteeType = 'crisis' | 'general' | 'specialized';

// Directive types and statuses
export type DirectiveType = 'personal' | 'joint' | 'cabinet';
export type DirectiveStatus =
    | 'submitted'
    | 'opened'
    | 'processing'
    | 'needs_revision'
    | 'approved'
    | 'denied'
    | 'executed';

// Message statuses (for moderated delegate messaging)
export type MessageStatus = 'pending' | 'approved' | 'denied';

// Announcement types
export type AnnouncementType = 'media_notice' | 'breaking_news' | 'general';
export type AnnouncementPriority = 'normal' | 'high' | 'urgent';

// Crisis update visibility
export type UpdateVisibility = 'public' | 'private';

// Audit log entity types
export type AuditEntityType = 'directive' | 'update' | 'note' | 'message' | 'announcement' | 'user' | 'conference' | 'committee';

// Base interfaces
export interface BaseEntity {
    _id: string;
    createdAt: string;
    updatedAt?: string;
}

// User
export interface User extends BaseEntity {
    email: string;
    name: string;
    role: UserRole;
    conferences: string[];
}

export interface UserWithPassword extends User {
    password: string;
    refreshTokens: string[];
}

// Conference
export interface Conference extends BaseEntity {
    name: string;
    code: string;
    description?: string;
    isActive: boolean;
    createdBy: string;
}

// Committee
export interface Committee extends BaseEntity {
    name: string;
    conference: string;
    description?: string;
    type: CommitteeType;
    members: string[];
    staff: string[];
}

// Directive (updated with new types and status tracking)
export interface Directive extends BaseEntity {
    title: string;
    body: string;
    type: DirectiveType;
    committee: string;
    submittedBy: string;
    status: DirectiveStatus;
    assignedTo?: string;
    feedback?: string;
    outcome?: string;
    // For joint directives
    coSigners?: string[];
    // Status tracking timestamps
    openedAt?: string;
    processingAt?: string;
    repliedAt?: string;
}

// Moderated Message (delegate-to-delegate)
export interface Message extends BaseEntity {
    from: string;
    to: string;
    committee: string;
    content: string;
    status: MessageStatus;
    moderatedBy?: string;
    moderatedAt?: string;
    rejectionReason?: string;
    readAt?: string;
}

// Staff Announcement
export interface Announcement extends BaseEntity {
    title: string;
    body: string;
    type: AnnouncementType;
    committee: string;
    postedBy: string;
    targetDelegates?: string[];
    priority: AnnouncementPriority;
}

// Crisis Update (legacy, kept for backward compatibility)
export interface CrisisUpdate extends BaseEntity {
    title: string;
    body: string;
    committee: string;
    visibility: UpdateVisibility;
    targetDelegates?: string[];
    postedBy: string;
}

// Crisis Note (legacy, kept for backward compatibility)
export interface CrisisNote extends BaseEntity {
    content: string;
    committee: string;
    from: string;
    to: string;
    replyTo?: string;
    read: boolean;
}

// Audit Log
export interface AuditLog extends BaseEntity {
    action: string;
    entityType: AuditEntityType;
    entityId: string;
    performedBy: string;
    details: Record<string, unknown>;
}

// Populated types for API responses
export interface DirectivePopulated extends Omit<Directive, 'submittedBy' | 'assignedTo' | 'committee' | 'coSigners'> {
    submittedBy: Pick<User, '_id' | 'name' | 'email'>;
    assignedTo?: Pick<User, '_id' | 'name' | 'email'>;
    committee: Pick<Committee, '_id' | 'name'>;
    coSigners?: Pick<User, '_id' | 'name'>[];
}

export interface MessagePopulated extends Omit<Message, 'from' | 'to' | 'committee' | 'moderatedBy'> {
    from: Pick<User, '_id' | 'name'>;
    to: Pick<User, '_id' | 'name'>;
    committee: Pick<Committee, '_id' | 'name'>;
    moderatedBy?: Pick<User, '_id' | 'name'>;
}

export interface AnnouncementPopulated extends Omit<Announcement, 'postedBy' | 'committee'> {
    postedBy: Pick<User, '_id' | 'name'>;
    committee: Pick<Committee, '_id' | 'name'>;
}

export interface CrisisUpdatePopulated extends Omit<CrisisUpdate, 'postedBy' | 'committee'> {
    postedBy: Pick<User, '_id' | 'name'>;
    committee: Pick<Committee, '_id' | 'name'>;
}

export interface CrisisNotePopulated extends Omit<CrisisNote, 'from' | 'to' | 'committee'> {
    from: Pick<User, '_id' | 'name' | 'role'>;
    to: Pick<User, '_id' | 'name' | 'role'>;
    committee: Pick<Committee, '_id' | 'name'>;
}
