import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { config } from '../config';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
    const error = new AppError(`Route ${req.originalUrl} not found`, 404);
    next(error);
};

export const errorHandler = (err: Error | AppError, req: Request, res: Response, next: NextFunction) => {
    let error = { ...err };
    error.message = err.message;

    // Log error
    logger.error(err);

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = new AppError(message, 404);
    }

    // Mongoose duplicate key
    if ((err as any).code === 11000) {
        const field = Object.keys((err as any).keyValue)[0];
        const message = `${field} already exists`;
        error = new AppError(message, 409);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values((err as any).errors)
            .map((val: any) => val.message)
            .join(', ');
        error = new AppError(message, 400);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = new AppError('Invalid token', 401);
    }

    if (err.name === 'TokenExpiredError') {
        error = new AppError('Token expired', 401);
    }

    const statusCode = (error as AppError).statusCode || 500;

    res.status(statusCode).json({
        success: false,
        message: error.message || 'Internal Server Error',
        ...(config.env === 'development' && { stack: err.stack }),
    });
};
