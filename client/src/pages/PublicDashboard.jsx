import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    Calendar,
    Users,
    LogIn,
    Eye,
    EyeOff,
    Gift,
    Trophy,
    Medal,
    Award,
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PublicDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        totalStudents: 0,
        totalTransactions: 0,
    });
    const [events, setEvents] = useState([]);
    const [recentPayments, setRecentPayments] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPublicData();
    }, []);

    const fetchPublicData = async () => {
        try {
            setLoading(true);

            // Use axios directly without auth interceptor for public access
            // Only fetch payments, expenses, and students (no users endpoint needed)
            const [paymentsRes, expensesRes, studentsRes] =
                await Promise.all([
                    axios.get(`${API_URL}/payments`),
                    axios.get(`${API_URL}/expenses`),
                    axios.get(`${API_URL}/students`),
                ]);

            const totalIncome = paymentsRes.data.reduce(
                (sum, p) => sum + (p.amount || 0),
                0
            );
            const totalExpenses = expensesRes.data.reduce(
                (sum, e) => sum + (e.amount || 0),
                0
            );

            // Get events from payments (unique event IDs)
            const eventPayments = paymentsRes.data.filter((p) => p.event);
            console.log('📅 Event Payments:', eventPayments);

            const uniqueEvents = {};
            eventPayments.forEach((p) => {
                const eventId = p.event._id || p.event;
                const eventName = p.event?.name || p.event?.title || 'Unknown';

                if (!uniqueEvents[eventId]) {
                    uniqueEvents[eventId] = {
                        ...p.event,
                        totalPaid: 0,
                        paidCount: 0,
                        payments: [], // Track individual payments for debugging
                    };
                }
                uniqueEvents[eventId].totalPaid += p.amount;
                uniqueEvents[eventId].paidCount += 1;
                uniqueEvents[eventId].payments.push({
                    id: p._id,
                    student: p.student?.name || p.student?.nama || 'Unknown',
                    amount: p.amount,
                    date: p.date,
                });
            });

            // Debug: log each event calculation
            Object.values(uniqueEvents).forEach((event) => {
                console.log(`🎯 Event: ${event.name || event.title}`);
                console.log(`   Total Paid: ${event.totalPaid}`);
                console.log(`   Paid Count: ${event.paidCount}`);
                console.log(`   Payments:`, event.payments);
            });

            // Calculate leaderboard based on students and their payments
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
                    studentPaymentMap[studentId].totalPaid += payment.amount || 0;
                    studentPaymentMap[studentId].paymentCount += 1;
                }
            });

            // Create leaderboard from students with payments
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
                .slice(0, 10); // Top 10 contributors

            console.log('🏆 Public Leaderboard (Top 10):', leaderboardData);

            setStats({
                totalIncome,
                totalExpenses,
                balance: totalIncome - totalExpenses,
                totalStudents: studentsRes.data.length,
                totalTransactions:
                    paymentsRes.data.length + expensesRes.data.length,
            });

            console.log('💰 Public Stats:', {
                totalIncome,
                totalExpenses,
                balance: totalIncome - totalExpenses,
                totalStudents: studentsRes.data.length,
            });

            setEvents(Object.values(uniqueEvents));
            setRecentPayments(paymentsRes.data.slice(0, 5));
            setLeaderboard(leaderboardData);
        } catch (error) {
            console.error('Error fetching public data:', error);
            // Set default values on error
            setStats({
                totalIncome: 0,
                totalExpenses: 0,
                balance: 0,
                totalStudents: 0,
                totalTransactions: 0,
            });
            setEvents([]);
            setRecentPayments([]);
            setLeaderboard([]);
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
            {/* Header with Login Button */}
            <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-white">
                            💰 Kas Kelas
                        </h1>
                        <p className="text-sm text-white/80 hidden sm:block">
                            Transparansi Keuangan Kelas
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/login')}
                        className="flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-lg hover:bg-white/90 transition-all shadow-lg text-sm sm:text-base"
                    >
                        <LogIn className="w-4 h-4" />
                        <span className="hidden sm:inline">Login</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
                {/* Hero Stats */}
                <div className="text-center mb-8 sm:mb-12">
                    <h2 className="text-3xl sm:text-5xl font-bold text-white mb-3 sm:mb-4">
                        {formatCurrency(stats.balance)}
                    </h2>
                    <p className="text-base sm:text-xl text-white/90">
                        Total Saldo Kas Kelas
                    </p>
                    <div className="flex items-center justify-center gap-4 sm:gap-6 mt-4 sm:mt-6 text-white/80 text-sm sm:text-base">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span>{stats.totalStudents} Siswa</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span>{stats.totalTransactions} Transaksi</span>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    {/* Total Income */}
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 sm:p-8">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-green-100 p-3 sm:p-4 rounded-xl">
                                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm sm:text-base text-gray-500 font-medium">
                                    Total Pemasukan
                                </p>
                                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                                    {formatCurrency(stats.totalIncome)}
                                </p>
                            </div>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">
                            Dari pembayaran kas kelas & event
                        </div>
                    </div>

                    {/* Total Expenses */}
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 sm:p-8">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-red-100 p-3 sm:p-4 rounded-xl">
                                <TrendingDown className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm sm:text-base text-gray-500 font-medium">
                                    Total Pengeluaran
                                </p>
                                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                                    {formatCurrency(stats.totalExpenses)}
                                </p>
                            </div>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">
                            Untuk keperluan kelas
                        </div>
                    </div>
                </div>

                {/* Events Section */}
                {events.length > 0 && (
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 sm:p-8 mb-6 sm:mb-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Gift className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600" />
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                                Event Kelas
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {events.map((event, idx) => (
                                <div
                                    key={idx}
                                    className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 sm:p-5 border border-purple-200"
                                >
                                    <h4 className="font-bold text-base sm:text-lg text-gray-900 mb-2">
                                        {event.name || 'Event'}
                                    </h4>
                                    <div className="space-y-1 text-sm text-gray-600">
                                        <p>
                                            Target:{' '}
                                            <span className="font-semibold">
                                                {formatCurrency(
                                                    event.targetAmount || 0
                                                )}
                                            </span>
                                        </p>
                                        <p>
                                            Terkumpul:{' '}
                                            <span className="font-semibold text-green-600">
                                                {formatCurrency(
                                                    event.totalPaid || 0
                                                )}
                                            </span>
                                        </p>
                                        <p>
                                            Peserta:{' '}
                                            <span className="font-semibold">
                                                {event.paidCount || 0} siswa
                                            </span>
                                        </p>
                                    </div>
                                    <div className="mt-3 bg-white rounded-lg overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2"
                                            style={{
                                                width: `${Math.min(
                                                    100,
                                                    ((event.totalPaid || 0) /
                                                        (event.targetAmount ||
                                                            1)) *
                                                        100
                                                )}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Leaderboard Section */}
                {leaderboard.length > 0 && (
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 sm:p-8 mb-6 sm:mb-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-600" />
                            <div>
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                                    🏆 Top Contributors
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                    Siswa dengan kontribusi pembayaran kas
                                    terbesar
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2 sm:space-y-3">
                            {leaderboard.map((member, index) => {
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
                                        className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-200 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            {/* Rank Badge */}
                                            <div
                                                className={`flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                                                    index < 3
                                                        ? `bg-gradient-to-br ${rankColor} text-white shadow-md`
                                                        : 'bg-gray-100 text-gray-600'
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

                                            {/* Student Info */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-sm sm:text-base text-gray-900 truncate">
                                                    {member.studentName}
                                                </h4>
                                                <p className="text-xs sm:text-sm text-gray-500">
                                                    {member.paymentCount}{' '}
                                                    transaksi
                                                </p>
                                            </div>
                                        </div>

                                        {/* Total Amount */}
                                        <div className="text-right flex-shrink-0 ml-3">
                                            <p
                                                className={`font-bold text-sm sm:text-base ${
                                                    index === 0
                                                        ? 'text-yellow-600'
                                                        : index === 1
                                                        ? 'text-gray-600'
                                                        : index === 2
                                                        ? 'text-orange-600'
                                                        : 'text-gray-900'
                                                }`}
                                            >
                                                {formatCurrency(
                                                    member.totalPaid
                                                )}
                                            </p>
                                            {index < 3 && (
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {index === 0
                                                        ? '👑 #1'
                                                        : index === 1
                                                        ? '🥈 #2'
                                                        : '🥉 #3'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                            <p className="text-xs sm:text-sm text-center text-indigo-900 font-medium">
                                💪 Yuk, tingkatkan kontribusimu untuk masuk
                                leaderboard!
                            </p>
                        </div>
                    </div>
                )}

                {/* Call to Action */}
                <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 sm:p-8 text-center">
                    <Wallet className="w-12 h-12 sm:w-16 sm:h-16 text-indigo-600 mx-auto mb-4" />
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                        Ingin Lihat Detail Pembayaran Anda?
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                        Login untuk melihat riwayat pembayaran, total
                        kontribusi, dan informasi keuangan pribadi Anda
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg text-sm sm:text-base font-semibold"
                    >
                        Login Sekarang
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-white/10 backdrop-blur-md border-t border-white/20 mt-8 sm:mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 text-center text-white/80 text-xs sm:text-sm">
                    <p>💰 Sistem Kas Kelas - Transparan & Terpercaya</p>
                    <p className="mt-2">
                        Data diperbarui secara realtime • Login untuk akses
                        lengkap
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PublicDashboard;
