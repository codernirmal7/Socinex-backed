import { Router } from 'express';
import { PostController } from './post.controller';
import {
    createPostValidator,
    updatePostValidator,
    postIdValidator,
    userIdParamValidator,
    searchPostsValidator,
} from './post.validator';
import { validate } from '../../middleware/validation.middleware';
import { protect } from '../../middleware/auth.middleware';
import { upload, handleUploadError } from '../../middleware/upload.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();
const postController = new PostController();

// Rate limiter for post creation
const createPostLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 posts per 15 minutes
    message: 'Too many posts created, please try again later',
});

// Public routes
router.get('/explore', postController.getExplorePosts);
router.get('/trending', postController.getTrendingPosts);
router.get('/search', searchPostsValidator, validate, postController.searchPosts);
router.get('/:id', postIdValidator, validate, postController.getPostById);
router.get('/user/:userId', userIdParamValidator, validate, postController.getUserPosts);

// Protected routes
router.use(protect);

// Create post with optional file uploads (up to 4 images)
router.post(
    '/',
    createPostLimiter,
    upload.array('images', 4),
    handleUploadError,
    createPostValidator,
    validate,
    postController.createPost
);

router.get('/feed/my-feed', postController.getFeed);

// Update post with optional file uploads
router.patch(
    '/:id',
    postIdValidator,
    upload.array('images', 4),
    handleUploadError,
    updatePostValidator,
    validate,
    postController.updatePost
);

router.delete('/:id', postIdValidator, validate, postController.deletePost);
router.post('/:id/like', postIdValidator, validate, postController.likePost);
router.delete('/:id/unlike', postIdValidator, validate, postController.unlikePost);

export default router;
