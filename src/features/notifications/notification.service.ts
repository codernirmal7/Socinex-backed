import { Notification, INotificationDocument } from './notification.model';
import { NotFoundError } from '../../utils/errors';

export class NotificationService {
    async getUserNotifications(userId: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const notifications = await Notification.find({ user: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Notification.countDocuments({ user: userId });
        const unreadCount = await Notification.countDocuments({ user: userId, read: false });

        return { notifications, total, unreadCount, page, limit };
    }

    async markAsRead(notificationId: string, userId: string): Promise<INotificationDocument> {
        const notification = await Notification.findOne({
            _id: notificationId,
            user: userId,
        });

        if (!notification) {
            throw new NotFoundError('Notification not found');
        }

        notification.read = true;
        await notification.save();

        return notification;
    }

    async markAllAsRead(userId: string): Promise<void> {
        await Notification.updateMany({ user: userId, read: false }, { read: true });
    }

    async deleteNotification(notificationId: string, userId: string): Promise<void> {
        const notification = await Notification.findOne({
            _id: notificationId,
            user: userId,
        });

        if (!notification) {
            throw new NotFoundError('Notification not found');
        }

        await notification.deleteOne();
    }

    async getUnreadCount(userId: string): Promise<number> {
        return await Notification.countDocuments({ user: userId, read: false });
    }
}
