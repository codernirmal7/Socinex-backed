import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import { BadRequestError } from '../utils/errors';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';

// Ensure uploads directory exists (for local storage)
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// File filter for image validation
const imageFileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    // Check file type
    if (!config.upload.allowedImageTypes.includes(file.mimetype)) {
        return cb(
            new BadRequestError(
                `Invalid file type. Allowed types: ${config.upload.allowedImageTypes.join(', ')}`
            )
        );
    }

    // Check file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
        return cb(new BadRequestError('Invalid file extension'));
    }

    cb(null, true);
};

// Local storage configuration
const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});

// Cloudinary storage configuration
const cloudinaryStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'socinex',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto:good' },
        ],
    } as any,
});

// Choose storage based on config
const storage = config.upload.useCloudinary ? cloudinaryStorage : localStorage;

// Configure multer
export const upload = multer({
    storage,
    fileFilter: imageFileFilter,
    limits: {
        fileSize: config.upload.maxFileSize,
        files: config.upload.maxFiles,
    },
});

// Middleware for handling upload errors
export const handleUploadError = (err: any, req: Request, res: any, next: any) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: `File too large. Maximum size is ${config.upload.maxFileSize / 1024 / 1024}MB`,
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: `Too many files. Maximum is ${config.upload.maxFiles}`,
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }
    next(err);
};
