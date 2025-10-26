import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
    {
        purpose: {
            type: String,
            required: true,
            trim: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        date: {
            type: Date,
            required: true,
            default: Date.now,
        },
        category: {
            type: String,
            enum: ['Kebersihan', 'Acara', 'Perlengkapan', 'Lain-lain'],
            required: true,
        },
        approvedBy: {
            type: String,
            required: true,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model('Expense', expenseSchema);
