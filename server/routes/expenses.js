import express from 'express';
import Expense from '../models/Expense.js';
import handleApiError from '../utils/errorHandler.js';

const router = express.Router();

// Get all expenses
router.get('/', async (req, res) => {
    try {
        const expenses = await Expense.find().sort({ date: -1 });
        res.json(expenses);
    } catch (error) {
        return handleApiError(res, error, 'Gagal mengambil data pengeluaran');
    }
});

// Create expense
router.post('/', async (req, res) => {
    const expense = new Expense({
        purpose: req.body.purpose,
        amount: req.body.amount,
        date: req.body.date || new Date(),
        category: req.body.category,
        approvedBy: req.body.approvedBy,
    });

    try {
        const newExpense = await expense.save();
        res.status(201).json(newExpense);
    } catch (error) {
        return handleApiError(res, error, 'Gagal menambahkan pengeluaran. Periksa data input.', 400);
    }
});

// Delete expense
router.delete('/:id', async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }
        await expense.deleteOne();
        res.json({ message: 'Expense deleted' });
    } catch (error) {
        return handleApiError(res, error, 'Gagal menghapus data pengeluaran');
    }
});

export default router;
