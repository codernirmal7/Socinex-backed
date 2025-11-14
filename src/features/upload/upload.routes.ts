import { Router } from 'express';
import { UploadController } from './upload.controller';
import { protect } from '../../middleware/auth.middleware';
import { upload, handleUploadError } from '../../middleware/upload.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();
const uploadController = new UploadController();

// Rate limiter for uploads
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 uploads per 15 minutes
    message: 'Too many uploads, please try again later',
});

// All routes require authentication
router.use(protect);
router.use(uploadLimiter);

// Upload single image
router.post(
    '/image',
    upload.single('image'),
    handleUploadError,
    uploadController.uploadImage
);

// Upload multiple images (max 4)
router.post(
    '/images',
    upload.array('images', 4),
    handleUploadError,
    uploadController.uploadImages
);

// Delete image
router.delete('/image/:filename', uploadController.deleteImage);

export default router;
