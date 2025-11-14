import { body, param, query } from 'express-validator';

export const updateProfileValidator = [
    body('username')
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Bio must be less than 500 characters'),
    body('avatar').optional().trim().isURL().withMessage('Avatar must be a valid URL'),
    body('banner').optional().trim().isURL().withMessage('Banner must be a valid URL'),
];

export const userIdValidator = [param('id').isMongoId().withMessage('Invalid user ID')];

export const usernameValidator = [
    param('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Invalid username'),
];

export const searchValidator = [
    query('q')
        .trim()
        .notEmpty()
        .withMessage('Search query is required')
        .isLength({ min: 2 })
        .withMessage('Search query must be at least 2 characters'),
];
