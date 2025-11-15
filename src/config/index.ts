import dotenv from 'dotenv';

dotenv.config();

export const config = {
    chain: {
        rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/Oj7_cESbGj0goSLlLVkLL',
        chainId: 11155111, // Sepolia
        batTokenAddress: process.env.BAT_TOKEN_ADDRESS!,
        tokenDecimals: Number(process.env.TOKEN_DECIMALS || 18),
        treasuryPrivateKey: process.env.TREASURY_PRIVATE_KEY!,

    },
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),

    database: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/socinex',
    },

    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
    },

    jwt: {
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },

    app: {
        pointsToTokenRate: 0.01,
        minConversionPoints: 100,
        conversionStepPoints: 100,
        dailyConversionLimitPoints: 100000,   // example daily cap per user
        maxPendingConversionsPerUser: 3,
        signupBonusPoints: parseInt(process.env.SIGNUP_BONUS_POINTS || '100', 10),
        minTipAmount: parseInt(process.env.MIN_TIP_AMOUNT || '1', 10),
        maxTipAmount: parseInt(process.env.MAX_TIP_AMOUNT || '1000', 10),
    },

    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
        credentials: true,
    },

    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },

    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB default
        maxFiles: parseInt(process.env.MAX_FILES || '4', 10),
        allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        useCloudinary: process.env.USE_CLOUDINARY === 'true',
        videoDir: process.env.VIDEO_UPLOAD_DIR || 'uploads/videos',
        maxVideoSize: 100 * 1024 * 1024, // 100MB
        imageDir: process.env.UPLOAD_DIR || 'uploads/images',
    },

    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
};
