import express from 'express';
import Student from '../models/Student.js';
import handleApiError from '../utils/errorHandler.js';

const router = express.Router();

// Get all students
router.get('/', async (req, res) => {
    try {
        const students = await Student.find().sort({ absen: 1 });
        res.json(students);
    } catch (error) {
        return handleApiError(res, error, 'Gagal mengambil data siswa');
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
        return handleApiError(res, error, 'Gagal mengambil detail data siswa');
    }
});

// Create student
router.post('/', async (req, res) => {
    const student = new Student({
        name: req.body.name,
        nickname: req.body.nickname || '',
        absen: req.body.absen,
        status: req.body.status || 'Aktif',
    });

    try {
        const newStudent = await student.save();
        res.status(201).json(newStudent);
    } catch (error) {
        return handleApiError(res, error, 'Gagal menambahkan siswa. Periksa kelengkapan data.', 400);
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
        if (req.body.nickname !== undefined)
            student.nickname = req.body.nickname;
        if (req.body.absen != null) student.absen = req.body.absen;
        if (req.body.status != null) student.status = req.body.status;
        if (req.body.phoneNumber !== undefined)
            student.phoneNumber = req.body.phoneNumber;
        if (req.body.enableNotification !== undefined)
            student.enableNotification = req.body.enableNotification;

        const updatedStudent = await student.save();
        res.json(updatedStudent);
    } catch (error) {
        return handleApiError(res, error, 'Gagal memperbarui data siswa.', 400);
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
        return handleApiError(res, error, 'Gagal menghapus data siswa');
    }
});

export default router;
