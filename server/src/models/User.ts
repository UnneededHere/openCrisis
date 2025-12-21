import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import type { UserRole } from '@opencrisis/shared';

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    email: string;
    password: string;
    name: string;
    role: UserRole;
    conferences: mongoose.Types.ObjectId[];
    refreshTokens: string[];
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 8,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100,
        },
        role: {
            type: String,
            enum: ['admin', 'staff', 'delegate'],
            default: 'delegate',
        },
        conferences: [{
            type: Schema.Types.ObjectId,
            ref: 'Conference',
        }],
        refreshTokens: [{
            type: String,
        }],
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields from JSON output
userSchema.set('toJSON', {
    transform: (_doc, ret) => {
        const { password: _p, refreshTokens: _r, ...rest } = ret;
        return rest;
    },
});

export const User = mongoose.model<IUser>('User', userSchema);
export default User;
