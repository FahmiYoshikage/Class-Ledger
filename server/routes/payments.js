import express from 'express';
import mongoose from 'mongoose';
import Payment from '../models/Payment.js';
import Setting from '../models/Setting.js';
import badgeService from '../services/badgeService.js';
import handleApiError from '../utils/errorHandler.js';

const router = express.Router();

// Get all payments
router.get('/', async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate('studentId', 'name absen')
            .sort({ date: -1 });
        res.json(payments);
    } catch (error) {
        return handleApiError(res, error, 'Gagal mengambil data pembayaran');
    }
});

// Get payments by student
router.get('/student/:studentId', async (req, res) => {
    try {
        const payments = await Payment.find({
            studentId: req.params.studentId,
        }).sort({ date: -1 });
        res.json(payments);
    } catch (error) {
        return handleApiError(res, error, 'Gagal mengambil data pembayaran siswa');
    }
});

// Create payment
router.post('/', async (req, res) => {
    const payment = new Payment({
        studentId: req.body.studentId,
        amount: req.body.amount || 2000,
        date: req.body.date || new Date(),
        week: req.body.week,
        method: req.body.method || 'Tunai',
        note: req.body.note,
    });

    try {
        const newPayment = await payment.save();
        const populatedPayment = await Payment.findById(
            newPayment._id
        ).populate('studentId', 'name absen');

        // 🎖️ AUTO-CALCULATE BADGES after payment
        if (req.body.studentId) {
            try {
                await badgeService.calculateBadgesForStudent(
                    req.body.studentId
                );
                console.log(
                    '✅ Badges updated for student:',
                    req.body.studentId
                );
            } catch (badgeError) {
                console.error(
                    '⚠️ Failed to calculate badges:',
                    badgeError.message
                );
                // Don't fail the payment if badge calculation fails
            }
        }

        res.status(201).json(populatedPayment);
    } catch (error) {
        return handleApiError(res, error, 'Gagal menyimpan pembayaran. Periksa data input.', 400);
    }
});

// Delete payment
router.delete('/:id', async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        const studentId = payment.studentId; // Save before delete
        await payment.deleteOne();

        // 🎖️ AUTO-RECALCULATE BADGES after payment deletion
        if (studentId) {
            try {
                await badgeService.calculateBadgesForStudent(studentId);
                console.log(
                    '✅ Badges recalculated after deletion for student:',
                    studentId
                );
            } catch (badgeError) {
                console.error(
                    '⚠️ Failed to recalculate badges:',
                    badgeError.message
                );
            }
        }

        res.json({ message: 'Payment deleted' });
    } catch (error) {
        return handleApiError(res, error, 'Gagal menghapus pembayaran');
    }
});

// Get total paid by student
router.get('/total/:studentId', async (req, res) => {
    try {
        const studentObjectId = new mongoose.Types.ObjectId(req.params.studentId);
        const result = await Payment.aggregate([
            {
                $match: {
                    studentId: studentObjectId,
                },
            },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        res.json({ total: result.length > 0 ? result[0].total : 0 });
    } catch (error) {
        return handleApiError(res, error, 'Gagal menghitung total pembayaran');
    }
});

// Get tunggakan by student (used by QR payment and student lookup)
router.get('/tunggakan/:studentId', async (req, res) => {
    try {
        const studentId = req.params.studentId;
        const payments = await Payment.find({ studentId });

        // Total regular payments
        const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

        // Fetch settings for weekly fee & current week
        const [semesterStatusSetting, pausedWeekSetting, startDateSetting, accumulatedWeeksSetting, weeklyFeeSetting] =
            await Promise.all([
                Setting.findOne({ key: 'semester_status' }),
                Setting.findOne({ key: 'paused_week' }),
                Setting.findOne({ key: 'start_date' }),
                Setting.findOne({ key: 'accumulated_weeks' }),
                Setting.findOne({ key: 'weekly_fee' }),
            ]);

        const weeklyFee = weeklyFeeSetting ? parseInt(weeklyFeeSetting.value) || 2000 : 2000;
        const accumulatedWeeks = accumulatedWeeksSetting ? parseInt(accumulatedWeeksSetting.value) || 7 : 7;
        const semesterStatus = semesterStatusSetting?.value || 'active';
        const pausedWeek = pausedWeekSetting?.value;

        let totalWeeks;
        if (semesterStatus === 'paused' && pausedWeek) {
            totalWeeks = accumulatedWeeks + pausedWeek;
        } else {
            const startDate = startDateSetting?.value
                ? new Date(startDateSetting.value)
                : new Date(process.env.START_DATE || '2025-10-27');
            const now = new Date();
            const diffTime = Math.abs(now - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const currentSemesterWeek = Math.max(1, Math.ceil(diffDays / 7));
            totalWeeks = accumulatedWeeks + currentSemesterWeek;
        }

        const weeksPaid = Math.floor(totalPaid / weeklyFee);
        const weeksLate = Math.max(0, totalWeeks - weeksPaid);
        const amountOwed = weeksLate * weeklyFee;

        res.json({
            success: true,
            studentId,
            totalPaid,
            weeklyFee,
            totalWeeks,
            weeksPaid,
            weeksLate,
            tunggakan: amountOwed,
            isLunas: amountOwed <= 0,
        });
    } catch (error) {
        return handleApiError(res, error, 'Gagal menghitung tunggakan pembayaran');
    }
});

export default router;
