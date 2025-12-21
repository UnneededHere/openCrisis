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
    // For joint directives - other delegates who co-signed
    coSigners: mongoose.Types.ObjectId[];
    // Status tracking timestamps
    openedAt?: Date;
    processingAt?: Date;
    repliedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const directiveSchema = new Schema<IDirective>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
            maxlength: 200,
        },
        body: {
            type: String,
            required: true,
            minlength: 1,
            maxlength: 10000,
        },
        type: {
            type: String,
            enum: ['personal', 'joint', 'cabinet'],
            default: 'personal',
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
            enum: ['submitted', 'opened', 'processing', 'needs_revision', 'approved', 'denied', 'executed'],
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
        // For joint directives
        coSigners: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
        }],
        // Status tracking timestamps
        openedAt: {
            type: Date,
        },
        processingAt: {
            type: Date,
        },
        repliedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for common queries
directiveSchema.index({ committee: 1, status: 1 });
directiveSchema.index({ committee: 1, createdAt: -1 });
directiveSchema.index({ coSigners: 1 }); // For finding directives user co-signed

export const Directive = mongoose.model<IDirective>('Directive', directiveSchema);
export default Directive;
