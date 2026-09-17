import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShieldCheck,
    Building,
    Wallet,
    CreditCard,
    User,
    Lock,
    Eye,
    EyeOff,
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    Plus,
    Trash2,
    Sparkles,
    AlertCircle,
    Send,
    Users,
    Sun,
    Moon,
    FileText,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useAppConfig } from '../../context/ConfigContext';
import { useTheme } from '../../context/ThemeContext';

const PRESET_PROVIDERS = [
    { type: 'bank', name: 'Bank BCA' },
    { type: 'bank', name: 'Bank Mandiri' },
    { type: 'bank', name: 'Bank BRI' },
    { type: 'bank', name: 'Bank BNI' },
    { type: 'bank', name: 'Bank BSI' },
    { type: 'bank', name: 'SeaBank' },
    { type: 'bank', name: 'Bank Jago' },
    { type: 'ewallet', name: 'GoPay' },
    { type: 'ewallet', name: 'DANA' },
    { type: 'ewallet', name: 'ShopeePay' },
    { type: 'ewallet', name: 'OVO' },
    { type: 'other', name: 'Lainnya' },
];

const SetupWizard = () => {
    const navigate = useNavigate();
    const { refreshConfig } = useAppConfig();
    const { theme, toggleTheme } = useTheme();

    // Step navigation: 1 to 6
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Step 1: Profil Kelas
    const [className, setClassName] = useState('');
    const [institutionName, setInstitutionName] = useState('');
    const [semesterName, setSemesterName] = useState('Semester Ganjil 2025/2026');
    const [description, setDescription] = useState('Sistem Transparansi & Manajemen Kas Terbuka');

    // Step 2: Aturan Kas
    const [weeklyAmount, setWeeklyAmount] = useState(2000);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [lateThreshold, setLateThreshold] = useState(4);

    // Step 3: Rekening Pembayaran
    const [bankAccounts, setBankAccounts] = useState([
        {
            provider: 'DANA',
            accountNumber: '',
            accountHolder: '',
            isDefault: true,
        },
    ]);
    const [paymentNotes, setPaymentNotes] = useState('Mohon sertakan bukti transfer atau konfirmasi ke bendahara setelah membayar.');

    // Step 4: Superadmin
    const [adminFullName, setAdminFullName] = useState('');
    const [adminUsername, setAdminUsername] = useState('bendahara');
    const [adminPassword, setAdminPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Step 5: WhatsApp Fonnte (Opsional)
    const [enableWhatsApp, setEnableWhatsApp] = useState(false);
    const [fonnteToken, setFonnteToken] = useState('');
    const [targetGroupId, setTargetGroupId] = useState('');

    // Step 6: Siswa Awal (Opsional)
    const [enableInitialStudents, setEnableInitialStudents] = useState(false);
    const [studentsText, setStudentsText] = useState('');

    // Currency Formatter
    const formatRp = (val) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(val);

    // Bank account handlers
    const addAccount = () => {
        setBankAccounts([
            ...bankAccounts,
            { provider: 'Bank BCA', accountNumber: '', accountHolder: '', isDefault: false },
        ]);
    };

    const removeAccount = (index) => {
        setBankAccounts(bankAccounts.filter((_, i) => i !== index));
    };

    const updateAccount = (index, field, value) => {
        const updated = [...bankAccounts];
        updated[index][field] = value;
        setBankAccounts(updated);
    };

    // Parse students text (format: "Absen, Nama, NoWA" or 1 name per line)
    const parseStudentsList = () => {
        if (!enableInitialStudents || !studentsText.trim()) return [];
        return studentsText
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line, idx) => {
                const parts = line.split(/[,;\t]/).map((p) => p.trim());
                if (parts.length >= 2 && !isNaN(Number(parts[0]))) {
                    return {
                        absen: Number(parts[0]),
                        name: parts[1],
                        phoneNumber: parts[2] || '',
                    };
                }
                return {
                    absen: idx + 1,
                    name: line,
                    phoneNumber: '',
                };
            });
    };

    // Step Validation
    const validateStep = (step) => {
        setError('');
        if (step === 1) {
            if (!className.trim()) {
                setError('Nama kelas atau organisasi wajib diisi!');
                return false;
            }
        } else if (step === 2) {
            if (!weeklyAmount || weeklyAmount < 500) {
                setError('Nominal kas mingguan minimal Rp 500.');
                return false;
            }
        } else if (step === 3) {
            const validAccounts = bankAccounts.filter(
                (a) => a.accountNumber.trim() && a.accountHolder.trim()
            );
            if (bankAccounts.length > 0 && validAccounts.length === 0) {
                setError('Harap lengkapi nomor rekening dan nama pemilik akun atau hapus baris yang kosong.');
                return false;
            }
        } else if (step === 4) {
            if (!adminFullName.trim() || !adminUsername.trim()) {
                setError('Nama lengkap dan username admin wajib diisi!');
                return false;
            }
            if (adminPassword.length < 6) {
                setError('Password minimal harus 6 karakter.');
                return false;
            }
            if (adminPassword !== confirmPassword) {
                setError('Konfirmasi password tidak cocok dengan password yang dimasukkan.');
                return false;
            }
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep((prev) => Math.min(prev + 1, 6));
        }
    };

    const handleBack = () => {
        setError('');
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    };

    // Final Submit
    const handleCompleteSetup = async () => {
        if (!validateStep(4)) {
            setCurrentStep(4);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const initialStudents = parseStudentsList();
            const payload = {
                adminFullName: adminFullName.trim(),
                adminUsername: adminUsername.trim(),
                adminPassword,
                className: className.trim(),
                institutionName: institutionName.trim(),
                semesterName: semesterName.trim(),
                description: description.trim(),
                weeklyAmount: Number(weeklyAmount) || 2000,
                startDate,
                lateThreshold: Number(lateThreshold) || 4,
                bankAccounts: bankAccounts
                    .filter((a) => a.accountNumber.trim())
                    .map((a) => ({
                        bankName: a.provider,
                        accountNumber: a.accountNumber.trim(),
                        accountHolder: a.accountHolder.trim(),
                    })),
                paymentNotes: paymentNotes.trim(),
                fonnteToken: enableWhatsApp ? fonnteToken.trim() : '',
                targetGroupId: enableWhatsApp ? targetGroupId.trim() : '',
                initialStudents,
            };

            const response = await api.post('/setup/initialize', payload);

            if (response.data?.success) {
                // Store token & user to auto-login
                if (response.data.token && response.data.user) {
                    localStorage.setItem('token', response.data.token);
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                }

                // Refresh app config
                await refreshConfig();

                // Redirect to dashboard
                navigate('/app/dashboard');
            } else {
                setError(response.data?.message || 'Gagal menyelesaikan setup.');
            }
        } catch (err) {
            console.error('Setup submission failed:', err);
            setError(
                err.response?.data?.message ||
                err.message ||
                'Terjadi kesalahan saat menyimpan setup.'
            );
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { id: 1, title: 'Profil Kelas', desc: 'Identitas & Lembaga' },
        { id: 2, title: 'Aturan Kas', desc: 'Nominal & Jadwal' },
        { id: 3, title: 'Rekening', desc: 'Metode Pembayaran' },
        { id: 4, title: 'Akun Bendahara', desc: 'Akses Superadmin' },
        { id: 5, title: 'WhatsApp & Siswa', desc: 'Integrasi & Data Awal' },
        { id: 6, title: 'Konfirmasi', desc: 'Review & Selesai' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#09090b] dark:text-white transition-colors duration-200 relative overflow-hidden flex flex-col justify-between">
            {/* Ambient Cyber Aurora */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-[15%] left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-indigo-600/15 via-violet-600/10 to-transparent blur-3xl animate-aurora" />
                <div className="absolute top-[40%] -right-[10%] w-[450px] h-[450px] rounded-full bg-gradient-to-br from-cyan-600/10 via-teal-600/10 to-transparent blur-3xl animate-aurora" style={{ animationDelay: '-6s' }} />
            </div>

            {/* Top Navigation Bar */}
            <header className="relative z-10 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2">
                            <span>Class-Ledger</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 font-bold uppercase tracking-wider">
                                Setup Wizard
                            </span>
                        </h1>
                        <p className="text-[11px] text-slate-500 dark:text-white/50">
                            Konfigurasi awal mandiri sistem kas kelas & organisasi
                        </p>
                    </div>
                </div>

                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-amber-300 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all"
                    title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                >
                    {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                </button>
            </header>

            {/* Main Setup Content Area */}
            <main className="relative z-10 max-w-3xl w-full mx-auto px-4 py-8 flex-1 flex flex-col justify-center">
                {/* Steps Progress Indicator */}
                <div className="mb-8">
                    <div className="grid grid-cols-6 gap-2">
                        {steps.map((s) => {
                            const isDone = s.id < currentStep;
                            const isCurrent = s.id === currentStep;
                            return (
                                <div key={s.id} className="flex flex-col gap-1.5">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-300 ${
                                            isDone
                                                ? 'bg-emerald-500 shadow-sm shadow-emerald-500/30'
                                                : isCurrent
                                                ? 'bg-gradient-to-r from-indigo-500 to-violet-500 shadow-md shadow-indigo-500/40'
                                                : 'bg-slate-200 dark:bg-white/10'
                                        }`}
                                    />
                                    <span
                                        className={`hidden sm:block text-[11px] font-semibold truncate ${
                                            isCurrent
                                                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                                                : isDone
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-slate-400 dark:text-white/30'
                                        }`}
                                    >
                                        {s.title}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 flex items-start gap-3 animate-slide-down">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div className="text-xs sm:text-sm font-medium">{error}</div>
                    </div>
                )}

                {/* Step Cards */}
                <div className="glass-cyber-card rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-white/10 shadow-2xl shadow-black/10 dark:shadow-black/40">
                    {/* STEP 1: Profil Kelas */}
                    {currentStep === 1 && (
                        <div className="space-y-5 animate-fade-in">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                    <Building className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                                        Identitas Kelas & Organisasi
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-white/50">
                                        Tentukan nama kelas yang akan ditampilkan di seluruh aplikasi
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-white/80 mb-1.5">
                                    Nama Kelas / Organisasi <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={className}
                                    onChange={(e) => setClassName(e.target.value)}
                                    placeholder="Contoh: 12 Rekayasa Perangkat Lunak 1, TRIFORCE, dll."
                                    className="w-full px-4 py-3 rounded-xl input-cyber-glass text-sm"
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-white/80 mb-1.5">
                                        Nama Sekolah / Kampus (Opsional)
                                    </label>
                                    <input
                                        type="text"
                                        value={institutionName}
                                        onChange={(e) => setInstitutionName(e.target.value)}
                                        placeholder="Contoh: SMK Negeri 1, Institut Teknologi..."
                                        className="w-full px-4 py-2.5 rounded-xl input-cyber-glass text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-white/80 mb-1.5">
                                        Nama Semester / Periode
                                    </label>
                                    <input
                                        type="text"
                                        value={semesterName}
                                        onChange={(e) => setSemesterName(e.target.value)}
                                        placeholder="Contoh: Semester Ganjil 2025/2026"
                                        className="w-full px-4 py-2.5 rounded-xl input-cyber-glass text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-white/80 mb-1.5">
                                    Deskripsi Singkat / Slogan Kelas
                                </label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Contoh: Sistem Transparansi & Kas Real-Time"
                                    className="w-full px-4 py-2.5 rounded-xl input-cyber-glass text-sm"
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Aturan Kas & Finansial */}
                    {currentStep === 2 && (
                        <div className="space-y-5 animate-fade-in">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    <Wallet className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                                        Aturan Iuran Kas Mingguan
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-white/50">
                                        Atur nominal kas yang ditagih ke setiap siswa setiap minggunya
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-white/80 mb-1.5">
                                    Nominal Iuran Kas Per Siswa / Minggu <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 dark:text-white/40">
                                        Rp
                                    </span>
                                    <input
                                        type="number"
                                        value={weeklyAmount}
                                        onChange={(e) => setWeeklyAmount(Number(e.target.value))}
                                        step="500"
                                        min="500"
                                        className="w-full pl-12 pr-4 py-3 rounded-xl input-cyber-glass font-mono font-bold text-base sm:text-lg"
                                    />
                                </div>

                                {/* Quick Presets */}
                                <div className="flex items-center gap-2 mt-2.5">
                                    <span className="text-xs text-slate-500 dark:text-white/40">Pilih Cepat:</span>
                                    {[1000, 2000, 5000, 10000].map((amt) => (
                                        <button
                                            key={amt}
                                            type="button"
                                            onClick={() => setWeeklyAmount(amt)}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                                weeklyAmount === amt
                                                    ? 'bg-emerald-600 text-white shadow-sm'
                                                    : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-white/60 hover:bg-slate-200'
                                            }`}
                                        >
                                            {formatRp(amt)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-white/80 mb-1.5">
                                        Tanggal Mulai Kas (Minggu ke-1)
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl input-cyber-glass text-sm font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-white/80 mb-1.5">
                                        Batas Tunggakan Telat (Minggu)
                                    </label>
                                    <input
                                        type="number"
                                        value={lateThreshold}
                                        onChange={(e) => setLateThreshold(Number(e.target.value))}
                                        min="1"
                                        max="20"
                                        className="w-full px-4 py-2.5 rounded-xl input-cyber-glass text-sm font-mono"
                                    />
                                    <p className="text-[11px] text-slate-500 dark:text-white/40 mt-1">
                                        Siswa berstatus telat jika tunggakan ≥ {lateThreshold} minggu ({formatRp(lateThreshold * weeklyAmount)})
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Rekening & Metode Pembayaran */}
                    {currentStep === 3 && (
                        <div className="space-y-5 animate-fade-in">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                                        <CreditCard className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                                            Rekening & Metode Pembayaran
                                        </h2>
                                        <p className="text-xs text-slate-500 dark:text-white/50">
                                            Rekening bank atau e-wallet tempat siswa mentransfer uang kas
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={addAccount}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 text-xs font-bold hover:scale-105 transition-all"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Tambah Rekening</span>
                                </button>
                            </div>

                            {/* Accounts List */}
                            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                                {bankAccounts.map((acc, index) => (
                                    <div
                                        key={index}
                                        className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
                                    >
                                        <select
                                            value={acc.provider}
                                            onChange={(e) => updateAccount(index, 'provider', e.target.value)}
                                            className="px-3 py-2 rounded-xl input-cyber-glass text-xs font-semibold sm:w-36"
                                        >
                                            {PRESET_PROVIDERS.map((p) => (
                                                <option key={p.name} value={p.name} className="dark:bg-zinc-900">
                                                    {p.name}
                                                </option>
                                            ))}
                                        </select>

                                        <input
                                            type="text"
                                            placeholder="Nomor Rekening / No HP"
                                            value={acc.accountNumber}
                                            onChange={(e) => updateAccount(index, 'accountNumber', e.target.value)}
                                            className="px-3 py-2 rounded-xl input-cyber-glass text-xs font-mono flex-1"
                                        />

                                        <input
                                            type="text"
                                            placeholder="Atas Nama (Contoh: Budi)"
                                            value={acc.accountHolder}
                                            onChange={(e) => updateAccount(index, 'accountHolder', e.target.value)}
                                            className="px-3 py-2 rounded-xl input-cyber-glass text-xs flex-1"
                                        />

                                        {bankAccounts.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeAccount(index)}
                                                className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors self-end sm:self-center"
                                                title="Hapus Rekening"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-white/80 mb-1.5">
                                    Catatan / Petunjuk Tambahan Pembayaran
                                </label>
                                <textarea
                                    rows={2}
                                    value={paymentNotes}
                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                    placeholder="Contoh: Harap simpan bukti transfer untuk verifikasi bendahara."
                                    className="w-full px-4 py-2 rounded-xl input-cyber-glass text-xs"
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Akun Superadmin Bendahara */}
                    {currentStep === 4 && (
                        <div className="space-y-5 animate-fade-in">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                                        Akun Superadmin Bendahara
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-white/50">
                                        Akun utama untuk mengelola kas, mencatat transaksi, dan mengubah pengaturan
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-white/80 mb-1.5">
                                        Nama Lengkap Bendahara <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={adminFullName}
                                        onChange={(e) => setAdminFullName(e.target.value)}
                                        placeholder="Contoh: Siti Rahmawati"
                                        className="w-full px-4 py-2.5 rounded-xl input-cyber-glass text-sm"
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-white/80 mb-1.5">
                                        Username Login <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={adminUsername}
                                        onChange={(e) => setAdminUsername(e.target.value)}
                                        placeholder="Contoh: bendahara"
                                        className="w-full px-4 py-2.5 rounded-xl input-cyber-glass text-sm font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-white/80 mb-1.5">
                                        Password <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={adminPassword}
                                            onChange={(e) => setAdminPassword(e.target.value)}
                                            placeholder="Minimal 6 karakter"
                                            className="w-full px-4 pr-10 py-2.5 rounded-xl input-cyber-glass text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40 hover:text-slate-600"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-white/80 mb-1.5">
                                        Konfirmasi Password <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Ulangi password di atas"
                                        className="w-full px-4 py-2.5 rounded-xl input-cyber-glass text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 5: WhatsApp Fonnte & Siswa Awal */}
                    {currentStep === 5 && (
                        <div className="space-y-6 animate-fade-in">
                            {/* WhatsApp Section */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                            <Send className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                                                Bot WhatsApp Fonnte (Opsional)
                                            </h2>
                                            <p className="text-xs text-slate-500 dark:text-white/50">
                                                Kirim reminder tunggakan otomatis dan broadcast laporan ke grup WA
                                            </p>
                                        </div>
                                    </div>

                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={enableWhatsApp}
                                            onChange={(e) => setEnableWhatsApp(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                </div>

                                {enableWhatsApp && (
                                    <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-3 animate-slide-down">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 dark:text-white/80 mb-1">
                                                Fonnte API Token
                                            </label>
                                            <input
                                                type="text"
                                                value={fonnteToken}
                                                onChange={(e) => setFonnteToken(e.target.value)}
                                                placeholder="Token dari fonnte.com"
                                                className="w-full px-3 py-2 rounded-xl input-cyber-glass text-xs font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 dark:text-white/80 mb-1">
                                                ID WhatsApp Grup Kelas Target
                                            </label>
                                            <input
                                                type="text"
                                                value={targetGroupId}
                                                onChange={(e) => setTargetGroupId(e.target.value)}
                                                placeholder="Contoh: 120363xxxxxx@g.us"
                                                className="w-full px-3 py-2 rounded-xl input-cyber-glass text-xs font-mono"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <hr className="border-slate-200 dark:border-white/10" />

                            {/* Initial Students Section */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                            <Users className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                                                Data Siswa Awal (Opsional)
                                            </h2>
                                            <p className="text-xs text-slate-500 dark:text-white/50">
                                                Input cepat daftar siswa atau lewati untuk ditambah nanti
                                            </p>
                                        </div>
                                    </div>

                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={enableInitialStudents}
                                            onChange={(e) => setEnableInitialStudents(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                                    </label>
                                </div>

                                {enableInitialStudents && (
                                    <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-2 animate-slide-down">
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-white/80">
                                            Tempel Nama Siswa (1 nama per baris atau format: No, Nama, NoWA):
                                        </label>
                                        <textarea
                                            rows={5}
                                            value={studentsText}
                                            onChange={(e) => setStudentsText(e.target.value)}
                                            placeholder={`1, Ahmad Fauzi, 08123456789\n2, Budi Santoso, 08567890123\n3, Citra Lestari`}
                                            className="w-full p-3 rounded-xl input-cyber-glass text-xs font-mono"
                                        />
                                        <p className="text-[11px] text-slate-500 dark:text-white/40">
                                            Terdeteksi: <strong>{parseStudentsList().length}</strong> siswa
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 6: Konfirmasi & Review */}
                    {currentStep === 6 && (
                        <div className="space-y-5 animate-fade-in">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-pink-500 text-white shadow-lg shadow-indigo-500/25">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                                        Ringkasan & Peluncuran
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-white/50">
                                        Periksa kembali ringkasan konfigurasi sebelum mengaktifkan sistem
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-2">
                                    <p className="text-[11px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider">
                                        Identitas Kelas
                                    </p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{className}</p>
                                    {institutionName && <p className="text-slate-600 dark:text-white/70">{institutionName}</p>}
                                    <p className="text-slate-500 dark:text-white/50">{semesterName}</p>
                                </div>

                                <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-2">
                                    <p className="text-[11px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider">
                                        Aturan Kas
                                    </p>
                                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                                        {formatRp(weeklyAmount)} / minggu
                                    </p>
                                    <p className="text-slate-600 dark:text-white/70">Mulai: {startDate}</p>
                                    <p className="text-slate-500 dark:text-white/50">Batas Telat: {lateThreshold} minggu</p>
                                </div>

                                <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-2">
                                    <p className="text-[11px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider">
                                        Metode Pembayaran
                                    </p>
                                    <p className="text-slate-800 dark:text-white font-medium">
                                        {bankAccounts.filter((a) => a.accountNumber).length} rekening terdaftar
                                    </p>
                                    {bankAccounts
                                        .filter((a) => a.accountNumber)
                                        .map((acc, idx) => (
                                            <p key={idx} className="text-[11px] text-slate-500 dark:text-white/50 font-mono truncate">
                                                • {acc.provider}: {acc.accountNumber} ({acc.accountHolder})
                                            </p>
                                        ))}
                                </div>

                                <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-2">
                                    <p className="text-[11px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider">
                                        Superadmin & Siswa
                                    </p>
                                    <p className="text-slate-800 dark:text-white font-bold">{adminFullName}</p>
                                    <p className="text-[11px] text-slate-500 dark:text-white/50 font-mono">Username: @{adminUsername}</p>
                                    <p className="text-slate-600 dark:text-white/70">
                                        {enableInitialStudents ? `${parseStudentsList().length} siswa awal` : 'Tanpa siswa awal (diisi nanti)'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons Footer */}
                    <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-200 dark:border-white/10">
                        {currentStep > 1 ? (
                            <button
                                type="button"
                                onClick={handleBack}
                                disabled={loading}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/[0.08] text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Kembali</span>
                            </button>
                        ) : (
                            <div />
                        )}

                        {currentStep < 6 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 transition-all hover:scale-105 active:scale-95"
                            >
                                <span>Lanjut</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleCompleteSetup}
                                disabled={loading}
                                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white text-sm sm:text-base font-black flex items-center gap-2 shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Menyiapkan Sistem...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        <span>Selesaikan Setup & Buka Dashboard</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer Branding */}
            <footer className="relative z-10 py-4 text-center text-xs text-slate-400 dark:text-white/30 border-t border-slate-200/60 dark:border-white/[0.06]">
                Class-Ledger • Open-Source Turnkey Class Financial Management
            </footer>
        </div>
    );
};

export default SetupWizard;
