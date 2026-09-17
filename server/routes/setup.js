import express from 'express';
import User from '../models/User.js';
import Setting from '../models/Setting.js';
import Student from '../models/Student.js';
import { generateToken } from '../middleware/auth.js';
import { createAuditLog } from '../middleware/auditLog.js';

const router = express.Router();

/**
 * Helper to determine if system setup has been completed.
 * Automatically marks setup_completed: true if users already exist (backward compatibility).
 */
export const checkSetupCompleted = async () => {
    const setupSetting = await Setting.findOne({ key: 'setup_completed' });
    if (setupSetting && setupSetting.value === true) {
        return true;
    }

    const userCount = await User.countDocuments();
    if (userCount > 0) {
        // Auto-migrate existing installation
        await Setting.findOneAndUpdate(
            { key: 'setup_completed' },
            { value: true },
            { upsert: true }
        );
        return true;
    }

    return false;
};

// @route   GET /api/setup/status
// @desc    Check whether initial setup is required or already completed
// @access  Public
router.get('/status', async (req, res) => {
    try {
        const isCompleted = await checkSetupCompleted();
        const userCount = await User.countDocuments();
        const classNameSetting = await Setting.findOne({ key: 'class_name' });

        res.json({
            setupCompleted: isCompleted,
            hasAdmin: userCount > 0,
            className: classNameSetting?.value || 'Kas Kelas',
        });
    } catch (error) {
        console.error('Check setup status error:', error);
        res.status(500).json({
            setupCompleted: false,
            hasAdmin: false,
            message: error.message,
        });
    }
});

// @route   POST /api/setup/initialize
// @desc    First Setup Wizard: initialize admin, class profile, financial rules, and payment accounts
// @access  Public (Only allowed when setup has not been completed)
router.post('/initialize', async (req, res) => {
    try {
        const isCompleted = await checkSetupCompleted();
        if (isCompleted) {
            return res.status(400).json({
                success: false,
                message: 'Aplikasi sudah dikonfigurasi sebelumnya. Untuk mengubah pengaturan, silakan login ke dashboard.',
            });
        }

        const {
            adminFullName,
            adminUsername,
            adminPassword,
            className,
            institutionName = '',
            semesterName = 'Semester 1',
            description = '',
            weeklyAmount = 2000,
            startDate = new Date().toISOString().split('T')[0],
            lateThreshold = 4,
            bankAccounts = [],
            paymentNotes = '',
            fonnteToken = '',
            targetGroupId = '',
            initialStudents = [],
        } = req.body;

        // Validations
        if (!adminUsername || !adminPassword || !adminFullName) {
            return res.status(400).json({
                success: false,
                message: 'Nama lengkap, username, dan password bendahara wajib diisi.',
            });
        }

        if (!className || !className.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Nama kelas atau organisasi wajib diisi.',
            });
        }

        // 1. Create Initial Superadmin
        const admin = new User({
            username: adminUsername.trim(),
            password: adminPassword,
            fullName: adminFullName.trim(),
            role: 'admin',
            isActive: true,
            mustChangePassword: false,
        });
        await admin.save();

        // 2. Persist Settings
        const settingsToSave = [
            { key: 'setup_completed', value: true },
            { key: 'class_name', value: className.trim() },
            { key: 'institution_name', value: institutionName.trim() },
            { key: 'semester_name', value: semesterName.trim() },
            { key: 'class_description', value: description.trim() },
            { key: 'weekly_amount', value: Math.max(500, Number(weeklyAmount) || 2000) },
            { key: 'start_date', value: new Date(startDate) },
            { key: 'late_threshold', value: Math.max(1, Number(lateThreshold) || 4) },
            { key: 'payment_accounts', value: Array.isArray(bankAccounts) ? bankAccounts : [] },
            { key: 'payment_notes', value: paymentNotes.trim() },
            { key: 'semester_status', value: 'active' },
        ];

        if (fonnteToken && fonnteToken.trim()) {
            settingsToSave.push({ key: 'fonnte_token', value: fonnteToken.trim() });
        }
        if (targetGroupId && targetGroupId.trim()) {
            settingsToSave.push({ key: 'target_group_id', value: targetGroupId.trim() });
        }

        await Promise.all(
            settingsToSave.map((s) =>
                Setting.findOneAndUpdate(
                    { key: s.key },
                    { value: s.value },
                    { upsert: true, new: true }
                )
            )
        );

        // 3. Optional initial students bulk insert
        let createdStudentsCount = 0;
        if (Array.isArray(initialStudents) && initialStudents.length > 0) {
            const studentDocs = initialStudents
                .filter((s) => s.name && s.name.trim())
                .map((s, index) => ({
                    absen: Number(s.absen) || index + 1,
                    name: s.name.trim(),
                    nickname: (s.nickname || '').trim(),
                    phoneNumber: (s.phoneNumber || '').trim(),
                    status: 'Aktif',
                    enableNotification: true,
                }));

            if (studentDocs.length > 0) {
                try {
                    await Student.insertMany(studentDocs, { ordered: false });
                    createdStudentsCount = studentDocs.length;
                } catch (bulkErr) {
                    console.warn('Partial student insert warnings:', bulkErr.message);
                }
            }
        }

        // 4. Generate Auth Token
        const token = generateToken(admin._id);

        // 5. Audit Log
        try {
            await createAuditLog({
                action: 'SYSTEM_SETUP',
                performedBy: admin._id,
                details: {
                    className: className.trim(),
                    weeklyAmount: Number(weeklyAmount) || 2000,
                    studentsAdded: createdStudentsCount,
                },
                ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            });
        } catch (auditErr) {
            console.warn('Audit log error on setup:', auditErr.message);
        }

        res.status(201).json({
            success: true,
            message: `Setup awal ${className} berhasil diselesaikan! Selamat datang di Class-Ledger.`,
            token,
            user: {
                id: admin._id,
                username: admin.username,
                fullName: admin.fullName,
                role: admin.role || 'admin',
            },
            config: {
                className: className.trim(),
                weeklyAmount: Number(weeklyAmount) || 2000,
                studentsCount: createdStudentsCount,
            },
        });
    } catch (error) {
        console.error('Setup initialization error:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal menginisialisasi sistem: ' + error.message,
        });
    }
});

export default router;
