import React, { useState, useEffect } from 'react';
import {
    Settings as SettingsIcon,
    Save,
    Calendar,
    DollarSign,
    RefreshCw,
    Pause,
    Play,
    BookOpen,
    School,
    CreditCard,
    MessageCircle,
    Plus,
    Trash2,
    Shield,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';
import { settingsAPI } from '../../services/api';

const Settings = ({ onStartDateChange, currentStartDate, onWeekChange, onConfigUpdated }) => {
    const [activeSubTab, setActiveSubTab] = useState('profile');

    // Profile Settings
    const [className, setClassName] = useState('');
    const [institutionName, setInstitutionName] = useState('');
    const [classDescription, setClassDescription] = useState('');

    // Rules & Semester
    const [startDate, setStartDate] = useState('');
    const [weeklyAmount, setWeeklyAmount] = useState(2000);
    const [lateThreshold, setLateThreshold] = useState(4);
    const [semesterStatus, setSemesterStatus] = useState('active');
    const [semesterName, setSemesterName] = useState('');
    const [pausedWeek, setPausedWeek] = useState(null);

    // Payment Accounts
    const [paymentAccounts, setPaymentAccounts] = useState([]);
    const [paymentNotes, setPaymentNotes] = useState('');

    // WhatsApp Bot Integration
    const [fonnteToken, setFonnteToken] = useState('');
    const [whatsappGroupId, setWhatsappGroupId] = useState('');
    const [adminPhone, setAdminPhone] = useState('');

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    useEffect(() => {
        if (currentStartDate) {
            setStartDate(formatDateForInput(currentStartDate));
        }
    }, [currentStartDate]);

    const formatDateForInput = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const loadSettings = async () => {
        setLoading(true);
        try {
            const [
                startDateRes,
                amountRes,
                thresholdRes,
                classNameRes,
                instRes,
                descRes,
                semesterStatusRes,
                semesterNameRes,
                pausedWeekRes,
                accountsRes,
                notesRes,
                fonnteRes,
                groupRes,
                adminPhoneRes,
            ] = await Promise.all([
                settingsAPI.get('start_date').catch(() => null),
                settingsAPI.get('weekly_amount').catch(() => null),
                settingsAPI.get('late_threshold').catch(() => null),
                settingsAPI.get('class_name').catch(() => null),
                settingsAPI.get('institution_name').catch(() => null),
                settingsAPI.get('class_description').catch(() => null),
                settingsAPI.get('semester_status').catch(() => null),
                settingsAPI.get('semester_name').catch(() => null),
                settingsAPI.get('paused_week').catch(() => null),
                settingsAPI.get('payment_accounts').catch(() => null),
                settingsAPI.get('payment_notes').catch(() => null),
                settingsAPI.get('fonnte_token').catch(() => null),
                settingsAPI.get('whatsapp_group_id').catch(() => null),
                settingsAPI.get('admin_phone').catch(() => null),
            ]);

            if (startDateRes?.data?.value) setStartDate(formatDateForInput(startDateRes.data.value));
            if (amountRes?.data?.value) setWeeklyAmount(Number(amountRes.data.value));
            if (thresholdRes?.data?.value) setLateThreshold(Number(thresholdRes.data.value));
            if (classNameRes?.data?.value) setClassName(classNameRes.data.value);
            if (instRes?.data?.value) setInstitutionName(instRes.data.value);
            if (descRes?.data?.value) setClassDescription(descRes.data.value);
            if (semesterStatusRes?.data?.value) setSemesterStatus(semesterStatusRes.data.value);
            if (semesterNameRes?.data?.value) setSemesterName(semesterNameRes.data.value);
            if (pausedWeekRes?.data?.value) setPausedWeek(pausedWeekRes.data.value);

            if (accountsRes?.data?.value) {
                let parsed = accountsRes.data.value;
                if (typeof parsed === 'string') {
                    try { parsed = JSON.parse(parsed); } catch { parsed = []; }
                }
                setPaymentAccounts(Array.isArray(parsed) ? parsed : []);
            }
            if (notesRes?.data?.value) setPaymentNotes(notesRes.data.value);

            if (fonnteRes?.data?.value) setFonnteToken(fonnteRes.data.value);
            if (groupRes?.data?.value) setWhatsappGroupId(groupRes.data.value);
            if (adminPhoneRes?.data?.value) setAdminPhone(adminPhoneRes.data.value);
        } catch (err) {
            console.error('Error loading settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAccount = () => {
        setPaymentAccounts([
            ...paymentAccounts,
            { bankName: '', accountNumber: '', accountHolder: '' },
        ]);
    };

    const handleRemoveAccount = (index) => {
        setPaymentAccounts(paymentAccounts.filter((_, idx) => idx !== index));
    };

    const handleAccountChange = (index, field, value) => {
        const updated = [...paymentAccounts];
        updated[index] = { ...updated[index], [field]: value };
        setPaymentAccounts(updated);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await Promise.all([
                settingsAPI.set('class_name', className),
                settingsAPI.set('institution_name', institutionName),
                settingsAPI.set('class_description', classDescription),
                settingsAPI.set('start_date', startDate),
                settingsAPI.set('weekly_amount', weeklyAmount),
                settingsAPI.set('late_threshold', lateThreshold),
                settingsAPI.set('semester_name', semesterName),
                settingsAPI.set('payment_accounts', paymentAccounts),
                settingsAPI.set('payment_notes', paymentNotes),
                settingsAPI.set('fonnte_token', fonnteToken),
                settingsAPI.set('whatsapp_group_id', whatsappGroupId),
                settingsAPI.set('admin_phone', adminPhone),
            ]);

            if (onStartDateChange && startDate) {
                onStartDateChange(new Date(startDate));
            }
            if (onConfigUpdated) {
                onConfigUpdated();
            }

            setSuccess('✅ Pengaturan berhasil disimpan dan disinkronkan ke seluruh sistem!');
            setTimeout(() => setSuccess(''), 3500);
        } catch (err) {
            setError('❌ Gagal menyimpan pengaturan: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handlePauseSemester = async () => {
        if (
            !confirm(
                '⏸️ Pause semester?\n\nSistem akan berhenti menghitung tunggakan dan menonaktifkan reminder otomatis.\n\nWeek counter akan di-freeze untuk dilanjutkan nanti.'
            )
        ) {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                `${
                    (typeof window !== 'undefined' && window.__ENV__?.VITE_API_URL) ||
                    import.meta.env.VITE_API_URL ||
                    '/api'
                }/settings/current-week`
            );
            const data = await response.json();
            const currentWeek = data.currentWeek || 1;

            await Promise.all([
                settingsAPI.set('semester_status', 'paused'),
                settingsAPI.set('paused_week', currentWeek),
                settingsAPI.set('paused_at', new Date().toISOString()),
            ]);

            setSemesterStatus('paused');
            setPausedWeek(currentWeek);
            setSuccess(`⏸️ Semester berhasil di-pause! System freeze di Week ${currentWeek}`);
            setTimeout(() => setSuccess(''), 5000);

            if (onWeekChange) onWeekChange();
            if (onConfigUpdated) onConfigUpdated();
            setTimeout(() => window.location.reload(), 1500);
        } catch (err) {
            setError('❌ Gagal pause semester: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResumeSemester = async () => {
        const newSemesterName = prompt(
            '📚 Mulai Semester Baru\n\nMasukkan nama semester:',
            semesterName || 'Semester 2'
        );

        if (!newSemesterName) return;

        if (
            !confirm(
                `▶️ Resume dengan semester baru: "${newSemesterName}"?\n\n✅ Week counter akan reset ke Week 1\n✅ Tunggakan siswa tetap dipertahankan (carry over)\n✅ Payment history tetap tersimpan\n✅ Leaderboard akumulasi tetap aman`
            )
        ) {
            return;
        }

        setLoading(true);
        try {
            const today = formatDateForInput(new Date());
            let prevAccumulated = 0;
            try {
                const accRes = await settingsAPI.get('accumulated_weeks');
                if (accRes?.data?.value != null) {
                    prevAccumulated = parseInt(accRes.data.value);
                }
            } catch {
                prevAccumulated = 0;
            }
            const newAccumulatedWeeks = prevAccumulated + (pausedWeek || 0);

            await Promise.all([
                settingsAPI.set('semester_status', 'active'),
                settingsAPI.set('semester_name', newSemesterName),
                settingsAPI.set('start_date', today),
                settingsAPI.set('resumed_at', new Date().toISOString()),
                settingsAPI.set('accumulated_weeks', newAccumulatedWeeks),
                settingsAPI.set('paused_week', null),
            ]);

            setSemesterStatus('active');
            setSemesterName(newSemesterName);
            setStartDate(today);
            setPausedWeek(null);
            setSuccess(`▶️ Semester "${newSemesterName}" aktif! Week counter reset ke Week 1`);
            setTimeout(() => setSuccess(''), 5000);

            if (onWeekChange) onWeekChange();
            if (onStartDateChange) onStartDateChange(new Date(today));
            if (onConfigUpdated) onConfigUpdated();

            setTimeout(() => window.location.reload(), 1500);
        } catch (err) {
            setError('❌ Gagal resume semester: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const navTabs = [
        { id: 'profile', label: 'Profil Kelas', icon: School },
        { id: 'kas', label: 'Aturan Kas & Semester', icon: BookOpen },
        { id: 'payment', label: 'Rekening Pembayaran', icon: CreditCard },
        { id: 'whatsapp', label: 'WhatsApp Bot', icon: MessageCircle },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="rounded-2xl bg-zinc-950/60 border border-white/10 p-6 glass-cyber-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600/20 text-indigo-400 p-3 rounded-xl border border-indigo-500/30">
                        <SettingsIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                            Pengaturan Sistem
                        </h2>
                        <p className="text-xs sm:text-sm text-white/50">
                            Kelola profil kelas, nominal kas, rekening transfer, dan integrasi WhatsApp bot
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                    {loading ? (
                        <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Menyimpan...</span>
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            <span>Simpan Semua Pengaturan</span>
                        </>
                    )}
                </button>
            </div>

            {/* Notification Alert */}
            {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-center gap-2 text-sm animate-fade-in">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span>{success}</span>
                </div>
            )}
            {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl flex items-center gap-2 text-sm animate-fade-in">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Sub-Tabs Nav */}
            <div className="flex overflow-x-auto gap-2 p-1.5 rounded-2xl bg-zinc-950/40 border border-white/5 no-scrollbar">
                {navTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeSubTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveSubTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                                isActive
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                    : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Form Container */}
            <form onSubmit={handleSave} className="rounded-2xl bg-zinc-950/60 border border-white/10 glass-cyber-card p-6 space-y-6">
                {/* TAB 1: PROFIL KELAS */}
                {activeSubTab === 'profile' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="border-b border-white/10 pb-4">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <School className="w-4 h-4 text-indigo-400" />
                                <span>Identitas Kelas & Instansi</span>
                            </h3>
                            <p className="text-xs text-white/50 mt-0.5">
                                Informasi ini akan tampil di landing page, public dashboard, dan laporan keuangan
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-white/70 mb-1.5">
                                    Nama Kelas <span className="text-rose-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={className}
                                    onChange={(e) => setClassName(e.target.value)}
                                    placeholder="Contoh: XII RPL 1 / Kelas Alpha"
                                    required
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/30 text-xs sm:text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-white/70 mb-1.5">
                                    Nama Sekolah / Kampus / Organisasi
                                </label>
                                <input
                                    type="text"
                                    value={institutionName}
                                    onChange={(e) => setInstitutionName(e.target.value)}
                                    placeholder="Contoh: SMKN 1 Surabaya / Institut Teknologi"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/30 text-xs sm:text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-white/70 mb-1.5">
                                Deskripsi / Slogan Singkat
                            </label>
                            <textarea
                                rows={3}
                                value={classDescription}
                                onChange={(e) => setClassDescription(e.target.value)}
                                placeholder="Tuliskan deskripsi atau moto kelas Anda..."
                                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/30 text-xs sm:text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                            />
                        </div>
                    </div>
                )}

                {/* TAB 2: ATURAN KAS & SEMESTER */}
                {activeSubTab === 'kas' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="border-b border-white/10 pb-4">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-indigo-400" />
                                <span>Aturan Kas & Kontrol Semester</span>
                            </h3>
                            <p className="text-xs text-white/50 mt-0.5">
                                Atur besaran tagihan per minggu, batas keterlambatan, serta status semester berjalan
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-white/70 mb-1.5">
                                    Nominal Kas Per Minggu (Rp) <span className="text-rose-400">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-2.5 text-xs text-white/40 font-mono">Rp</span>
                                    <input
                                        type="number"
                                        min="500"
                                        step="500"
                                        value={weeklyAmount}
                                        onChange={(e) => setWeeklyAmount(parseInt(e.target.value) || 0)}
                                        required
                                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/30 text-xs sm:text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-white/70 mb-1.5">
                                    Batas Telat (Minggu) <span className="text-rose-400">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={lateThreshold}
                                    onChange={(e) => setLateThreshold(parseInt(e.target.value) || 1)}
                                    required
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/30 text-xs sm:text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition font-mono"
                                />
                                <p className="text-[11px] text-white/40 mt-1">
                                    Telat jika tunggakan &ge; Rp {(lateThreshold * weeklyAmount).toLocaleString('id-ID')}
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-white/70 mb-1.5">
                                    Tanggal Mulai Pembayaran <span className="text-rose-400">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/30 text-xs sm:text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                                />
                            </div>
                        </div>

                        {/* Semester Control Section */}
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-bold text-white">Status Semester</h4>
                                    <p className="text-xs text-white/50">
                                        Semester saat ini: <strong className="text-indigo-400">{semesterName || 'Aktif'}</strong>
                                    </p>
                                </div>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        semesterStatus === 'active'
                                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                    }`}
                                >
                                    {semesterStatus === 'active' ? '🟢 AKTIF' : '⏸️ DI-PAUSE'}
                                </span>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                {semesterStatus === 'active' ? (
                                    <button
                                        type="button"
                                        onClick={handlePauseSemester}
                                        disabled={loading}
                                        className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 transition"
                                    >
                                        <Pause className="w-4 h-4" />
                                        <span>Pause Semester (Mulai Libur)</span>
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleResumeSemester}
                                        disabled={loading}
                                        className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 transition"
                                    >
                                        <Play className="w-4 h-4" />
                                        <span>Resume Semester Baru</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: REKENING PEMBAYARAN */}
                {activeSubTab === 'payment' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-indigo-400" />
                                    <span>Rekening Bank & E-Wallet</span>
                                </h3>
                                <p className="text-xs text-white/50 mt-0.5">
                                    Daftar rekening tujuan transfer pembayaran kas bagi siswa
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddAccount}
                                className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Tambah Rekening</span>
                            </button>
                        </div>

                        {paymentAccounts.length === 0 ? (
                            <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                                <CreditCard className="w-8 h-8 text-white/20 mx-auto mb-2" />
                                <p className="text-xs text-white/50">Belum ada rekening pembayaran yang ditambahkan.</p>
                                <button
                                    type="button"
                                    onClick={handleAddAccount}
                                    className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 underline"
                                >
                                    + Tambah Rekening Pertama
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {paymentAccounts.map((acc, index) => (
                                    <div
                                        key={index}
                                        className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col md:flex-row items-center gap-3"
                                    >
                                        <div className="w-full md:w-1/3">
                                            <label className="block text-[10px] text-white/50 mb-1">
                                                Bank / E-Wallet
                                            </label>
                                            <input
                                                type="text"
                                                value={acc.bankName}
                                                onChange={(e) =>
                                                    handleAccountChange(index, 'bankName', e.target.value)
                                                }
                                                placeholder="BCA / Dana / Gopay"
                                                className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs outline-none focus:border-indigo-500"
                                            />
                                        </div>

                                        <div className="w-full md:w-1/3">
                                            <label className="block text-[10px] text-white/50 mb-1">
                                                Nomor Rekening / Telepon
                                            </label>
                                            <input
                                                type="text"
                                                value={acc.accountNumber}
                                                onChange={(e) =>
                                                    handleAccountChange(index, 'accountNumber', e.target.value)
                                                }
                                                placeholder="Contoh: 08123456789"
                                                className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono outline-none focus:border-indigo-500"
                                            />
                                        </div>

                                        <div className="w-full md:w-1/3">
                                            <label className="block text-[10px] text-white/50 mb-1">
                                                Atas Nama Pemilik
                                            </label>
                                            <input
                                                type="text"
                                                value={acc.accountHolder}
                                                onChange={(e) =>
                                                    handleAccountChange(index, 'accountHolder', e.target.value)
                                                }
                                                placeholder="Nama Pemilik"
                                                className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs outline-none focus:border-indigo-500"
                                            />
                                        </div>

                                        <div className="self-end md:self-center pt-2 md:pt-4">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveAccount(index)}
                                                className="p-2 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 transition"
                                                title="Hapus Rekening"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-medium text-white/70 mb-1.5">
                                Catatan Pembayaran / Konfirmasi
                            </label>
                            <input
                                type="text"
                                value={paymentNotes}
                                onChange={(e) => setPaymentNotes(e.target.value)}
                                placeholder="Contoh: Mohon sertakan bukti screenshot saat konfirmasi transfer."
                                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/30 text-xs sm:text-sm focus:border-indigo-500 outline-none"
                            />
                        </div>
                    </div>
                )}

                {/* TAB 4: WHATSAPP BOT */}
                {activeSubTab === 'whatsapp' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="border-b border-white/10 pb-4">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <MessageCircle className="w-4 h-4 text-emerald-400" />
                                <span>Integrasi WhatsApp Gateway (Fonnte)</span>
                            </h3>
                            <p className="text-xs text-white/50 mt-0.5">
                                Hubungkan dengan layanan Fonnte untuk reminder tunggakan otomatis dan broadcast laporan kas
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-white/70 mb-1.5">
                                    Fonnte API Token
                                </label>
                                <input
                                    type="password"
                                    value={fonnteToken}
                                    onChange={(e) => setFonnteToken(e.target.value)}
                                    placeholder="Tempel token API dari fonnte.com"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/30 text-xs sm:text-sm font-mono focus:border-emerald-500 outline-none"
                                />
                                <p className="text-[11px] text-white/40 mt-1">
                                    Dapatkan gratis dari dashboard <a href="https://fonnte.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline">fonnte.com</a>
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-white/70 mb-1.5">
                                        ID WhatsApp Grup Target
                                    </label>
                                    <input
                                        type="text"
                                        value={whatsappGroupId}
                                        onChange={(e) => setWhatsappGroupId(e.target.value)}
                                        placeholder="Contoh: 120363xxxxxxxxxx@g.us"
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/30 text-xs sm:text-sm font-mono focus:border-emerald-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-white/70 mb-1.5">
                                        Nomor WhatsApp Admin / Bendahara
                                    </label>
                                    <input
                                        type="text"
                                        value={adminPhone}
                                        onChange={(e) => setAdminPhone(e.target.value)}
                                        placeholder="Contoh: 628123456789"
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/30 text-xs sm:text-sm font-mono focus:border-emerald-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

export default Settings;
