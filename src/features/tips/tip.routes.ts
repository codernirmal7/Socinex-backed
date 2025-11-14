import { Router } from 'express';
import { TipController } from './tip.controller';
import { sendTipValidator, tipIdValidator } from './tip.validator';
import { validate } from '../../middleware/validation.middleware';
import { protect } from '../../middleware/auth.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();
const tipController = new TipController();

// Rate limiter for tips
const tipLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 tips per minute
    message: 'Too many tips sent, please try again later',
});

// All routes require authentication
router.use(protect);

// Send tip
router.post('/', tipLimiter, sendTipValidator, validate, tipController.sendTip);

// Get my sent tips
router.get('/sent', tipController.getMySentTips);

// Get my received tips
router.get('/received', tipController.getMyReceivedTips);

// Get tip by ID
router.get('/:id', tipIdValidator, validate, tipController.getTipById);

export default router;
