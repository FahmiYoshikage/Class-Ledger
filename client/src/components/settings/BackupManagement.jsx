import React, { useState, useEffect } from 'react';
import {
    HardDrive,
    Download,
    Upload,
    Trash2,
    RefreshCw,
    ShieldCheck,
    AlertTriangle,
    FileArchive,
    CheckCircle2,
    Clock,
    Database,
    Image,
    Terminal,
    Copy,
    Check,
} from 'lucide-react';
import { backupAPI } from '../../services/api';

const BackupManagement = () => {
    const [backups, setBackups] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState('');
    const [restoring, setRestoring] = useState(false);
    const [restoreFile, setRestoreFile] = useState(null);
    const [restoreModalOpen, setRestoreModalOpen] = useState(false);
    const [restoreSummary, setRestoreSummary] = useState(null);
    const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }
    const [copiedCron, setCopiedCron] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [listRes, statsRes] = await Promise.all([
                backupAPI.list().catch(() => ({ data: { backups: [] } })),
                backupAPI.getStats().catch(() => ({ data: { stats: null } })),
            ]);
            setBackups(listRes.data?.backups || []);
            setStats(statsRes.data?.stats || null);
        } catch (err) {
            console.error('Error loading backup data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Export & Download Backup ZIP
    const handleExportBackup = async () => {
        setExporting(true);
        setExportProgress('Memaketkan database dan mengompres file bukti transfer...');
        setMessage(null);

        try {
            const response = await backupAPI.export();
            const blob = new Blob([response.data], { type: 'application/zip' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            
            // Extract filename from response headers or fallback
            const contentDisposition = response.headers['content-disposition'];
            let filename = `ClassLedger_Backup_${new Date().toISOString().slice(0, 10)}.zip`;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^"]+)"?/);
                if (match && match[1]) filename = match[1];
            }

            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            setMessage({
                type: 'success',
                text: `✅ File backup (${filename}) berhasil dibuat dan diunduh ke komputer Anda! Salinan juga tersimpan di server.`,
            });
            loadData();
        } catch (err) {
            console.error('Export error:', err);
            setMessage({
                type: 'error',
                text: '❌ Gagal membuat backup: ' + (err.response?.data?.message || err.message),
            });
        } finally {
            setExporting(false);
            setExportProgress('');
        }
    };

    // Download an existing backup from server list
    const handleDownloadExisting = async (filename) => {
        try {
            const response = await backupAPI.download(filename);
            const blob = new Blob([response.data], { type: 'application/zip' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setMessage({
                type: 'error',
                text: '❌ Gagal mengunduh file backup: ' + (err.response?.data?.message || err.message),
            });
        }
    };

    // Delete a server backup
    const handleDeleteBackup = async (filename) => {
        if (!window.confirm(`Hapus file backup "${filename}" dari server?`)) {
            return;
        }

        try {
            await backupAPI.delete(filename);
            setMessage({
                type: 'success',
                text: `File ${filename} berhasil dihapus dari server.`,
            });
            loadData();
        } catch (err) {
            setMessage({
                type: 'error',
                text: '❌ Gagal menghapus file: ' + (err.response?.data?.message || err.message),
            });
        }
    };

    // Trigger Restore
    const handleConfirmRestore = async () => {
        if (!restoreFile) return;

        setRestoring(true);
        setMessage(null);

        const formData = new FormData();
        formData.append('backupZip', restoreFile);

        try {
            const res = await backupAPI.restore(formData);
            setRestoreModalOpen(false);
            setRestoreSummary(res.data?.summary || null);
            setRestoreFile(null);
            setMessage({
                type: 'success',
                text: '🎉 Sistem berhasil dipulihkan secara penuh dari file backup!',
            });
            loadData();
        } catch (err) {
            setRestoreModalOpen(false);
            setMessage({
                type: 'error',
                text: '❌ Gagal memulihkan sistem: ' + (err.response?.data?.message || err.message),
            });
        } finally {
            setRestoring(false);
        }
    };

    const copyCronCommand = () => {
        const cmd = '0 2 * * * /opt/Class-Ledger/scripts/backup-vps.sh >> /opt/Class-Ledger/backup.log 2>&1';
        navigator.clipboard.writeText(cmd);
        setCopiedCron(true);
        setTimeout(() => setCopiedCron(false), 2500);
    };

    return (
        <div className="space-y-6 pb-12 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/[0.08]">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            <HardDrive className="w-6 h-6" />
                        </div>
                        <span>Backup & Pemulihan Sistem</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-white/60 mt-1 max-w-2xl">
                        Lindungi seluruh database keuangan dan file foto bukti transfer kas siswa. Paket arsip <code>.zip</code> dapat diunduh langsung ke komputer Anda agar aman jika server VPS mengalami gangguan.
                    </p>
                </div>

                <button
                    onClick={loadData}
                    disabled={loading}
                    className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-xs font-semibold text-slate-700 dark:text-white/80 border border-slate-200 dark:border-white/[0.08] transition cursor-pointer"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                </button>
            </div>

            {/* Alert Message */}
            {message && (
                <div
                    className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 animate-scale-pop ${
                        message.type === 'success'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
                    }`}
                >
                    {message.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                    )}
                    <div className="flex-1 font-medium">{message.text}</div>
                    <button
                        onClick={() => setMessage(null)}
                        className="text-xs opacity-60 hover:opacity-100 font-bold"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Quick Storage Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-cyber-card p-5 rounded-2xl border border-slate-200 dark:border-white/[0.08]">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <Image className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-medium text-slate-500 dark:text-white/50 uppercase tracking-wider">
                                Bukti Transfer
                            </p>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                {stats?.proofsCount ?? '-'} File
                            </h3>
                            <p className="text-[10px] text-slate-400 dark:text-white/40">
                                Ukuran: {stats?.proofsSizeFormatted || '0 MB'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="glass-cyber-card p-5 rounded-2xl border border-slate-200 dark:border-white/[0.08]">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            <Database className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-medium text-slate-500 dark:text-white/50 uppercase tracking-wider">
                                Database Kas
                            </p>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                {stats?.paymentsCount ?? '-'} Transaksi
                            </h3>
                            <p className="text-[10px] text-slate-400 dark:text-white/40">
                                {stats?.studentsCount ?? '-'} Siswa Terdaftar
                            </p>
                        </div>
                    </div>
                </div>

                <div className="glass-cyber-card p-5 rounded-2xl border border-slate-200 dark:border-white/[0.08]">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <FileArchive className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-medium text-slate-500 dark:text-white/50 uppercase tracking-wider">
                                Arsip di Server
                            </p>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                {stats?.backupsCount ?? backups.length} Backup
                            </h3>
                            <p className="text-[10px] text-slate-400 dark:text-white/40">
                                Total: {stats?.totalBackupsSizeFormatted || '0 MB'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="glass-cyber-card p-5 rounded-2xl border border-slate-200 dark:border-white/[0.08]">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-medium text-slate-500 dark:text-white/50 uppercase tracking-wider">
                                Proteksi Data
                            </p>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                100% Siap
                            </h3>
                            <p className="text-[10px] text-slate-400 dark:text-white/40">
                                Database + Media Lengkap
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Action Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: 1-Click Backup Export & Restore (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                    {/* 1-Click Backup Download */}
                    <div className="glass-cyber-card p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-white/[0.1] relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-600/20">
                                <Download className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Unduh Backup Lengkap Sekarang
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-white/50">
                                    Paket satu file <code>.zip</code> terkompresi berisi seluruh data kas dan foto bukti transfer.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] my-4 text-xs space-y-2 text-slate-700 dark:text-white/70">
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-emerald-500" />
                                <span>Seluruh data koleksi MongoDB (Siswa, Kas, QRIS, Pengeluaran, Catatan).</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-emerald-500" />
                                <span>Seluruh file fisik foto bukti transfer dari siswa (<code>/uploads/payment-proofs</code>).</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-emerald-500" />
                                <span>Arsip otomatis disimpan juga di server untuk riwayat.</span>
                            </div>
                        </div>

                        {exporting ? (
                            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center space-y-2">
                                <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
                                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                                    {exportProgress || 'Memproses backup...'}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-white/40">
                                    Harap tunggu, file akan terunduh otomatis begitu proses kompresi selesai.
                                </p>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={handleExportBackup}
                                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                            >
                                <Download className="w-4 h-4" />
                                <span>Buat & Unduh Backup Lengkap (.zip)</span>
                            </button>
                        )}
                    </div>

                    {/* Restore Section */}
                    <div className="glass-cyber-card p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-white/[0.1]">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
                                <Upload className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Pulihkan Sistem dari Backup (.zip)
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-white/50">
                                    Gunakan fitur ini saat memindahkan data ke server baru atau memulihkan data setelah VPS crash.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="border-2 border-dashed border-slate-300 dark:border-white/15 rounded-2xl p-6 text-center hover:border-indigo-500 transition-colors">
                                <FileArchive className="w-8 h-8 text-slate-400 dark:text-white/30 mx-auto mb-2" />
                                <input
                                    type="file"
                                    id="restoreFileInput"
                                    accept=".zip"
                                    onChange={(e) => setRestoreFile(e.target.files[0] || null)}
                                    className="hidden"
                                />
                                {restoreFile ? (
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                                            {restoreFile.name}
                                        </p>
                                        <p className="text-[11px] text-slate-500 dark:text-white/50">
                                            Ukuran: {(restoreFile.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setRestoreFile(null)}
                                            className="text-[11px] text-rose-500 hover:underline pt-1"
                                        >
                                            Pilih file lain
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <label
                                            htmlFor="restoreFileInput"
                                            className="inline-block px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-xs font-semibold text-slate-700 dark:text-white cursor-pointer transition"
                                        >
                                            Pilih File Backup (.zip)
                                        </label>
                                        <p className="text-[11px] text-slate-400 dark:text-white/30 mt-2">
                                            Maksimal ukuran file: 250 MB
                                        </p>
                                    </div>
                                )}
                            </div>

                            <button
                                type="button"
                                disabled={!restoreFile || restoring}
                                onClick={() => setRestoreModalOpen(true)}
                                className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
                            >
                                <Upload className="w-4 h-4" />
                                <span>Mulai Proses Pemulihan</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Server Backup History & VPS Cron (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Server Backups List */}
                    <div className="glass-cyber-card p-6 rounded-3xl border border-slate-200 dark:border-white/[0.1]">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-indigo-500" />
                            <span>Riwayat Backup di Server</span>
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-white/40 mb-4">
                            Daftar file backup yang tersimpan di server.
                        </p>

                        {backups.length === 0 ? (
                            <div className="py-8 text-center rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.04]">
                                <FileArchive className="w-8 h-8 text-slate-300 dark:text-white/20 mx-auto mb-2" />
                                <p className="text-xs text-slate-500 dark:text-white/40">
                                    Belum ada file backup di server.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                                {backups.map((b) => (
                                    <div
                                        key={b.filename}
                                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between text-xs"
                                    >
                                        <div className="min-w-0 pr-2">
                                            <p className="font-semibold text-slate-900 dark:text-white truncate">
                                                {b.filename}
                                            </p>
                                            <p className="text-[10px] text-slate-400 dark:text-white/40 mt-0.5">
                                                {new Date(b.createdAt).toLocaleString('id-ID')} • {b.sizeFormatted}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => handleDownloadExisting(b.filename)}
                                                className="p-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 transition"
                                                title="Unduh file ini"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteBackup(b.filename)}
                                                className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition"
                                                title="Hapus dari server"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* VPS Automation / Cron Setup Guide */}
                    <div className="glass-cyber-card p-6 rounded-3xl border border-slate-200 dark:border-white/[0.1]">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-emerald-500" />
                            <span>Otomatisasi Backup Harian (Cron VPS)</span>
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-white/40 mb-3">
                            Agar server otomatis membackup setiap jam 02:00 malam dan menghapus arsip yang lebih dari 7 hari:
                        </p>

                        <div className="relative p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] leading-relaxed overflow-x-auto border border-white/10">
                            <code>0 2 * * * /opt/Class-Ledger/scripts/backup-vps.sh &gt;&gt; /opt/Class-Ledger/backup.log 2&gt;&amp;1</code>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                            <span className="text-[11px] text-slate-500 dark:text-white/40">
                                Tambahkan baris di atas pada <code>crontab -e</code> di VPS.
                            </span>
                            <button
                                type="button"
                                onClick={copyCronCommand}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                            >
                                {copiedCron ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedCron ? 'Tersalin!' : 'Salin Perintah'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Restore Confirmation Modal */}
            {restoreModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-white/15 shadow-2xl animate-scale-pop">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                            <AlertTriangle className="w-6 h-6" />
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                            Konfirmasi Pemulihan Sistem
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-white/70 leading-relaxed mb-4">
                            Proses ini akan <strong>menimpa data database kas saat ini</strong> dengan data dari file backup <code>{restoreFile?.name}</code>. Seluruh foto bukti transfer di dalam backup juga akan diekstrak ke server.
                        </p>

                        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 mb-5">
                            ⚠️ <strong>Penting:</strong> Pastikan Anda telah mengunduh backup terkini sebelum melanjutkan jika ingin menyimpan snapshot kas saat ini.
                        </div>

                        <div className="flex gap-2.5">
                            <button
                                type="button"
                                onClick={() => setRestoreModalOpen(false)}
                                disabled={restoring}
                                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5 transition"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmRestore}
                                disabled={restoring}
                                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-2"
                            >
                                {restoring ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Memulihkan...</span>
                                    </>
                                ) : (
                                    <span>Ya, Pulihkan Data</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Restore Summary Modal */}
            {restoreSummary && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-white/15 shadow-2xl animate-scale-pop">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                            Pemulihan Berhasil!
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-white/70 mb-4">
                            Data dari arsip <code>{restoreSummary.manifest?.filename || 'Backup'}</code> telah berhasil dipulihkan.
                        </p>

                        <div className="space-y-2 mb-5 max-h-48 overflow-y-auto pr-1">
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] text-xs flex justify-between font-mono">
                                <span>File Media Diekstrak:</span>
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">{restoreSummary.filesRestored} file</span>
                            </div>
                            {Object.entries(restoreSummary.database || {}).map(([model, count]) => (
                                <div
                                    key={model}
                                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] text-xs flex justify-between font-mono"
                                >
                                    <span className="text-slate-500 dark:text-white/50">{model}:</span>
                                    <span className="font-semibold text-slate-800 dark:text-white">{count} data</span>
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={() => setRestoreSummary(null)}
                            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BackupManagement;
