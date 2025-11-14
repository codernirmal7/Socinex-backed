// src/features/conversions/conversion.validator.ts
import { body, param } from 'express-validator';
import { config } from '../../config';

export const requestConversionValidator = [
    body('pointsAmount')
        .isInt({ min: config.app.minConversionPoints })
        .withMessage(`Points amount must be at least ${config.app.minConversionPoints}`)
        .custom((val) => val % config.app.conversionStepPoints === 0)
        .withMessage(`Points must be in multiples of ${config.app.conversionStepPoints}`),
];

export const conversionIdValidator = [
    param('id').isMongoId().withMessage('Invalid conversion ID'),
];
