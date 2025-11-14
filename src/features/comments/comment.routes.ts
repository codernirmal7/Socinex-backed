import { Router } from 'express';
import { CommentController } from './comment.controller';
import {
    createCommentValidator,
    updateCommentValidator,
    commentIdValidator,
    postIdParamValidator,
} from './comment.validator';
import { validate } from '../../middleware/validation.middleware';
import { protect } from '../../middleware/auth.middleware';

const router = Router();
const commentController = new CommentController();

// Get comments for a post (public)
router.get(
    '/post/:postId',
    postIdParamValidator,
    validate,
    commentController.getPostComments
);

// Protected routes
router.use(protect);

// Create comment
router.post(
    '/',
    createCommentValidator,
    validate,
    commentController.createComment
);

// Update comment
router.patch(
    '/:id',
    commentIdValidator,
    updateCommentValidator,
    validate,
    commentController.updateComment
);

// Delete comment
router.delete(
    '/:id',
    commentIdValidator,
    validate,
    commentController.deleteComment
);

export default router;
