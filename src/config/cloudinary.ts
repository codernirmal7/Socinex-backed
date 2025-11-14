import { v2 as cloudinary } from 'cloudinary';
import { config } from './index';
import logger from '../utils/logger';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test connection
export const testCloudinaryConnection = async (): Promise<boolean> => {
    try {
        await cloudinary.api.ping();
        logger.info('✅ Cloudinary connected successfully');
        return true;
    } catch (error) {
        logger.error('❌ Cloudinary connection failed:', error);
        return false;
    }
};

export default cloudinary;
