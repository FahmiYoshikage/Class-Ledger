import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: false, // Not required for group messages
        },
        phoneNumber: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: [
                'payment_reminder',
                'event_reminder',
                'thank_you',
                'late_payment',
                'custom',
                'group_reminder',
            ],
            default: 'payment_reminder',
        },
        status: {
            type: String,
            enum: ['pending', 'sent', 'failed', 'delivered', 'read'],
            default: 'pending',
        },
        sentAt: {
            type: Date,
        },
        deliveredAt: {
            type: Date,
        },
        failureReason: {
            type: String,
        },
        weekNumber: {
            type: Number,
        },
        tunggakan: {
            type: Number,
        },
        templateUsed: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Index untuk query cepat
notificationSchema.index({ studentId: 1, createdAt: -1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ type: 1 });

export default mongoose.model('Notification', notificationSchema);
