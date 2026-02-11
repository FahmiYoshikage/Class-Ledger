import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    User,
    Users,
    Calendar,
    DollarSign,
    CheckCircle,
    XCircle,
    Trophy,
    Medal,
    Award,
} from 'lucide-react';
import { paymentsAPI, expensesAPI, studentsAPI } from '../services/api';
import api from '../services/api';

const MemberDashboard = () => {
    const { user } = useAuth();
    const [studentData, setStudentData] = useState(null);
    const [payments, setPayments] = useState([]);
    const [allPayments, setAllPayments] = useState([]); // All class payments
    const [allStudents, setAllStudents] = useState([]); // All students
    const [memberStats, setMemberStats] = useState([]); // Member leaderboard
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalPaid: 0, // Personal payment
        totalClassIncome: 0, // Total class income
        totalExpenses: 0,
        totalClassBalance: 0, // Class balance
        paymentCount: 0,
    });

    useEffect(() => {
        if (user?.studentId) {
            fetchStudentData();
            fetchPayments();
        }
    }, [user]);

    const fetchStudentData = async () => {
        try {
            const response = await studentsAPI.getAll();
            const student = response.data.find(
                (s) => s._id === user.studentId._id || s._id === user.studentId
            );
            setStudentData(student || user.studentId);
        } catch (error) {
            console.error('Error fetching student:', error);
        }
    };

    const fetchPayments = async () => {
        try {
            setLoading(true);
            // Remove /api/users dependency - only fetch payments, expenses, students
            const [paymentsRes, expensesRes, studentsRes] = await Promise.all([
                paymentsAPI.getAll(),
                expensesAPI.getAll(),
                studentsAPI.getAll(),
            ]);

            console.log('👤 Current User:', user);
            console.log('📦 Payments Data:', paymentsRes.data);

            // Save all payments for class total
            setAllPayments(paymentsRes.data);
            setAllStudents(studentsRes.data);

            // Get current student ID (handle both string and object)
            const currentStudentId = user.studentId?._id || user.studentId;
            console.log('🎯 Current Student ID:', currentStudentId);

            // Filter payments for this student only
            const studentPayments = paymentsRes.data.filter((p) => {
                const paymentStudentId = p.student?._id || p.student;
                return paymentStudentId === currentStudentId;
            });

            console.log('💰 Student Payments:', studentPayments);

            setPayments(studentPayments);
            setExpenses(expensesRes.data);

            // Calculate stats
            const totalPaid = studentPayments.reduce(
                (sum, p) => sum + (p.amount || 0),
                0
            );

            // Calculate total class income from ALL payments
            const totalClassIncome = paymentsRes.data.reduce(
                (sum, p) => sum + (p.amount || 0),
                0
            );

            const totalExpenses = expensesRes.data.reduce(
                (sum, e) => sum + (e.amount || 0),
                0
            );

            console.log('📊 Stats:', {
                totalPaid,
                totalClassIncome,
                totalExpenses,
                totalClassBalance: totalClassIncome - totalExpenses,
            });

            setStats({
                totalPaid,
                totalClassIncome,
                totalExpenses,
                totalClassBalance: totalClassIncome - totalExpenses,
                paymentCount: studentPayments.length,
            });

            // Calculate member leaderboard based on students and their payments
            // Group payments by student
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
                    studentPaymentMap[studentId].totalPaid +=
                        payment.amount || 0;
                    studentPaymentMap[studentId].paymentCount += 1;
                }
            });

            // Create leaderboard from students with payments
            const leaderboard = studentsRes.data
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
                .sort((a, b) => b.totalPaid - a.totalPaid); // Sort by total paid descending

            console.log('🏆 Leaderboard:', leaderboard);
            setMemberStats(leaderboard);
        } catch (error) {
            console.error('Error fetching data:', error);
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

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    if (!user?.studentId) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-amber-500/20 border border-yellow-200 rounded-lg p-6">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-6 h-6 text-yellow-600" />
                            <div>
                                <h3 className="font-semibold text-yellow-900">
                                    Akun Belum Terhubung
                                </h3>
                                <p className="text-sm text-amber-300 mt-1">
                                    Akun Anda belum terhubung dengan data siswa.
                                    Silakan hubungi administrator untuk
                                    menghubungkan akun Anda.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-3 sm:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-50">
                        Dashboard Member
                    </h1>
                    <p className="text-sm sm:text-base text-slate-200 mt-2">
                        Selamat datang, {user.fullName}!
                    </p>
                </div>

                {/* Student Info Card */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 text-slate-50">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="bg-white/20 p-3 sm:p-4 rounded-full">
                            <User className="w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold">
                                {studentData?.nama || user.studentId.nama}
                            </h2>
                            <p className="text-sm sm:text-base text-indigo-100">
                                No. Absen:{' '}
                                {studentData?.absen || user.studentId.absen}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-6">
                    {/* Personal Payment */}
                    <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-lg shadow p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className="bg-green-100 p-2 sm:p-3 rounded-lg">
                                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
                            </div>
                        </div>
                        <h3 className="text-xs sm:text-sm font-medium text-slate-300">
                            Pembayaran Saya
                        </h3>
                        <p className="text-lg sm:text-2xl font-bold text-slate-50 mt-1 sm:mt-2">
                            {formatCurrency(stats.totalPaid)}
                        </p>
                        <p className="text-xs text-slate-300 mt-1">
                            {stats.paymentCount} transaksi
                        </p>
                    </div>

                    {/* Total Class Income */}
                    <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-lg shadow p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className="bg-blue-100 p-2 sm:p-3 rounded-lg">
                                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-sky-300" />
                            </div>
                        </div>
                        <h3 className="text-xs sm:text-sm font-medium text-slate-300">
                            Total Pemasukan Kelas
                        </h3>
                        <p className="text-lg sm:text-2xl font-bold text-slate-50 mt-1 sm:mt-2">
                            {formatCurrency(stats.totalClassIncome)}
                        </p>
                        <p className="text-xs text-slate-300 mt-1">
                            {allPayments.length} transaksi total
                        </p>
                    </div>

                    {/* Total Expenses */}
                    <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-lg shadow p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className="bg-red-100 p-2 sm:p-3 rounded-lg">
                                <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-rose-300" />
                            </div>
                        </div>
                        <h3 className="text-xs sm:text-sm font-medium text-slate-300">
                            Total Pengeluaran Kelas
                        </h3>
                        <p className="text-lg sm:text-2xl font-bold text-slate-50 mt-1 sm:mt-2">
                            {formatCurrency(stats.totalExpenses)}
                        </p>
                        <p className="text-xs text-slate-300 mt-1">
                            {expenses.length} transaksi
                        </p>
                    </div>

                    {/* Class Balance */}
                    <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-lg shadow p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className="bg-yellow-100 p-2 sm:p-3 rounded-lg">
                                <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                            </div>
                        </div>
                        <h3 className="text-xs sm:text-sm font-medium text-slate-300">
                            Saldo Kas Kelas
                        </h3>
                        <p className="text-lg sm:text-2xl font-bold text-slate-50 mt-1 sm:mt-2">
                            {formatCurrency(stats.totalClassBalance)}
                        </p>
                        <p className="text-xs text-slate-300 mt-1">
                            Sisa kas kelas
                        </p>
                    </div>
                </div>

                {/* Payment History */}
                <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-lg shadow mb-4 sm:mb-6">
                    <div className="p-4 sm:p-6 border-b border-slate-700/50">
                        <h2 className="text-lg sm:text-xl font-bold text-slate-50 flex items-center gap-2">
                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                            Riwayat Pembayaran Saya
                        </h2>
                    </div>
                    <div className="p-4 sm:p-6">
                        {loading ? (
                            <div className="text-center py-8 text-slate-300">
                                Loading...
                            </div>
                        ) : payments.length === 0 ? (
                            <div className="text-center py-8 text-slate-300">
                                Belum ada pembayaran
                            </div>
                        ) : (
                            <div className="overflow-x-auto -mx-4 sm:mx-0">
                                <table className="min-w-full">
                                    <thead className="bg-slate-800/60">
                                        <tr>
                                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                                                Tanggal
                                            </th>
                                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                                                Minggu
                                            </th>
                                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                                                Jumlah
                                            </th>
                                            <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-700/50">
                                        {payments.map((payment) => (
                                            <tr key={payment._id}>
                                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-slate-50">
                                                    {new Date(
                                                        payment.date
                                                    ).toLocaleDateString(
                                                        'id-ID',
                                                        {
                                                            day: 'numeric',
                                                            month: 'short',
                                                        }
                                                    )}
                                                </td>
                                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-slate-50">
                                                    {payment.week}
                                                </td>
                                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-semibold text-cyan-400">
                                                    {formatCurrency(
                                                        payment.amount
                                                    )}
                                                </td>
                                                <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                                                    <span className="flex items-center gap-1 text-cyan-400">
                                                        <CheckCircle className="w-4 h-4" />
                                                        <span className="text-sm">
                                                            Lunas
                                                        </span>
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Member Leaderboard */}
                <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-lg shadow mb-4 sm:mb-6">
                    <div className="p-4 sm:p-6 border-b border-slate-700/50">
                        <h2 className="text-lg sm:text-xl font-bold text-slate-50 flex items-center gap-2">
                            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                            Leaderboard Member
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-300 mt-1">
                            Total kontribusi pembayaran kas dari semua member
                        </p>
                    </div>
                    <div className="p-4 sm:p-6">
                        {loading ? (
                            <div className="text-center py-8 text-slate-300">
                                Loading...
                            </div>
                        ) : memberStats.length === 0 ? (
                            <div className="text-center py-8 text-slate-300">
                                Belum ada data member
                            </div>
                        ) : (
                            <div className="space-y-2 sm:space-y-3">
                                {memberStats.map((member, index) => {
                                    const isCurrentUser =
                                        member.userId === user._id;
                                    const rankColor =
                                        index === 0
                                            ? 'from-yellow-400 to-yellow-600'
                                            : index === 1
                                            ? 'from-gray-300 to-gray-500'
                                            : index === 2
                                            ? 'from-orange-400 to-orange-600'
                                            : 'from-gray-200 to-gray-300';

                                    const RankIcon =
                                        index === 0
                                            ? Trophy
                                            : index === 1
                                            ? Medal
                                            : index === 2
                                            ? Award
                                            : null;

                                    return (
                                        <div
                                            key={member.userId}
                                            className={`flex items-center justify-between p-3 sm:p-4 rounded-lg ${
                                                isCurrentUser
                                                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300'
                                                    : 'bg-slate-800/60'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                {/* Rank */}
                                                <div
                                                    className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                                                        index < 3
                                                            ? `bg-gradient-to-br ${rankColor} text-slate-50`
                                                            : 'bg-gray-200 text-slate-200'
                                                    }`}
                                                >
                                                    {RankIcon ? (
                                                        <RankIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                                    ) : (
                                                        <span className="text-xs sm:text-sm font-bold">
                                                            {index + 1}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Member Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold text-sm sm:text-base text-slate-50 truncate">
                                                            {member.studentName}
                                                        </h3>
                                                        {isCurrentUser && (
                                                            <span className="text-xs bg-cyan-600 text-slate-50 px-2 py-0.5 rounded-full">
                                                                Anda
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs sm:text-sm text-slate-300">
                                                        {member.paymentCount}{' '}
                                                        transaksi
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Total */}
                                            <div className="text-right flex-shrink-0">
                                                <p
                                                    className={`font-bold text-sm sm:text-base ${
                                                        isCurrentUser
                                                            ? 'text-cyan-400'
                                                            : 'text-slate-50'
                                                    }`}
                                                >
                                                    {formatCurrency(
                                                        member.totalPaid
                                                    )}
                                                </p>
                                                {index < 3 && (
                                                    <p className="text-xs text-slate-300">
                                                        {index === 0
                                                            ? '👑 Top 1'
                                                            : index === 1
                                                            ? '🥈 Top 2'
                                                            : '🥉 Top 3'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Expenses */}
                <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-lg shadow">
                    <div className="p-4 sm:p-6 border-b border-slate-700/50">
                        <h2 className="text-lg sm:text-xl font-bold text-slate-50 flex items-center gap-2">
                            <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-rose-300" />
                            Pengeluaran Kelas Terbaru ```
                        </h2>
                    </div>
                    <div className="p-4 sm:p-6">
                        {loading ? (
                            <div className="text-center py-8 text-slate-300">
                                Loading...
                            </div>
                        ) : expenses.length === 0 ? (
                            <div className="text-center py-8 text-slate-300">
                                Belum ada pengeluaran
                            </div>
                        ) : (
                            <div className="space-y-2 sm:space-y-3">
                                {expenses.slice(0, 5).map((expense) => (
                                    <div
                                        key={expense._id}
                                        className="flex items-center justify-between p-3 sm:p-4 bg-slate-800/60 rounded-lg gap-3"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-sm sm:text-base text-slate-50 truncate">
                                                {expense.description}
                                            </h3>
                                            <p className="text-xs sm:text-sm text-slate-300">
                                                {new Date(
                                                    expense.date
                                                ).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                })}{' '}
                                                • {expense.category}
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
            </div>
        </div>
    );
};

export default MemberDashboard;
