import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { logger } from './config/logger';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware';

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
    origin: config.corsOrigin,
    credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Request logging
app.use((req, res, next) => {
    logger.info({
        method: req.method,
        path: req.path,
        ip: req.ip,
    });
    next();
});

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: config.authRateLimitWindowMs,
    max: config.authRateLimitMaxRequests,
    message: {
        success: false,
        error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many requests, please try again later',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting to auth routes
app.use('/api/auth', authLimiter);

// General rate limiting
const generalLimiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMaxRequests,
    message: {
        success: false,
        error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many requests, please try again later',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api', generalLimiter);

// API routes
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;
