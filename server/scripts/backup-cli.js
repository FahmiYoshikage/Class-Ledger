#!/usr/bin/env node
/**
 * Standalone CLI Backup Runner for Class-Ledger
 * Can be run manually or via cron: node server/scripts/backup-cli.js
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import connectDB from '../config/database.js';
import { createBackupArchive } from '../services/backupService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from server directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });
if (!process.env.MONGODB_URI) {
    dotenv.config({ path: path.resolve(__dirname, '../.env.production') });
}

async function runCliBackup() {
    console.log('====================================================');
    console.log('📦 Class-Ledger: Memulai Backup Sistem Penuh (CLI)');
    console.log('====================================================');
    const startTime = Date.now();

    try {
        await connectDB();

        console.log('⏳ Mengumpulkan data database dan file bukti transfer...');
        const result = await createBackupArchive({ saveToServer: true });

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log('----------------------------------------------------');
        console.log(`✅ Backup selesai dalam ${duration}s!`);
        console.log(`📁 Nama file  : ${result.filename}`);
        console.log(`📍 Lokasi     : ${result.filePath}`);
        console.log(`📊 Ukuran     : ${(result.sizeBytes / 1024 / 1024).toFixed(2)} MB`);
        console.log(`👥 Siswa      : ${result.manifest.stats.totalStudents}`);
        console.log(`💳 Transaksi  : ${result.manifest.stats.totalPaymentsCount}`);
        console.log(`📸 File Bukti : ${result.manifest.stats.totalProofFilesCount}`);
        console.log('====================================================');

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('❌ Gagal membuat backup:', err);
        try {
            await mongoose.disconnect();
        } catch {}
        process.exit(1);
    }
}

runCliBackup();
