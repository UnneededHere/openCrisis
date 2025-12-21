import mongoose, { Document, Schema } from 'mongoose';
import type { AuditEntityType } from '@opencrisis/shared';

export interface IAuditLog extends Document {
    _id: mongoose.Types.ObjectId;
    action: string;
    entityType: AuditEntityType;
    entityId: mongoose.Types.ObjectId;
    performedBy: mongoose.Types.ObjectId;
    details: Record<string, unknown>;
    createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
    {
        action: {
            type: String,
            required: true,
            index: true,
        },
        entityType: {
            type: String,
            enum: ['directive', 'update', 'note', 'message', 'announcement', 'user', 'conference', 'committee'],
            required: true,
            index: true,
        },
        entityId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        performedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        details: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

// Index for time-based queries
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
export default AuditLog;
