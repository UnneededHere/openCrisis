import mongoose, { Document, Schema } from 'mongoose';

export interface ICrisisNote extends Document {
    _id: mongoose.Types.ObjectId;
    content: string;
    committee: mongoose.Types.ObjectId;
    from: mongoose.Types.ObjectId;
    to: mongoose.Types.ObjectId;
    replyTo?: mongoose.Types.ObjectId;
    read: boolean;
    createdAt: Date;
}

const crisisNoteSchema = new Schema<ICrisisNote>(
    {
        content: {
            type: String,
            required: true,
            minlength: 1,
            maxlength: 5000,
        },
        committee: {
            type: Schema.Types.ObjectId,
            ref: 'Committee',
            required: true,
            index: true,
        },
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
        replyTo: {
            type: Schema.Types.ObjectId,
            ref: 'CrisisNote',
        },
        read: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

// Indexes for common queries
crisisNoteSchema.index({ committee: 1, createdAt: -1 });
crisisNoteSchema.index({ to: 1, read: 1 });

export const CrisisNote = mongoose.model<ICrisisNote>('CrisisNote', crisisNoteSchema);
export default CrisisNote;
