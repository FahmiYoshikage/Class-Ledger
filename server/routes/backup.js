import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticate } from '../middleware/auth.js';
import handleApiError from '../utils/errorHandler.js';
import AuditLog from '../models/AuditLog.js';
import {
    createBackupArchive,
    listServerBackups,
    getSafeBackupPath,
    deleteServerBackup,
    restoreBackupFromZip,
    getStorageStats,
} from '../services/backupService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUPS_DIR = path.resolve(__dirname, '../backups');
const TMP_RESTORE_DIR = path.join(BACKUPS_DIR, 'tmp');

if (!fs.existsSync(TMP_RESTORE_DIR)) {
    fs.mkdirSync(TMP_RESTORE_DIR, { recursive: true });
}

// Multer for restore ZIP upload
const upload = multer({
    dest: TMP_RESTORE_DIR,
    limits: { fileSize: 250 * 1024 * 1024 }, // 250MB max
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.zip') {
            cb(null, true);
        } else {
            cb(new Error('Hanya file arsip .zip yang diperbolehkan'));
        }
    },
});

const router = express.Router();

/**
 * GET /api/backup/export
 * Creates a complete ZIP backup (Database + Uploads) and streams it directly to browser
 * Also saves a copy in server/backups/
 */
router.get('/export', authenticate, async (req, res) => {
    try {
        console.log(`📦 Admin ${req.user?.username || 'unknown'} memulai backup sistem...`);
        const result = await createBackupArchive({ res, saveToServer: true });

        // Record audit log asynchronously
        try {
            await AuditLog.create({
                action: 'backup_created',
                resource: 'System',
                user: req.user?._id,
                details: `Backup sistem dibuat: ${result.filename} (${(result.sizeBytes / 1024 / 1024).toFixed(2)} MB)`,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            });
        } catch (e) {
            console.warn('AuditLog logging skipped:', e.message);
        }
    } catch (error) {
        // If response headers already sent, close stream
        if (res.headersSent) {
            res.end();
        } else {
            return handleApiError(res, error, 'Gagal membuat file backup');
        }
    }
});

/**
 * GET /api/backup/list
 * List all backup files stored on the server
 */
router.get('/list', authenticate, (req, res) => {
    try {
        const backups = listServerBackups();
        res.json({
            success: true,
            backups,
        });
    } catch (error) {
        return handleApiError(res, error, 'Gagal mengambil daftar backup');
    }
});

/**
 * GET /api/backup/download/:filename
 * Download an existing backup file from server
 */
router.get('/download/:filename', authenticate, (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = getSafeBackupPath(filename);

        if (!filePath) {
            return res.status(404).json({
                success: false,
                message: 'File backup tidak ditemukan atau nama tidak valid',
            });
        }

        res.download(filePath, filename);
    } catch (error) {
        return handleApiError(res, error, 'Gagal mengunduh file backup');
    }
});

/**
 * DELETE /api/backup/:filename
 * Delete a specific backup file from the server
 */
router.delete('/:filename', authenticate, async (req, res) => {
    try {
        const { filename } = req.params;
        deleteServerBackup(filename);

        try {
            await AuditLog.create({
                action: 'backup_deleted',
                resource: 'System',
                user: req.user?._id,
                details: `File backup dihapus: ${filename}`,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            });
        } catch (e) {}

        res.json({
            success: true,
            message: `File backup ${filename} berhasil dihapus`,
        });
    } catch (error) {
        return handleApiError(res, error, error.message || 'Gagal menghapus file backup');
    }
});

/**
 * POST /api/backup/restore
 * Restore database and uploads from uploaded ZIP backup file
 */
router.post('/restore', authenticate, upload.single('backupZip'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'File .zip backup harus diunggah',
        });
    }

    const tempPath = req.file.path;
    try {
        console.log(`⚠️ Memulai pemulihan sistem dari file: ${req.file.originalname}`);
        const summary = await restoreBackupFromZip(tempPath);

        try {
            await AuditLog.create({
                action: 'backup_restored',
                resource: 'System',
                user: req.user?._id,
                details: `Sistem dipulihkan dari backup: ${req.file.originalname}`,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            });
        } catch (e) {}

        res.json({
            success: true,
            message: 'Sistem berhasil dipulihkan dari file backup',
            summary,
        });
    } catch (error) {
        return handleApiError(res, error, error.message || 'Gagal memulihkan sistem dari backup');
    } finally {
        // Clean up temp file
        if (fs.existsSync(tempPath)) {
            try {
                fs.unlinkSync(tempPath);
            } catch {}
        }
    }
});

/**
 * GET /api/backup/stats
 * Storage usage and count stats
 */
router.get('/stats', authenticate, async (req, res) => {
    try {
        const stats = await getStorageStats();
        res.json({
            success: true,
            stats,
        });
    } catch (error) {
        return handleApiError(res, error, 'Gagal mengambil statistik penyimpanan');
    }
});

export default router;
