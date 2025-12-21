import mongoose, { Document, Schema } from 'mongoose';
import type { MessageStatus } from '@opencrisis/shared';

export interface IMessage extends Document {
    _id: mongoose.Types.ObjectId;
    from: mongoose.Types.ObjectId;
    to: mongoose.Types.ObjectId;
    committee: mongoose.Types.ObjectId;
    content: string;
    status: MessageStatus;
    moderatedBy?: mongoose.Types.ObjectId;
    moderatedAt?: Date;
    rejectionReason?: string;
    readAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
    {
        from: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        to: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        committee: {
            type: Schema.Types.ObjectId,
            ref: 'Committee',
            required: true,
            index: true,
        },
        content: {
            type: String,
            required: true,
            minlength: 1,
            maxlength: 5000,
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'denied'],
            default: 'pending',
            index: true,
        },
        moderatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        moderatedAt: {
            type: Date,
        },
        rejectionReason: {
            type: String,
            maxlength: 500,
        },
        readAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for common queries
messageSchema.index({ from: 1, createdAt: -1 });
messageSchema.index({ to: 1, createdAt: -1 });
messageSchema.index({ committee: 1, status: 1 });
messageSchema.index({ status: 1, createdAt: -1 }); // For staff moderation queue

export const Message = mongoose.model<IMessage>('Message', messageSchema);
export default Message;
