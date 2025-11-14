import { Comment, ICommentDocument } from './comment.model';
import { Post } from '../posts/post.model';
import { User } from '../users/user.model';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../utils/errors';

export class CommentService {
    async createComment(
        postId: string,
        authorId: string,
        content: string
    ): Promise<ICommentDocument> {
        const post = await Post.findById(postId);
        if (!post) {
            throw new NotFoundError('Post not found');
        }

        const author = await User.findById(authorId);
        if (!author) {
            throw new NotFoundError('User not found');
        }

        const comment = await Comment.create({
            post: postId,
            author: authorId,
            content,
        });

        return await comment.populate('author', 'username avatar');
    }

    async getPostComments(postId: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const comments = await Comment.find({ post: postId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('author', 'username avatar');

        const total = await Comment.countDocuments({ post: postId });

        return { comments, total, page, limit };
    }

    async updateComment(
        commentId: string,
        userId: string,
        content: string
    ): Promise<ICommentDocument> {
        const comment = await Comment.findById(commentId);

        if (!comment) {
            throw new NotFoundError('Comment not found');
        }

        if (comment.author.toString() !== userId) {
            throw new ForbiddenError('You can only update your own comments');
        }

        comment.content = content;
        await comment.save();

        return await comment.populate('author', 'username avatar');
    }

    async deleteComment(commentId: string, userId: string): Promise<void> {
        const comment = await Comment.findById(commentId);

        if (!comment) {
            throw new NotFoundError('Comment not found');
        }

        if (comment.author.toString() !== userId) {
            throw new ForbiddenError('You can only delete your own comments');
        }

        await comment.deleteOne();
    }

    async getCommentCount(postId: string): Promise<number> {
        return await Comment.countDocuments({ post: postId });
    }
}
