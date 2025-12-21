import http from 'http';
import app from './app';
import { config } from './config';
import { connectDatabase } from './config/database';
import { logger } from './config/logger';
import { initializeSocket } from './socket';

const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDatabase();

        // Create HTTP server
        const server = http.createServer(app);

        // Initialize Socket.IO
        initializeSocket(server);
        logger.info('Socket.IO initialized');

        // Start listening
        server.listen(config.port, () => {
            logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
        });

        // Graceful shutdown
        const shutdown = async () => {
            logger.info('Shutting down server...');
            server.close(() => {
                logger.info('Server closed');
                process.exit(0);
            });
        };

        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
