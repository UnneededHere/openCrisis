import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';
import { User, IUser } from '../models';
import { AuditLog } from '../models';
import type { LoginInput, RegisterInput } from '@opencrisis/shared';
import type { LoginResponse, AuthTokens } from '@opencrisis/shared';

class AuthService {
    // Generate access token
    generateAccessToken(user: IUser): string {
        return jwt.sign(
            { userId: user._id.toString(), role: user.role },
            config.jwtSecret,
            { expiresIn: '15m' } as jwt.SignOptions
        );
    }

    // Generate refresh token
    generateRefreshToken(): string {
        return crypto.randomBytes(64).toString('hex');
    }

    // Hash refresh token for storage
    hashToken(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    // Generate both tokens
    async generateTokens(user: IUser): Promise<AuthTokens> {
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken();

        // Store hashed refresh token
        const hashedToken = this.hashToken(refreshToken);
        user.refreshTokens.push(hashedToken);

        // Keep only last 5 refresh tokens
        if (user.refreshTokens.length > 5) {
            user.refreshTokens = user.refreshTokens.slice(-5);
        }

        await user.save();

        return { accessToken, refreshToken };
    }

    // Register new user
    async register(data: RegisterInput): Promise<LoginResponse> {
        const existingUser = await User.findOne({ email: data.email.toLowerCase() });

        if (existingUser) {
            const error = new Error('Email already registered') as Error & { statusCode: number; code: string };
            error.statusCode = 400;
            error.code = 'EMAIL_EXISTS';
            throw error;
        }

        const user = new User({
            email: data.email.toLowerCase(),
            password: data.password,
            name: data.name,
            role: data.role || 'delegate',
        });

        await user.save();

        // Log the registration
        await AuditLog.create({
            action: 'user.registered',
            entityType: 'user',
            entityId: user._id,
            performedBy: user._id,
            details: { role: user.role },
        });

        const tokens = await this.generateTokens(user);

        return {
            user: {
                _id: user._id.toString(),
                email: user.email,
                name: user.name,
                role: user.role,
            },
            tokens,
        };
    }

    // Login user
    async login(data: LoginInput): Promise<LoginResponse> {
        const user = await User.findOne({ email: data.email.toLowerCase() });

        if (!user) {
            const error = new Error('Invalid credentials') as Error & { statusCode: number; code: string };
            error.statusCode = 401;
            error.code = 'INVALID_CREDENTIALS';
            throw error;
        }

        const isMatch = await user.comparePassword(data.password);

        if (!isMatch) {
            const error = new Error('Invalid credentials') as Error & { statusCode: number; code: string };
            error.statusCode = 401;
            error.code = 'INVALID_CREDENTIALS';
            throw error;
        }

        // Log the login
        await AuditLog.create({
            action: 'user.login',
            entityType: 'user',
            entityId: user._id,
            performedBy: user._id,
            details: {},
        });

        const tokens = await this.generateTokens(user);

        return {
            user: {
                _id: user._id.toString(),
                email: user.email,
                name: user.name,
                role: user.role,
            },
            tokens,
        };
    }

    // Refresh access token
    async refresh(refreshToken: string): Promise<{ accessToken: string }> {
        const hashedToken = this.hashToken(refreshToken);

        const user = await User.findOne({ refreshTokens: hashedToken });

        if (!user) {
            const error = new Error('Invalid refresh token') as Error & { statusCode: number; code: string };
            error.statusCode = 401;
            error.code = 'INVALID_REFRESH_TOKEN';
            throw error;
        }

        // Generate new access token
        const accessToken = this.generateAccessToken(user);

        return { accessToken };
    }

    // Logout - invalidate refresh token
    async logout(user: IUser, refreshToken?: string): Promise<void> {
        if (refreshToken) {
            const hashedToken = this.hashToken(refreshToken);
            user.refreshTokens = user.refreshTokens.filter((t) => t !== hashedToken);
        } else {
            // Logout from all devices
            user.refreshTokens = [];
        }

        await user.save();

        // Log the logout
        await AuditLog.create({
            action: 'user.logout',
            entityType: 'user',
            entityId: user._id,
            performedBy: user._id,
            details: { allDevices: !refreshToken },
        });
    }
}

export const authService = new AuthService();
export default authService;
