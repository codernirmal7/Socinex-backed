// src/features/auth/auth.service.ts
import { User, IUserDocument } from '../users/user.model';
import { config } from '../../config';
import { BadRequestError, ConflictError, UnauthorizedError } from '../../utils/errors';
import redis from '../../config/redis';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';

export class AuthService {
    async register(
        email: string,
        username: string,
        password: string,
        ipAddress: string,
        deviceFingerprint: string
    ): Promise<{ user: IUserDocument; token: string }> {
        // Check if email already registered
        const existingEmail = await User.findByEmail(email);
        if (existingEmail) {
            throw new ConflictError('Email already registered');
        }

        // Check if username already taken
        const existingUsername = await User.findByUsername(username);
        if (existingUsername) {
            throw new ConflictError('Username already taken');
        }

        // Check for duplicate signups from same device/IP
        await this.checkDuplicateSignup(ipAddress, deviceFingerprint);

        // Create user with signup bonus (password will be hashed automatically)
        const user = await User.create({
            email: email.toLowerCase(),
            username: username.toLowerCase(),
            password,
            batPoints: config.app.signupBonusPoints,
            signupBonus: {
                claimed: true,
                claimedAt: new Date(),
                ipAddress,
                deviceFingerprint,
            },
        });

        // Update leaderboard
        await redis.zadd('leaderboard:creators', 0, user._id.toString());
        await redis.zadd('leaderboard:tippers', 0, user._id.toString());

        // Generate JWT
        const token = this.generateToken(user._id.toString());

        return { user, token };
    }

    async login(
        email: string,
        password: string
    ): Promise<{ user: IUserDocument; token: string }> {
        // Find user by email and explicitly select password
        const user = await User.findByEmail(email).select('+password').exec(); // .exec() returns a Promise

        if (!user) {
            throw new UnauthorizedError('Invalid email or password');
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new UnauthorizedError('Invalid email or password');
        }

        // Update last active
        user.lastActive = new Date();
        await user.save();

        // Generate JWT
        const token = this.generateToken(user._id.toString());

        // Remove password from response
        user.password = undefined as any;

        return { user, token };
    }

    private generateToken(userId: string): string {
        const payload = { id: userId };
        const secret = config.jwt.secret as Secret;

        const options: SignOptions = {
            expiresIn: config.jwt.expiresIn as any,
        };

        return jwt.sign(payload, secret, options);
    }

    private async checkDuplicateSignup(ipAddress: string, deviceFingerprint: string): Promise<void> {
        const recentSignups = await User.find({
            'signupBonus.claimed': true,
            'signupBonus.ipAddress': ipAddress,
            'signupBonus.deviceFingerprint': deviceFingerprint,
            'signupBonus.claimedAt': { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        });

        if (recentSignups.length >= 3) {
            throw new BadRequestError('Too many signups from this device. Please try again later.');
        }
    }
}
