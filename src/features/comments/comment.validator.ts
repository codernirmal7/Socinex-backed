import { body, param } from 'express-validator';

export const createCommentValidator = [
    body('postId').isMongoId().withMessage('Invalid post ID'),
    body('content')
        .trim()
        .notEmpty()
        .withMessage('Comment content is required')
        .isLength({ max: 500 })
        .withMessage('Comment must be less than 500 characters'),
];

export const updateCommentValidator = [
    body('content')
        .trim()
        .notEmpty()
        .withMessage('Comment content is required')
        .isLength({ max: 500 })
        .withMessage('Comment must be less than 500 characters'),
];

export const commentIdValidator = [
    param('id').isMongoId().withMessage('Invalid comment ID'),
];

export const postIdParamValidator = [
    param('postId').isMongoId().withMessage('Invalid post ID'),
];
