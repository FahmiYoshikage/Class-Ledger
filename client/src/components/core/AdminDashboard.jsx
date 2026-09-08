import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    Users,
    Calendar,
    DollarSign,
    ExclamationCircle,
    BarChart3,
    ChevronRight,
} from 'lucide-react';
import {
    paymentsAPI,
    expensesAPI,
    eventsAPI,
    studentsAPI,
    settingsAPI,
} from '../../services/api';
import api from '../../services/api';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        totalStudents: 0,
        totalTransactions: 0,
    });
    const [payments, setPayments] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [events, setEvents] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchAdminData();
        }
    }, [user]);

    const fetchAdminData = async () => {
        try {
            setLoading(true);
            // Fetch all data for admin overview
            const [
                paymentsRes,
                expensesRes,
                eventsRes,
                studentsRes,
            ] = await Promise.all([
                paymentsAPI.getAll(),
                expensesAPI.getAll(),
                eventsAPI.getAll(),
                studentsAPI.getAll(),
            ]);

            // Calculate stats
            const totalIncome = paymentsRes.data.reduce(
                (sum, p) => sum + (p.amount || 0),
                0
            );
            const totalExpenses = expensesRes.data.reduce(
                (sum, e) => sum + (e.amount || 0),
                0
            );

            setStats({
                totalIncome,
                totalExpenses,
                balance: totalIncome - totalExpenses,
                totalStudents: studentsRes.data.length,
                totalTransactions: paymentsRes.data.length + expensesRes.data.length,
            });

            setPayments(paymentsRes.data);
            setExpenses(expensesRes.data);
            setEvents(eventsRes.data);

            // Build leaderboard from students and their payments
            const studentPaymentMap = {};

            paymentsRes.data.forEach((payment) => {
                const studentId = payment.student?._id || payment.student;
                if (studentId) {
                    if (!studentPaymentMap[studentId]) {
                        studentPaymentMap[studentId] = {
                            totalPaid: 0,
                            paymentCount: 0,
                        };
                    }
                    studentPaymentMap[studentId].totalPaid += payment.amount || 0;
                    studentPaymentMap[studentId].paymentCount += 1;
                }
            });

            const leaderboardData = studentsRes.data
                .filter((student) => studentPaymentMap[student._id])
                .map((student) => {
                    const paymentData = studentPaymentMap[student._id];
                    return {
                        studentId: student._id,
                        studentName: student.name || student.nama || 'Unknown',
                        absen: student.absen,
                        totalPaid: paymentData.totalPaid,
                        paymentCount: paymentData.paymentCount,
                    };
                })
                .sort((a, b) => b.totalPaid - a.totalPaid)
                .slice(0, 10); // Top 10 only

            setLeaderboard(leaderboardData);
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
                <div className="max-w-2xl mx-auto text-center">
                    <AlertCircle className="w-12 h-12 text-amber-300 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white">Akses Ditolak</h2>
                    <p className="text-white/60 mt-4">Silakan login sebagai administrator</p>
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
                    >
                        Login Administrator
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-3 sm:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">
                        Admin Dashboard
                    </h1>
                    <p className="text-sm sm:text-base text-white/60 mt-2">
                        Selamat datang, {user.fullName}!
                    </p>
                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
                    {/* Total Income */}
                    <div className="rounded-xl bg-white/[0.035] border border-white/[0.1] p-4 sm:p-6">
                        <div className="flex items-between justify-between">
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-white/60">
                                    Total Pemasukan
                                </p>
                                <p className="text-2xl sm:text-3xl font-bold text-white mt-1">
                                    {formatCurrency(stats.totalIncome)}
                                </p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-teal-300" />
                            </div>
                        </div>
                    </div>

                    {/* Total Expenses */}
                    <div className="rounded-xl bg-white/[0.035] border border-white/[0.1] p-4 sm:p-6">
                        <div className="flex items-between justify-between">
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-white/60">
                                    Total Pengeluaran
                                </p>
                                <p className="text-2xl sm:text-3xl font-bold text-white mt-1">
                                    {formatCurrency(stats.totalExpenses)}
                                </p>
                            </div>
                            <div className="bg-red-100 p-3 rounded-lg">
                                <TrendingDown className="w-5 h-5 text-rose-300" />
                            </div>
                        </div>
                    </div>

                    {/* Balance */}
                    <div className="rounded-xl bg-white/[0.035] border border-white/[0.1] p-4 sm:p-6">
                        <div className="flex items-between justify-between">
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-white/60">
                                    Saldo Kas
                                </p>
                                <p className="text-2xl sm:text-3xl font-bold text-white mt-1">
                                    {formatCurrency(stats.balance)}
                                </p>
                            </div>
                            <div className="bg-yellow-100 p-3 rounded-lg">
                                <Wallet className="w-5 h-5 text-amber-300" />
                            </div>
                        </div>
                    </div>

                    {/* Total Transactions */}
                    <div className="rounded-xl bg-white/[0.035] border border-white/[0.1] p-4 sm:p-6">
                        <div className="flex items-between justify-between">
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-white/60">
                                    Total Transaksi
                                </p>
                                <p className="text-2xl sm:text-3xl font-bold text-white mt-1">
                                    {stats.totalTransactions}
                                </p>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-lg">
                                <BarChart3 className="w-5 h-5 text-violet-300" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Payments */}
                <div className="rounded-xl bg-white/[0.035] border border-white/[0.1] mb-6 sm:mb-8">
                    <div className="p-4 sm:p-6 border-b border-white/[0.1]">
                        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                            <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                            Riwayat Pembayaran Terbaru
                        </h2>
                    </div>
                    <div className="p-4 sm:p-6">
                        {loading ? (
                            <div className="text-center py-8 text-white/60">
                                Loading...
                            </div>
                        ) : payments.length === 0 ? (
                            <div className="text-center py-8 text-white/60">
                                Belum ada pembayaran
                            </div>
                        ) : (
                            <div className="overflow-x-auto -mx-4 sm:mx-0">
                                <table className="min-w-full">
                                    <thead className="bg-white/[0.04]">
                                        <tr>
                                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                                                Tanggal
                                            </th>
                                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                                                Minggu
                                            </th>
                                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                                                Jumlah
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.04]">
                                        {payments
                                            .slice(0, 10)
                                            .map((payment) => (
                                                <tr key={payment._id}>
                                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-white">
                                                        {new Date(
                                                            payment.date
                                                        ).toLocaleDateString('id-ID', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                        })}
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-white">
                                                        {payment.week || 'N/A'}
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-semibold text-indigo-400">
                                                        {formatCurrency(
                                                            payment.amount
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Expenses */}
                <div className="rounded-xl bg-white/[0.035] border border-white/[0.1] mb-6 sm:mb-8">
                    <div className="p-4 sm:p-6 border-b border-white/[0.1]">
                        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                            <ExclamationCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-300" />
                            Pengeluaran Kelas Terbaru
                        </h2>
                    </div>
                    <div className="p-4 sm:p-6">
                        {loading ? (
                            <div className="text-center py-8 text-white/60">
                                Loading...
                            </div>
                        ) : expenses.length === 0 ? (
                            <div className="text-center py-8 text-white/60">
                                Belum ada pengeluaran
                            </div>
                        ) : (
                            <div className="space-y-2 sm:space-y-3">
                                {expenses.slice(0, 5).map((expense) => (
                                    <div
                                        key={expense._id}
                                        className="flex items-center justify-between p-3 sm:p-4 bg-white/[0.04] rounded-lg gap-3"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-sm sm:text-base text-white truncate">
                                                {expense.description}
                                            </h3>
                                            <p className="text-xs sm:text-sm text-white/60">
                                                {new Date(
                                                    expense.date
                                                ).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                })}{' '}
                                                {expense.category || '-'}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="font-bold text-sm sm:text-base text-rose-300">
                                                {formatCurrency(expense.amount)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Events Summary */}
                {events.length > 0 && (
                    <div className="rounded-xl bg-white/[0.035] border border-white/[0.1] mb-6 sm:mb-8">
                        <h2 className="text-lg sm:text-xl font-bold text-white pb-3 border-b border-white/[0.1]">
                            <Gift className="w-4 h-4 text-violet-400" />
                            Event Kelas
                        </h2>
                        <div className="p-4 sm:p-6 space-y-3">
                            {events.slice(0, 5).map((event) => {
                                const progress = Math.min(
                                    100,
                                    ((event.totalPaid || 0) / (event.targetAmount || 1)) * 100
                                );
                                return (
                                    <div
                                        key={event._id}
                                        className="flex items-center justify-between p-3 sm:p-4 bg-white/[0.04] rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-semibold text-sm sm:text-base text-white truncate">
                                                {event.name || 'Event'}
                                            </h3>
                                            <span className="text-white/60 text-sm">
                                                {progress.toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="text-right text-xs text-white/60">
                                            {formatCurrency(
                                                event.totalPaid || 0
                                            )} / {formatCurrency(
                                                event.targetAmount || 0
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Top Contributors */}
                {leaderboard.length > 0 && (
                    <div className="rounded-xl bg-white/[0.035] border border-white/[0.1]">
                        <h2 className="text-lg sm:text-xl font-bold text-white pb-3 border-b border-white/[0.1]">
                            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
                            Top Kontributor
                        </h2>
                        <div className="p-4 sm:p-6">
                            {leaderboard.map((member, index) => {
                                const rankColors = ['text-amber-300', 'text-white/55', 'text-orange-400'];
                                const rankBg = [
                                    'bg-amber-400/10 border-amber-400/15',
                                    'bg-white/[0.1]/10 border-white/[0.1]/20',
                                    'bg-orange-400/10 border-orange-400/20',
                                ];
                                const RankIcon = index === 0 ? 'Trophy' : index === 1 ? 'Medal' : 'Award';

                                return (
                                    <div
                                        key={member.studentId}
                                        className={`flex items-center justify-between px-5 sm:px-6 py-3.5 hover:bg-white/[0.015] transition-colors`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div
                                                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${index < 3 ? rankBg[index] : 'bg-white/[0.03] border-white/[0.1]'}`}
                                            >
                                                <RankIcon
                                                    className={
                                                        index === 0
                                                            ? 'text-amber-300 text-xs'
                                                            : index === 1
                                                            ? 'text-white/55 text-xs'
                                                            : 'text-orange-400 text-xs'
                                                    }
                                                >
                                                    {index + 1}
                                                </RankIcon>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm sm:text-base text-white truncate">
                                                    {member.studentName}
                                                </p>
                                                <p className="text-xs sm:text-sm text-white/60">
                                                    {member.paymentCount} transaksi
                                                </p>
                                            </div>
                                        </div>
                                        <p className="font-semibold flex-shrink-0 text-amber-300">
                                            {formatCurrency(member.totalPaid)}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;