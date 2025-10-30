import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import studentRoutes from './routes/student.js';
import paymentRoutes from './routes/payments.js';
import expenseRoutes from './routes/expenses.js';
import settingRoutes from './routes/settings.js';
import eventRoutes from './routes/events.js';
import notificationRoutes from './routes/notifications.js';
import authRoutes from './routes/auth.js';
import auditLogRoutes from './routes/auditLogs.js';
import sessionRoutes from './routes/sessions.js';
import notificationScheduler from './services/notificationScheduler.js';
import { apiLimiter } from './middleware/rateLimiter.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
    cors({
        origin: [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
            'http://10.252.146.203:3000',
            'http://10.252.146.203:3001',
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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });
}

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
