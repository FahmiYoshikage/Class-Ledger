import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import QRCode from '../models/QRCode.js';
import PaymentConfirmation from '../models/PaymentConfirmation.js';
import Payment from '../models/Payment.js';
import Student from '../models/Student.js';
import handleApiError from '../utils/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, '../uploads');
const PROOFS_DIR = path.join(UPLOADS_DIR, 'payment-proofs');
const QR_CODES_DIR = path.join(UPLOADS_DIR, 'qr-codes');

// Ensure upload directories exist safely
[UPLOADS_DIR, PROOFS_DIR, QR_CODES_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
        try {
            fs.mkdirSync(dir, { recursive: true });
        } catch (err) {
            console.error(`Failed to ensure upload directory ${dir}:`, err);
        }
    }
});

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(QR_CODES_DIR)) {
            fs.mkdirSync(QR_CODES_DIR, { recursive: true });
        }
        cb(null, QR_CODES_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, 'qr-' + uniqueSuffix + ext);
    },
});

const proofStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(PROOFS_DIR)) {
            fs.mkdirSync(PROOFS_DIR, { recursive: true });
        }
        cb(null, PROOFS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, 'proof-' + uniqueSuffix + ext);
    },
});

const imageFileFilter = (req, file, cb) => {
    const allowedExtensions = /jpeg|jpg|png|webp|heic|heif/i;
    const ext = path
        .extname(file.originalname || '')
        .toLowerCase()
        .replace('.', '');
    const isImageMime =
        file.mimetype?.startsWith('image/') ||
        allowedExtensions.test(file.mimetype || '');
    const hasValidExt = !ext || allowedExtensions.test(ext);

    if (isImageMime && hasValidExt) {
        return cb(null, true);
    } else {
        cb(
            new Error(
                'Hanya file gambar (JPG, PNG, WEBP) yang diperbolehkan'
            )
        );
    }
};

const uploadQR = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: imageFileFilter,
});

const uploadProof = multer({
    storage: proofStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: imageFileFilter,
});

// Middleware wrappers to cleanly handle multer errors
const handleQRUpload = (req, res, next) => {
    uploadQR.single('qrImage')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'Ukuran file QR code terlalu besar. Maksimal 5MB.',
                });
            }
            return res.status(400).json({
                success: false,
                message: 'Gagal mengunggah berkas QR code. Pastikan ukuran di bawah 5MB.',
            });
        } else if (err) {
            console.error('❌ Upload error in handleQRUpload:', err);
            const isUserValidationError =
                typeof err.message === 'string' &&
                err.message.startsWith('Hanya file gambar');
            return res.status(isUserValidationError ? 400 : 500).json({
                success: false,
                message: isUserValidationError
                    ? err.message
                    : 'Gagal memproses upload QR code. Silakan coba lagi.',
            });
        }
        next();
    });
};

const handleProofUpload = (req, res, next) => {
    uploadProof.single('proofImage')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'Ukuran file foto terlalu besar. Maksimal 5MB.',
                });
            }
            return res.status(400).json({
                success: false,
                message: 'Gagal mengunggah bukti pembayaran. Pastikan ukuran di bawah 5MB.',
            });
        } else if (err) {
            console.error('❌ Upload error in handleProofUpload:', err);
            const isUserValidationError =
                typeof err.message === 'string' &&
                err.message.startsWith('Hanya file gambar');
            return res.status(isUserValidationError ? 400 : 500).json({
                success: false,
                message: isUserValidationError
                    ? err.message
                    : 'Gagal memproses upload bukti transfer. Silakan coba beberapa saat lagi atau hubungi bendahara.',
            });
        }
        next();
    });
};

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
        return handleApiError(res, error, 'Gagal mengambil QR code aktif');
    }
});

// POST /api/qr-payment/upload - Upload new QR code (admin only)
router.post('/upload', handleQRUpload, async (req, res) => {
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
        return handleApiError(res, error, 'Gagal mengupload QR code');
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
        return handleApiError(res, error, 'Gagal mengambil daftar QR code');
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
        if (qrCode.imageUrl) {
            const filename = path.basename(qrCode.imageUrl);
            const filePath = path.join(QR_CODES_DIR, filename);
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (unlinkErr) {
                    console.warn('Could not unlink QR file:', unlinkErr);
                }
            }
        }

        await QRCode.findByIdAndDelete(req.params.id);

        console.log(`✅ QR code deleted: ${req.params.id}`);

        res.json({
            success: true,
            message: 'QR code berhasil dihapus',
        });
    } catch (error) {
        return handleApiError(res, error, 'Gagal menghapus QR code');
    }
});

// ========== PAYMENT CONFIRMATION (STUDENT) ==========

// POST /api/qr-payment/confirm - Submit payment confirmation with proof
router.post('/confirm', handleProofUpload, async (req, res) => {
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
        return handleApiError(
            res,
            error,
            'Gagal mengirim konfirmasi pembayaran. Silakan coba beberapa saat lagi.'
        );
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
        return handleApiError(res, error, 'Gagal mengambil riwayat konfirmasi');
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
        return handleApiError(res, error, 'Gagal mengambil konfirmasi pending');
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
        return handleApiError(res, error, 'Gagal mengambil daftar konfirmasi');
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
            method: 'QRIS',
            note:
                notes || `Pembayaran via QRIS - Diverifikasi oleh ${reviewedBy}`,
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
        return handleApiError(res, error, 'Gagal menyetujui pembayaran');
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
        return handleApiError(res, error, 'Gagal menolak pembayaran');
    }
});

export default router;
