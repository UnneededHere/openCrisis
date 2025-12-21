import mongoose, { Document, Schema } from 'mongoose';
import type { DirectiveType, DirectiveStatus } from '@opencrisis/shared';

export interface IDirective extends Document {
    _id: mongoose.Types.ObjectId;
    title: string;
    body: string;
    type: DirectiveType;
    committee: mongoose.Types.ObjectId;
    submittedBy: mongoose.Types.ObjectId;
    status: DirectiveStatus;
    assignedTo?: mongoose.Types.ObjectId;
    feedback?: string;
    outcome?: string;
    createdAt: Date;
    updatedAt: Date;
}

const directiveSchema = new Schema<IDirective>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 200,
        },
        body: {
            type: String,
            required: true,
            minlength: 10,
            maxlength: 10000,
        },
        type: {
            type: String,
            enum: ['public', 'private', 'covert'],
            default: 'public',
        },
        committee: {
            type: Schema.Types.ObjectId,
            ref: 'Committee',
            required: true,
            index: true,
        },
        submittedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: ['submitted', 'in_review', 'needs_revision', 'approved', 'denied', 'executed'],
            default: 'submitted',
            index: true,
        },
        assignedTo: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        feedback: {
            type: String,
            maxlength: 2000,
        },
        outcome: {
            type: String,
            maxlength: 2000,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for common queries
directiveSchema.index({ committee: 1, status: 1 });
directiveSchema.index({ committee: 1, createdAt: -1 });

export const Directive = mongoose.model<IDirective>('Directive', directiveSchema);
export default Directive;
