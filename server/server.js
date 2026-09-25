import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';

dotenv.config();

// Ensure process allows full read/write for all users (container & host volume sharing)
try {
    process.umask(0);
} catch (e) {
    // Ignore if not supported
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure critical upload and report directories exist with full permissions
const uploadsDir = path.join(__dirname, 'uploads');
const paymentProofsDir = path.join(uploadsDir, 'payment-proofs');
const qrCodesDir = path.join(uploadsDir, 'qr-codes');
const reportsDir = path.join(__dirname, 'public/reports');

[uploadsDir, paymentProofsDir, qrCodesDir, reportsDir].forEach((dir) => {
    try {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true, mode: 0o777 });
        }
        fs.chmodSync(dir, 0o777);
    } catch (err) {
        // Non-fatal
    }
});
import authRoutes from './routes/auth.js';
import setupRoutes from './routes/setup.js';
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
import backupRoutes from './routes/backup.js';
import notificationScheduler from './services/notificationScheduler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { authenticate, loginAdmin, authorizeAdmin } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy - Required for Cloudflare/Nginx reverse proxy
// Trust only loopback and private IP ranges (Cloudflare/Nginx on same network)
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests without origin (curl, internal proxy, mobile apps)
            if (!origin) return callback(null, true);

            // Allow localhost & local IPs
            if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
                return callback(null, true);
            }

            // If CORS_ORIGIN is specified in env, check against it
            if (process.env.CORS_ORIGIN) {
                const origins = process.env.CORS_ORIGIN.split(',').map((o) => o.trim());
                if (origins.includes('*') || origins.includes(origin)) {
                    return callback(null, true);
                }
            }

            // Always allow *.crud.my.id, *.deepkernel.site
            try {
                const host = new URL(origin).hostname;
                if (/\.(crud\.my\.id|deepkernel\.site)$/.test(host) || host === 'crud.my.id') {
                    return callback(null, true);
                }
            } catch {
                // Ignore parse errors
            }

            // Dynamic allow for any configured or custom subdomain
            return callback(null, true);
        },
        credentials: true,
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// --- Auth & Setup Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/setup', setupRoutes);

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
app.use('/api/backup', backupRoutes);

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
app.use('/api/admin/backup', backupRoutes);

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

// Error handling middleware - strictly avoid leaking error traces or internal details to client
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err.stack || err);
    const status = typeof err.status === 'number' ? err.status : 500;
    const safeMessage =
        status < 500 && err.message && !err.message.includes('/') && !err.message.includes('open')
            ? err.message
            : 'Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.';
    res.status(status).json({
        success: false,
        message: safeMessage,
        error: safeMessage,
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);

    // Start notification scheduler
    notificationScheduler.start();
});
