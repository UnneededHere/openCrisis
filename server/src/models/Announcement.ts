import mongoose, { Document, Schema } from 'mongoose';
import type { AnnouncementType, AnnouncementPriority } from '@opencrisis/shared';

export interface IAnnouncement extends Document {
    _id: mongoose.Types.ObjectId;
    title: string;
    body: string;
    type: AnnouncementType;
    committee: mongoose.Types.ObjectId;
    postedBy: mongoose.Types.ObjectId;
    targetDelegates: mongoose.Types.ObjectId[];
    priority: AnnouncementPriority;
    createdAt: Date;
    updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
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
            enum: ['media_notice', 'breaking_news', 'general'],
            default: 'general',
        },
        committee: {
            type: Schema.Types.ObjectId,
            ref: 'Committee',
            required: true,
            index: true,
        },
        postedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        // Empty array means all delegates can see
        targetDelegates: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
        }],
        priority: {
            type: String,
            enum: ['normal', 'high', 'urgent'],
            default: 'normal',
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for common queries
announcementSchema.index({ committee: 1, createdAt: -1 });
announcementSchema.index({ committee: 1, type: 1 });
announcementSchema.index({ targetDelegates: 1 });

export const Announcement = mongoose.model<IAnnouncement>('Announcement', announcementSchema);
export default Announcement;
