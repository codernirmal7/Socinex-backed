import Queue from 'bull';
import { config } from '../config';
import { Notification } from '../features/notifications/notification.model';
import { io } from '../server';
import logger from '../utils/logger';

export const notificationQueue = new Queue('notifications', {
    redis: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
    },
});

notificationQueue.process(async (job) => {
    const { userId, type, data } = job.data;

    try {
        // Create notification in database
        await Notification.create({
            user: userId,
            type,
            data,
            read: false,
        });

        // Emit real-time notification via Socket.io
        io.to(userId).emit('notification', { type, data });

        logger.info(`Notification sent to user ${userId}: ${type}`);
    } catch (error) {
        logger.error('Failed to process notification:', error);
        throw error;
    }
});

notificationQueue.on('failed', (job, err) => {
    logger.error(`Notification job ${job.id} failed:`, err);
});

notificationQueue.on('completed', (job) => {
    logger.debug(`Notification job ${job.id} completed`);
});

export default notificationQueue;
