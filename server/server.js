import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/student.js';
import paymentRoutes from './routes/payments.js';
import expenseRoutes from './routes/expenses.js';
import settingRoutes from './routes/settings.js';
import eventRoutes from './routes/events.js';
import notificationRoutes from './routes/notifications.js';
import leaderboardRoutes from './routes/leaderboard.js';
import badgeRoutes from './routes/badges.js';
import qrPaymentRoutes from './routes/qrPayment.js';
import sessionRoutes from './routes/sessions.js';
import auditLogRoutes from './routes/auditLogs.js';
import notificationScheduler from './services/notificationScheduler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { authenticate, loginAdmin, authorizeAdmin } from './middleware/auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy - Required for Cloudflare/Nginx reverse proxy
// Trust only loopback and private IP ranges (Cloudflare/Nginx on same network)
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

// Middleware
app.use(
    cors({
        origin: [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:8767',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
            'http://127.0.0.1:8767',
            process.env.CORS_ORIGIN || 'https://triforce.crud.my.id',
        ],
        credentials: true,
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// --- Auth Routes (Public - for admin login) ---
app.use('/api/auth', authRoutes);

// --- Core API Routes ---
app.use('/api/students', studentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/qr-payment', qrPaymentRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// --- Admin Aliases (Compatible with /api/admin/* paths) ---
app.use('/api/admin/students', studentRoutes);
app.use('/api/admin/payments', paymentRoutes);
app.use('/api/admin/expenses', expenseRoutes);
app.use('/api/admin/settings', settingRoutes);
app.use('/api/admin/events', eventRoutes);
app.use('/api/admin/notifications', notificationRoutes);
app.use('/api/admin/qr-payment', qrPaymentRoutes);
app.use('/api/admin/sessions', sessionRoutes);
app.use('/api/admin/audit-logs', auditLogRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve PDF reports
app.use('/reports', express.static(path.join(__dirname, 'public/reports')));

// Health check (public - no auth required)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Server is running',
        clientIp: req.headers['cf-connecting-ip'] || req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.ip,
        timestamp: new Date().toISOString(),
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);

    // Start notification scheduler
    notificationScheduler.start();
});
