import mongoose, { Document, Schema } from 'mongoose';
import { nanoid } from 'nanoid';

export interface IConference extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    isActive: boolean;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const conferenceSchema = new Schema<IConference>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 200,
        },
        description: {
            type: String,
            maxlength: 1000,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export const Conference = mongoose.model<IConference>('Conference', conferenceSchema);
export default Conference;
