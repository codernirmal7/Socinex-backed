import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { ApiResponse } from '../../utils/response';
import { asyncHandler } from '../../middleware/async.middleware';
import { BadRequestError } from '../../utils/errors';
import { config } from '../../config';
import path from 'path';
import fs from 'fs/promises';

export class UploadController {
    // Upload single image
    uploadImage = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.file) {
            throw new BadRequestError('No file uploaded');
        }

        let imageUrl: string;
        let publicId: string | undefined;

        if (config.upload.useCloudinary) {
            // Cloudinary URL and public ID
            imageUrl = (req.file as any).path;
            publicId = (req.file as any).filename;
        } else {
            // Local URL
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
        }

        ApiResponse.success(
            res,
            {
                url: imageUrl,
                filename: req.file.filename,
                originalName: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                publicId,
            },
            'Image uploaded successfully',
            201
        );
    });

    // Upload multiple images
    uploadImages = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            throw new BadRequestError('No files uploaded');
        }

        const files = req.files as Express.Multer.File[];
        const baseUrl = `${req.protocol}://${req.get('host')}`;

        const imageUrls = files.map((file) => {
            if (config.upload.useCloudinary) {
                return {
                    url: (file as any).path,
                    filename: file.filename,
                    originalName: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                    publicId: (file as any).filename,
                };
            } else {
                return {
                    url: `${baseUrl}/uploads/${file.filename}`,
                    filename: file.filename,
                    originalName: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                };
            }
        });

        ApiResponse.success(
            res,
            {
                images: imageUrls,
                count: imageUrls.length,
            },
            `${imageUrls.length} image(s) uploaded successfully`,
            201
        );
    });

    // Delete image
    deleteImage = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { filename } = req.params;

        if (!filename) {
            throw new BadRequestError('Filename is required');
        }

        try {
            if (config.upload.useCloudinary) {
                // Delete from Cloudinary
                const cloudinary = require('../../config/cloudinary').default;
                const publicId = filename.includes('/') ? filename : `socinex/${filename.split('.')[0]}`;
                await cloudinary.uploader.destroy(publicId);
            } else {
                // Delete from local storage
                const filePath = path.join(__dirname, '../../../uploads', filename);
                await fs.unlink(filePath);
            }

            ApiResponse.success(res, null, 'Image deleted successfully');
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                throw new BadRequestError('File not found');
            }
            throw error;
        }
    });


}
