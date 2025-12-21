import mongoose from 'mongoose';
import { config } from './index';
import { logger } from './logger';

export const connectDatabase = async (): Promise<void> => {
    try {
        await mongoose.connect(config.mongoUri);
        logger.info('Connected to MongoDB');
    } catch (error) {
        logger.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
    logger.error('MongoDB error:', err);
});

export default connectDatabase;
