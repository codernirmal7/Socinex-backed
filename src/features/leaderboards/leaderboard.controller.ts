import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { LeaderboardService } from './leaderboard.service';
import { ApiResponse } from '../../utils/response';
import { asyncHandler } from '../../middleware/async.middleware';

const leaderboardService = new LeaderboardService();

export class LeaderboardController {
    // Get top creators
    getTopCreators = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const limit = parseInt(req.query.limit as string) || 100;

        const creators = await leaderboardService.getTopCreators(Math.min(limit, 100));

        ApiResponse.success(res, creators, 'Top creators retrieved successfully');
    });

    // Get top tippers
    getTopTippers = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const limit = parseInt(req.query.limit as string) || 100;

        const tippers = await leaderboardService.getTopTippers(Math.min(limit, 100));

        ApiResponse.success(res, tippers, 'Top tippers retrieved successfully');
    });

    // Get my rank
    getMyRank = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const userId = req.user!._id.toString();

        const rank = await leaderboardService.getMyRank(userId);

        ApiResponse.success(res, rank, 'Your rank retrieved successfully');
    });
}
