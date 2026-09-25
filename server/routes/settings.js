import express from 'express';
import Setting from '../models/Setting.js';
import { handleApiError } from '../utils/errorHandler.js';

const router = express.Router();

// Get current week (respects semester pause) - MUST BE BEFORE /:key route
router.get('/current-week', async (req, res) => {
    try {
        const [semesterStatusSetting, pausedWeekSetting, startDateSetting, accumulatedWeeksSetting] =
            await Promise.all([
                Setting.findOne({ key: 'semester_status' }),
                Setting.findOne({ key: 'paused_week' }),
                Setting.findOne({ key: 'start_date' }),
                Setting.findOne({ key: 'accumulated_weeks' }),
            ]);

        const semesterStatus = semesterStatusSetting?.value || 'active';
        const pausedWeek = pausedWeekSetting?.value;
        // Default to 7 = semester 1 had 7 weeks (hardcoded initial carry-over)
        // Once pause/resume saves a new value to DB, this fallback is ignored
        const accumulatedWeeks = accumulatedWeeksSetting ? parseInt(accumulatedWeeksSetting.value) : 7;
        const startDate = startDateSetting?.value
            ? new Date(startDateSetting.value)
            : new Date(process.env.START_DATE || '2025-10-27');

        // If paused, return the paused week
        if (semesterStatus === 'paused' && pausedWeek) {
            return res.json({
                currentWeek: pausedWeek,
                accumulatedWeeks,
                totalWeeks: accumulatedWeeks + pausedWeek,
                status: 'paused',
                message: `System paused at Week ${pausedWeek}`,
            });
        }

        // Calculate current week normally
        const now = new Date();
        const diffTime = Math.abs(now - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const currentWeek = Math.max(1, Math.ceil(diffDays / 7));

        res.json({
            currentWeek,
            accumulatedWeeks,
            totalWeeks: accumulatedWeeks + currentWeek,
            status: 'active',
            startDate: startDate,
        });
    } catch (error) {
        return handleApiError(res, error, 'Gagal menghitung minggu berjalan.');
    }
});

// Get public-safe settings (safe for client, public dashboard, and payments)
router.get('/public', async (req, res) => {
    try {
        const [
            className,
            institutionName,
            semesterName,
            description,
            weeklyAmount,
            lateThreshold,
            startDate,
            paymentAccounts,
            paymentNotes,
            semesterStatus,
            accumulatedWeeks,
        ] = await Promise.all([
            Setting.findOne({ key: 'class_name' }),
            Setting.findOne({ key: 'institution_name' }),
            Setting.findOne({ key: 'semester_name' }),
            Setting.findOne({ key: 'class_description' }),
            Setting.findOne({ key: 'weekly_amount' }),
            Setting.findOne({ key: 'late_threshold' }),
            Setting.findOne({ key: 'start_date' }),
            Setting.findOne({ key: 'payment_accounts' }),
            Setting.findOne({ key: 'payment_notes' }),
            Setting.findOne({ key: 'semester_status' }),
            Setting.findOne({ key: 'accumulated_weeks' }),
        ]);

        res.json({
            className: className?.value || 'Kas Kelas',
            institutionName: institutionName?.value || '',
            semesterName: semesterName?.value || 'Semester 1',
            description: description?.value || '',
            weeklyAmount: Number(weeklyAmount?.value) || 2000,
            lateThreshold: Number(lateThreshold?.value) || 4,
            startDate: startDate?.value || '2025-10-27',
            paymentAccounts: Array.isArray(paymentAccounts?.value) ? paymentAccounts.value : [],
            paymentNotes: paymentNotes?.value || '',
            semesterStatus: semesterStatus?.value || 'active',
            accumulatedWeeks: Number(accumulatedWeeks?.value) || 7,
        });
    } catch (error) {
        return handleApiError(res, error, 'Gagal mengambil pengaturan publik.');
    }
});

// Get all settings
router.get('/', async (req, res) => {
    try {
        const settings = await Setting.find();
        res.json(settings);
    } catch (error) {
        return handleApiError(res, error, 'Gagal mengambil daftar pengaturan.');
    }
});

// Get setting by key
router.get('/:key', async (req, res) => {
    try {
        const setting = await Setting.findOne({ key: req.params.key });
        if (!setting) {
            return res.status(404).json({ success: false, message: 'Pengaturan tidak ditemukan', error: 'Pengaturan tidak ditemukan' });
        }
        res.json(setting);
    } catch (error) {
        return handleApiError(res, error, 'Gagal mengambil pengaturan.');
    }
});

// Create or update setting
router.post('/', async (req, res) => {
    try {
        const { key, value } = req.body;

        if (!key || value === undefined) {
            return res
                .status(400)
                .json({ success: false, message: 'Key dan value wajib diisi', error: 'Key dan value wajib diisi' });
        }

        // If value is null, delete the setting instead of saving null
        if (value === null || value === '') {
            await Setting.findOneAndDelete({ key });
            return res.json({ key, value: null, message: 'Setting cleared' });
        }

        const setting = await Setting.findOneAndUpdate(
            { key },
            { value },
            { upsert: true, new: true, runValidators: true }
        );

        res.json(setting);
    } catch (error) {
        return handleApiError(res, error, 'Gagal menyimpan pengaturan.', 400);
    }
});

// Delete setting
router.delete('/:key', async (req, res) => {
    try {
        const setting = await Setting.findOneAndDelete({ key: req.params.key });
        if (!setting) {
            return res.status(404).json({ success: false, message: 'Pengaturan tidak ditemukan', error: 'Pengaturan tidak ditemukan' });
        }
        res.json({ success: true, message: 'Setting deleted' });
    } catch (error) {
        return handleApiError(res, error, 'Gagal menghapus pengaturan.');
    }
});

export default router;
