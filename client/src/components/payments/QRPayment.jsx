import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft,
    QrCode,
    UploadCloud,
    CheckCircle2,
    AlertCircle,
    Copy,
    Check,
    ShieldCheck,
    Clock,
    FileText,
    Sparkles,
    Sun,
    Moon,
} from 'lucide-react';
import api from '../../services/api';
import { useAppConfig } from '../../context/ConfigContext';
import { useTheme } from '../../context/ThemeContext';

function QRPayment() {
    const { config } = useAppConfig();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const [activeQR, setActiveQR] = useState(null);
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [proofImage, setProofImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [tunggakanData, setTunggakanData] = useState(null);
    const [copiedAccount, setCopiedAccount] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    useEffect(() => {
        initData();
    }, []);

    const initData = async () => {
        try {
            setLoading(true);
            const [qrRes, studentsRes] = await Promise.all([
                api.get('/qr-payment/active').catch(() => ({ data: { success: false } })),
                api.get('/students').catch(() => ({ data: [] })),
            ]);

            if (qrRes.data?.success && qrRes.data?.qrCode) {
                setActiveQR(qrRes.data.qrCode);
            }

            const rawList = Array.isArray(studentsRes.data)
                ? studentsRes.data
                : studentsRes.data?.students || [];
            setStudents(rawList);

            // Check if studentId was passed via URL query
            const queryParams = new URLSearchParams(location.search);
            const studentIdFromUrl = queryParams.get('studentId');
            if (studentIdFromUrl) {
                setSelectedStudent(studentIdFromUrl);
                await fetchTunggakan(studentIdFromUrl);
            }
        } catch (error) {
            console.error('Error initializing QR Payment:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTunggakan = async (studentId) => {
        if (!studentId) {
            setTunggakanData(null);
            return;
        }

        try {
            const response = await api.get(`/payments/tunggakan/${studentId}`);
            if (response.data?.success) {
                setTunggakanData(response.data);
                const suggestedAmount = response.data.tunggakan > 0 ? response.data.tunggakan : 2000;
                setAmount(suggestedAmount.toString());
            }
        } catch (error) {
            console.error('Error fetching tunggakan:', error);
        }
    };

    const handleStudentChange = async (e) => {
        const studentId = e.target.value;
        setSelectedStudent(studentId);
        await fetchTunggakan(studentId);
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setMessage('Ukuran file maksimal 5MB');
                return;
            }
            setProofImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            setMessage('');
        }
    };

    const copyAccountNumber = (accountNumber) => {
        if (!accountNumber) return;
        navigator.clipboard.writeText(accountNumber);
        setCopiedAccount(true);
        setTimeout(() => setCopiedAccount(false), 2000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (!selectedStudent || !amount || !proofImage) {
            setMessage('Mohon pilih siswa, nominal, dan unggah foto bukti transfer.');
            return;
        }

        const formData = new FormData();
        formData.append('studentId', selectedStudent);
        formData.append('amount', amount);
        formData.append('notes', notes);
        formData.append('proofImage', proofImage);

        setSubmitting(true);

        try {
            // Note: Let browser set Content-Type with boundary for multipart/form-data
            const response = await api.post('/qr-payment/confirm', formData, {
                headers: {
                    'Content-Type': undefined,
                },
            });

            if (response.data?.success) {
                setSubmitSuccess(true);
            } else {
                setMessage(response.data?.message || 'Gagal mengirim konfirmasi');
            }
        } catch (error) {
            const errMsg =
                error.response?.data?.message ||
                error.response?.data?.error ||
                (error.response?.status === 413
                    ? 'Ukuran foto terlalu besar. Maksimal 5MB.'
                    : error.message || 'Gagal mengirim konfirmasi pembayaran.');
            setMessage(errMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(val || 0);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] flex items-center justify-center transition-colors">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                    <p className="text-slate-600 dark:text-white/60 text-xs tracking-wider">Memuat Pembayaran QRIS...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-white selection:bg-indigo-500/30 py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-200">
            {/* Ambient Background Orbs */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-40 dark:opacity-100 transition-opacity">
                <div className="absolute top-0 right-[20%] w-[500px] h-[400px] bg-indigo-500/15 blur-[130px] rounded-full animate-aurora" />
                <div className="absolute bottom-[10%] left-[10%] w-[450px] h-[350px] bg-violet-500/15 blur-[120px] rounded-full animate-aurora-delayed" />
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                {/* Header Navigation */}
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-white/[0.08]">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white transition-all bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                        <span>Kembali ke Dashboard</span>
                    </button>

                    <div className="flex items-center gap-3">
                        {/* Theme Toggle Button */}
                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-amber-400 transition cursor-pointer"
                            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                        >
                            {theme === 'dark' ? (
                                <Sun className="w-4 h-4 text-amber-400" />
                            ) : (
                                <Moon className="w-4 h-4 text-indigo-600" />
                            )}
                        </button>

                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md">
                                <ShieldCheck className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-xs font-semibold text-slate-700 dark:text-white/80">Kas {config.className || 'Kelas'}</span>
                        </div>
                    </div>
                </div>

                {submitSuccess ? (
                    <div className="glass-cyber-card rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto border border-emerald-500/30 animate-scale-pop shadow-2xl">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/10">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                            Konfirmasi Terkirim!
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-white/60 leading-relaxed mb-6">
                            Bukti pembayaran kas sebesar <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(amount)}</strong> berhasil dikirim.
                            Bendahara kelas akan memverifikasi dalam waktu singkat.
                        </p>

                        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-left text-xs space-y-2 mb-6 text-slate-700 dark:text-white/70">
                            <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-white/40">Status:</span>
                                <span className="text-amber-600 dark:text-amber-300 font-semibold flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" /> Menunggu Verifikasi
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-white/40">Metode:</span>
                                <span className="font-medium text-slate-800 dark:text-white">QRIS / Transfer Bank</span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => {
                                    setSubmitSuccess(false);
                                    setSelectedStudent('');
                                    setAmount('');
                                    setTunggakanData(null);
                                    setProofImage(null);
                                    setPreviewUrl('');
                                    setNotes('');
                                    setMessage('');
                                }}
                                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-xs font-semibold text-slate-700 dark:text-white border border-slate-200 dark:border-white/10 transition cursor-pointer"
                            >
                                Kirim Konfirmasi Lain
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                className="btn-cyber-primary px-5 py-2.5 rounded-xl text-xs font-semibold shadow-lg cursor-pointer"
                            >
                                Kembali ke Beranda
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-10">
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 text-slate-900 dark:text-white">
                                Pembayaran Kas via <span className="text-cyber-gradient">QRIS & Transfer</span>
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-white/50 max-w-md mx-auto">
                                Scan QR code resmi kas kelas, selesaikan transfer, lalu unggah bukti bayar untuk diverifikasi oleh bendahara.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                            {/* Left Column: QR Code Card */}
                            <div className="md:col-span-5 glass-cyber-card rounded-3xl p-6 border border-slate-200 dark:border-white/[0.1] text-center">
                                <h2 className="text-sm font-bold text-slate-800 dark:text-white/90 uppercase tracking-wider mb-4 flex items-center justify-center gap-2">
                                    <QrCode className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                                    <span>QRIS Kas {config.className || 'Kelas'}</span>
                                </h2>

                                {activeQR ? (
                                    <>
                                        <div className="bg-white p-3.5 rounded-2xl inline-block shadow-xl border border-slate-100 dark:border-transparent mb-3">
                                            <img
                                                src={activeQR.imageUrl}
                                                alt="QR Code Kas"
                                                className="w-56 h-56 object-contain rounded-lg"
                                            />
                                        </div>

                                        {activeQR.paymentMethod === 'qris' && (
                                            <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <span>Mendukung Semua Bank & E-Wallet</span>
                                            </div>
                                        )}

                                        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] text-left text-xs space-y-2.5">
                                            <div className="flex justify-between">
                                                <span className="text-slate-500 dark:text-white/40">
                                                    {activeQR.paymentMethod === 'qris' ? 'Nama Merchant:' : 'Atas Nama:'}
                                                </span>
                                                <span className="font-semibold text-slate-900 dark:text-white">{activeQR.accountName}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500 dark:text-white/40">Metode:</span>
                                                <span className="font-medium text-indigo-600 dark:text-indigo-400 uppercase">
                                                    {activeQR.paymentMethod === 'qris' ? 'QRIS Universal' : activeQR.paymentMethod}
                                                </span>
                                            </div>
                                            {activeQR.accountNumber && (
                                                <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-white/[0.06]">
                                                    <span className="text-slate-500 dark:text-white/40">
                                                        {activeQR.paymentMethod === 'qris' ? 'NMID / No. Alternatif:' : 'No. Rekening:'}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyAccountNumber(activeQR.accountNumber)}
                                                        className="flex items-center gap-1.5 font-mono text-slate-800 dark:text-white bg-white dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] px-2 py-1 rounded border border-slate-200 dark:border-white/10 transition cursor-pointer"
                                                    >
                                                        <span>{activeQR.accountNumber}</span>
                                                        {copiedAccount ? (
                                                            <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                                                        ) : (
                                                            <Copy className="w-3.5 h-3.5 text-slate-400 dark:text-white/40" />
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="py-12 px-4 rounded-2xl bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06]">
                                        <AlertCircle className="w-10 h-10 text-amber-500 dark:text-amber-400/60 mx-auto mb-3" />
                                        <p className="text-sm font-semibold text-slate-800 dark:text-white/80">QR Code Belum Diaktifkan</p>
                                        <p className="text-xs text-slate-500 dark:text-white/40 mt-1">
                                            Bendahara belum mengunggah QR Code aktif. Anda dapat mentransfer ke rekening yang tersedia di bawah.
                                        </p>
                                    </div>
                                )}

                                {config.paymentAccounts && config.paymentAccounts.length > 0 && (
                                    <div className="mt-4 p-3.5 rounded-2xl bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] text-left">
                                        <p className="text-[10px] font-semibold text-slate-500 dark:text-white/40 mb-2 uppercase tracking-wider">
                                            Rekening Transfer Alternatif
                                        </p>
                                        <div className="space-y-1.5">
                                            {config.paymentAccounts.map((acc, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-xs">
                                                    <span className="text-slate-700 dark:text-white/60 font-medium">{acc.bankName}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyAccountNumber(acc.accountNumber)}
                                                        className="font-mono text-slate-800 dark:text-white/90 hover:text-slate-950 dark:hover:text-white bg-white dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] px-2 py-0.5 rounded text-[11px] flex items-center gap-1 border border-slate-200 dark:border-white/10 transition cursor-pointer"
                                                        title="Salin No Rekening"
                                                    >
                                                        <span>{acc.accountNumber}</span>
                                                        <span className="text-[10px] text-slate-500 dark:text-white/40">({acc.accountHolder})</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Confirmation Form */}
                            <div className="md:col-span-7 glass-cyber-card rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-white/[0.1]">
                                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                                    <span>Formulir Konfirmasi Pembayaran</span>
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-white/40 mb-6">
                                    Pilih nama kamu dan sertakan tangkapan layar bukti transfer.
                                </p>

                                {message && (
                                    <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0" />
                                        <span>{message}</span>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Student Dropdown */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-white/70 mb-1.5">
                                            Nama Siswa / Mahasiswa <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={selectedStudent}
                                            onChange={handleStudentChange}
                                            className="input-cyber-glass w-full px-4 py-3 rounded-xl text-sm"
                                            required
                                        >
                                            <option value="" className="bg-white dark:bg-zinc-900 text-slate-500 dark:text-white/50">
                                                -- Pilih Nama Kamu --
                                            </option>
                                            {students.map((s) => (
                                                <option key={s._id} value={s._id} className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">
                                                    #{s.absen || '-'} {s.name} {s.nickname ? `(${s.nickname})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Live Tunggakan Badge if Student Selected */}
                                    {tunggakanData && (
                                        <div
                                            className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                                                tunggakanData.isLunas
                                                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300'
                                                    : 'bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {tunggakanData.isLunas ? (
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                                                ) : (
                                                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                                                )}
                                                <div>
                                                    <span className="font-semibold">
                                                        {tunggakanData.isLunas
                                                            ? `Lunas sampai Minggu ${tunggakanData.totalWeeks}`
                                                            : `Tunggakan ${tunggakanData.weeksLate} Minggu`}
                                                    </span>
                                                    <p className="text-[11px] opacity-70">
                                                        Total terbayar sebelumnya: {formatCurrency(tunggakanData.totalPaid)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right font-bold text-sm">
                                                {formatCurrency(tunggakanData.tunggakan)}
                                            </div>
                                        </div>
                                    )}

                                    {/* Amount Input */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-white/70 mb-1.5">
                                            Nominal Ditransfer (Rp) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder={String(config.weeklyAmount || 2000)}
                                            className="input-cyber-glass w-full px-4 py-3 rounded-xl text-sm font-mono"
                                            required
                                            min="500"
                                        />
                                    </div>

                                    {/* File Upload Dropzone */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-white/70 mb-1.5">
                                            Foto / Screenshot Bukti Transfer <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative border-2 border-dashed border-slate-300 dark:border-white/[0.15] hover:border-indigo-500/50 rounded-2xl p-4 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-white/[0.015]">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                required
                                            />
                                            {previewUrl ? (
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={previewUrl}
                                                        alt="Bukti Transfer"
                                                        className="w-16 h-16 object-cover rounded-xl border border-slate-200 dark:border-white/[0.1]"
                                                    />
                                                    <div className="text-left text-xs">
                                                        <p className="font-semibold text-slate-900 dark:text-white">Bukti Terpilih</p>
                                                        <p className="text-slate-500 dark:text-white/40">Klik area ini jika ingin mengganti foto</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-1.5 py-3">
                                                    <UploadCloud className="w-7 h-7 text-indigo-500 dark:text-indigo-400" />
                                                    <p className="text-xs font-medium text-slate-700 dark:text-white/80">
                                                        Klik atau drag file bukti transfer ke sini
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 dark:text-white/30">JPG, JPEG, PNG, WEBP (Maksimal 5MB)</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Notes Input */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-white/70 mb-1.5">
                                            Catatan / Keterangan (Opsional)
                                        </label>
                                        <input
                                            type="text"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Contoh: Kas via Dana Budi"
                                            className="input-cyber-glass w-full px-4 py-2.5 rounded-xl text-sm"
                                        />
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="btn-cyber-primary w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                                    >
                                        {submitting ? (
                                            <>
                                                <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                                                <span>Mengirim Bukti...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4" />
                                                <span>Kirim Konfirmasi Pembayaran</span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default QRPayment;
