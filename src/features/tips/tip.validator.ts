import { body, param } from 'express-validator';

export const sendTipValidator = [
    body('recipientId')
        .isMongoId()
        .withMessage('Invalid recipient ID'),
    body('amount')
        .isInt({ min: 1, max: 1000 })
        .withMessage('Tip amount must be between 1 and 1000 BAT Points'),
    body('message')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Message must be less than 200 characters'),
    body('postId')
        .optional()
        .isMongoId()
        .withMessage('Invalid post ID'),
];

export const tipIdValidator = [
    param('id').isMongoId().withMessage('Invalid tip ID'),
];
