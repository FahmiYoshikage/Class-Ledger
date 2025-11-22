import express from 'express';
import Student from '../models/Student.js';
import Payment from '../models/Payment.js';

const router = express.Router();

// ==============================================
// 🏆 GET LEADERBOARD TOP 10 DONORS
// ==============================================
// Public endpoint - no auth required
router.get('/', async (req, res) => {
    try {
        console.log('📊 Fetching leaderboard data...');

        // Get all students (only active)
        const students = await Student.find({ status: 'Aktif' });

        // Get all payments (filter out null studentId)
        const payments = await Payment.find({ studentId: { $ne: null } });

        console.log(
            `📊 Found ${students.length} students, ${payments.length} payments`
        );

        // Calculate total donation & earliest payment for each student
        const leaderboardData = students.map((student) => {
            const studentPayments = payments.filter(
                (p) =>
                    p.studentId &&
                    p.studentId.toString() === student._id.toString()
            );

            const totalDonation = studentPayments.reduce(
                (sum, payment) => sum + payment.amount,
                0
            );

            // Find earliest payment date
            const earliestPayment =
                studentPayments.length > 0
                    ? new Date(
                          Math.min(
                              ...studentPayments.map((p) => new Date(p.date))
                          )
                      )
                    : null;

            return {
                studentId: student._id,
                name: student.name,
                nickname: student.nickname || student.name, // Fallback to full name
                absen: student.absen,
                totalDonation,
                earliestPayment,
                paymentCount: studentPayments.length,
            };
        });

        // Filter: only students with donations > 0
        const eligibleDonors = leaderboardData.filter(
            (d) => d.totalDonation > 0
        );

        // Sort by:
        // 1. Total donation (descending)
        // 2. Earliest payment date (ascending - earlier is better)
        const sortedLeaderboard = eligibleDonors.sort((a, b) => {
            // Primary sort: Total donation (higher is better)
            if (b.totalDonation !== a.totalDonation) {
                return b.totalDonation - a.totalDonation;
            }

            // Secondary sort: Earliest payment (earlier is better)
            if (a.earliestPayment && b.earliestPayment) {
                return a.earliestPayment - b.earliestPayment;
            }

            // If one has payment and other doesn't, prioritize the one with payment
            if (a.earliestPayment && !b.earliestPayment) return -1;
            if (!a.earliestPayment && b.earliestPayment) return 1;

            return 0;
        });

        // Take top 10
        const top10 = sortedLeaderboard.slice(0, 10);

        console.log(
            `✅ Leaderboard calculated: ${top10.length} donors from ${eligibleDonors.length} total`
        );

        res.json({
            success: true,
            leaderboard: top10,
            totalDonors: eligibleDonors.length,
            lastUpdated: new Date(),
            message:
                top10.length === 0
                    ? 'Belum ada data pembayaran'
                    : 'Leaderboard berhasil dimuat',
        });
    } catch (error) {
        console.error('❌ Error fetching leaderboard:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

export default router;
