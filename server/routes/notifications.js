import express from 'express';
import Student from '../models/Student.js';
import Payment from '../models/Payment.js';
import Notification from '../models/Notification.js';
import whatsappService from '../services/whatsappService.js';

const router = express.Router();

// ==============================================
// 📊 GET ALL NOTIFICATIONS
// ==============================================
router.get('/', async (req, res) => {
    try {
        const notifications = await Notification.find()
            .populate('studentId', 'name absen phoneNumber')
            .sort({ createdAt: -1 })
            .limit(100);

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==============================================
// 📱 GET NOTIFICATIONS BY STUDENT
// ==============================================
router.get('/student/:studentId', async (req, res) => {
    try {
        const notifications = await Notification.find({
            studentId: req.params.studentId,
        })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==============================================
// 🎯 GET STUDENTS WHO NEED REMINDER
// ==============================================
router.get('/needs-reminder', async (req, res) => {
    try {
        const { minWeeks = 1 } = req.query;

        // Get all active students
        const students = await Student.find({ status: 'Aktif' });

        // Get all payments
        const payments = await Payment.find();

        // Calculate students who need reminder
        const needsReminder = [];

        for (const student of students) {
            // Skip if no phone number or notification disabled
            if (!student.phoneNumber || !student.enableNotification) {
                continue;
            }

            // Calculate weeks late
            const studentPayments = payments.filter(
                (p) => p.studentId?.toString() === student._id.toString()
            );

            const totalPaid = studentPayments.reduce(
                (sum, p) => sum + p.amount,
                0
            );
            const weeksPaid = Math.floor(totalPaid / 2000);

            // Calculate current week
            const startDate = new Date(process.env.START_DATE || '2025-10-27');
            const now = new Date();
            const days = Math.floor((now - startDate) / (24 * 60 * 60 * 1000));
            const currentWeek = Math.max(0, Math.ceil(days / 7) + 1);

            const weeksLate = currentWeek - weeksPaid;
            const amountOwed = weeksLate * 2000;

            if (weeksLate >= minWeeks) {
                needsReminder.push({
                    student,
                    weeksLate,
                    amountOwed,
                    lastNotificationSent: student.lastNotificationSent,
                });
            }
        }

        res.json({
            total: needsReminder.length,
            students: needsReminder,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==============================================
// 📤 SEND REMINDER TO ONE STUDENT
// ==============================================
router.post('/send-reminder/:studentId', async (req, res) => {
    try {
        const { category = 'friendly', weeksLate, amount } = req.body;

        const student = await Student.findById(req.params.studentId);

        if (!student) {
            return res.status(404).json({ error: 'Siswa tidak ditemukan' });
        }

        if (!student.phoneNumber) {
            return res.status(400).json({
                error: 'Siswa tidak memiliki nomor WhatsApp',
            });
        }

        // Send reminder
        const result = await whatsappService.sendPaymentReminder(
            student,
            weeksLate,
            amount,
            category
        );

        res.json({
            success: result.success,
            message: result.testMode
                ? 'Pesan berhasil dikirim (TEST MODE)'
                : 'Pesan berhasil dikirim',
            notification: result.notification,
            testMode: result.testMode,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==============================================
// 📤 SEND REMINDER TO MULTIPLE STUDENTS
// ==============================================
router.post('/send-bulk-reminder', async (req, res) => {
    try {
        const {
            studentIds,
            category = 'friendly',
            minWeeks = 1,
            maxWeeks = null,
        } = req.body;

        const results = {
            success: [],
            failed: [],
            skipped: [],
        };

        // Get students
        let students;
        if (studentIds && studentIds.length > 0) {
            students = await Student.find({ _id: { $in: studentIds } });
        } else {
            // Send to all who need reminder
            students = await Student.find({
                status: 'Aktif',
                phoneNumber: { $exists: true, $ne: '' },
                enableNotification: true,
            });
        }

        // Get all payments for calculation
        const payments = await Payment.find();

        // Calculate current week
        const startDate = new Date(process.env.START_DATE || '2025-10-27');
        const now = new Date();
        const days = Math.floor((now - startDate) / (24 * 60 * 60 * 1000));
        const currentWeek = Math.max(0, Math.ceil(days / 7) + 1);

        // Send to each student
        for (const student of students) {
            try {
                // Calculate weeks late
                const studentPayments = payments.filter(
                    (p) => p.studentId?.toString() === student._id.toString()
                );

                const totalPaid = studentPayments.reduce(
                    (sum, p) => sum + p.amount,
                    0
                );
                const weeksPaid = Math.floor(totalPaid / 2000);
                const weeksLate = currentWeek - weeksPaid;
                const amountOwed = weeksLate * 2000;

                // Check if within range
                if (weeksLate < minWeeks) {
                    results.skipped.push({
                        student: student.name,
                        reason: 'Belum mencapai minimum weeks',
                    });
                    continue;
                }

                if (maxWeeks && weeksLate > maxWeeks) {
                    results.skipped.push({
                        student: student.name,
                        reason: 'Melebihi maximum weeks',
                    });
                    continue;
                }

                // Send reminder
                const result = await whatsappService.sendPaymentReminder(
                    student,
                    weeksLate,
                    amountOwed,
                    category
                );

                if (result.success) {
                    results.success.push({
                        student: student.name,
                        phone: student.phoneNumber,
                        weeksLate,
                        amount: amountOwed,
                        notificationId: result.notification._id,
                    });
                } else {
                    results.failed.push({
                        student: student.name,
                        phone: student.phoneNumber,
                        error: 'Gagal mengirim pesan',
                    });
                }

                // Delay to avoid rate limit
                await new Promise((resolve) => setTimeout(resolve, 1000));
            } catch (error) {
                results.failed.push({
                    student: student.name,
                    error: error.message,
                });
            }
        }

        res.json({
            message: 'Pengiriman selesai',
            summary: {
                total: students.length,
                success: results.success.length,
                failed: results.failed.length,
                skipped: results.skipped.length,
            },
            results,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==============================================
// 💌 SEND THANK YOU MESSAGE
// ==============================================
router.post('/send-thank-you/:studentId', async (req, res) => {
    try {
        const student = await Student.findById(req.params.studentId);

        if (!student) {
            return res.status(404).json({ error: 'Siswa tidak ditemukan' });
        }

        const result = await whatsappService.sendThankYou(student);

        res.json({
            success: result.success,
            message: result.success
                ? 'Ucapan terima kasih berhasil dikirim'
                : 'Gagal mengirim ucapan terima kasih',
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==============================================
// ✉️ SEND CUSTOM MESSAGE
// ==============================================
router.post('/send-custom', async (req, res) => {
    try {
        const { studentId, message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Pesan tidak boleh kosong' });
        }

        const student = await Student.findById(studentId);

        if (!student) {
            return res.status(404).json({ error: 'Siswa tidak ditemukan' });
        }

        const result = await whatsappService.sendCustomMessage(
            student,
            message
        );

        res.json({
            success: result.success,
            message: result.success
                ? 'Pesan berhasil dikirim'
                : 'Gagal mengirim pesan',
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==============================================
// 🔍 PREVIEW MESSAGE
// ==============================================
router.post('/preview', async (req, res) => {
    try {
        const {
            category = 'friendly',
            studentName,
            weeksLate,
            amount,
        } = req.body;

        const message = whatsappService.generateReminderMessage(
            studentName || 'John Doe',
            weeksLate || 4,
            amount || 8000,
            category
        );

        res.json({
            message,
            category,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==============================================
// ✅ CHECK WHATSAPP API STATUS
// ==============================================
router.get('/status', async (req, res) => {
    try {
        const status = await whatsappService.checkStatus();

        res.json({
            connected: status.valid,
            device: status.device,
            expired: status.expired,
            testMode: process.env.WA_TEST_MODE === 'true',
            apiToken: process.env.FONNTE_API_TOKEN ? '✓ Set' : '✗ Not Set',
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==============================================
// 📊 GET NOTIFICATION STATISTICS
// ==============================================
router.get('/stats', async (req, res) => {
    try {
        const totalSent = await Notification.countDocuments({ status: 'sent' });
        const totalFailed = await Notification.countDocuments({
            status: 'failed',
        });
        const totalPending = await Notification.countDocuments({
            status: 'pending',
        });

        const last7Days = await Notification.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        });

        const byType = await Notification.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                },
            },
        ]);

        res.json({
            total: totalSent + totalFailed + totalPending,
            sent: totalSent,
            failed: totalFailed,
            pending: totalPending,
            last7Days,
            byType,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==============================================
// 📱 SEND TO WHATSAPP GROUP
// ==============================================
router.post('/send-to-group', async (req, res) => {
    try {
        const { groupId, category = 'friendly', minWeeks = 1 } = req.body;

        if (!groupId) {
            return res.status(400).json({
                error: 'Group ID wajib diisi',
            });
        }

        // Get students yang perlu reminder
        const students = await Student.find({
            status: 'Aktif',
            phoneNumber: { $exists: true, $ne: '' },
        });

        const payments = await Payment.find();

        // Calculate current week
        const startDate = new Date(process.env.START_DATE || '2025-10-27');
        const now = new Date();
        const days = Math.floor((now - startDate) / (24 * 60 * 60 * 1000));
        const currentWeek = Math.max(0, Math.ceil(days / 7) + 1);

        // Filter students with late payments
        const studentsData = [];

        for (const student of students) {
            const studentPayments = payments.filter(
                (p) => p.studentId?.toString() === student._id.toString()
            );

            const totalPaid = studentPayments.reduce(
                (sum, p) => sum + p.amount,
                0
            );
            const weeksPaid = Math.floor(totalPaid / 2000);
            const weeksLate = currentWeek - weeksPaid;
            const amountOwed = weeksLate * 2000;

            if (weeksLate >= minWeeks) {
                studentsData.push({
                    student,
                    weeksLate,
                    amountOwed,
                });
            }
        }

        if (studentsData.length === 0) {
            return res.json({
                success: true,
                message: 'Tidak ada siswa yang perlu diingatkan',
                studentsCount: 0,
            });
        }

        // Send to group
        const result = await whatsappService.sendToGroup(
            groupId,
            studentsData,
            category
        );

        res.json({
            success: result.success,
            message: result.testMode
                ? `Pesan berhasil dibuat (TEST MODE) - ${studentsData.length} siswa akan di-mention`
                : `Pesan berhasil dikirim ke grup dengan ${studentsData.length} mention`,
            studentsCount: studentsData.length,
            messageId: result.messageId,
            testMode: result.testMode,
            students: studentsData.map((s) => ({
                name: s.student.name,
                phone: s.student.phoneNumber,
                weeksLate: s.weeksLate,
                amount: s.amountOwed,
            })),
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==============================================
// 🔍 PREVIEW GROUP MESSAGE
// ==============================================
router.post('/preview-group', async (req, res) => {
    try {
        const { category = 'friendly', minWeeks = 1 } = req.body;

        // Get sample data
        const students = await Student.find({
            status: 'Aktif',
            phoneNumber: { $exists: true, $ne: '' },
        }).limit(5);

        const payments = await Payment.find();

        // Calculate current week
        const startDate = new Date(process.env.START_DATE || '2025-10-27');
        const now = new Date();
        const days = Math.floor((now - startDate) / (24 * 60 * 60 * 1000));
        const currentWeek = Math.max(0, Math.ceil(days / 7) + 1);

        // Create sample data
        const studentsData = [];

        for (const student of students) {
            const studentPayments = payments.filter(
                (p) => p.studentId?.toString() === student._id.toString()
            );

            const totalPaid = studentPayments.reduce(
                (sum, p) => sum + p.amount,
                0
            );
            const weeksPaid = Math.floor(totalPaid / 2000);
            const weeksLate = currentWeek - weeksPaid;
            const amountOwed = weeksLate * 2000;

            if (weeksLate >= minWeeks) {
                studentsData.push({
                    student,
                    weeksLate,
                    amountOwed,
                });
            }
        }

        if (studentsData.length === 0) {
            return res.json({
                message: 'Tidak ada siswa yang cocok untuk preview',
                preview: null,
            });
        }

        // Generate preview
        const message = whatsappService.generateGroupReminderMessage(
            studentsData,
            category
        );

        res.json({
            message,
            category,
            studentsCount: studentsData.length,
            students: studentsData.map((s) => ({
                name: s.student.name,
                phone: s.student.phoneNumber,
                weeksLate: s.weeksLate,
            })),
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==============================================
// 🎉 EVENT REMINDER - SEND TO ONE STUDENT
// ==============================================
router.post('/send-event-reminder/:studentId/:eventId', async (req, res) => {
    try {
        const { category = 'friendly' } = req.body;
        const { studentId, eventId } = req.params;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ error: 'Siswa tidak ditemukan' });
        }

        // Import Event model
        const Event = (await import('../models/Event.js')).default;
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ error: 'Event tidak ditemukan' });
        }

        if (!student.phoneNumber) {
            return res.status(400).json({
                error: 'Siswa tidak memiliki nomor WhatsApp',
            });
        }

        // Send reminder
        const result = await whatsappService.sendEventReminder(
            student,
            event,
            category
        );

        res.json({
            success: result.success,
            message: result.testMode
                ? 'Reminder berhasil dibuat (TEST MODE)'
                : 'Reminder event berhasil dikirim',
            notification: result.notification,
            testMode: result.testMode,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==============================================
// 🎉 EVENT REMINDER - SEND BULK
// ==============================================
router.post('/send-event-reminder-bulk/:eventId', async (req, res) => {
    try {
        const { category = 'friendly', studentIds } = req.body;
        const { eventId } = req.params;

        // Import Event model
        const Event = (await import('../models/Event.js')).default;
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ error: 'Event tidak ditemukan' });
        }

        // Get students yang belum bayar
        const allStudents = await Student.find({ status: 'Aktif' });
        const paidStudentIds = event.studentsPaid.map((id) => id.toString());

        let studentsToRemind;
        if (studentIds && studentIds.length > 0) {
            studentsToRemind = await Student.find({
                _id: { $in: studentIds },
                phoneNumber: { $exists: true, $ne: '' },
            });
        } else {
            // Semua yang belum bayar
            studentsToRemind = allStudents.filter(
                (s) =>
                    !paidStudentIds.includes(s._id.toString()) &&
                    s.phoneNumber &&
                    s.enableNotification !== false
            );
        }

        const results = {
            success: [],
            failed: [],
            skipped: [],
        };

        for (const student of studentsToRemind) {
            try {
                const result = await whatsappService.sendEventReminder(
                    student,
                    event,
                    category
                );

                if (result.success) {
                    results.success.push({
                        student: student.name,
                        phone: student.phoneNumber,
                        notificationId: result.notification._id,
                    });
                } else {
                    results.failed.push({
                        student: student.name,
                        error: 'Gagal mengirim',
                    });
                }

                // Delay to avoid rate limit
                await new Promise((resolve) => setTimeout(resolve, 1000));
            } catch (error) {
                results.failed.push({
                    student: student.name,
                    error: error.message,
                });
            }
        }

        res.json({
            message: 'Pengiriman event reminder selesai',
            event: event.name,
            summary: {
                total: studentsToRemind.length,
                success: results.success.length,
                failed: results.failed.length,
            },
            results,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==============================================
// 🎉 EVENT REMINDER - SEND TO GROUP
// ==============================================
router.post('/send-event-reminder-group/:eventId', async (req, res) => {
    try {
        const { groupId, category = 'friendly' } = req.body;
        const { eventId } = req.params;

        if (!groupId) {
            return res.status(400).json({ error: 'Group ID wajib diisi' });
        }

        // Import Event model
        const Event = (await import('../models/Event.js')).default;
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ error: 'Event tidak ditemukan' });
        }

        // Get students yang belum bayar
        const allStudents = await Student.find({
            status: 'Aktif',
            phoneNumber: { $exists: true, $ne: '' },
        });

        const paidStudentIds = event.studentsPaid.map((id) => id.toString());
        const studentsData = allStudents
            .filter((s) => !paidStudentIds.includes(s._id.toString()))
            .map((student) => ({ student }));

        if (studentsData.length === 0) {
            return res.json({
                success: true,
                message: 'Semua siswa sudah bayar event ini! 🎉',
                studentsCount: 0,
            });
        }

        // Send to group
        const result = await whatsappService.sendEventReminderToGroup(
            groupId,
            studentsData,
            event,
            category
        );

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error || 'Gagal mengirim pesan',
                detail: result.detail,
                message: `Gagal mengirim reminder: ${
                    result.error || 'Unknown error'
                }`,
            });
        }

        res.json({
            success: result.success,
            message: result.testMode
                ? `Pesan berhasil dibuat (TEST MODE) - ${studentsData.length} siswa akan di-mention`
                : `Reminder event berhasil dikirim ke grup dengan ${studentsData.length} mention`,
            event: event.name,
            studentsCount: studentsData.length,
            messageId: result.messageId,
            testMode: result.testMode,
            detail: result.detail,
        });
    } catch (error) {
        console.error('Route error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==============================================
// 🔍 PREVIEW EVENT REMINDER
// ==============================================
router.post('/preview-event-reminder/:eventId', async (req, res) => {
    try {
        const { category = 'friendly' } = req.body;
        const { eventId } = req.params;

        // Import Event model
        const Event = (await import('../models/Event.js')).default;
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ error: 'Event tidak ditemukan' });
        }

        // Get sample student
        const student = await Student.findOne({
            status: 'Aktif',
            phoneNumber: { $exists: true, $ne: '' },
        });

        if (!student) {
            return res.json({
                message: 'Tidak ada siswa dengan nomor WA',
                preview: null,
            });
        }

        // Format deadline
        const deadline = new Date(event.endDate).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });

        // Generate preview
        const message = whatsappService.generateEventReminderMessage(
            student.name,
            event.name,
            event.perStudentAmount,
            deadline,
            category
        );

        res.json({
            message,
            category,
            event: {
                name: event.name,
                amount: event.perStudentAmount,
                deadline,
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Preview event reminder group message
router.post('/preview-event-reminder-group/:eventId', async (req, res) => {
    try {
        const { category = 'friendly' } = req.body;
        const { eventId } = req.params;

        // Import Event model
        const Event = (await import('../models/Event.js')).default;
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ error: 'Event tidak ditemukan' });
        }

        // Get unpaid students with WA
        const allStudents = await Student.find({ status: 'Aktif' });
        const unpaidStudents = allStudents.filter(
            (student) =>
                !event.studentsPaid.some(
                    (paidId) => paidId.toString() === student._id.toString()
                ) &&
                student.phoneNumber &&
                student.phoneNumber.trim() !== ''
        );

        if (unpaidStudents.length === 0) {
            return res.json({
                message: 'Semua siswa sudah bayar atau tidak ada nomor WA',
                preview: null,
            });
        }

        // Prepare studentsData in correct format
        const studentsData = unpaidStudents.map((student) => ({ student }));

        // Generate group message
        const message = whatsappService.generateGroupEventReminderMessage(
            studentsData,
            event,
            category
        );

        res.json({
            message,
            category,
            studentsCount: unpaidStudents.length,
            event: {
                name: event.name,
                amount: event.perStudentAmount,
                deadline: new Date(event.endDate).toLocaleDateString('id-ID'),
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
