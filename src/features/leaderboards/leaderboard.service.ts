import { User } from '../users/user.model';
import { Tip } from '../tips/tip.model';
import { NotFoundError } from '../../utils/errors';

export class LeaderboardService {
    // Get top creators by tips received
    async getTopCreators(limit: number = 100) {
        // Aggregate tips received by each user
        const tipsData = await Tip.aggregate([
            {
                $group: {
                    _id: '$recipient',
                    totalPointsEarned: { $sum: '$amount' },
                    tipCount: { $count: {} },
                },
            },
            {
                $sort: { totalPointsEarned: -1 },
            },
            {
                $limit: limit,
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userInfo',
                },
            },
            {
                $unwind: '$userInfo',
            },
            {
                $project: {
                    _id: '$userInfo._id',
                    username: '$userInfo.username',
                    avatar: '$userInfo.avatar',
                    bio: '$userInfo.bio',
                    privacyScore: '$userInfo.privacyScore',
                    followers: '$userInfo.followers',
                    batPoints: '$userInfo.batPoints',
                    totalPointsEarned: 1,
                    tipCount: 1,
                },
            },
        ]);

        // If no tips exist, return users sorted by BAT points
        if (tipsData.length === 0) {
            const usersByPoints = await User.find()
                .sort({ batPoints: -1 })
                .limit(limit)
                .select('username avatar bio privacyScore followers batPoints')
                .lean();

            return usersByPoints.map((user) => ({
                ...user,
                totalPointsEarned: 0,
                tipCount: 0,
            }));
        }

        return tipsData;
    }

    // Get top tippers by tips sent
    async getTopTippers(limit: number = 100) {
        // Aggregate tips sent by each user
        const tipsData = await Tip.aggregate([
            {
                $group: {
                    _id: '$sender',
                    totalPointsSent: { $sum: '$amount' },
                    tipCount: { $count: {} },
                },
            },
            {
                $sort: { totalPointsSent: -1 },
            },
            {
                $limit: limit,
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userInfo',
                },
            },
            {
                $unwind: '$userInfo',
            },
            {
                $project: {
                    _id: '$userInfo._id',
                    username: '$userInfo.username',
                    avatar: '$userInfo.avatar',
                    bio: '$userInfo.bio',
                    privacyScore: '$userInfo.privacyScore',
                    followers: '$userInfo.followers',
                    batPoints: '$userInfo.batPoints',
                    totalPointsSent: 1,
                    tipCount: 1,
                },
            },
        ]);

        // If no tips exist, return users sorted by BAT points
        if (tipsData.length === 0) {
            const usersByPoints = await User.find()
                .sort({ batPoints: -1 })
                .limit(limit)
                .select('username avatar bio privacyScore followers batPoints')
                .lean();

            return usersByPoints.map((user) => ({
                ...user,
                totalPointsSent: 0,
                tipCount: 0,
            }));
        }

        return tipsData;
    }

    // Get user's rank in both leaderboards
    async getMyRank(userId: string) {
        const user = await User.findById(userId);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        // Get user's total points earned
        const pointsEarnedResult = await Tip.aggregate([
            {
                $match: { recipient: user._id },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                },
            },
        ]);

        const totalPointsEarned = pointsEarnedResult[0]?.total || 0;

        // Get user's total points sent
        const pointsSentResult = await Tip.aggregate([
            {
                $match: { sender: user._id },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                },
            },
        ]);

        const totalPointsSent = pointsSentResult[0]?.total || 0;

        // Calculate creator rank (how many users have more points earned)
        const creatorsAbove = await Tip.aggregate([
            {
                $group: {
                    _id: '$recipient',
                    totalPointsEarned: { $sum: '$amount' },
                },
            },
            {
                $match: {
                    totalPointsEarned: { $gt: totalPointsEarned },
                },
            },
            {
                $count: 'count',
            },
        ]);

        const creatorRank = totalPointsEarned > 0 ? (creatorsAbove[0]?.count || 0) + 1 : null;

        // Calculate tipper rank (how many users have sent more points)
        const tippersAbove = await Tip.aggregate([
            {
                $group: {
                    _id: '$sender',
                    totalPointsSent: { $sum: '$amount' },
                },
            },
            {
                $match: {
                    totalPointsSent: { $gt: totalPointsSent },
                },
            },
            {
                $count: 'count',
            },
        ]);

        const tipperRank = totalPointsSent > 0 ? (tippersAbove[0]?.count || 0) + 1 : null;

        return {
            creatorRank,
            tipperRank,
            totalPointsEarned,
            totalPointsSent,
        };
    }
}
