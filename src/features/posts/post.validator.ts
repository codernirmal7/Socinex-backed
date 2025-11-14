import { body, param, query } from 'express-validator';

export const createPostValidator = [
    body('content')
        .trim()
        .notEmpty()
        .withMessage('Content is required')
        .isLength({ min: 1, max: 1000 })
        .withMessage('Content must be between 1 and 1000 characters'),
    body('images')
        .optional()
        .isArray()
        .withMessage('Images must be an array')
        .custom((images: string[]) => {
            if (images.length > 4) {
                throw new Error('Maximum 4 images allowed');
            }
            return true;
        }),
    body('images.*')
        .optional()
        .isURL()
        .withMessage('Each image must be a valid URL'),
];

export const updatePostValidator = [
    body('content')
        .optional()
        .trim()
        .isLength({ min: 1, max: 1000 })
        .withMessage('Content must be between 1 and 1000 characters'),
    body('images')
        .optional()
        .isArray()
        .withMessage('Images must be an array')
        .custom((images: string[]) => {
            if (images.length > 4) {
                throw new Error('Maximum 4 images allowed');
            }
            return true;
        }),
    body('images.*')
        .optional()
        .isURL()
        .withMessage('Each image must be a valid URL'),
];

export const postIdValidator = [
    param('id').isMongoId().withMessage('Invalid post ID'),
];

export const userIdParamValidator = [
    param('userId').isMongoId().withMessage('Invalid user ID'),
];

export const searchPostsValidator = [
    query('q')
        .trim()
        .notEmpty()
        .withMessage('Search query is required')
        .isLength({ min: 2 })
        .withMessage('Search query must be at least 2 characters'),
];
