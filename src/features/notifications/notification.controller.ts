import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { NotificationService } from './notification.service';
import { ApiResponse } from '../../utils/response';
import { asyncHandler } from '../../middleware/async.middleware';

const notificationService = new NotificationService();

export class NotificationController {
    getNotifications = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const userId = req.user!._id.toString();
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const result = await notificationService.getUserNotifications(userId, page, limit);

        res.status(200).json({
            success: true,
            message: 'Notifications retrieved successfully',
            data: result.notifications,
            unreadCount: result.unreadCount,
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                pages: Math.ceil(result.total / result.limit),
            },
        });
    });

    markAsRead = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const userId = req.user!._id.toString();
        const { id } = req.params;

        const notification = await notificationService.markAsRead(id, userId);

        ApiResponse.success(res, notification, 'Notification marked as read');
    });

    markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const userId = req.user!._id.toString();

        await notificationService.markAllAsRead(userId);

        ApiResponse.success(res, null, 'All notifications marked as read');
    });

    deleteNotification = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const userId = req.user!._id.toString();
        const { id } = req.params;

        await notificationService.deleteNotification(id, userId);

        ApiResponse.success(res, null, 'Notification deleted successfully');
    });

    getUnreadCount = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const userId = req.user!._id.toString();

        const count = await notificationService.getUnreadCount(userId);

        ApiResponse.success(res, { count }, 'Unread count retrieved successfully');
    });
}
