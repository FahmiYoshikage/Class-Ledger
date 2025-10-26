import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        targetAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        perStudentAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ['aktif', 'selesai', 'dibatalkan'],
            default: 'aktif',
        },
        totalCollected: {
            type: Number,
            default: 0,
        },
        studentsPaid: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Student',
            },
        ],
        isCompleted: {
            type: Boolean,
            default: false,
        },
        completedAt: {
            type: Date,
        },
        surplusTransferred: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Method untuk cek apakah event sudah selesai
eventSchema.methods.checkCompletion = function () {
    const totalStudents = this.studentsPaid.length;
    const expectedTotal = this.perStudentAmount * totalStudents;

    return {
        isComplete: this.totalCollected >= this.targetAmount,
        totalCollected: this.totalCollected,
        targetAmount: this.targetAmount,
        surplus: this.totalCollected - this.targetAmount,
        percentComplete: (this.totalCollected / this.targetAmount) * 100,
    };
};

export default mongoose.model('Event', eventSchema);
