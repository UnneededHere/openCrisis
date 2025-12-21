import mongoose, { Document, Schema } from 'mongoose';
import type { CommitteeType } from '@opencrisis/shared';

// Member assignment with character name
export interface ICommitteeMember {
    user: mongoose.Types.ObjectId;
    characterName: string;
}

export interface ICommittee extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    conference: mongoose.Types.ObjectId;
    description?: string;
    type: CommitteeType;
    members: ICommitteeMember[];
    staff: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const committeeMemberSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    characterName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },
}, { _id: false });

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
        members: [committeeMemberSchema],
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
// Index for finding committees by member user
committeeSchema.index({ 'members.user': 1 });

export const Committee = mongoose.model<ICommittee>('Committee', committeeSchema);
export default Committee;
