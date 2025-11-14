import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { config } from '../../config';
import { asyncHandler } from '../../middleware/async.middleware';
import { ApiResponse } from '../../utils/response';
import { ConversionService } from './conversion.service';

const conversionService = new ConversionService();

export class ConversionController {
    requestConversion = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const userId = req.user!._id.toString();
        const { pointsAmount, walletAddress } = req.body;

        const conv = await conversionService.convertNow(userId, pointsAmount, walletAddress);

        ApiResponse.success(
            res,
            conv,
            conv.status === 'completed' ? 'Conversion completed successfully' : 'Conversion failed',
            conv.status === 'completed' ? 201 : 400
        );
    });

    getConversionHistory = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const userId = req.user!._id.toString();
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const result = await conversionService.getConversionHistory(userId, page, limit);

        ApiResponse.paginated(
            res,
            result.conversions,
            result.page,
            result.limit,
            result.total,
            'Conversion history retrieved successfully'
        );
    });

    getConversionById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const userId = req.user!._id.toString();
        const { id } = req.params;

        const conv = await conversionService.getConversionById(id, userId);

        ApiResponse.success(res, conv, 'Conversion retrieved successfully');
    });

    getRate = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { pointsToTokenRate, minConversionPoints, conversionStepPoints } = config.app;

        ApiResponse.success(
            res,
            { pointsToTokenRate, minConversionPoints, conversionStepPoints },
            'Conversion rate retrieved successfully'
        );
    });
}
