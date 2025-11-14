import { Router } from 'express';
import { LeaderboardController } from './leaderboard.controller';
import { protect } from '../../middleware/auth.middleware';

const router = Router();
const leaderboardController = new LeaderboardController();

// Public routes (can view without auth)
router.get('/creators', leaderboardController.getTopCreators);
router.get('/tippers', leaderboardController.getTopTippers);

// Protected routes (require auth)
router.get('/my-rank', protect, leaderboardController.getMyRank);

export default router;
