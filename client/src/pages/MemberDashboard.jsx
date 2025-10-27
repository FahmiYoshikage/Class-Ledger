import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    User,
    Calendar,
    DollarSign,
    CheckCircle,
    XCircle,
} from 'lucide-react';
import { paymentsAPI, expensesAPI, studentsAPI } from '../services/api';

const MemberDashboard = () => {
    const { user } = useAuth();
    const [studentData, setStudentData] = useState(null);
    const [payments, setPayments] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalPaid: 0,
        totalDebt: 0,
        totalExpenses: 0,
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
            const [paymentsRes, expensesRes] = await Promise.all([
                paymentsAPI.getAll(),
                expensesAPI.getAll(),
            ]);

            // Filter payments for this student only
            const studentPayments = paymentsRes.data.filter(
                (p) =>
                    p.student === user.studentId._id ||
                    p.student === user.studentId ||
                    p.student?._id === user.studentId._id ||
                    p.student?._id === user.studentId
            );

            setPayments(studentPayments);
            setExpenses(expensesRes.data);

            // Calculate stats
            const totalPaid = studentPayments.reduce(
                (sum, p) => sum + (p.amount || 0),
                0
            );
            const totalExpenses = expensesRes.data.reduce(
                (sum, e) => sum + (e.amount || 0),
                0
            );

            setStats({
                totalPaid,
                totalDebt: 0, // TODO: Calculate from expected weekly amount
                totalExpenses,
                paymentCount: studentPayments.length,
            });
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
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-6 h-6 text-yellow-600" />
                            <div>
                                <h3 className="font-semibold text-yellow-900">
                                    Akun Belum Terhubung
                                </h3>
                                <p className="text-sm text-yellow-800 mt-1">
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
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Dashboard Member
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Selamat datang, {user.fullName}!
                    </p>
                </div>

                {/* Student Info Card */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 mb-6 text-white">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-4 rounded-full">
                            <User className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">
                                {studentData?.nama || user.studentId.nama}
                            </h2>
                            <p className="text-indigo-100">
                                No. Absen:{' '}
                                {studentData?.absen || user.studentId.absen}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-green-100 p-3 rounded-lg">
                                <DollarSign className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                        <h3 className="text-sm font-medium text-gray-500">
                            Total Pembayaran
                        </h3>
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                            {formatCurrency(stats.totalPaid)}
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                        <h3 className="text-sm font-medium text-gray-500">
                            Jumlah Transaksi
                        </h3>
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                            {stats.paymentCount}
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-red-100 p-3 rounded-lg">
                                <TrendingDown className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                        <h3 className="text-sm font-medium text-gray-500">
                            Total Pengeluaran Kelas
                        </h3>
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                            {formatCurrency(stats.totalExpenses)}
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-yellow-100 p-3 rounded-lg">
                                <Wallet className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                        <h3 className="text-sm font-medium text-gray-500">
                            Saldo Kas Kelas
                        </h3>
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                            {formatCurrency(
                                stats.totalPaid - stats.totalExpenses
                            )}
                        </p>
                    </div>
                </div>

                {/* Payment History */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                            Riwayat Pembayaran Saya
                        </h2>
                    </div>
                    <div className="p-6">
                        {loading ? (
                            <div className="text-center py-8 text-gray-500">
                                Loading...
                            </div>
                        ) : payments.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                Belum ada pembayaran
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Tanggal
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Minggu Ke
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Jumlah
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {payments.map((payment) => (
                                            <tr key={payment._id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatDate(payment.date)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    Minggu {payment.week}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                                                    {formatCurrency(
                                                        payment.amount
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="flex items-center gap-1 text-green-600">
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

                {/* Recent Expenses */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <TrendingDown className="w-5 h-5 text-red-600" />
                            Pengeluaran Kelas Terbaru
                        </h2>
                    </div>
                    <div className="p-6">
                        {loading ? (
                            <div className="text-center py-8 text-gray-500">
                                Loading...
                            </div>
                        ) : expenses.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                Belum ada pengeluaran
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {expenses.slice(0, 5).map((expense) => (
                                    <div
                                        key={expense._id}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                                    >
                                        <div>
                                            <h3 className="font-semibold text-gray-900">
                                                {expense.description}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {formatDate(expense.date)} •{' '}
                                                {expense.category}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-red-600">
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
