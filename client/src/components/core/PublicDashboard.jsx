import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    Users,
    LogIn,
    Gift,
    Trophy,
    Medal,
    Award,
    ArrowRight,
    BarChart3,
    ChevronRight,
    QrCode,
    Search,
    CheckCircle2,
    AlertCircle,
    Calendar,
    Sparkles,
    ShieldCheck,
    CreditCard,
    Flame,
    Sun,
    Moon,
} from 'lucide-react';
import axios from 'axios';
import { useAppConfig } from '../../context/ConfigContext';
import { useTheme } from '../../context/ThemeContext';

const API_URL =
    (typeof window !== 'undefined' && window.__ENV__?.VITE_API_URL) ||
    import.meta.env.VITE_API_URL ||
    '/api';

const PublicDashboard = () => {
    const { config } = useAppConfig();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        totalStudents: 0,
        totalTransactions: 0,
    });
    const [students, setStudents] = useState([]);
    const [events, setEvents] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [currentWeek, setCurrentWeek] = useState(26);
    const [searchStudent, setSearchStudent] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPublicData();
    }, []);

    const fetchPublicData = async () => {
        try {
            setLoading(true);
            const [paymentsRes, expensesRes, studentsRes, weekRes, eventsRes, leaderboardRes] = await Promise.all([
                axios.get(`${API_URL}/payments`),
                axios.get(`${API_URL}/expenses`),
                axios.get(`${API_URL}/students`),
                axios.get(`${API_URL}/settings/current-week`).catch(() => ({ data: { totalWeeks: 26 } })),
                axios.get(`${API_URL}/events`).catch(() => ({ data: [] })),
                axios.get(`${API_URL}/leaderboard`).catch(() => ({ data: { leaderboard: [] } })),
            ]);

            const payments = Array.isArray(paymentsRes.data) ? paymentsRes.data : [];
            const expenses = Array.isArray(expensesRes.data) ? expensesRes.data : [];
            const studentList = Array.isArray(studentsRes.data) ? studentsRes.data : [];
            const activeWeek = weekRes.data?.totalWeeks || 26;

            setCurrentWeek(activeWeek);

            // Calculate totals
            const totalIncome = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
            const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

            setStats({
                totalIncome,
                totalExpenses,
                balance: totalIncome - totalExpenses,
                totalStudents: studentList.length,
                totalTransactions: payments.length + expenses.length,
            });

            // Map payments per student
            const studentPaymentMap = {};
            payments.forEach((payment) => {
                const sId = payment.studentId?._id || payment.studentId || payment.student?._id || payment.student;
                if (sId) {
                    const idStr = sId.toString();
                    if (!studentPaymentMap[idStr]) {
                        studentPaymentMap[idStr] = {
                            totalPaid: 0,
                            paymentCount: 0,
                            lastDate: payment.date,
                        };
                    }
                    studentPaymentMap[idStr].totalPaid += payment.amount || 0;
                    studentPaymentMap[idStr].paymentCount += 1;
                }
            });

            // Enriched student data with dues / status
            const fee = config.weeklyAmount || 2000;
            const enrichedStudents = studentList.map((s) => {
                const sId = s._id.toString();
                const pData = studentPaymentMap[sId] || { totalPaid: 0, paymentCount: 0, lastDate: null };
                const weeksPaid = Math.floor(pData.totalPaid / fee);
                const weeksLate = Math.max(0, activeWeek - weeksPaid);
                const tunggakan = weeksLate * fee;

                return {
                    ...s,
                    totalPaid: pData.totalPaid,
                    paymentCount: pData.paymentCount,
                    lastDate: pData.lastDate,
                    weeksPaid,
                    weeksLate,
                    tunggakan,
                    isLunas: tunggakan <= 0,
                };
            });

            setStudents(enrichedStudents);

            // Set active events
            if (Array.isArray(eventsRes.data)) {
                setEvents(eventsRes.data.filter((e) => e.status === 'active' || !e.status));
            }

            // Set top leaderboard
            if (leaderboardRes.data?.leaderboard && Array.isArray(leaderboardRes.data.leaderboard)) {
                setLeaderboard(leaderboardRes.data.leaderboard);
            } else if (Array.isArray(leaderboardRes.data)) {
                setLeaderboard(leaderboardRes.data);
            }
        } catch (error) {
            console.error('Error fetching public data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    // Filter students for "Cek Kas Saya"
    const searchedStudents = useMemo(() => {
        const query = searchStudent.trim().toLowerCase();
        if (!query) return [];
        return students.filter(
            (s) =>
                s.name?.toLowerCase().includes(query) ||
                s.nickname?.toLowerCase().includes(query) ||
                s.absen?.toString().includes(query)
        ).slice(0, 5);
    }, [searchStudent, students]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] flex items-center justify-center transition-colors">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                    <p className="text-slate-600 dark:text-white/60 text-sm font-medium tracking-wide">Sinkronisasi Kas Kelas...</p>
                </div>
            </div>
        );
    }

    const netRate = stats.totalIncome > 0 ? Math.round((stats.balance / stats.totalIncome) * 100) : 100;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-white selection:bg-indigo-500/30 overflow-x-hidden relative transition-colors duration-300">
            {/* Ambient Aurora Orbs (Subtle in light mode, vivid in dark mode) */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-40 dark:opacity-100 transition-opacity">
                <div className="absolute top-[-10%] left-[15%] w-[650px] h-[500px] bg-gradient-to-br from-indigo-500/20 via-violet-500/15 to-transparent blur-[130px] rounded-full animate-aurora" />
                <div className="absolute top-[30%] right-[-5%] w-[550px] h-[450px] bg-gradient-to-bl from-fuchsia-500/15 via-pink-500/10 to-transparent blur-[140px] rounded-full animate-aurora-delayed" />
                <div className="absolute bottom-[10%] left-[5%] w-[500px] h-[400px] bg-gradient-to-tr from-cyan-500/10 via-indigo-500/15 to-transparent blur-[120px] rounded-full animate-aurora" />
            </div>

            {/* Sticky Modern Cyber Glass Nav */}
            <nav className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-2xl transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Brand Logo & Name */}
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-600 to-pink-500 p-[1.5px] shadow-lg shadow-indigo-500/20">
                                <div className="w-full h-full bg-white dark:bg-[#09090b] rounded-[10px] flex items-center justify-center">
                                    <ShieldCheck className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 dark:text-white text-[15px] tracking-tight">
                                        Kas {config.className || 'Kelas'}
                                    </span>
                                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 beacon-live" />
                                        Minggu {currentWeek}
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-white/40 hidden sm:block">
                                    {config.institutionName ? `${config.institutionName} • ` : ''}Transparansi Keuangan Real-Time
                                </p>
                            </div>
                        </div>

                        {/* Navigation Actions */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            <a
                                href="#cek-kas"
                                className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.05] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition-all"
                            >
                                <Search className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                                <span>Cek Kas Saya</span>
                            </a>

                            <button
                                onClick={() => navigate('/qr-payment')}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 text-indigo-600 dark:text-indigo-300 text-xs font-semibold transition-all hover:scale-105"
                            >
                                <QrCode className="w-3.5 h-3.5" />
                                <span>Bayar QRIS</span>
                            </button>

                            <button
                                onClick={() => navigate('/leaderboard')}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.05] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition-all"
                            >
                                <Trophy className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                                <span className="hidden sm:inline">Leaderboard</span>
                            </button>

                            {/* Theme Toggle Button (Light / Dark) */}
                            <button
                                type="button"
                                onClick={toggleTheme}
                                className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-amber-400 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-105"
                                title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
                            >
                                {theme === 'dark' ? (
                                    <Sun className="w-4 h-4 text-amber-400" />
                                ) : (
                                    <Moon className="w-4 h-4 text-indigo-600" />
                                )}
                                <span className="hidden xl:inline text-xs font-medium text-slate-700 dark:text-white/80">
                                    {theme === 'dark' ? 'Terang' : 'Gelap'}
                                </span>
                            </button>

                            <button
                                onClick={() => navigate('/login')}
                                className="flex items-center gap-1.5 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-white/90 text-xs font-bold transition-all shadow-md shadow-indigo-600/20 dark:shadow-white/10 hover:scale-105"
                            >
                                <LogIn className="w-3.5 h-3.5" />
                                <span>Bendahara</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Continuous Marquee Ticker */}
            <div className="relative z-10 border-b border-slate-200/80 dark:border-white/[0.06] bg-slate-100/70 dark:bg-white/[0.015] py-2.5 transition-colors">
                <div className="marquee-wrapper">
                    <div className="marquee-content text-xs text-slate-600 dark:text-white/60">
                        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                            <Sparkles className="w-3.5 h-3.5" /> Saldo Kas: {formatCurrency(stats.balance)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                            👥 {stats.totalStudents} Siswa Terdaftar
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-300">
                            🛡️ Iuran Kas Rutin Rp {(config.weeklyAmount || 2000).toLocaleString('id-ID')} / Minggu
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-300">
                            ⚡ {stats.totalTransactions} Total Transaksi Tercatat
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5 text-pink-600 dark:text-pink-400">
                            💳 Pembayaran Online via QRIS Terbuka 24/7
                        </span>
                        <span>•</span>
                    </div>
                    <div className="marquee-content text-xs text-slate-600 dark:text-white/60" aria-hidden="true">
                        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                            <Sparkles className="w-3.5 h-3.5" /> Saldo Kas: {formatCurrency(stats.balance)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                            👥 {stats.totalStudents} Siswa Terdaftar
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-300">
                            🛡️ Iuran Kas Rutin Rp {(config.weeklyAmount || 2000).toLocaleString('id-ID')} / Minggu
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-300">
                            ⚡ {stats.totalTransactions} Total Transaksi Tercatat
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5 text-pink-600 dark:text-pink-400">
                            💳 Pembayaran Online via QRIS Terbuka 24/7
                        </span>
                        <span>•</span>
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <section className="relative z-10 pt-12 sm:pt-20 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-10">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-xs font-semibold mb-6 shadow-inner animate-fade-in">
                        <Flame className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 animate-pulse" />
                        <span>Sistem Transparansi Kas Kelas 100% Real-Time</span>
                    </div>
                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-4 leading-tight">
                        <span className="text-slate-900 dark:text-white">Saldo Kas: </span>
                        <span className="text-cyber-gradient block sm:inline">
                            {formatCurrency(stats.balance)}
                        </span>
                    </h1>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-white/50 max-w-xl mx-auto leading-relaxed">
                        Seluruh pemasukan, pengeluaran, dan tunggakan kas tercatat terbuka dan dapat dipantau oleh setiap anggota kelas kapan saja.
                    </p>

                    {/* Fast Hero CTA */}
                    <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
                        <button
                            onClick={() => navigate('/qr-payment')}
                            className="btn-cyber-primary px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-semibold shadow-xl cursor-pointer"
                        >
                            <QrCode className="w-4 h-4" />
                            <span>Bayar Kas via QRIS</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <a
                            href="#cek-kas"
                            className="px-6 py-3 rounded-xl bg-white dark:bg-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/[0.1] text-slate-800 dark:text-white text-sm font-semibold transition-all hover:scale-105 flex items-center gap-2 shadow-sm"
                        >
                            <Search className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                            <span>Cek Tunggakan Saya</span>
                        </a>
                    </div>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto animate-slide-up">
                    {/* Income Card */}
                    <div className="glass-cyber-card rounded-2xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Pemasukan</span>
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                            {formatCurrency(stats.totalIncome)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-white/40 mt-2">Iuran mingguan & kontribusi acara</p>
                    </div>

                    {/* Expense Card */}
                    <div className="glass-cyber-card rounded-2xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all" />
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Total Pengeluaran</span>
                            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                                <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                            {formatCurrency(stats.totalExpenses)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-white/40 mt-2">Fotokopi, konsumsi & kegiatan kelas</p>
                    </div>

                    {/* Class Health Card */}
                    <div className="glass-cyber-card rounded-2xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Kesehatan Kas</span>
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{netRate}%</p>
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Cadangan Tersisa</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-white/[0.08] h-1.5 rounded-full mt-3 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 h-full rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min(100, Math.max(10, netRate))}%` }}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Interactive "Cek Kas Saya" Widget */}
            <section id="cek-kas" className="relative z-10 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <div className="glass-cyber-card rounded-3xl p-6 sm:p-10 border border-indigo-200 dark:border-indigo-500/20 shadow-xl relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                            <Search className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Cek Status Kas Saya
                        </h2>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-white/50 mb-6">
                        Ketik nama atau nomor absenmu untuk mengecek jumlah minggu lunas dan tunggakan secara instan.
                    </p>

                    {/* Search Input Box */}
                    <div className="relative mb-6">
                        <input
                            type="text"
                            value={searchStudent}
                            onChange={(e) => setSearchStudent(e.target.value)}
                            placeholder="Ketik nama kamu atau nomor absen (misal: Budi atau 12...)"
                            className="input-cyber-glass w-full px-5 py-4 pl-12 rounded-2xl text-sm"
                        />
                        <Search className="w-5 h-5 text-slate-400 dark:text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
                        {searchStudent && (
                            <button
                                onClick={() => setSearchStudent('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white/70 font-medium transition cursor-pointer"
                            >
                                Reset
                            </button>
                        )}
                    </div>

                    {/* Search Results Display */}
                    {searchStudent.trim() !== '' && (
                        <div className="space-y-3 animate-slide-up">
                            {searchedStudents.length === 0 ? (
                                <div className="text-center py-8 rounded-2xl bg-slate-100/80 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06]">
                                    <AlertCircle className="w-8 h-8 text-amber-500 dark:text-amber-400/60 mx-auto mb-2" />
                                    <p className="text-sm text-slate-700 dark:text-white/70 font-medium">Nama atau nomor absen tidak ditemukan.</p>
                                    <p className="text-xs text-slate-500 dark:text-white/30 mt-1">Coba gunakan nama panggilan atau periksa ejaan nomor absen.</p>
                                </div>
                            ) : (
                                searchedStudents.map((student) => (
                                    <div
                                        key={student._id}
                                        className="rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] hover:border-indigo-400 dark:hover:border-indigo-500/30 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all card-hover shadow-sm"
                                    >
                                        <div className="flex items-start sm:items-center gap-3.5">
                                            <div
                                                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                                                    student.isLunas
                                                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                                        : 'bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400'
                                                }`}
                                            >
                                                {student.absen || '#'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-slate-900 dark:text-white text-[15px]">
                                                        {student.name}
                                                    </h3>
                                                    {student.nickname && (
                                                        <span className="text-xs text-slate-500 dark:text-white/40">({student.nickname})</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 text-xs mt-1 text-slate-500 dark:text-white/50">
                                                    <span>Terbayar: <strong className="text-slate-700 dark:text-white/80">{student.weeksPaid} Minggu</strong></span>
                                                    <span>•</span>
                                                    <span>Total: <strong className="text-slate-700 dark:text-white/80">{formatCurrency(student.totalPaid)}</strong></span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status & CTA Button */}
                                        <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200 dark:border-white/[0.06]">
                                            {student.isLunas ? (
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-300 text-xs font-semibold">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                                                    <span>Lunas (Minggu {currentWeek})</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <span className="text-[11px] text-rose-600 dark:text-rose-400/80 block leading-tight font-medium">
                                                            Tunggakan {student.weeksLate} Minggu
                                                        </span>
                                                        <span className="text-sm font-bold text-rose-600 dark:text-rose-300">
                                                            {formatCurrency(student.tunggakan)}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => navigate(`/qr-payment?studentId=${student._id}`)}
                                                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md transition-all hover:scale-105 flex items-center gap-1 cursor-pointer"
                                                    >
                                                        <span>Bayar</span>
                                                        <ArrowRight className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* Active Events (if any) */}
            {events.length > 0 && (
                <section className="relative z-10 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="flex items-center gap-2.5 mb-6">
                        <Gift className="w-5 h-5 text-violet-500 dark:text-violet-400" />
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">Event & Patungan Kelas</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {events.map((event, idx) => {
                            const progress = Math.min(100, ((event.totalPaid || 0) / (event.targetAmount || 1)) * 100);
                            return (
                                <div key={idx} className="glass-cyber-card rounded-2xl p-6 card-hover">
                                    <h3 className="font-bold text-slate-900 dark:text-white text-base mb-3">{event.name || 'Event Khusus'}</h3>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between text-slate-500 dark:text-white/50">
                                            <span>Target Iuran</span>
                                            <span className="text-slate-800 dark:text-white font-medium">{formatCurrency(event.targetAmount || 0)}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-500 dark:text-white/50">
                                            <span>Terkumpul</span>
                                            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{formatCurrency(event.totalPaid || 0)}</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 h-1.5 bg-slate-200 dark:bg-white/[0.08] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-white/40 mt-2">
                                        <span>{event.paidCount || 0} Siswa berpartisipasi</span>
                                        <span className="font-semibold text-slate-700 dark:text-white/70">{progress.toFixed(0)}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Top 5 Leaderboard Preview */}
            {leaderboard.length > 0 && (
                <section className="relative z-10 py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2.5">
                            <Trophy className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">Top Donatur Kas Kelas</h2>
                        </div>
                        <button
                            onClick={() => navigate('/leaderboard')}
                            className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition cursor-pointer"
                        >
                            <span>Lihat Semua Peringkat</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="glass-cyber-card rounded-2xl overflow-hidden divide-y divide-slate-200 dark:divide-white/[0.06]">
                        {leaderboard.slice(0, 5).map((member, index) => {
                            const rankIcons = ['🥇', '🥈', '🥉'];
                            return (
                                <div
                                    key={member.studentId || member._id || index}
                                    className="flex items-center justify-between p-4 sm:p-5 hover:bg-slate-100/60 dark:hover:bg-white/[0.02] transition-colors"
                                >
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0">
                                            {index < 3 ? rankIcons[index] : <span className="text-xs text-slate-500 dark:text-white/40 font-semibold">{index + 1}</span>}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                {member.name || member.nickname}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-white/40">
                                                Absen #{member.absen} • {member.paymentCount} Transaksi
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-bold text-amber-600 dark:text-amber-300 flex-shrink-0 ml-4">
                                        {formatCurrency(member.totalDonation ?? member.totalPaid ?? 0)}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Modern Clean Footer */}
            <footer className="relative z-10 border-t border-slate-200 dark:border-white/[0.08] mt-16 bg-white/80 dark:bg-[#09090b]/80 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-sm">
                            <ShieldCheck className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 dark:text-white/70">Kas {config.className || 'Kelas'}</span>
                        <span className="text-slate-300 dark:text-white/20">•</span>
                        <span className="text-[11px] text-slate-500 dark:text-white/40">Data Tersinkronisasi Otomatis</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-white/50">
                        <button onClick={() => navigate('/qr-payment')} className="hover:text-slate-900 dark:hover:text-white transition cursor-pointer">
                            Bayar QRIS
                        </button>
                        <button onClick={() => navigate('/leaderboard')} className="hover:text-slate-900 dark:hover:text-white transition cursor-pointer">
                            Leaderboard
                        </button>
                        <button onClick={() => navigate('/login')} className="hover:text-slate-900 dark:hover:text-white transition cursor-pointer">
                            Login Bendahara
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PublicDashboard;