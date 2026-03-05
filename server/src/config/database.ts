import mongoose from 'mongoose';
import { config } from './index';
import { logger } from './logger';
import { User } from '../models';

export const connectDatabase = async (): Promise<void> => {
    try {
        await mongoose.connect(config.mongoUri);
        logger.info('Connected to MongoDB');
    } catch (error) {
        logger.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

/**
 * Ensures a default admin account exists. Runs on every server startup.
 * Idempotent — does nothing if admin@example.com already exists.
 */
export const ensureAdminAccount = async (): Promise<void> => {
    try {
        const existingAdmin = await User.findOne({ email: 'admin@example.com' });

        if (existingAdmin) {
            logger.info('Default admin account already exists');
            return;
        }

        await User.create({
            email: 'admin@example.com',
            password: 'password123',
            name: 'System Administrator',
            role: 'admin',
        });

        logger.info('Default admin account created (admin@example.com)');
    } catch (error) {
        logger.error('Failed to ensure admin account:', error);
    }
};

mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
    logger.error('MongoDB error:', err);
});

export default connectDatabase;
