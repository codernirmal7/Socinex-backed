// src/features/auth/auth.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { AuthService } from './auth.service';
import { ApiResponse } from '../../utils/response';
import { generateDeviceFingerprint } from '../../utils/deviceFingerprint';
import { asyncHandler } from '../../middleware/async.middleware';
import { User } from '../users/user.model';

const authService = new AuthService();

export class AuthController {
    register = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { email, username, password } = req.body;
        const ipAddress = req.ip || req.socket.remoteAddress || '';
        const deviceFingerprint = generateDeviceFingerprint(req);

        const { user, token } = await authService.register(
            email,
            username,
            password,
            ipAddress,
            deviceFingerprint
        );

        ApiResponse.success(
            res,
            { user, token },
            `Welcome to BraveWorld! You've received ${user.batPoints} BAT Points as a signup bonus!`,
            201
        );
    });

    login = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { email, password } = req.body;

        const { user, token } = await authService.login(email, password);

        ApiResponse.success(res, { user, token }, 'Login successful');
    });

    getMe = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        ApiResponse.success(res, req.user, 'User retrieved successfully');
    });

    checkEmail = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const email = String(req.params.email || '').toLowerCase();
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            return ApiResponse.error(res, 'Invalid email address', 400);
        }
        const user = await User.findByEmail(email);
        const exists = !!user;
        return ApiResponse.success(res, { exists, username: user?.username }, 'Email check completed');
    });

    checkUsername = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const username = String(req.params.username || '').toLowerCase();
        if (!username || username.length < 3) {
            return ApiResponse.error(res, 'Invalid username', 400);
        }
        const user = await User.findByUsername(username);
        const exists = !!user;
        return ApiResponse.success(res, { exists }, 'Username check completed');
    });
}
