import express from 'express';
import Event from '../models/Event.js';
import EventPayment from '../models/EventPayment.js';
import Payment from '../models/Payment.js';
import Student from '../models/Student.js';

const router = express.Router();

// Get all events
router.get('/', async (req, res) => {
    try {
        const events = await Event.find()
            .populate('studentsPaid', 'name absen')
            .sort({ createdAt: -1 });
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single event
router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate(
            'studentsPaid',
            'name absen'
        );
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create event
router.post('/', async (req, res) => {
    const event = new Event({
        name: req.body.name,
        description: req.body.description,
        targetAmount: req.body.targetAmount,
        perStudentAmount: req.body.perStudentAmount,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
    });

    try {
        const newEvent = await event.save();
        res.status(201).json(newEvent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update event
router.patch('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        Object.keys(req.body).forEach((key) => {
            if (req.body[key] !== undefined) {
                event[key] = req.body[key];
            }
        });

        const updatedEvent = await event.save();
        res.json(updatedEvent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete event
router.delete('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Delete all event payments
        await EventPayment.deleteMany({ eventId: req.params.id });

        await event.deleteOne();
        res.json({ message: 'Event deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Complete event and transfer surplus
router.post('/:id/complete', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const completion = event.checkCompletion();

        if (!completion.isComplete) {
            return res.status(400).json({
                message: 'Event belum mencapai target',
                data: completion,
            });
        }

        // Jika ada surplus, transfer ke kas
        if (completion.surplus > 0 && !event.surplusTransferred) {
            const surplusPayment = new Payment({
                studentId: null, // Tidak ada studentId karena ini dari event
                amount: completion.surplus,
                date: new Date(),
                method: 'Transfer',
                note: `Surplus dari event: ${event.name}`,
                source: 'event',
                sourceName: event.name,
            });

            await surplusPayment.save();
            event.surplusTransferred = true;
        }

        event.status = 'selesai';
        event.isCompleted = true;
        event.completedAt = new Date();

        await event.save();

        res.json({
            message: 'Event selesai dan surplus ditransfer ke kas',
            event,
            surplus: completion.surplus,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get event payments
router.get('/:id/payments', async (req, res) => {
    try {
        const payments = await EventPayment.find({ eventId: req.params.id })
            .populate('studentId', 'name absen')
            .sort({ date: -1 });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add event payment
router.post('/:id/payments', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.status !== 'aktif') {
            return res.status(400).json({ message: 'Event sudah tidak aktif' });
        }

        const payment = new EventPayment({
            eventId: req.params.id,
            studentId: req.body.studentId,
            amount: req.body.amount,
            date: req.body.date || new Date(),
            method: req.body.method || 'Tunai',
            note: req.body.note,
        });

        await payment.save();

        // Update event
        event.totalCollected += payment.amount;
        if (!event.studentsPaid.includes(payment.studentId)) {
            event.studentsPaid.push(payment.studentId);
        }

        await event.save();

        const populatedPayment = await EventPayment.findById(
            payment._id
        ).populate('studentId', 'name absen');

        res.status(201).json(populatedPayment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete event payment
router.delete('/:eventId/payments/:paymentId', async (req, res) => {
    try {
        const payment = await EventPayment.findById(req.params.paymentId);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        const event = await Event.findById(req.params.eventId);
        if (event) {
            event.totalCollected -= payment.amount;

            // Check if student has other payments
            const otherPayments = await EventPayment.find({
                eventId: req.params.eventId,
                studentId: payment.studentId,
                _id: { $ne: payment._id },
            });

            if (otherPayments.length === 0) {
                event.studentsPaid = event.studentsPaid.filter(
                    (id) => id.toString() !== payment.studentId.toString()
                );
            }

            await event.save();
        }

        await payment.deleteOne();
        res.json({ message: 'Payment deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update event payment
router.patch('/:eventId/payments/:paymentId', async (req, res) => {
    try {
        const payment = await EventPayment.findById(req.params.paymentId);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        const event = await Event.findById(req.params.eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Store old amount to adjust event total
        const oldAmount = payment.amount;
        const oldStudentId = payment.studentId;

        // Update payment fields
        if (req.body.studentId) payment.studentId = req.body.studentId;
        if (req.body.amount !== undefined) payment.amount = req.body.amount;
        if (req.body.date) payment.date = req.body.date;
        if (req.body.method) payment.method = req.body.method;
        if (req.body.note !== undefined) payment.note = req.body.note;

        await payment.save();

        // Update event total collected
        const amountDifference = payment.amount - oldAmount;
        event.totalCollected += amountDifference;

        // Handle student change
        if (oldStudentId.toString() !== payment.studentId.toString()) {
            // Remove old student if no other payments
            const oldStudentPayments = await EventPayment.find({
                eventId: req.params.eventId,
                studentId: oldStudentId,
                _id: { $ne: payment._id },
            });

            if (oldStudentPayments.length === 0) {
                event.studentsPaid = event.studentsPaid.filter(
                    (id) => id.toString() !== oldStudentId.toString()
                );
            }

            // Add new student if not exists
            if (!event.studentsPaid.includes(payment.studentId)) {
                event.studentsPaid.push(payment.studentId);
            }
        }

        await event.save();

        const populatedPayment = await EventPayment.findById(
            payment._id
        ).populate('studentId', 'name absen');

        res.json(populatedPayment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

export default router;
