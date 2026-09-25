import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Models
import Student from '../models/Student.js';
import Payment from '../models/Payment.js';
import Expense from '../models/Expense.js';
import QRCode from '../models/QRCode.js';
import PaymentConfirmation from '../models/PaymentConfirmation.js';
import Event from '../models/Event.js';
import EventPayment from '../models/EventPayment.js';
import Setting from '../models/Setting.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import Session from '../models/Session.js';
import Badge from '../models/Badge.js';

import { ZipArchive } from 'archiver';
import AdmZip from 'adm-zip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVER_ROOT = path.resolve(__dirname, '..');
const UPLOADS_DIR = path.join(SERVER_ROOT, 'uploads');
const REPORTS_DIR = path.join(SERVER_ROOT, 'public/reports');
const BACKUPS_DIR = path.join(SERVER_ROOT, 'backups');

// Ensure backups dir exists
if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

/**
 * Format timestamp into standard backup filename
 */
export const generateBackupFilename = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    return `ClassLedger_Backup_${dateStr}.zip`;
};

/**
 * Gather all database collection data
 */
const fetchAllCollectionsData = async () => {
    const [
        students,
        payments,
        expenses,
        qrCodes,
        paymentConfirmations,
        events,
        eventPayments,
        settings,
        users,
        notifications,
        auditLogs,
        sessions,
        badges,
    ] = await Promise.all([
        Student.find().lean(),
        Payment.find().lean(),
        Expense.find().lean(),
        QRCode.find().lean(),
        PaymentConfirmation.find().lean(),
        Event.find().lean(),
        EventPayment.find().lean(),
        Setting.find().lean(),
        User.find().lean(),
        Notification.find().lean(),
        AuditLog.find().lean(),
        Session.find().lean(),
        Badge.find().lean(),
    ]);

    return {
        students,
        payments,
        expenses,
        qrCodes,
        paymentConfirmations,
        events,
        eventPayments,
        settings,
        users,
        notifications,
        auditLogs,
        sessions,
        badges,
    };
};

/**
 * Calculate totals for manifest stats
 */
const calculateStats = (data) => {
    const totalPayments = (data.payments || []).reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const totalExpenses = (data.expenses || []).reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const balance = totalPayments - totalExpenses;

    let proofsCount = 0;
    const proofsDir = path.join(UPLOADS_DIR, 'payment-proofs');
    if (fs.existsSync(proofsDir)) {
        try {
            proofsCount = fs.readdirSync(proofsDir).length;
        } catch {
            proofsCount = 0;
        }
    }

    return {
        totalStudents: data.students?.length || 0,
        totalPaymentsCount: data.payments?.length || 0,
        totalExpensesCount: data.expenses?.length || 0,
        totalConfirmationsCount: data.paymentConfirmations?.length || 0,
        totalProofFilesCount: proofsCount,
        totalPaymentsAmount: totalPayments,
        totalExpensesAmount: totalExpenses,
        currentBalance: balance,
    };
};

/**
 * Create a complete ZIP backup archive
 * Can write to server file and/or pipe to Express response stream
 */
export const createBackupArchive = async ({ res = null, saveToServer = true } = {}) => {
    const filename = generateBackupFilename();
    const serverFilePath = path.join(BACKUPS_DIR, filename);

    const dbData = await fetchAllCollectionsData();
    const stats = calculateStats(dbData);

    const manifest = {
        app: 'Class-Ledger',
        version: '1.0.0',
        backupDate: new Date().toISOString(),
        filename,
        stats,
        collections: {
            students: dbData.students.length,
            payments: dbData.payments.length,
            expenses: dbData.expenses.length,
            qrCodes: dbData.qrCodes.length,
            paymentConfirmations: dbData.paymentConfirmations.length,
            events: dbData.events.length,
            eventPayments: dbData.eventPayments.length,
            settings: dbData.settings.length,
            users: dbData.users.length,
            notifications: dbData.notifications.length,
            auditLogs: dbData.auditLogs.length,
            sessions: dbData.sessions.length,
            badges: dbData.badges.length,
        },
    };

    return new Promise((resolve, reject) => {
        const archive = new ZipArchive({
            zlib: { level: 6 },
        });

        let fileStream = null;
        if (saveToServer) {
            fileStream = fs.createWriteStream(serverFilePath);
            archive.pipe(fileStream);
        }

        if (res) {
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            archive.pipe(res);
        }

        archive.on('error', (err) => {
            console.error('❌ Archiver error:', err);
            reject(err);
        });

        // Track when finished
        if (fileStream) {
            fileStream.on('close', () => {
                const sizeBytes = archive.pointer();
                resolve({
                    filename,
                    filePath: serverFilePath,
                    sizeBytes,
                    manifest,
                });
            });
        } else if (res) {
            res.on('finish', () => {
                resolve({
                    filename,
                    sizeBytes: archive.pointer(),
                    manifest,
                });
            });
        }

        // 1. Add manifest
        archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });

        // 2. Add JSON database files
        for (const [collName, docs] of Object.entries(dbData)) {
            archive.append(JSON.stringify(docs, null, 2), {
                name: `database/${collName}.json`,
            });
        }

        // 3. Add uploads/payment-proofs
        const proofsDir = path.join(UPLOADS_DIR, 'payment-proofs');
        if (fs.existsSync(proofsDir)) {
            archive.directory(proofsDir, 'uploads/payment-proofs');
        }

        // 4. Add uploads/qr-codes
        const qrDir = path.join(UPLOADS_DIR, 'qr-codes');
        if (fs.existsSync(qrDir)) {
            archive.directory(qrDir, 'uploads/qr-codes');
        }

        // 5. Add public/reports if present
        if (fs.existsSync(REPORTS_DIR)) {
            archive.directory(REPORTS_DIR, 'public/reports');
        }

        archive.finalize();
    });
};

/**
 * List all backup files stored in server
 */
export const listServerBackups = () => {
    if (!fs.existsSync(BACKUPS_DIR)) {
        return [];
    }

    const files = fs.readdirSync(BACKUPS_DIR);
    const backups = [];

    for (const file of files) {
        if (!file.endsWith('.zip')) continue;
        const filePath = path.join(BACKUPS_DIR, file);
        try {
            const stats = fs.statSync(filePath);
            backups.push({
                filename: file,
                sizeBytes: stats.size,
                sizeFormatted: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
                createdAt: stats.birthtime || stats.mtime,
                modifiedAt: stats.mtime,
            });
        } catch {
            // Ignore inaccessible files
        }
    }

    // Sort newest first
    return backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

/**
 * Get safe path for backup filename
 */
export const getSafeBackupPath = (filename) => {
    if (!filename || typeof filename !== 'string') return null;
    const safeName = path.basename(filename);
    if (safeName !== filename || !safeName.endsWith('.zip')) {
        return null;
    }
    const fullPath = path.join(BACKUPS_DIR, safeName);
    if (!fs.existsSync(fullPath)) {
        return null;
    }
    return fullPath;
};

/**
 * Delete a backup file on server
 */
export const deleteServerBackup = (filename) => {
    const fullPath = getSafeBackupPath(filename);
    if (!fullPath) {
        throw new Error('File backup tidak ditemukan atau tidak valid.');
    }
    fs.unlinkSync(fullPath);
    return true;
};

/**
 * Restore system from ZIP backup
 */
export const restoreBackupFromZip = async (zipFilePath) => {
    if (!fs.existsSync(zipFilePath)) {
        throw new Error('File backup ZIP tidak ditemukan.');
    }

    const zip = new AdmZip(zipFilePath);
    const zipEntries = zip.getEntries();

    // 1. Verify manifest
    const manifestEntry = zipEntries.find((e) => e.entryName === 'manifest.json');
    if (!manifestEntry) {
        throw new Error('File backup tidak valid: manifest.json tidak ditemukan dalam arsip.');
    }

    let manifest = null;
    try {
        manifest = JSON.parse(manifestEntry.getData().toString('utf8'));
    } catch {
        throw new Error('Manifest file dalam backup rusak atau tidak dapat dibaca.');
    }

    const restoreSummary = {
        database: {},
        filesRestored: 0,
        manifest,
    };

    // 2. Extract media files
    for (const entry of zipEntries) {
        if (entry.isDirectory) continue;

        if (entry.entryName.startsWith('uploads/')) {
            const relPath = entry.entryName.replace(/^uploads\//, '');
            const targetPath = path.join(UPLOADS_DIR, relPath);
            fs.mkdirSync(path.dirname(targetPath), { recursive: true });
            fs.writeFileSync(targetPath, entry.getData());
            restoreSummary.filesRestored++;
        } else if (entry.entryName.startsWith('public/reports/')) {
            const relPath = entry.entryName.replace(/^public\/reports\//, '');
            const targetPath = path.join(REPORTS_DIR, relPath);
            fs.mkdirSync(path.dirname(targetPath), { recursive: true });
            fs.writeFileSync(targetPath, entry.getData());
            restoreSummary.filesRestored++;
        }
    }

    // 3. Restore database collections
    const modelMapping = {
        'database/students.json': Student,
        'database/payments.json': Payment,
        'database/expenses.json': Expense,
        'database/qrCodes.json': QRCode,
        'database/paymentConfirmations.json': PaymentConfirmation,
        'database/events.json': Event,
        'database/eventPayments.json': EventPayment,
        'database/settings.json': Setting,
        'database/users.json': User,
        'database/notifications.json': Notification,
        'database/auditLogs.json': AuditLog,
        'database/sessions.json': Session,
        'database/badges.json': Badge,
    };

    for (const [entryPath, Model] of Object.entries(modelMapping)) {
        const entry = zipEntries.find((e) => e.entryName === entryPath);
        if (!entry) continue;

        try {
            const docs = JSON.parse(entry.getData().toString('utf8'));
            if (Array.isArray(docs) && docs.length > 0) {
                // Clear existing and replace with backed up documents
                await Model.deleteMany({});
                await Model.insertMany(docs, { ordered: false });
                restoreSummary.database[Model.modelName] = docs.length;
            } else {
                restoreSummary.database[Model.modelName] = 0;
            }
        } catch (err) {
            console.error(`Gagal merestore collection ${entryPath}:`, err);
            restoreSummary.database[Model.modelName] = `Error: ${err.message}`;
        }
    }

    return restoreSummary;
};

/**
 * Get comprehensive disk and collection storage statistics
 */
export const getStorageStats = async () => {
    let proofsCount = 0;
    let proofsSizeBytes = 0;
    const proofsDir = path.join(UPLOADS_DIR, 'payment-proofs');

    if (fs.existsSync(proofsDir)) {
        try {
            const files = fs.readdirSync(proofsDir);
            proofsCount = files.length;
            for (const file of files) {
                const stat = fs.statSync(path.join(proofsDir, file));
                proofsSizeBytes += stat.size;
            }
        } catch {}
    }

    let qrCodesCount = 0;
    const qrDir = path.join(UPLOADS_DIR, 'qr-codes');
    if (fs.existsSync(qrDir)) {
        try {
            qrCodesCount = fs.readdirSync(qrDir).length;
        } catch {}
    }

    const [studentsCount, paymentsCount, confirmationsCount] = await Promise.all([
        Student.countDocuments(),
        Payment.countDocuments(),
        PaymentConfirmation.countDocuments(),
    ]);

    const backups = listServerBackups();
    const totalBackupsSizeBytes = backups.reduce((acc, b) => acc + b.sizeBytes, 0);

    return {
        proofsCount,
        proofsSizeBytes,
        proofsSizeFormatted: (proofsSizeBytes / (1024 * 1024)).toFixed(2) + ' MB',
        qrCodesCount,
        studentsCount,
        paymentsCount,
        confirmationsCount,
        backupsCount: backups.length,
        totalBackupsSizeBytes,
        totalBackupsSizeFormatted: (totalBackupsSizeBytes / (1024 * 1024)).toFixed(2) + ' MB',
    };
};
