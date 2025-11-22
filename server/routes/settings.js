import express from 'express';
import Setting from '../models/Setting.js';

const router = express.Router();

// Get all settings
router.get('/', async (req, res) => {
    try {
        const settings = await Setting.find();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get setting by key
router.get('/:key', async (req, res) => {
    try {
        const setting = await Setting.findOne({ key: req.params.key });
        if (!setting) {
            return res.status(404).json({ message: 'Setting not found' });
        }
        res.json(setting);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create or update setting
router.post('/', async (req, res) => {
    try {
        const { key, value } = req.body;

        if (!key || value === undefined) {
            return res
                .status(400)
                .json({ message: 'Key and value are required' });
        }

        const setting = await Setting.findOneAndUpdate(
            { key },
            { value },
            { upsert: true, new: true, runValidators: true }
        );

        res.json(setting);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete setting
router.delete('/:key', async (req, res) => {
    try {
        const setting = await Setting.findOneAndDelete({ key: req.params.key });
        if (!setting) {
            return res.status(404).json({ message: 'Setting not found' });
        }
        res.json({ message: 'Setting deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get current week (respects semester pause)
router.get('/current-week', async (req, res) => {
    try {
        const [semesterStatusSetting, pausedWeekSetting, startDateSetting] =
            await Promise.all([
                Setting.findOne({ key: 'semester_status' }),
                Setting.findOne({ key: 'paused_week' }),
                Setting.findOne({ key: 'start_date' }),
            ]);

        const semesterStatus = semesterStatusSetting?.value || 'active';
        const pausedWeek = pausedWeekSetting?.value;
        const startDate = startDateSetting?.value
            ? new Date(startDateSetting.value)
            : new Date(process.env.START_DATE || '2025-10-27');

        // If paused, return the paused week
        if (semesterStatus === 'paused' && pausedWeek) {
            return res.json({
                currentWeek: pausedWeek,
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
            status: 'active',
            startDate: startDate,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
