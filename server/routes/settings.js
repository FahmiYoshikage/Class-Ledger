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

export default router;
