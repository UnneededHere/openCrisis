import mongoose, { Document, Schema } from 'mongoose';
import type { CommitteeType } from '@opencrisis/shared';

export interface ICommittee extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    conference: mongoose.Types.ObjectId;
    description?: string;
    type: CommitteeType;
    members: mongoose.Types.ObjectId[];
    staff: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const committeeSchema = new Schema<ICommittee>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 200,
        },
        conference: {
            type: Schema.Types.ObjectId,
            ref: 'Conference',
            required: true,
            index: true,
        },
        description: {
            type: String,
            maxlength: 1000,
        },
        type: {
            type: String,
            enum: ['crisis', 'general', 'specialized'],
            default: 'crisis',
        },
        members: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
        }],
        staff: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
        }],
    },
    {
        timestamps: true,
    }
);

// Compound index for conference + name uniqueness
committeeSchema.index({ conference: 1, name: 1 }, { unique: true });

export const Committee = mongoose.model<ICommittee>('Committee', committeeSchema);
export default Committee;
