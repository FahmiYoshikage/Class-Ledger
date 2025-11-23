import mongoose from 'mongoose';

const qrCodeSchema = new mongoose.Schema(
    {
        imageUrl: {
            type: String,
            required: true,
        },
        paymentMethod: {
            type: String,
            enum: ['dana', 'gopay', 'ovo', 'bank', 'other'],
            required: true,
        },
        accountName: {
            type: String,
            required: true,
        },
        accountNumber: {
            type: String,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        uploadedBy: {
            type: String,
            required: true,
        },
        uploadedAt: {
            type: Date,
            default: Date.now,
        },
        notes: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Only one active QR code at a time
qrCodeSchema.index({ isActive: 1 });

export default mongoose.model('QRCode', qrCodeSchema);
