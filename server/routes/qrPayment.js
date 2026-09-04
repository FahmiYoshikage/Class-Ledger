import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import QRCode from '../models/QRCode.js';
import PaymentConfirmation from '../models/PaymentConfirmation.js';
import Payment from '../models/Payment.js';
import Student from '../models/Student.js';

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/qr-codes';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'qr-' + uniqueSuffix + path.extname(file.originalname));
    },
});

const proofStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/payment-proofs';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'proof-' + uniqueSuffix + path.extname(file.originalname));
    },
});

const uploadQR = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(
            path.extname(file.originalname).toLowerCase()
        );
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(
                new Error(
                    'Hanya file gambar (JPEG, JPG, PNG) yang diperbolehkan'
                )
            );
        }
    },
});

const uploadProof = multer({
    storage: proofStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(
            path.extname(file.originalname).toLowerCase()
        );
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(
                new Error(
                    'Hanya file gambar (JPEG, JPG, PNG) yang diperbolehkan'
                )
            );
        }
    },
});

// ========== QR CODE MANAGEMENT (ADMIN) ==========

// GET /api/qr-payment/active - Get active QR code
router.get('/active', async (req, res) => {
    try {
        const activeQR = await QRCode.findOne({ isActive: true }).sort({
            uploadedAt: -1,
        });

        if (!activeQR) {
            return res.json({
                success: true,
                qrCode: null,
                message: 'Belum ada QR code aktif',
            });
        }

        res.json({
            success: true,
            qrCode: activeQR,
        });
    } catch (error) {
        console.error('❌ Error fetching active QR code:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil QR code',
            error: error.message,
        });
    }
});

// POST /api/qr-payment/upload - Upload new QR code (admin only)
router.post('/upload', uploadQR.single('qrImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'File QR code harus diupload',
            });
        }

        const { paymentMethod, accountName, accountNumber, uploadedBy, notes } =
            req.body;

        if (!paymentMethod || !accountName || !uploadedBy) {
            return res.status(400).json({
                success: false,
                message: 'Data tidak lengkap',
            });
        }

        // Deactivate all previous QR codes
        await QRCode.updateMany({}, { isActive: false });

        // Create new QR code
        const newQR = new QRCode({
            imageUrl: `/uploads/qr-codes/${req.file.filename}`,
            paymentMethod,
            accountName,
            accountNumber: accountNumber || '',
            uploadedBy,
            notes: notes || '',
            isActive: true,
        });

        await newQR.save();

        console.log(
            `✅ New QR code uploaded: ${paymentMethod} - ${accountName}`
        );

        res.json({
            success: true,
            qrCode: newQR,
            message: 'QR code berhasil diupload',
        });
    } catch (error) {
        console.error('❌ Error uploading QR code:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengupload QR code',
            error: error.message,
        });
    }
});

// GET /api/qr-payment/list - Get all QR codes (admin only)
router.get('/list', async (req, res) => {
    try {
        const qrCodes = await QRCode.find().sort({ uploadedAt: -1 });

        res.json({
            success: true,
            qrCodes,
            count: qrCodes.length,
        });
    } catch (error) {
        console.error('❌ Error fetching QR codes:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil daftar QR code',
            error: error.message,
        });
    }
});

// DELETE /api/qr-payment/:id - Delete QR code (admin only)
router.delete('/:id', async (req, res) => {
    try {
        const qrCode = await QRCode.findById(req.params.id);

        if (!qrCode) {
            return res.status(404).json({
                success: false,
                message: 'QR code tidak ditemukan',
            });
        }

        // Delete file from filesystem
        const filePath = path.join(process.cwd(), qrCode.imageUrl);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await QRCode.findByIdAndDelete(req.params.id);

        console.log(`✅ QR code deleted: ${req.params.id}`);

        res.json({
            success: true,
            message: 'QR code berhasil dihapus',
        });
    } catch (error) {
        console.error('❌ Error deleting QR code:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal menghapus QR code',
            error: error.message,
        });
    }
});

// ========== PAYMENT CONFIRMATION (STUDENT) ==========

// POST /api/qr-payment/confirm - Submit payment confirmation with proof
router.post('/confirm', uploadProof.single('proofImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Bukti pembayaran harus diupload',
            });
        }

        const { studentId, amount, notes } = req.body;

        if (!studentId || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Data tidak lengkap',
            });
        }

        // Verify student exists
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Siswa tidak ditemukan',
            });
        }

        // Create payment confirmation
        const confirmation = new PaymentConfirmation({
            studentId,
            amount: parseFloat(amount),
            proofImageUrl: `/uploads/payment-proofs/${req.file.filename}`,
            notes: notes || '',
            status: 'pending',
        });

        await confirmation.save();

        console.log(
            `✅ Payment confirmation submitted: ${student.name} - Rp${amount}`
        );

        res.json({
            success: true,
            confirmation,
            message:
                'Konfirmasi pembayaran berhasil dikirim. Menunggu verifikasi admin.',
        });
    } catch (error) {
        console.error('❌ Error submitting payment confirmation:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengirim konfirmasi pembayaran',
            error: error.message,
        });
    }
});

// GET /api/qr-payment/confirmations/student/:studentId - Get student's confirmations
router.get('/confirmations/student/:studentId', async (req, res) => {
    try {
        const confirmations = await PaymentConfirmation.find({
            studentId: req.params.studentId,
        })
            .sort({ submittedAt: -1 })
            .populate('studentId', 'name nickname');

        res.json({
            success: true,
            confirmations,
            count: confirmations.length,
        });
    } catch (error) {
        console.error('❌ Error fetching student confirmations:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil riwayat konfirmasi',
            error: error.message,
        });
    }
});

// ========== ADMIN APPROVAL ==========

// GET /api/qr-payment/confirmations/pending - Get all pending confirmations (admin)
router.get('/confirmations/pending', async (req, res) => {
    try {
        const pendingConfirmations = await PaymentConfirmation.find({
            status: 'pending',
        })
            .sort({ submittedAt: 1 }) // Oldest first
            .populate('studentId', 'name nickname phone');

        res.json({
            success: true,
            confirmations: pendingConfirmations,
            count: pendingConfirmations.length,
        });
    } catch (error) {
        console.error('❌ Error fetching pending confirmations:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil konfirmasi pending',
            error: error.message,
        });
    }
});

// GET /api/qr-payment/confirmations/all - Get all confirmations with filters (admin)
router.get('/confirmations/all', async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;

        const query = {};
        if (status) query.status = status;
        if (startDate || endDate) {
            query.submittedAt = {};
            if (startDate) query.submittedAt.$gte = new Date(startDate);
            if (endDate) query.submittedAt.$lte = new Date(endDate);
        }

        const confirmations = await PaymentConfirmation.find(query)
            .sort({ submittedAt: -1 })
            .populate('studentId', 'name nickname phone')
            .populate('paymentId');

        res.json({
            success: true,
            confirmations,
            count: confirmations.length,
        });
    } catch (error) {
        console.error('❌ Error fetching all confirmations:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil daftar konfirmasi',
            error: error.message,
        });
    }
});

// POST /api/qr-payment/approve/:confirmationId - Approve payment (admin)
router.post('/approve/:confirmationId', async (req, res) => {
    try {
        const { reviewedBy, notes } = req.body;

        if (!reviewedBy) {
            return res.status(400).json({
                success: false,
                message: 'Reviewer name is required',
            });
        }

        const confirmation = await PaymentConfirmation.findById(
            req.params.confirmationId
        ).populate('studentId');

        if (!confirmation) {
            return res.status(404).json({
                success: false,
                message: 'Konfirmasi tidak ditemukan',
            });
        }

        if (confirmation.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Konfirmasi sudah ${confirmation.status}`,
            });
        }

        // Create Payment record
        const payment = new Payment({
            studentId: confirmation.studentId._id,
            amount: confirmation.amount,
            date: new Date(),
            method: 'qr_code',
            notes:
                notes || `Pembayaran via QR Code - Verified by ${reviewedBy}`,
        });

        await payment.save();

        // Update confirmation status
        confirmation.status = 'approved';
        confirmation.reviewedAt = new Date();
        confirmation.reviewedBy = reviewedBy;
        confirmation.paymentId = payment._id;
        if (notes) confirmation.notes = notes;

        await confirmation.save();

        console.log(
            `✅ Payment approved: ${confirmation.studentId.name} - Rp${confirmation.amount}`
        );

        res.json({
            success: true,
            confirmation,
            payment,
            message: 'Pembayaran berhasil disetujui',
        });
    } catch (error) {
        console.error('❌ Error approving payment:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal menyetujui pembayaran',
            error: error.message,
        });
    }
});

// POST /api/qr-payment/reject/:confirmationId - Reject payment (admin)
router.post('/reject/:confirmationId', async (req, res) => {
    try {
        const { reviewedBy, rejectionReason } = req.body;

        if (!reviewedBy || !rejectionReason) {
            return res.status(400).json({
                success: false,
                message: 'Reviewer name and rejection reason are required',
            });
        }

        const confirmation = await PaymentConfirmation.findById(
            req.params.confirmationId
        ).populate('studentId');

        if (!confirmation) {
            return res.status(404).json({
                success: false,
                message: 'Konfirmasi tidak ditemukan',
            });
        }

        if (confirmation.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Konfirmasi sudah ${confirmation.status}`,
            });
        }

        // Update confirmation status
        confirmation.status = 'rejected';
        confirmation.reviewedAt = new Date();
        confirmation.reviewedBy = reviewedBy;
        confirmation.rejectionReason = rejectionReason;

        await confirmation.save();

        console.log(
            `⚠️ Payment rejected: ${confirmation.studentId.name} - Rp${confirmation.amount} - Reason: ${rejectionReason}`
        );

        res.json({
            success: true,
            confirmation,
            message: 'Pembayaran ditolak',
        });
    } catch (error) {
        console.error('❌ Error rejecting payment:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal menolak pembayaran',
            error: error.message,
        });
    }
});

export default router;
