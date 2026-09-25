import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    MessageCircle,
    Send,
    Users,
    FileText,
    RefreshCw,
    Check,
    Copy,
    X,
    AlertCircle,
    CheckCircle2,
    Sparkles,
    QrCode,
    Image,
} from 'lucide-react';
import { notificationsAPI } from '../../services/api';
import { useAppConfig } from '../../context/ConfigContext';

const buildFallbackTemplates = (config) => {
    const className = (config?.className || 'Kelas').toUpperCase();
    const amountStr = `Rp ${(config?.weeklyAmount || 2000).toLocaleString('id-ID')}`;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

    let accountsText = 'Silakan hubungi bendahara kelas untuk rekening pembayaran.';
    if (Array.isArray(config?.paymentAccounts) && config.paymentAccounts.length > 0) {
        accountsText = config.paymentAccounts
            .map((acc) => `• *${acc.bankName}*: ${acc.accountNumber} (a.n ${acc.accountHolder})`)
            .join('\n');
        if (config?.paymentNotes) {
            accountsText += `\n_${config.paymentNotes}_`;
        }
    }

    return {
        full: `📊 *LAPORAN KAS KELAS* 📊\n${className}\n━━━━━━━━━━━━━━━━━━━━\n\nMohon kerja samanya untuk pembayaran kas kelas ya teman-teman! 🙏\n\n━━━━━━━━━━━━━━━━━━━━\n💳 *INFORMASI PEMBAYARAN*\n${accountsText}\n━━━━━━━━━━━━━━━━━━━━\n\n🏆 Cek Leaderboard Lengkap:\n${baseUrl}/leaderboard`,
        summary: `📊 *UPDATE KAS KELAS (RINGKAS)* 📊\n${className}\n━━━━━━━━━━━━━━━━━━━━\nPengingat pembayaran kas kelas mingguan (${amountStr}/minggu).\n\n💳 *Pembayaran via:*\n${accountsText}\n🏆 ${baseUrl}/leaderboard`,
        arrears: `⚠️ *PENGINGAT KAS & TUNGGAKAN* ⚠️\n${className}\n━━━━━━━━━━━━━━━━━━━━\nYuk segera lunasi kas kelas teman-teman agar operasional kegiatan tetap aman! 💪\n\n💳 *Pembayaran via:*\n${accountsText}\n🏆 ${baseUrl}/leaderboard`,
        qris: `📢 *PENGUMUMAN PEMBAYARAN KAS KELAS VIA QRIS & WEB* 📢\n${className}\n━━━━━━━━━━━━━━━━━━━━\n\nHalo teman-teman semua! 👋\n\nMulai sekarang, pembayaran uang kas kelas sudah jauh lebih praktis dan transparan melalui sistem web kas kelas kita! 🎉\n\n💳 *BISA BAYAR PAKAI APA SAJA?*\nCukup *scan barcode QRIS* yang terlampir di pesan ini menggunakan:\n• 🏦 *Mobile Banking:* BCA, Mandiri (Livin), BRI (BRImo), BNI, Seabank, Bank Jago, dll.\n• 📱 *E-Wallet:* DANA, GoPay, OVO, ShopeePay, LinkAja.\n\n📸 *CARA BAYAR & KONFIRMASI:*\n1. Scan gambar QRIS di atas dan transfer nominal kas kamu (${amountStr}/minggu).\n2. Simpan / tangkap layar (screenshot) bukti transfer berhasil.\n3. Buka link web kas kelas:\n   👉 *${baseUrl}/qr-payment*\n4. Pilih nama kamu, isi nominal, dan upload foto bukti transfernya.\n5. Selesai! ✨\n\n⚡ *KEUNTUNGAN:*\n• Konfirmasi diverifikasi langsung oleh bendahara kelas.\n• Saldo kas bertambah otomatis secara real-time.\n• Peringkat donatur & pelunasan kas langsung terupdate di leaderboard!\n\n🏆 *Cek Peringkat & Status Tunggakan Kamu:*\n👉 ${baseUrl}/leaderboard\n\nYuk bayar kas tepat waktu demi kelancaran kegiatan kelas kita bersama! Terima kasih teman-teman! 🙏✨`,
    };
};

const SendFinancialReportModal = ({ isOpen, onClose, onSuccess }) => {
    const { config } = useAppConfig();
    const fallbackTemplates = useMemo(() => buildFallbackTemplates(config), [config]);

    const [groupId, setGroupId] = useState(config?.whatsappGroupId || '');
    const [saveDefault, setSaveDefault] = useState(true);
    const [selectedTemplateKey, setSelectedTemplateKey] = useState('full');
    const [message, setMessage] = useState(fallbackTemplates.full);
    const [templates, setTemplates] = useState(fallbackTemplates);
    const [attachPdf, setAttachPdf] = useState(true);
    const [attachmentType, setAttachmentType] = useState('pdf'); // 'qris' | 'pdf' | 'none'
    const [activeQRInfo, setActiveQRInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [copied, setCopied] = useState(false);
    const [statusResult, setStatusResult] = useState(null);

    // Sync templates when config changes
    useEffect(() => {
        if (config?.whatsappGroupId && !groupId) {
            setGroupId(config.whatsappGroupId);
        }
    }, [config, groupId]);

    const fetchPreview = useCallback(async () => {
        setLoading(true);
        setStatusResult(null);
        try {
            const res = await notificationsAPI.getBroadcastPreview();
            if (res.data?.success) {
                const fetchedTemplates = res.data.templates || {
                    full: res.data.message || fallbackTemplates.full,
                    summary: fallbackTemplates.summary,
                    arrears: fallbackTemplates.arrears,
                    qris: fallbackTemplates.qris,
                };
                setTemplates(fetchedTemplates);
                setMessage(fetchedTemplates[selectedTemplateKey] || res.data.message || fallbackTemplates[selectedTemplateKey]);
                if (res.data.activeQRInfo) {
                    setActiveQRInfo(res.data.activeQRInfo);
                }
                if (res.data.groupId) {
                    setGroupId(res.data.groupId);
                } else if (config?.whatsappGroupId) {
                    setGroupId((prev) => prev || config.whatsappGroupId);
                }
            }
        } catch (err) {
            console.error('Error fetching broadcast preview:', err);
            // Fallback so user is never blocked
            if (config?.whatsappGroupId) {
                setGroupId((prev) => prev || config.whatsappGroupId);
            }
            setTemplates(fallbackTemplates);
            setMessage((prev) => prev || fallbackTemplates[selectedTemplateKey] || fallbackTemplates.full);

            setStatusResult({
                success: false,
                message:
                    'Catatan: Gagal memuat data live otomatis dari server (' +
                    (err.response?.data?.error || err.message) +
                    '). Template offline diaktifkan, Anda tetap dapat mengedit teks & mengirim laporan.',
            });
        } finally {
            setLoading(false);
        }
    }, [selectedTemplateKey, fallbackTemplates, config]);

    // Fetch live templates & default Group ID whenever modal opens
    useEffect(() => {
        if (!isOpen) return;
        fetchPreview();
    }, [isOpen, fetchPreview]);

    if (!isOpen) return null;

    const handleSelectTemplate = (key) => {
        setSelectedTemplateKey(key);
        if (templates[key]) {
            setMessage(templates[key]);
        } else if (fallbackTemplates[key]) {
            setMessage(fallbackTemplates[key]);
        }

        // Auto-select attachment type based on chosen template
        if (key === 'qris') {
            setAttachmentType('qris');
            setAttachPdf(false);
        } else if (key === 'full' || key === 'arrears') {
            setAttachmentType('pdf');
            setAttachPdf(true);
        }
    };

    const handleResetTemplate = () => {
        if (templates[selectedTemplateKey]) {
            setMessage(templates[selectedTemplateKey]);
        } else if (fallbackTemplates[selectedTemplateKey]) {
            setMessage(fallbackTemplates[selectedTemplateKey]);
        }
    };

    const handleCopy = () => {
        if (!message) return;
        navigator.clipboard.writeText(message);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSend = async () => {
        if (!groupId || !groupId.trim()) {
            setStatusResult({
                success: false,
                message: 'ID Grup WhatsApp wajib diisi!',
            });
            return;
        }

        if (!message || !message.trim()) {
            setStatusResult({
                success: false,
                message: 'Pesan laporan kas tidak boleh kosong!',
            });
            return;
        }

        setSending(true);
        setStatusResult(null);

        try {
            const res = await notificationsAPI.sendGroupBroadcast({
                groupId: groupId.trim(),
                customMessage: message,
                attachmentType, // 'qris' | 'pdf' | 'none'
                attachPdf: attachmentType === 'pdf',
                saveDefault,
            });

            if (res.data?.success) {
                setStatusResult({
                    success: true,
                    message: res.data.message || 'Laporan keuangan berhasil dikirim ke grup WhatsApp!',
                    detail: res.data.detail,
                });
                if (onSuccess) onSuccess(res.data);
            } else {
                setStatusResult({
                    success: false,
                    message: res.data?.message || 'Gagal mengirim laporan ke grup WhatsApp',
                    detail: res.data?.error,
                });
            }
        } catch (err) {
            console.error('Error sending report to group:', err);
            const errMsg =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                'Terjadi kesalahan saat mengirim ke WhatsApp Fonnte API';
            setStatusResult({
                success: false,
                message: errMsg,
            });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
            <div className="relative w-full max-w-2xl my-auto rounded-3xl bg-white dark:bg-zinc-950/95 border border-slate-200 dark:border-emerald-500/30 shadow-2xl shadow-slate-900/10 dark:shadow-emerald-950/50 flex flex-col overflow-hidden animate-scale-up">
                {/* Glowing top line */}
                <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 shadow-md shadow-emerald-500/50" />

                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/20">
                            <MessageCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-wide">
                                    Kirim Laporan Kas ke WA Grup
                                </h3>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/25">
                                    <Sparkles className="w-3 h-3" /> Fonnte WA
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-white/50 mt-0.5">
                                Broadcast ringkasan keuangan terbaru & lampiran PDF resmi
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={sending}
                        className="p-2 rounded-xl text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                        title="Tutup"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Status Alert Banner */}
                    {statusResult && (
                        <div
                            className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
                                statusResult.success
                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                                    : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300'
                            }`}
                        >
                            {statusResult.success ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 text-xs sm:text-sm">
                                <p className="font-semibold">{statusResult.message}</p>
                                {statusResult.detail && (
                                    <p className="mt-1 text-xs opacity-75 font-mono break-all">
                                        ID: {statusResult.detail.messageId || JSON.stringify(statusResult.detail)}
                                    </p>
                                )}
                                {!statusResult.success && (
                                    <button
                                        type="button"
                                        onClick={fetchPreview}
                                        disabled={loading}
                                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-100 dark:bg-rose-500/20 hover:bg-rose-200 dark:hover:bg-rose-500/30 text-rose-800 dark:text-rose-200 text-xs font-semibold border border-rose-300 dark:border-rose-500/30 transition-colors disabled:opacity-50"
                                    >
                                        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                                        <span>Coba Muat Ulang Live</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Group ID Input */}
                    <div className="space-y-2">
                        <label className="flex items-center justify-between text-xs sm:text-sm font-medium text-slate-700 dark:text-white/80">
                            <span className="flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                ID WhatsApp Grup Target
                            </span>
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400/80 font-mono">
                                Format: xxxxx@g.us
                            </span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={groupId}
                                onChange={(e) => setGroupId(e.target.value)}
                                placeholder="Contoh: 120363xxxxxxxxxx@g.us"
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/25 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs sm:text-sm font-mono tracking-wide transition-all"
                            />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-white/50 pt-0.5">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={saveDefault}
                                    onChange={(e) => setSaveDefault(e.target.checked)}
                                    className="rounded bg-slate-100 dark:bg-white/10 border-slate-300 dark:border-white/20 text-emerald-500 focus:ring-0 focus:ring-offset-0"
                                />
                                <span>Simpan ID grup ini sebagai default</span>
                            </label>
                            <span className="text-slate-400 dark:text-white/40 hidden sm:inline">
                                ID grup bisa didapat dari Fonnte / invite link
                            </span>
                        </div>
                    </div>

                    {/* Template Selector Pills */}
                    <div className="space-y-2">
                        <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-white/80">
                            Pilih Template Pesan
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                                {
                                    key: 'full',
                                    label: '📊 Lengkap & Detail',
                                    desc: 'Semua saldo, top contributor & tunggakan',
                                },
                                {
                                    key: 'summary',
                                    label: '⚡ Ringkas',
                                    desc: 'Ringkasan saldo & info bayar cepat',
                                },
                                {
                                    key: 'arrears',
                                    label: '⚠️ Tunggakan',
                                    desc: 'Prioritas penunggak & rekening',
                                },
                                {
                                    key: 'qris',
                                    label: '📢 Info QRIS',
                                    desc: 'Pengumuman QRIS, web kas & leaderboard',
                                },
                            ].map((tpl) => {
                                const isActive = selectedTemplateKey === tpl.key;
                                return (
                                    <button
                                        key={tpl.key}
                                        type="button"
                                        onClick={() => handleSelectTemplate(tpl.key)}
                                        className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                                            isActive
                                                ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500/50 text-emerald-800 dark:text-white shadow-sm ring-1 ring-emerald-500/30'
                                                : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <span className="text-xs font-semibold">{tpl.label}</span>
                                        <span className="text-[10px] text-slate-400 dark:text-white/40 mt-1 line-clamp-1">
                                            {tpl.desc}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Message Preview & Custom Editor */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs sm:text-sm font-medium text-slate-700 dark:text-white/80">
                            <span>Draft Pesan (Bisa Diedit Sesuai Kebutuhan)</span>
                            <div className="flex items-center gap-1 sm:gap-2">
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-white/70 text-[11px] font-medium border border-slate-200 dark:border-white/10 transition-colors"
                                    title="Salin isi pesan ke clipboard"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Tersalin</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3.5 h-3.5" />
                                            <span>Salin</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleResetTemplate}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-white/70 text-[11px] font-medium border border-slate-200 dark:border-white/10 transition-colors"
                                    title="Reset ke isi template default"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    <span>Reset</span>
                                </button>
                            </div>
                        </div>

                        <div className="relative">
                            {loading ? (
                                <div className="h-48 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-white/40 text-xs">
                                    <RefreshCw className="w-5 h-5 animate-spin text-emerald-500 dark:text-emerald-400" />
                                    <span>Memuat data keuangan real-time...</span>
                                </div>
                            ) : (
                                <textarea
                                    rows={8}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Isi pesan laporan keuangan..."
                                    className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-emerald-100/90 placeholder-slate-400 dark:placeholder-white/20 font-mono text-xs leading-relaxed focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 custom-scrollbar resize-y"
                                />
                            )}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-white/40">
                            <span>Karakter: {message.length}</span>
                            <span>Mendukung format WhatsApp (*tebal*, _miring_)</span>
                        </div>
                    </div>

                    {/* Attachment Selection */}
                    <div className="space-y-2">
                        <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-white/80">
                            Lampiran Media (WhatsApp)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {/* QRIS Option */}
                            <button
                                type="button"
                                onClick={() => {
                                    setAttachmentType('qris');
                                    setAttachPdf(false);
                                }}
                                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                                    attachmentType === 'qris'
                                        ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500/50 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500/30 shadow-sm'
                                        : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-1.5">
                                    <div className={`p-1.5 rounded-lg ${attachmentType === 'qris' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200/60 dark:bg-white/5 text-slate-500 dark:text-white/40'}`}>
                                        <QrCode className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                                        Gambar QRIS
                                    </span>
                                </div>
                                <span className="text-[11px] text-slate-500 dark:text-white/50 line-clamp-2">
                                    {activeQRInfo ? `QRIS a.n ${activeQRInfo.accountName || 'Aktif'}` : 'Foto barcode QRIS aktif'}
                                </span>
                            </button>

                            {/* PDF Option */}
                            <button
                                type="button"
                                onClick={() => {
                                    setAttachmentType('pdf');
                                    setAttachPdf(true);
                                }}
                                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                                    attachmentType === 'pdf'
                                        ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500/50 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500/30 shadow-sm'
                                        : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-1.5">
                                    <div className={`p-1.5 rounded-lg ${attachmentType === 'pdf' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200/60 dark:bg-white/5 text-slate-500 dark:text-white/40'}`}>
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                                        Dokumen PDF
                                    </span>
                                </div>
                                <span className="text-[11px] text-slate-500 dark:text-white/50 line-clamp-2">
                                    Laporan PDF tabel kas resmi
                                </span>
                            </button>

                            {/* None Option */}
                            <button
                                type="button"
                                onClick={() => {
                                    setAttachmentType('none');
                                    setAttachPdf(false);
                                }}
                                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                                    attachmentType === 'none'
                                        ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500/50 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500/30 shadow-sm'
                                        : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-1.5">
                                    <div className={`p-1.5 rounded-lg ${attachmentType === 'none' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200/60 dark:bg-white/5 text-slate-500 dark:text-white/40'}`}>
                                        <MessageCircle className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                                        Teks Saja
                                    </span>
                                </div>
                                <span className="text-[11px] text-slate-500 dark:text-white/50 line-clamp-2">
                                    Pesan tanpa file lampiran
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/20 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={sending}
                        className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 text-slate-700 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 text-xs sm:text-sm font-medium transition-all"
                    >
                        Tutup
                    </button>
                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={sending || !groupId.trim() || !message.trim()}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {sending ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                                <span>Mengirim Laporan...</span>
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4 text-white" />
                                <span>Kirim Sekarang ke Grup WA</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SendFinancialReportModal;
