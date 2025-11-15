// src/app.ts
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { config } from './config';
import { generalLimiter } from './middleware/rateLimiter.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Import routes
import authRoutes from './features/auth/auth.routes';
import userRoutes from './features/users/user.routes';
import postRoutes from './features/posts/post.routes';
import tipRoutes from './features/tips/tip.routes';
import leaderboardRoutes from './features/leaderboards/leaderboard.routes';
import notificationRoutes from './features/notifications/notification.routes';
import uploadRoutes from './features/upload/upload.routes';
import commentRoutes from './features/comments/comment.routes';
import conversionsRoutes from './features/conversions/conversion.routes';

const app: Application = express();

// ✅ FIXED: Added frontend URLs
const allowedOrigins = [
    'http://localhost:5173',        // ✅ Vite frontend (MOST IMPORTANT)
    'http://localhost:8080',        // Local development
    'http://localhost:3000',        // Backup local port
    'https://gateway.pinata.cloud', // Pinata public gateway
    'https://ipfs.io',              // IPFS.io gateway
    'https://cloudflare-ipfs.com',
    'https://plum-manual-loon-821.mypinata.cloud', // ✅ Fixed - added https://
];

// ✅ FIXED: Better CORS configuration
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, same-origin)
        if (!origin) return callback(null, true);

        // Check if origin is allowed
        if (allowedOrigins.some(allowed => origin.includes(allowed.replace('https://', '').replace('http://', '')))) {
            callback(null, true);
        } else {
            console.log('⚠️ Blocked origin:', origin); // Debug log
            callback(null, true); // Temporarily allow all origins for debugging
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'X-Total-Count']
}));

// ✅ FIXED: Security middleware with proper config
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false, // Important for images/videos
}));

app.use(compression());

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


// Rate limiting
// app.use(generalLimiter);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});


// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/tips', tipRoutes);
app.use('/api/leaderboards', leaderboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/conversions', conversionsRoutes);

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
