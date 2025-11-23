import mongoose from 'mongoose';

const paymentConfirmationSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        proofImageUrl: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        submittedAt: {
            type: Date,
            default: Date.now,
        },
        reviewedAt: {
            type: Date,
        },
        reviewedBy: {
            type: String, // Admin name/email
        },
        rejectionReason: {
            type: String,
        },
        notes: {
            type: String,
        },
        // Reference to created Payment after approval
        paymentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Payment',
        },
    },
    {
        timestamps: true,
    }
);

// Index for querying pending confirmations
paymentConfirmationSchema.index({ status: 1, submittedAt: -1 });
paymentConfirmationSchema.index({ studentId: 1, submittedAt: -1 });

export default mongoose.model('PaymentConfirmation', paymentConfirmationSchema);
