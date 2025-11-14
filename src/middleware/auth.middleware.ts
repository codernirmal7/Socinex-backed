import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError } from '../utils/errors';
import { User, IUserDocument } from '../features/users/user.model';
import { asyncHandler } from './async.middleware';

export interface AuthRequest extends Request {
    user?: IUserDocument;
}

export const protect = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        throw new UnauthorizedError('Not authorized to access this route');
    }

    try {
        const decoded = jwt.verify(token, config.jwt.secret) as { id: string };
        const user = await User.findById(decoded.id).select('-signupBonus');

        if (!user) {
            throw new UnauthorizedError('User not found');
        }

        req.user = user;
        next();
    } catch (error) {
        throw new UnauthorizedError('Not authorized to access this route');
    }
});
