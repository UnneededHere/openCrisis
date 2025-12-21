// User roles
export type UserRole = 'admin' | 'staff' | 'delegate';

// Committee types
export type CommitteeType = 'crisis' | 'general' | 'specialized';

// Directive types and statuses
export type DirectiveType = 'public' | 'private' | 'covert';
export type DirectiveStatus =
    | 'submitted'
    | 'in_review'
    | 'needs_revision'
    | 'approved'
    | 'denied'
    | 'executed';

// Crisis update visibility
export type UpdateVisibility = 'public' | 'private';

// Audit log entity types
export type AuditEntityType = 'directive' | 'update' | 'note' | 'user' | 'conference' | 'committee';

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

// Directive
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
}

// Crisis Update
export interface CrisisUpdate extends BaseEntity {
    title: string;
    body: string;
    committee: string;
    visibility: UpdateVisibility;
    targetDelegates?: string[];
    postedBy: string;
}

// Crisis Note
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
export interface DirectivePopulated extends Omit<Directive, 'submittedBy' | 'assignedTo' | 'committee'> {
    submittedBy: Pick<User, '_id' | 'name' | 'email'>;
    assignedTo?: Pick<User, '_id' | 'name' | 'email'>;
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
