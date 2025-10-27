import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import IncomeVsExpenseChart from './IncomeVsExpenseChart';
import ExpenseCategoryPieChart from './ExpenseCategoryPieChart';
import WeeklyPaymentBarChart from './WeeklyPaymentBarChart';
import PaymentHeatmap from './PaymentHeatmap';
import DebtTrendChart from './DebtTrendChart';
import { studentsAPI, paymentsAPI, expensesAPI } from '../../services/api';

const DashboardAnalytics = () => {
    const [students, setStudents] = useState([]);
    const [payments, setPayments] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [timeRange, setTimeRange] = useState('30'); // days
    const [analytics, setAnalytics] = useState(null);

    useEffect(() => {
        loadData();
    }, [timeRange]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [studentsRes, paymentsRes, expensesRes] = await Promise.all([
                studentsAPI.getAll(),
                paymentsAPI.getAll(),
                expensesAPI.getAll(),
            ]);

            setStudents(studentsRes.data);
            setPayments(paymentsRes.data);
            setExpenses(expensesRes.data);

            // Calculate analytics
            calculateAnalytics(
                studentsRes.data,
                paymentsRes.data,
                expensesRes.data
            );
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateAnalytics = (studentsData, paymentsData, expensesData) => {
        const now = new Date();
        const rangeDate = new Date(
            now.getTime() - timeRange * 24 * 60 * 60 * 1000
        );

        // Filter data by time range
        const filteredPayments = paymentsData.filter(
            (p) => new Date(p.date) >= rangeDate
        );
        const filteredExpenses = expensesData.filter(
            (e) => new Date(e.date) >= rangeDate
        );

        // Calculate totals
        const totalIncome = filteredPayments.reduce(
            (sum, p) => sum + p.amount,
            0
        );
        const totalExpense = filteredExpenses.reduce(
            (sum, e) => sum + e.amount,
            0
        );
        const netBalance = totalIncome - totalExpense;

        // Calculate previous period for comparison
        const prevRangeStart = new Date(
            rangeDate.getTime() - timeRange * 24 * 60 * 60 * 1000
        );
        const prevPayments = paymentsData.filter(
            (p) =>
                new Date(p.date) >= prevRangeStart &&
                new Date(p.date) < rangeDate
        );
        const prevExpenses = expensesData.filter(
            (e) =>
                new Date(e.date) >= prevRangeStart &&
                new Date(e.date) < rangeDate
        );

        const prevIncome = prevPayments.reduce((sum, p) => sum + p.amount, 0);
        const prevExpense = prevExpenses.reduce((sum, e) => sum + e.amount, 0);

        const incomeChange =
            prevIncome > 0
                ? ((totalIncome - prevIncome) / prevIncome) * 100
                : 0;
        const expenseChange =
            prevExpense > 0
                ? ((totalExpense - prevExpense) / prevExpense) * 100
                : 0;

        // Payment statistics
        const uniquePayingStudents = new Set(
            filteredPayments.map((p) => p.studentId?._id || p.studentId)
        ).size;

        const avgPaymentAmount =
            filteredPayments.length > 0
                ? totalIncome / filteredPayments.length
                : 0;

        // Debt analysis
        const startDate = new Date('2025-10-27');
        const days = Math.floor((now - startDate) / (24 * 60 * 60 * 1000));
        const currentWeek = Math.max(0, Math.ceil(days / 7) + 1);

        let totalDebt = 0;
        let studentsWithDebt = 0;

        studentsData.forEach((student) => {
            const studentPayments = paymentsData.filter(
                (p) => (p.studentId?._id || p.studentId) === student._id
            );
            const totalPaid = studentPayments.reduce(
                (sum, p) => sum + p.amount,
                0
            );
            const shouldPay = currentWeek * 2000;
            const debt = shouldPay - totalPaid;

            if (debt > 0) {
                totalDebt += debt;
                studentsWithDebt++;
            }
        });

        setAnalytics({
            totalIncome,
            totalExpense,
            netBalance,
            incomeChange,
            expenseChange,
            uniquePayingStudents,
            avgPaymentAmount,
            totalDebt,
            studentsWithDebt,
            paymentCount: filteredPayments.length,
            expenseCount: filteredExpenses.length,
        });
    };

    const formatRp = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const exportAnalytics = () => {
        // TODO: Implement export functionality
        alert('Export analytics akan segera hadir!');
    };

    if (loading && !analytics) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Memuat analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">
                            📊 Dashboard Analytics
                        </h1>
                        <p className="text-indigo-100">
                            Analisis mendalam keuangan kas kelas
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={loadData}
                            disabled={loading}
                            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition flex items-center gap-2"
                        >
                            <RefreshCw
                                className={`w-4 h-4 ${
                                    loading ? 'animate-spin' : ''
                                }`}
                            />
                            Refresh
                        </button>
                        <button
                            onClick={exportAnalytics}
                            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Time Range Filter */}
                <div className="flex gap-2">
                    {[
                        { label: '7 Hari', value: '7' },
                        { label: '30 Hari', value: '30' },
                        { label: '90 Hari', value: '90' },
                        { label: 'Semua', value: '999999' },
                    ].map((range) => (
                        <button
                            key={range.value}
                            onClick={() => setTimeRange(range.value)}
                            className={`px-4 py-2 rounded-lg transition ${
                                timeRange === range.value
                                    ? 'bg-white text-indigo-600 font-semibold'
                                    : 'bg-white/20 hover:bg-white/30'
                            }`}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Key Metrics Cards */}
            {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Income */}
                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-gray-600">
                                Total Pemasukan
                            </p>
                            <TrendingUp className="w-5 h-5 text-green-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800 mb-1">
                            {formatRp(analytics.totalIncome)}
                        </p>
                        <div className="flex items-center gap-1 text-sm">
                            {analytics.incomeChange >= 0 ? (
                                <>
                                    <TrendingUp className="w-4 h-4 text-green-500" />
                                    <span className="text-green-600 font-medium">
                                        +{analytics.incomeChange.toFixed(1)}%
                                    </span>
                                </>
                            ) : (
                                <>
                                    <TrendingDown className="w-4 h-4 text-red-500" />
                                    <span className="text-red-600 font-medium">
                                        {analytics.incomeChange.toFixed(1)}%
                                    </span>
                                </>
                            )}
                            <span className="text-gray-500">
                                vs periode sebelumnya
                            </span>
                        </div>
                    </div>

                    {/* Total Expense */}
                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-gray-600">
                                Total Pengeluaran
                            </p>
                            <TrendingDown className="w-5 h-5 text-red-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800 mb-1">
                            {formatRp(analytics.totalExpense)}
                        </p>
                        <div className="flex items-center gap-1 text-sm">
                            {analytics.expenseChange >= 0 ? (
                                <>
                                    <TrendingUp className="w-4 h-4 text-red-500" />
                                    <span className="text-red-600 font-medium">
                                        +{analytics.expenseChange.toFixed(1)}%
                                    </span>
                                </>
                            ) : (
                                <>
                                    <TrendingDown className="w-4 h-4 text-green-500" />
                                    <span className="text-green-600 font-medium">
                                        {analytics.expenseChange.toFixed(1)}%
                                    </span>
                                </>
                            )}
                            <span className="text-gray-500">
                                vs periode sebelumnya
                            </span>
                        </div>
                    </div>

                    {/* Net Balance */}
                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-gray-600">
                                Saldo Bersih
                            </p>
                            <DollarSign className="w-5 h-5 text-indigo-500" />
                        </div>
                        <p
                            className={`text-2xl font-bold mb-1 ${
                                analytics.netBalance >= 0
                                    ? 'text-green-600'
                                    : 'text-red-600'
                            }`}
                        >
                            {formatRp(analytics.netBalance)}
                        </p>
                        <p className="text-sm text-gray-500">
                            {analytics.paymentCount} pembayaran •{' '}
                            {analytics.expenseCount} pengeluaran
                        </p>
                    </div>

                    {/* Active Students */}
                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-gray-600">
                                Siswa Aktif Bayar
                            </p>
                            <Users className="w-5 h-5 text-blue-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800 mb-1">
                            {analytics.uniquePayingStudents}
                        </p>
                        <p className="text-sm text-gray-500">
                            Rata-rata: {formatRp(analytics.avgPaymentAmount)}
                        </p>
                    </div>
                </div>
            )}

            {/* Debt Alert */}
            {analytics && analytics.totalDebt > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                            <p className="font-semibold text-yellow-900">
                                Total Tunggakan: {formatRp(analytics.totalDebt)}
                            </p>
                            <p className="text-sm text-yellow-700">
                                {analytics.studentsWithDebt} siswa memiliki
                                tunggakan yang perlu ditagih
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Income vs Expense Line Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-lg font-bold text-gray-800">
                            Pemasukan vs Pengeluaran
                        </h3>
                    </div>
                    <IncomeVsExpenseChart
                        payments={payments}
                        expenses={expenses}
                        timeRange={timeRange}
                    />
                </div>

                {/* Expense Category Pie Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <PieChart className="w-5 h-5 text-purple-600" />
                        <h3 className="text-lg font-bold text-gray-800">
                            Kategori Pengeluaran
                        </h3>
                    </div>
                    <ExpenseCategoryPieChart
                        expenses={expenses}
                        timeRange={timeRange}
                    />
                </div>
            </div>

            {/* Weekly Payment Bar Chart */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-bold text-gray-800">
                        Pembayaran Per Minggu
                    </h3>
                </div>
                <WeeklyPaymentBarChart payments={payments} />
            </div>

            {/* Payment Heatmap */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-bold text-gray-800">
                        Heatmap Kehadiran Pembayaran
                    </h3>
                </div>
                <PaymentHeatmap students={students} payments={payments} />
            </div>

            {/* Debt Trend Chart */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-red-600" />
                    <h3 className="text-lg font-bold text-gray-800">
                        Trend Tunggakan
                    </h3>
                </div>
                <DebtTrendChart students={students} payments={payments} />
            </div>
        </div>
    );
};

export default DashboardAnalytics;
