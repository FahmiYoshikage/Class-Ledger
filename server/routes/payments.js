import express from 'express';
import Payment from '../models/Payment.js';

const router = express.Router();

// Get all payments
router.get('/', async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate('studentId', 'name absen')
            .sort({ date: -1 });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
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
        res.status(500).json({ message: error.message });
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
        res.status(201).json(populatedPayment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete payment
router.delete('/:id', async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        await payment.deleteOne();
        res.json({ message: 'Payment deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get total paid by student
router.get('/total/:studentId', async (req, res) => {
    try {
        const result = await Payment.aggregate([
            {
                $match: {
                    studentId: mongoose.Types.ObjectId(req.params.studentId),
                },
            },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        res.json({ total: result.length > 0 ? result[0].total : 0 });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
