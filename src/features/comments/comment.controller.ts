import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { CommentService } from './comment.service';
import { ApiResponse } from '../../utils/response';
import { asyncHandler } from '../../middleware/async.middleware';

const commentService = new CommentService();

export class CommentController {
    createComment = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const authorId = req.user!._id.toString();
        const { postId, content } = req.body;

        const comment = await commentService.createComment(postId, authorId, content);

        ApiResponse.success(res, comment, 'Comment created successfully', 201);
    });

    getPostComments = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { postId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const result = await commentService.getPostComments(postId, page, limit);

        ApiResponse.paginated(
            res,
            result.comments,
            result.page,
            result.limit,
            result.total,
            'Comments retrieved successfully'
        );
    });

    updateComment = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const userId = req.user!._id.toString();
        const { id } = req.params;
        const { content } = req.body;

        const comment = await commentService.updateComment(id, userId, content);

        ApiResponse.success(res, comment, 'Comment updated successfully');
    });

    deleteComment = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const userId = req.user!._id.toString();
        const { id } = req.params;

        await commentService.deleteComment(id, userId);

        ApiResponse.success(res, null, 'Comment deleted successfully');
    });
}
