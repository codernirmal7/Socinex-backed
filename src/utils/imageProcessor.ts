import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import logger from './logger';

export interface ImageProcessOptions {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
}

export const processImage = async (
    inputPath: string,
    outputPath: string,
    options: ImageProcessOptions = {}
): Promise<void> => {
    try {
        const {
            width = 1200,
            height = 1200,
            quality = 80,
            format = 'webp',
        } = options;

        await sharp(inputPath)
            .resize(width, height, {
                fit: 'inside',
                withoutEnlargement: true,
            })
            .toFormat(format, { quality })
            .toFile(outputPath);

        logger.debug(`Image processed: ${outputPath}`);
    } catch (error) {
        logger.error('Image processing error:', error);
        throw new Error('Failed to process image');
    }
};

export const deleteFile = async (filePath: string): Promise<void> => {
    try {
        await fs.unlink(filePath);
        logger.debug(`File deleted: ${filePath}`);
    } catch (error) {
        logger.error('File deletion error:', error);
    }
};

export const deleteCloudinaryImage = async (publicId: string): Promise<void> => {
    try {
        const cloudinary = require('../config/cloudinary').default;
        await cloudinary.uploader.destroy(publicId);
        logger.debug(`Cloudinary image deleted: ${publicId}`);
    } catch (error) {
        logger.error('Cloudinary deletion error:', error);
    }
};
