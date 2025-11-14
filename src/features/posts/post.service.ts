import { Post, IPostDocument } from './post.model';
import { User } from '../users/user.model';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../utils/errors';
import mongoose from 'mongoose';

export class PostService {
    async createPost(
        authorId: string,
        content: string,
        images?: string[]
    ): Promise<IPostDocument> {
        const author = await User.findById(authorId);

        if (!author) {
            throw new NotFoundError('User not found');
        }

        // Validate images array
        if (images && images.length > 4) {
            throw new BadRequestError('Maximum 4 images allowed per post');
        }

        const post = await Post.create({
            author: authorId,
            content,
            images: images || [],
        });

        return await post.populate('author', 'username avatar');
    }

    async getPostById(postId: string): Promise<IPostDocument> {
        const post = await Post.findById(postId)
            .populate('author', 'username avatar bio totalPointsEarned')
            .populate('likes', 'username avatar');

        if (!post) {
            throw new NotFoundError('Post not found');
        }

        return post;
    }

    async updatePost(
        postId: string,
        userId: string,
        updates: { content?: string; images?: string[] }
    ): Promise<IPostDocument> {
        const post = await Post.findById(postId);

        if (!post) {
            throw new NotFoundError('Post not found');
        }

        // Check if user is the author
        if (post.author.toString() !== userId) {
            throw new ForbiddenError('You can only update your own posts');
        }

        if (updates.content !== undefined) {
            post.content = updates.content;
        }

        if (updates.images !== undefined) {
            if (updates.images.length > 4) {
                throw new BadRequestError('Maximum 4 images allowed per post');
            }
            post.images = updates.images;
        }

        await post.save();

        return await post.populate('author', 'username avatar');
    }

    async deletePost(postId: string, userId: string): Promise<void> {
        const post = await Post.findById(postId);

        if (!post) {
            throw new NotFoundError('Post not found');
        }

        // Check if user is the author
        if (post.author.toString() !== userId) {
            throw new ForbiddenError('You can only delete your own posts');
        }

        await post.deleteOne();
    }

    async likePost(postId: string, userId: string): Promise<IPostDocument> {
        const post = await Post.findById(postId);

        if (!post) {
            throw new NotFoundError('Post not found');
        }

        // Check if already liked
        const alreadyLiked = post.likes.some((id) => id.toString() === userId);

        if (alreadyLiked) {
            throw new BadRequestError('Post already liked');
        }

        post.likes.push(new mongoose.Types.ObjectId(userId));
        await post.save();

        return await post.populate('author', 'username avatar');
    }

    async unlikePost(postId: string, userId: string): Promise<IPostDocument> {
        const post = await Post.findById(postId);

        if (!post) {
            throw new NotFoundError('Post not found');
        }

        // Check if not liked
        const isLiked = post.likes.some((id) => id.toString() === userId);

        if (!isLiked) {
            throw new BadRequestError('Post not liked yet');
        }

        post.likes = post.likes.filter((id) => id.toString() !== userId);
        await post.save();

        return await post.populate('author', 'username avatar');
    }

    async getFeed(userId: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        // Get user's following list
        const user = await User.findById(userId).select('following');

        if (!user) {
            throw new NotFoundError('User not found');
        }

        // Get posts from followed users + own posts
        const posts = await Post.find({
            author: { $in: [...user.following, new mongoose.Types.ObjectId(userId)] },
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('author', 'username avatar bio')
            .populate('likes', 'username avatar');

        const total = await Post.countDocuments({
            author: { $in: [...user.following, new mongoose.Types.ObjectId(userId)] },
        });

        return { posts, total, page, limit };
    }

    async getExplorePosts(page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        // Get all posts sorted by popularity (likes + tips)
        const posts = await Post.aggregate([
            {
                $addFields: {
                    popularity: {
                        $add: [{ $size: '$likes' }, { $multiply: ['$totalTipAmount', 2] }],
                    },
                },
            },
            { $sort: { popularity: -1, createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
        ]);

        // Populate author and likes
        await Post.populate(posts, [
            { path: 'author', select: 'username avatar bio' },
            { path: 'likes', select: 'username avatar' },
        ]);

        const total = await Post.countDocuments();

        return { posts, total, page, limit };
    }

    async getUserPosts(userId: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const posts = await Post.find({ author: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('author', 'username avatar bio')
            .populate('likes', 'username avatar');

        const total = await Post.countDocuments({ author: userId });

        return { posts, total, page, limit };
    }

    async getTrendingPosts(limit: number = 20) {
        // Get posts from last 7 days sorted by engagement
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const posts = await Post.aggregate([
            {
                $match: {
                    createdAt: { $gte: sevenDaysAgo },
                },
            },
            {
                $addFields: {
                    engagement: {
                        $add: [
                            { $size: '$likes' },
                            { $multiply: ['$totalTips', 3] },
                            { $multiply: ['$totalTipAmount', 5] },
                        ],
                    },
                },
            },
            { $sort: { engagement: -1 } },
            { $limit: limit },
        ]);

        // Populate author and likes
        await Post.populate(posts, [
            { path: 'author', select: 'username avatar bio' },
            { path: 'likes', select: 'username avatar' },
        ]);

        return posts;
    }

    async searchPosts(query: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const posts = await Post.find({
            content: { $regex: query, $options: 'i' },
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('author', 'username avatar bio')
            .populate('likes', 'username avatar');

        const total = await Post.countDocuments({
            content: { $regex: query, $options: 'i' },
        });

        return { posts, total, page, limit };
    }

    // Called by TipService after a tip is sent to a post
    async incrementPostTipStats(postId: string, amount: number): Promise<void> {
        await Post.updateOne(
            { _id: postId },
            {
                $inc: {
                    totalTips: 1,
                    totalTipAmount: amount,
                },
            }
        );
    }
}
