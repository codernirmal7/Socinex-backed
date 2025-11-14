import { Server } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import { config } from './config';
import { connectDatabase } from './config/database';
import redis from './config/redis';
import logger from './utils/logger';

let server: Server;
export let io: SocketIOServer;

const startServer = async () => {
    try {
        // Connect to database
        await connectDatabase();

        // Start server
        server = app.listen(config.port, () => {
            logger.info(`🚀 Server running on port ${config.port} in ${config.env} mode`);
        });

        // Initialize Socket.IO
        io = new SocketIOServer(server, {
            cors: config.cors,
        });

        io.on('connection', (socket) => {
            logger.debug(`Socket connected: ${socket.id}`);

            socket.on('join', (userId: string) => {
                socket.join(userId);
                logger.debug(`User ${userId} joined room`);
            });

            socket.on('disconnect', () => {
                logger.debug(`Socket disconnected: ${socket.id}`);
            });
        });

        // Graceful shutdown
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

const gracefulShutdown = async () => {
    logger.info('Shutting down gracefully...');

    server.close(async () => {
        logger.info('HTTP server closed');

        try {
            await redis.quit();
            logger.info('Redis connection closed');

            process.exit(0);
        } catch (error) {
            logger.error('Error during shutdown:', error);
            process.exit(1);
        }
    });
};

startServer();
