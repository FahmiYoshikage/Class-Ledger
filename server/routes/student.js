import express from 'express';
import Student from '../models/Student.js';

const router = express.Router();

// Get all students
router.get('/', async (req, res) => {
    try {
        const students = await Student.find().sort({ absen: 1 });
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single student
router.get('/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json(student);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create student
router.post('/', async (req, res) => {
    const student = new Student({
        name: req.body.name,
        absen: req.body.absen,
        status: req.body.status || 'Aktif',
    });

    try {
        const newStudent = await student.save();
        res.status(201).json(newStudent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update student
router.patch('/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        if (req.body.name != null) student.name = req.body.name;
        if (req.body.absen != null) student.absen = req.body.absen;
        if (req.body.status != null) student.status = req.body.status;
        if (req.body.phoneNumber !== undefined)
            student.phoneNumber = req.body.phoneNumber;
        if (req.body.enableNotification !== undefined)
            student.enableNotification = req.body.enableNotification;

        const updatedStudent = await student.save();
        res.json(updatedStudent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete student
router.delete('/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        await student.deleteOne();
        res.json({ message: 'Student deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
