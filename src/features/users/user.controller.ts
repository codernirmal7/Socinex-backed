import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { UserService } from './user.service';
import { ApiResponse } from '../../utils/response';
import { asyncHandler } from '../../middleware/async.middleware';
import { config } from '../../config';
import { User } from './user.model';

const userService = new UserService();

export class UserController {
    getUserById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { id } = req.params;
        const user = await userService.getUserById(id);

        ApiResponse.success(res, user, 'User retrieved successfully');
    });

    getUserByUsername = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { username } = req.params;
        const user = await userService.getUserByUsername(username);

        ApiResponse.success(res, user, 'User retrieved successfully');
    });

    updateProfile = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const userId = req.user!._id.toString();
        const updates = req.body;

        // ✅ Handle Cloudinary uploads
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        if (files) {
            // Handle avatar upload - Cloudinary URL is in file.path
            if (files.avatar && files.avatar[0]) {
                updates.avatar = (files.avatar[0] as any).path;
                console.log('🖼️ Avatar uploaded to Cloudinary:', updates.avatar);
            }

            // Handle banner upload - Cloudinary URL is in file.path
            if (files.banner && files.banner[0]) {
                updates.banner = (files.banner[0] as any).path;
                console.log('🖼️ Banner uploaded to Cloudinary:', updates.banner);
            }
        }

        const user = await userService.updateProfile(userId, updates);
        ApiResponse.success(res, user, 'Profile updated successfully');
    });

    followUser = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const followerId = req.user!._id.toString();
        const { id } = req.params;

        await userService.followUser(followerId, id);

        ApiResponse.success(res, null, 'Successfully followed user');
    });

    unfollowUser = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const followerId = req.user!._id.toString();
        const { id } = req.params;

        await userService.unfollowUser(followerId, id);

        ApiResponse.success(res, null, 'Successfully unfollowed user');
    });

    searchUsers = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const query = req.query.q as string;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const result = await userService.searchUsers(query, page, limit);

        ApiResponse.paginated(
            res,
            result.users,
            result.page,
            result.limit,
            result.total,
            'Users retrieved successfully'
        );
    });

    getFollowers = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { id } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const result = await userService.getFollowers(id, page, limit);
        ApiResponse.paginated(res, result.items, result.page, result.limit, result.total, 'Followers retrieved');
    });
    // [Uses populate select and skip/limit options under the hood]

    getFollowing = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { id } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const result = await userService.getFollowing(id, page, limit);
        ApiResponse.paginated(res, result.items, result.page, result.limit, result.total, 'Following retrieved');
    });

    // Get all users (for explore page)
    getAllUsers = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
        const { page = 1, limit = 50 } = req.query;

        const skip = (Number(page) - 1) * Number(limit);

        const users = await User.find()
            .select('username avatar bio privacyScore followers following batPoints createdAt')
            .sort({ createdAt: -1 }) // Newest first
            .skip(skip)
            .limit(Number(limit))
            .lean();

        const total = await User.countDocuments();

        ApiResponse.paginated(
            res,
            users,
            Number(page),
            Number(limit),
            total,
            'Users retrieved successfully'
        );
    });


    getUserStats = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { id } = req.params;
        const stats = await userService.getUserStats(id);

        ApiResponse.success(res, stats, 'User stats retrieved successfully');
    });
}
