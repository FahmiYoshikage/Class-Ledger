import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: false, // UBAH ke false karena bisa null untuk custom payment
        },
        amount: {
            type: Number,
            required: true,
            default: 2000,
        },
        date: {
            type: Date,
            required: true,
            default: Date.now,
        },
        week: {
            type: Number,
        },
        method: {
            type: String,
            enum: ['Tunai', 'Transfer', 'QRIS'],
            default: 'Tunai',
        },
        note: {
            type: String,
            trim: true,
        },
        // ===== TAMBAHKAN FIELD BARU INI =====
        source: {
            type: String,
            enum: ['regular', 'event', 'custom'],
            default: 'regular',
        },
        sourceName: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for high-speed queries on VPS and Atlas
paymentSchema.index({ studentId: 1, date: -1 });
paymentSchema.index({ date: -1 });

export default mongoose.model('Payment', paymentSchema);
