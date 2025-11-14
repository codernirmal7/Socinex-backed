// src/features/auth/auth.routes.ts
import { Router } from 'express';
import { AuthController } from './auth.controller';
import { registerValidator, loginValidator } from './auth.validator';
import { validate } from '../../middleware/validation.middleware';
import { authLimiter } from '../../middleware/rateLimiter.middleware';
import { protect } from '../../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

router.post('/register', authLimiter, registerValidator, validate, authController.register);
router.post('/login', authLimiter, loginValidator, validate, authController.login);
router.get('/me', protect, authController.getMe);
router.get('/check-email/:email', authController.checkEmail);
router.get('/check-username/:username', authController.checkUsername);

export default router;
