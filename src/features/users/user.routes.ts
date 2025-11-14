import { Router } from 'express';
import { UserController } from './user.controller';
import {
    updateProfileValidator,
    userIdValidator,
    usernameValidator,
    searchValidator,
} from './user.validator';
import { validate } from '../../middleware/validation.middleware';
import { protect } from '../../middleware/auth.middleware';
import { upload, handleUploadError } from '../../middleware/upload.middleware';

const router = Router();
const userController = new UserController();

// ⚠️ ORDER MATTERS - Most specific routes FIRST, then dynamic params

// Public routes - SEARCH must come before any /:id routes
router.get('/search', searchValidator, validate, userController.searchUsers);

// Username route - must come before /:id
router.get('/username/:username', usernameValidator, validate, userController.getUserByUsername);

// Get all users - MUST come before /:id (use specific path to avoid conflicts)
router.get('/all', userController.getAllUsers);

// Stats route - must come before generic /:id
router.get('/:id/stats', userIdValidator, validate, userController.getUserStats);

// Generic ID route - comes AFTER all specific routes
router.get('/:id', userIdValidator, validate, userController.getUserById);

router.get('/:id/followers', userController.getFollowers);
router.get('/:id/following', userController.getFollowing);

// Protected routes
router.use(protect);

// Update profile with file uploads (avatar and banner)
router.patch(
    '/profile',
    upload.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'banner', maxCount: 1 }
    ]),
    handleUploadError,
    updateProfileValidator,
    validate,
    userController.updateProfile
);

// Follow/Unfollow
router.post('/:id/follow', userIdValidator, validate, userController.followUser);
router.delete('/:id/follow', userController.unfollowUser);
router.post('/:id/unfollow', userIdValidator, validate, userController.unfollowUser);

export default router;
