import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            // Low-memory settings for small VPS (1GB RAM / 2 vCPU)
            maxPoolSize: 5, // Reduce connection pool size (default 100)
            minPoolSize: 1,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            family: 4, // Force IPv4 (avoids IPv6 lookup overhead)
            autoIndex: false, // Don't auto-build indexes in production
        });
        console.log('✅ MongoDB Connected Successfully (low-memory mode)');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

export default connectDB;