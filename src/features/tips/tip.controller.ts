import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { TipService } from './tip.service';
import { ApiResponse } from '../../utils/response';
import { asyncHandler } from '../../middleware/async.middleware';

const tipService = new TipService();

export class TipController {
    sendTip = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const senderId = req.user!._id.toString();
        const { recipientId, amount, message, postId } = req.body;

        const tip = await tipService.sendTip(senderId, recipientId, amount, message, postId);

        ApiResponse.success(res, tip, 'Tip sent successfully', 201);
    });

    getMySentTips = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const userId = req.user!._id.toString();
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const result = await tipService.getMySentTips(userId, page, limit);

        ApiResponse.paginated(
            res,
            result.tips,
            result.page,
            result.limit,
            result.total,
            'Sent tips retrieved successfully'
        );
    });

    getMyReceivedTips = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const userId = req.user!._id.toString();
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const result = await tipService.getMyReceivedTips(userId, page, limit);

        ApiResponse.paginated(
            res,
            result.tips,
            result.page,
            result.limit,
            result.total,
            'Received tips retrieved successfully'
        );
    });

    getTipById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { id } = req.params;

        const tip = await tipService.getTipById(id);

        ApiResponse.success(res, tip, 'Tip retrieved successfully');
    });
}
