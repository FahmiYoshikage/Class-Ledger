import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: true,
        },
        badgeType: {
            type: String,
            enum: [
                'early_bird', // Selalu bayar minggu pertama
                'perfect_score', // Lunas 8 minggu berturut-turut
                'speed_demon', // Bayar dalam 24 jam setelah reminder
                'mega_donor', // Total donasi > Rp 50.000
                'streak_master', // 4 minggu berturut tidak telat
                'comeback_kid', // Lunas setelah tunggakan besar
                'consistent_payer', // Bayar rutin tanpa telat
            ],
            required: true,
        },
        earnedAt: {
            type: Date,
            default: Date.now,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

// Index untuk query cepat
badgeSchema.index({ studentId: 1, badgeType: 1 }, { unique: true });

export default mongoose.model('Badge', badgeSchema);
