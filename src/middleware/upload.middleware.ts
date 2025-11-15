// src/middleware/upload.middleware.ts
import multer from 'multer';
import { NextFunction } from 'express';
import path from 'path';
import { config } from '../config';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';
import { v4 as uuidv4 } from 'uuid';

// File filter for images and videos
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

    if (allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM, OGG, MOV) are allowed'));
    }
};

// ✅ Cloudinary storage configuration for both images and videos
const cloudinaryStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const isVideo = file.mimetype.startsWith('video/');
        const isImage = file.mimetype.startsWith('image/');

        // Generate unique filename
        const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;

        if (isVideo) {
            return {
                folder: 'socinex/videos',
                resource_type: 'video',
                public_id: uniqueFilename,
                format: path.extname(file.originalname).slice(1), // mp4, webm, etc
                chunk_size: 6000000, // 6MB chunks for large videos
                eager: [
                    { streaming_profile: 'hd', format: 'mp4' },
                    { streaming_profile: 'sd', format: 'mp4' }
                ],
                eager_async: true,
                allowed_formats: ['mp4', 'webm', 'ogg', 'mov'],
            };
        } else if (isImage) {
            return {
                folder: 'socinex/images',
                resource_type: 'image',
                public_id: uniqueFilename,
                format: 'jpg', // Convert all to jpg for consistency
                transformation: [
                    { width: 1200, height: 1200, crop: 'limit' },
                    { quality: 'auto:good' },
                    { fetch_format: 'auto' }
                ],
                allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            };
        }

        return {
            folder: 'socinex',
            resource_type: 'auto',
            public_id: uniqueFilename,
        };
    },
});

// Configure multer with Cloudinary storage
export const upload = multer({
    storage: cloudinaryStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max for videos
        files: 6, // Max 6 files (4 images + 2 videos)
    },
});

// Error handler
export const handleUploadError = (err: any, req: any, res: any, next: NextFunction) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum 100MB per file',
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files. Maximum 6 files (4 images + 2 videos)',
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }

    if (err) {
        console.error('❌ Upload error:', err);
        return res.status(400).json({
            success: false,
            message: err.message || 'File upload error',
        });
    }

    next();
};
