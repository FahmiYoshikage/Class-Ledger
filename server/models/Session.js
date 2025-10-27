import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        token: {
            type: String,
            required: true,
        },
        deviceInfo: {
            userAgent: String,
            browser: String,
            os: String,
            device: String,
        },
        ipAddress: {
            type: String,
        },
        location: {
            country: String,
            city: String,
        },
        lastActivity: {
            type: Date,
            default: Date.now,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
sessionSchema.index({ user: 1, isActive: 1 });
sessionSchema.index({ token: 1 });

// Auto-delete expired sessions (TTL index)
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session = mongoose.model('Session', sessionSchema);

export default Session;
