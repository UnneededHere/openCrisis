import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
    // Server
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    // MongoDB
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/opencrisis',

    // JWT
    jwtSecret: process.env.JWT_SECRET || 'change-this-secret-in-production',
    jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',

    // CORS
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

    // Rate Limiting
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10000', 10),

    // Auth Rate Limiting (stricter for auth endpoints)
    authRateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
    authRateLimitMaxRequests: 1000, // 1000 requests per window
};

export default config;
