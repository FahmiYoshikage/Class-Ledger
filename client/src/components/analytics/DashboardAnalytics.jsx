import React, { useState, useEffect, useMemo } from 'react';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Users,
    Calendar,
    PieChart,
    BarChart3,
    Activity,
    Download,
    RefreshCw,
    AlertCircle,
    Sparkles,
    ShieldAlert,
    Wallet,
} from 'lucide-react';
import IncomeVsExpenseChart from './IncomeVsExpenseChart';
import ExpenseCategoryPieChart from './ExpenseCategoryPieChart';
import WeeklyPaymentBarChart from './WeeklyPaymentBarChart';
import PaymentHeatmap from './PaymentHeatmap';
import DebtTrendChart from './DebtTrendChart';
import { studentsAPI, paymentsAPI, expensesAPI, settingsAPI } from '../../services/api';

const DashboardAnalytics = ({
    students: propStudents,
    payments: propPayments,
    expenses: propExpenses,
    currentWeek: propCurrentWeek,
    accumulatedWeeks: propAccumulatedWeeks,
    semesterStatus: propSemesterStatus,
    startDate: propStartDate,
    weeklyAmount: propWeeklyAmount = 2000,
    onRefresh,
}) => {
    // Local states when props aren't supplied
    const [localStudents, setLocalStudents] = useState([]);
    const [localPayments, setLocalPayments] = useState([]);
    const [localExpenses, setLocalExpenses] = useState([]);
    const [localStartDate, setLocalStartDate] = useState(new Date('2025-10-27'));
    const [localCurrentWeek, setLocalCurrentWeek] = useState(1);
    const [localAccumulatedWeeks, setLocalAccumulatedWeeks] = useState(7);
    const [localSemesterStatus, setLocalSemesterStatus] = useState('active');
    const [loading, setLoading] = useState(false);
    const [timeRange, setTimeRange] = useState('30'); // '7', '30', '90', '999999'

    // Determine effective data sources
    const hasProps = Array.isArray(propStudents) && propStudents.length > 0;

    const students = hasProps ? propStudents : localStudents;
    const payments = hasProps ? (propPayments || []) : localPayments;
    const expenses = hasProps ? (propExpenses || []) : localExpenses;
    const currentWeek = propCurrentWeek != null ? propCurrentWeek : localCurrentWeek;
    const accumulatedWeeks = propAccumulatedWeeks != null ? propAccumulatedWeeks : localAccumulatedWeeks;
    const semesterStatus = propSemesterStatus || localSemesterStatus;
    const startDate = propStartDate || localStartDate;
    const weeklyAmount = propWeeklyAmount || 2000;

    useEffect(() => {
        if (!hasProps) {
            loadData();
        }
    }, [hasProps]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [studentsRes, paymentsRes, expensesRes, startDateRes, currentWeekRes] =
                await Promise.all([
                    studentsAPI.getAll().catch(() => ({ data: [] })),
                    paymentsAPI.getAll().catch(() => ({ data: [] })),
                    expensesAPI.getAll().catch(() => ({ data: [] })),
                    settingsAPI.get('start_date').catch(() => null),
                    settingsAPI.get('current-week').catch(() => null),
                ]);

            setLocalStudents(studentsRes.data || []);
            setLocalPayments(paymentsRes.data || []);
            setLocalExpenses(expensesRes.data || []);

            if (startDateRes?.data?.value) {
                setLocalStartDate(new Date(startDateRes.data.value));
            }
            if (currentWeekRes?.data?.currentWeek) {
                setLocalCurrentWeek(currentWeekRes.data.currentWeek);
                setLocalAccumulatedWeeks(currentWeekRes.data.accumulatedWeeks ?? 7);
                setLocalSemesterStatus(currentWeekRes.data.status || 'active');
            }
        } catch (error) {
            console.error('Error loading analytics data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        if (onRefresh) {
            await onRefresh();
        } else {
            await loadData();
        }
    };

    const formatRp = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    // Calculate Core Metrics
    const metrics = useMemo(() => {
        const now = new Date();
        const days = Number(timeRange) || 30;
        const rangeDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        // Filtered transactions within timeRange
        const filteredPayments = payments.filter((p) => new Date(p.date) >= rangeDate);
        const filteredExpenses = expenses.filter((e) => new Date(e.date) >= rangeDate);

        const totalIncome = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const totalExpense = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const netBalance = totalIncome - totalExpense;

        // Previous Period for % change
        const prevRangeStart = new Date(rangeDate.getTime() - days * 24 * 60 * 60 * 1000);
        const prevPayments = payments.filter(
            (p) => new Date(p.date) >= prevRangeStart && new Date(p.date) < rangeDate
        );
        const prevExpenses = expenses.filter(
            (e) => new Date(e.date) >= prevRangeStart && new Date(e.date) < rangeDate
        );

        const prevIncome = prevPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const prevExpense = prevExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

        const incomeChange =
            prevIncome > 0 ? ((totalIncome - prevIncome) / prevIncome) * 100 : 0;
        const expenseChange =
            prevExpense > 0 ? ((totalExpense - prevExpense) / prevExpense) * 100 : 0;

        // Unique Paying Students in range
        const uniquePayingStudents = new Set(
            filteredPayments.map((p) => p.studentId?._id || p.studentId || p.student?._id || p.student)
        ).size;

        const avgPaymentAmount =
            filteredPayments.length > 0 ? totalIncome / filteredPayments.length : 0;

        // Cumulative Debt & Surplus Calculation across active students
        const activeStudents = students.filter((s) => s.status === 'Aktif');
        const totalWeeks = (Number(accumulatedWeeks) || 0) + (Number(currentWeek) || 1);
        const expectedPerStudent = totalWeeks * weeklyAmount;

        let totalDebt = 0;
        let studentsWithDebt = 0;
        let totalSurplus = 0;
        let studentsWithSurplus = 0;
        let lunasStudents = 0;

        activeStudents.forEach((student) => {
            const studentPayments = payments.filter((p) => {
                const sId = p.studentId?._id || p.studentId || p.student?._id || p.student;
                return sId === student._id;
            });
            const paid = studentPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
            const diff = expectedPerStudent - paid;

            if (diff > 0) {
                totalDebt += diff;
                studentsWithDebt++;
            } else if (diff < 0) {
                totalSurplus += Math.abs(diff);
                studentsWithSurplus++;
            } else {
                lunasStudents++;
            }
        });

        return {
            totalIncome,
            totalExpense,
            netBalance,
            incomeChange,
            expenseChange,
            uniquePayingStudents,
            avgPaymentAmount,
            totalDebt,
            studentsWithDebt,
            totalSurplus,
            studentsWithSurplus,
            lunasStudents,
            paymentCount: filteredPayments.length,
            expenseCount: filteredExpenses.length,
            activeStudentCount: activeStudents.length,
        };
    }, [students, payments, expenses, timeRange, currentWeek, accumulatedWeeks, weeklyAmount]);

    if (loading && !hasProps && students.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-3" />
                    <p className="text-sm text-slate-500 dark:text-white/60">Memuat data analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <div className="rounded-2xl bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-pink-500/10 border border-indigo-500/20 p-4 sm:p-6 backdrop-blur-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                📊 Dashboard Analytics
                            </h1>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                                LIVE
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-white/60 mt-0.5">
                            Analisis presisi kas kelas, kehadiran pembayaran, dan tren keuangan
                        </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            onClick={handleRefresh}
                            disabled={loading}
                            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white dark:bg-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.12] text-slate-700 dark:text-white border border-slate-200 dark:border-white/10 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold shadow-sm"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Time Range Filter Tabs */}
                <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1">
                    {[
                        { label: '7 Hari', value: '7' },
                        { label: '30 Hari', value: '30' },
                        { label: '90 Hari', value: '90' },
                        { label: 'Semua Transaksi', value: '999999' },
                    ].map((range) => (
                        <button
                            key={range.value}
                            onClick={() => setTimeRange(range.value)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                                timeRange === range.value
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105'
                                    : 'bg-white/80 dark:bg-white/[0.05] text-slate-600 dark:text-white/70 hover:bg-white dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/5'
                            }`}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Key Metrics KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Pemasukan */}
                <div className="glass-cyber-card rounded-2xl p-5 border-l-4 border-emerald-500">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500 dark:text-white/60">
                            Pemasukan ({timeRange === '999999' ? 'Semua' : `${timeRange} Hari`})
                        </span>
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums mb-1">
                        {formatRp(metrics.totalIncome)}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs">
                        {metrics.incomeChange >= 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center">
                                <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                                +{metrics.incomeChange.toFixed(1)}%
                            </span>
                        ) : (
                            <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center">
                                <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                                {metrics.incomeChange.toFixed(1)}%
                            </span>
                        )}
                        <span className="text-slate-400 dark:text-white/40">vs periode lalu</span>
                    </div>
                </div>

                {/* Total Pengeluaran */}
                <div className="glass-cyber-card rounded-2xl p-5 border-l-4 border-rose-500">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500 dark:text-white/60">
                            Pengeluaran ({timeRange === '999999' ? 'Semua' : `${timeRange} Hari`})
                        </span>
                        <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                            <TrendingDown className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums mb-1">
                        {formatRp(metrics.totalExpense)}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs">
                        {metrics.expenseChange <= 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center">
                                <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                                {metrics.expenseChange.toFixed(1)}%
                            </span>
                        ) : (
                            <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center">
                                <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                                +{metrics.expenseChange.toFixed(1)}%
                            </span>
                        )}
                        <span className="text-slate-400 dark:text-white/40">vs periode lalu</span>
                    </div>
                </div>

                {/* Saldo Bersih Periode */}
                <div className="glass-cyber-card rounded-2xl p-5 border-l-4 border-indigo-500">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500 dark:text-white/60">
                            Saldo Bersih Periode
                        </span>
                        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                            <Wallet className="w-4 h-4" />
                        </div>
                    </div>
                    <p
                        className={`text-xl sm:text-2xl font-black tabular-nums mb-1 ${
                            metrics.netBalance >= 0
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-rose-600 dark:text-rose-400'
                        }`}
                    >
                        {formatRp(metrics.netBalance)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-white/50">
                        {metrics.paymentCount} pemasukan • {metrics.expenseCount} pengeluaran
                    </p>
                </div>

                {/* Siswa Bayar di Depan / Surplus */}
                <div className="glass-cyber-card rounded-2xl p-5 border-l-4 border-cyan-500">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500 dark:text-white/60">
                            Bayar di Depan (Surplus)
                        </span>
                        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
                            <Sparkles className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-cyan-600 dark:text-cyan-300 tabular-nums mb-1">
                        {metrics.studentsWithSurplus} Siswa
                    </p>
                    <p className="text-xs text-slate-500 dark:text-white/50">
                        Total Surplus: <strong className="text-cyan-600 dark:text-cyan-300">{formatRp(metrics.totalSurplus)}</strong>
                    </p>
                </div>
            </div>

            {/* Tunggakan Alert Bar */}
            {metrics.totalDebt > 0 && (
                <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-slide-up">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                                Total Tunggakan: {formatRp(metrics.totalDebt)}
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-300/80">
                                Sebanyak <strong>{metrics.studentsWithDebt}</strong> siswa belum melunasi kas hingga Minggu ke-{currentWeek}.
                            </p>
                        </div>
                    </div>
                    <div className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-500/20 px-3 py-1.5 rounded-xl self-end sm:self-auto">
                        Target Koleksi Mingguan: {formatRp(weeklyAmount)} / siswa
                    </div>
                </div>
            )}

            {/* Line Chart & Category Pie Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pemasukan vs Pengeluaran */}
                <div className="glass-cyber-card rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-5 h-5 text-indigo-500" />
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                                Tren Pemasukan vs Pengeluaran
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-white/50">
                                Kronologi harian pemasukan dan pengeluaran kas
                            </p>
                        </div>
                    </div>
                    <IncomeVsExpenseChart
                        payments={payments}
                        expenses={expenses}
                        timeRange={timeRange}
                    />
                </div>

                {/* Kategori Pengeluaran */}
                <div className="glass-cyber-card rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-2 mb-4">
                        <PieChart className="w-5 h-5 text-violet-500" />
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                                Proporsi Kategori Pengeluaran
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-white/50">
                                Distribusi penggunaan dana kas kelas
                            </p>
                        </div>
                    </div>
                    <ExpenseCategoryPieChart
                        expenses={expenses}
                        timeRange={timeRange}
                    />
                </div>
            </div>

            {/* Weekly Payment Bar Chart */}
            <div className="glass-cyber-card rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-indigo-500" />
                    <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                            Pembayaran Kas Per Minggu
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-white/50">
                            Volume dan nominal kas yang terkumpul setiap minggunya
                        </p>
                    </div>
                </div>
                <WeeklyPaymentBarChart
                    payments={payments}
                    currentWeek={currentWeek}
                    accumulatedWeeks={accumulatedWeeks}
                    startDate={startDate}
                    semesterStatus={semesterStatus}
                />
            </div>

            {/* Payment Attendance Heatmap */}
            <div className="glass-cyber-card rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-amber-500" />
                    <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                            Heatmap Kehadiran Pembayaran Kas
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-white/50">
                            Matriks mingguan setiap siswa • Mendukung burst payment & bayar di depan
                        </p>
                    </div>
                </div>
                <PaymentHeatmap
                    students={students}
                    payments={payments}
                    currentWeek={currentWeek}
                    accumulatedWeeks={accumulatedWeeks}
                    semesterStatus={semesterStatus}
                    startDate={startDate}
                    weeklyAmount={weeklyAmount}
                />
            </div>

            {/* Debt Trend Chart */}
            <div className="glass-cyber-card rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-rose-500" />
                    <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                            Tren Akumulasi Tunggakan & Koleksi
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-white/50">
                            Perjalanan tunggakan vs persentase kas yang berhasil dihimpun
                        </p>
                    </div>
                </div>
                <DebtTrendChart
                    students={students}
                    payments={payments}
                    currentWeek={currentWeek}
                    accumulatedWeeks={accumulatedWeeks}
                    startDate={startDate}
                    weeklyAmount={weeklyAmount}
                />
            </div>
        </div>
    );
};

export default DashboardAnalytics;
