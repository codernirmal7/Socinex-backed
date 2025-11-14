import { User, IUserDocument } from './user.model';
import { NotFoundError, ConflictError, BadRequestError } from '../../utils/errors';
import redis from '../../config/redis';
import { io } from '../../server';
import { Notification } from '../notifications/notification.model';

export class UserService {
    async getUserById(userId: string): Promise<IUserDocument> {
        const user = await User.findById(userId)
            .select('-signupBonus.ipAddress -signupBonus.deviceFingerprint')
            .populate('followers', 'username avatar')
            .populate('following', 'username avatar');

        if (!user) {
            throw new NotFoundError('User not found');
        }

        return user;
    }

    async getUserByUsername(username: string): Promise<IUserDocument> {
        const user = await User.findOne({ username: username.toLowerCase() })
            .select('-signupBonus.ipAddress -signupBonus.deviceFingerprint')
            .populate('followers', 'username avatar')
            .populate('following', 'username avatar');


        if (!user) {
            throw new NotFoundError('User not found');
        }

        return user;
    }

    async updateProfile(
        userId: string,
        updates: { username?: string; bio?: string; avatar?: string; banner?: string }
    ): Promise<IUserDocument> {
        const user = await User.findById(userId);

        if (!user) {
            throw new NotFoundError('User not found');
        }

        // Check if username is being changed and if it's already taken
        if (updates.username && updates.username !== user.username) {
            const existingUser = await User.findByUsername(updates.username);
            if (existingUser) {
                throw new ConflictError('Username already taken');
            }
            user.username = updates.username;
        }

        if (updates.bio !== undefined) user.bio = updates.bio;
        if (updates.avatar) user.avatar = updates.avatar;
        if (updates.banner) user.banner = updates.banner;

        await user.save();

        return user;
    }

    // Remove walletAddress from getFollowers and getFollowing select
    async getFollowers(userId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const base = await User.findById(userId).select('_id followers');
        if (!base) throw new NotFoundError('User not found');
        const populated = await User.findById(userId)
            .select('_id')
            .populate({
                path: 'followers',
                select: 'username avatar bio email createdAt', // changed from walletAddress
                options: { sort: { createdAt: -1 }, limit, skip },
            })
            .lean();
        const items = (populated as any)?.followers || [];
        const total = (base.followers || []).length;
        return { items, total, page, limit };
    }


    async getFollowing(userId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const base = await User.findById(userId).select('_id following');
        if (!base) throw new NotFoundError('User not found');
        const populated = await User.findById(userId)
            .select('_id')
            .populate({
                path: 'following',
                select: 'username avatar bio walletAddress createdAt',
                options: { sort: { createdAt: -1 }, limit, skip },
            })
            .lean();
        const items = (populated as any)?.following || [];
        const total = (base.following || []).length;
        return { items, total, page, limit };
    }


    async followUser(followerId: string, followingId: string): Promise<void> {
        if (followerId === followingId) {
            throw new BadRequestError('Cannot follow yourself');
        }

        const follower = await User.findById(followerId);
        const following = await User.findById(followingId);

        if (!follower || !following) {
            throw new NotFoundError('User not found');
        }

        // Check if already following
        if (follower.following.includes(following._id)) {
            throw new ConflictError('Already following this user');
        }

        // Add to following/followers
        follower.following.push(following._id);
        following.followers.push(follower._id);

        await Promise.all([follower.save(), following.save()]);

        // Create notification
        await Notification.create({
            user: followingId,
            type: 'follow',
            data: {
                follower: {
                    id: follower._id,
                    username: follower.username,
                    avatar: follower.avatar,
                },
            },
            read: false,
        });

        // Emit real-time notification
        io.to(followingId).emit('notification', {
            type: 'follow',
            data: {
                follower: follower.username,
            },
        });
    }

    async unfollowUser(followerId: string, followingId: string): Promise<void> {
        if (followerId === followingId) {
            throw new BadRequestError('Cannot unfollow yourself');
        }

        const follower = await User.findById(followerId);
        const following = await User.findById(followingId);

        if (!follower || !following) {
            throw new NotFoundError('User not found');
        }

        // Remove from following/followers
        follower.following = follower.following.filter(
            (id) => id.toString() !== followingId
        );
        following.followers = following.followers.filter(
            (id) => id.toString() !== followerId
        );

        await Promise.all([follower.save(), following.save()]);
    }

    async searchUsers(query: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const users = await User.find({
            $or: [
                { username: { $regex: query, $options: 'i' } },
                { bio: { $regex: query, $options: 'i' } },
            ],
        })
            .select('username avatar bio batPoints totalPointsEarned followers')
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments({
            $or: [
                { username: { $regex: query, $options: 'i' } },
                { bio: { $regex: query, $options: 'i' } },
            ],
        });

        return { users, total, page, limit };
    }

    async getUserStats(userId: string) {
        const user = await User.findById(userId);

        if (!user) {
            throw new NotFoundError('User not found');
        }

        // Get ranks from Redis
        const creatorRank = await redis.zrevrank('leaderboard:creators', userId);
        const tipperRank = await redis.zrevrank('leaderboard:tippers', userId);

        return {
            batPoints: user.batPoints,
            totalPointsEarned: user.totalPointsEarned,
            totalPointsSent: user.totalPointsSent,
            followersCount: user.followers.length,
            followingCount: user.following.length,
            creatorRank: creatorRank !== null ? creatorRank + 1 : null,
            tipperRank: tipperRank !== null ? tipperRank + 1 : null,
        };
    }
}
