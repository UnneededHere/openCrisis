// API Response types
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: ApiError;
    pagination?: PaginationMeta;
}

export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, string[]>;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

// Auth responses
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface LoginResponse {
    user: {
        _id: string;
        email: string;
        name: string;
        role: string;
    };
    tokens: AuthTokens;
}

export interface RefreshResponse {
    accessToken: string;
}

// Socket event payloads
export interface DirectiveCreatedPayload {
    directive: {
        _id: string;
        title: string;
        type: string;
        status: string;
        submittedBy: { _id: string; name: string };
        committee: { _id: string; name: string };
        createdAt: string;
    };
}

export interface DirectiveUpdatedPayload {
    directiveId: string;
    status: string;
    feedback?: string;
    outcome?: string;
    updatedBy: { _id: string; name: string };
}

export interface CrisisUpdatePayload {
    update: {
        _id: string;
        title: string;
        body: string;
        visibility: string;
        postedBy: { _id: string; name: string };
        createdAt: string;
    };
}

export interface CrisisNotePayload {
    note: {
        _id: string;
        content: string;
        from: { _id: string; name: string };
        createdAt: string;
    };
}

export interface UserJoinedPayload {
    userId: string;
    name: string;
    role: string;
}

// Socket event names
export const SOCKET_EVENTS = {
    // Client -> Server
    JOIN_COMMITTEE: 'join:committee',
    LEAVE_COMMITTEE: 'leave:committee',

    // Server -> Client
    DIRECTIVE_CREATED: 'directive:created',
    DIRECTIVE_UPDATED: 'directive:updated',
    UPDATE_NEW: 'update:new',
    NOTE_NEW: 'note:new',
    USER_JOINED: 'user:joined',
    USER_LEFT: 'user:left',
    ERROR: 'error',
} as const;
