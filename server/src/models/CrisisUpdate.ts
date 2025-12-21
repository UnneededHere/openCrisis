import mongoose, { Document, Schema } from 'mongoose';
import type { UpdateVisibility } from '@opencrisis/shared';

export interface ICrisisUpdate extends Document {
    _id: mongoose.Types.ObjectId;
    title: string;
    body: string;
    committee: mongoose.Types.ObjectId;
    visibility: UpdateVisibility;
    targetDelegates?: mongoose.Types.ObjectId[];
    postedBy: mongoose.Types.ObjectId;
    createdAt: Date;
}

const crisisUpdateSchema = new Schema<ICrisisUpdate>(
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
        committee: {
            type: Schema.Types.ObjectId,
            ref: 'Committee',
            required: true,
            index: true,
        },
        visibility: {
            type: String,
            enum: ['public', 'private'],
            default: 'public',
        },
        targetDelegates: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
        }],
        postedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

// Index for fetching updates by committee
crisisUpdateSchema.index({ committee: 1, createdAt: -1 });

export const CrisisUpdate = mongoose.model<ICrisisUpdate>('CrisisUpdate', crisisUpdateSchema);
export default CrisisUpdate;
