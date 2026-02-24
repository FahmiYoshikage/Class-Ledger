import React, { useState, useEffect } from 'react';
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
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPublicData();
    }, []);

    const fetchPublicData = async () => {
        try {
            setLoading(true);
            const [paymentsRes, expensesRes, studentsRes] = await Promise.all([
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

            const eventPayments = paymentsRes.data.filter((p) => p.event);
            const uniqueEvents = {};
            eventPayments.forEach((p) => {
                const eventId = p.event._id || p.event;
                if (!uniqueEvents[eventId]) {
                    uniqueEvents[eventId] = {
                        ...p.event,
                        totalPaid: 0,
                        paidCount: 0,
                    };
                }
                uniqueEvents[eventId].totalPaid += p.amount;
                uniqueEvents[eventId].paidCount += 1;
            });

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
                .slice(0, 10);

            setStats({
                totalIncome,
                totalExpenses,
                balance: totalIncome - totalExpenses,
                totalStudents: studentsRes.data.length,
                totalTransactions: paymentsRes.data.length + expensesRes.data.length,
            });
            setEvents(Object.values(uniqueEvents));
            setLeaderboard(leaderboardData);
        } catch (error) {
            console.error('Error fetching public data:', error);
            setStats({ totalIncome: 0, totalExpenses: 0, balance: 0, totalStudents: 0, totalTransactions: 0 });
            setEvents([]);
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
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <p className="text-white/40 text-sm">Memuat data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#09090b] text-white selection:bg-blue-500/30">
            {/* Sticky Nav */}
            <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-2xl">
                <div className="px-5 sm:px-8 lg:px-12">
                    <div className="flex items-center justify-between h-14 sm:h-16">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                            </div>
                            <span className="font-semibold text-white text-sm sm:text-[15px] tracking-tight">
                                Kas Kelas
                            </span>
                            <span className="hidden sm:inline text-[13px] text-white/30 font-medium">
                                TRIFORCE
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => navigate('/leaderboard')}
                                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.06] text-white/60 hover:text-white/90 transition-all text-[13px]"
                            >
                                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                                <span className="hidden sm:inline">Leaderboard</span>
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="flex items-center gap-1.5 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full bg-white text-[#09090b] hover:bg-white/90 transition-all text-[13px] font-semibold"
                            >
                                <LogIn className="w-3.5 h-3.5" />
                                <span>Login</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative overflow-hidden">
                {/* Ambient glow */}
                <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-blue-600/[0.04] blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute top-20 right-1/4 w-[400px] h-[300px] bg-violet-600/[0.03] blur-[100px] rounded-full pointer-events-none" />

                <div className="relative px-5 sm:px-8 lg:px-12 pt-20 sm:pt-28 pb-16 sm:pb-20">
                    <p className="text-blue-400 text-[13px] font-semibold mb-4 tracking-widest uppercase">
                        Transparansi Keuangan
                    </p>
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter text-white leading-[0.95] mb-5">
                        {formatCurrency(stats.balance)}
                    </h1>
                    <p className="text-base sm:text-lg text-white/35 mb-10 max-w-lg leading-relaxed">
                        Total saldo kas kelas saat ini. Semua transaksi tercatat transparan dan real-time.
                    </p>
                    <div className="flex flex-wrap gap-5 sm:gap-8 text-[13px] text-white/30">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{stats.totalStudents} Siswa</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            <span>{stats.totalTransactions} Transaksi</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="px-5 sm:px-8 lg:px-12 pb-14">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Income */}
                    <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-6 sm:p-8 hover:bg-white/[0.04] hover:border-white/[0.09] transition-all duration-300 group">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/15 w-fit mb-5">
                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                        </div>
                        <p className="text-[13px] text-white/35 mb-1 font-medium">Total Pemasukan</p>
                        <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                            {formatCurrency(stats.totalIncome)}
                        </p>
                        <p className="text-xs text-white/20 mt-4">Dari pembayaran kas kelas & event</p>
                    </div>
                    {/* Expenses */}
                    <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-6 sm:p-8 hover:bg-white/[0.04] hover:border-white/[0.09] transition-all duration-300 group">
                        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/15 w-fit mb-5">
                            <TrendingDown className="w-5 h-5 text-rose-400" />
                        </div>
                        <p className="text-[13px] text-white/35 mb-1 font-medium">Total Pengeluaran</p>
                        <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                            {formatCurrency(stats.totalExpenses)}
                        </p>
                        <p className="text-xs text-white/20 mt-4">Untuk keperluan kelas</p>
                    </div>
                </div>
            </section>

            {/* Events */}
            {events.length > 0 && (
                <section className="px-5 sm:px-8 lg:px-12 pb-14">
                    <div className="flex items-center gap-2.5 mb-5">
                        <Gift className="w-[18px] h-[18px] text-violet-400" />
                        <h2 className="text-[15px] font-semibold text-white">Event Kelas</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {events.map((event, idx) => {
                            const progress = Math.min(100, ((event.totalPaid || 0) / (event.targetAmount || 1)) * 100);
                            return (
                                <div key={idx} className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-5 sm:p-6 hover:bg-white/[0.04] transition-all">
                                    <h3 className="font-semibold text-white text-[15px] mb-4">{event.name || 'Event'}</h3>
                                    <div className="space-y-2.5 text-[13px]">
                                        <div className="flex justify-between">
                                            <span className="text-white/30">Target</span>
                                            <span className="text-white/60 font-medium">{formatCurrency(event.targetAmount || 0)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-white/30">Terkumpul</span>
                                            <span className="text-blue-400 font-medium">{formatCurrency(event.totalPaid || 0)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-white/30">Peserta</span>
                                            <span className="text-white/60 font-medium">{event.paidCount || 0} siswa</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
                                    </div>
                                    <p className="text-[11px] text-white/20 mt-2 text-right">{progress.toFixed(0)}%</p>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
                <section className="px-5 sm:px-8 lg:px-12 pb-14">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2.5">
                            <Trophy className="w-[18px] h-[18px] text-amber-400" />
                            <h2 className="text-[15px] font-semibold text-white">Top Contributors</h2>
                        </div>
                        <button onClick={() => navigate('/leaderboard')} className="flex items-center gap-1 text-[13px] text-white/30 hover:text-white/60 transition">
                            Selengkapnya <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] overflow-hidden">
                        {leaderboard.map((member, index) => {
                            const rankColors = ['text-amber-400', 'text-white/20', 'text-orange-400'];
                            const rankBg = ['bg-amber-400/10 border-amber-400/20', 'bg-white/[0.1]/10 border-white/[0.1]/20', 'bg-orange-400/10 border-orange-400/20'];
                            const RankIcon = index === 0 ? Trophy : index === 1 ? Medal : index === 2 ? Award : null;
                            return (
                                <div key={member.studentId} className={`flex items-center justify-between px-5 sm:px-6 py-3.5 hover:bg-white/[0.015] transition-colors ${index !== leaderboard.length - 1 ? 'border-b border-white/[0.04]' : ''}`}>
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${index < 3 ? rankBg[index] : 'bg-white/[0.03] border-white/[0.06]'}`}>
                                            {RankIcon ? <RankIcon className={`w-3.5 h-3.5 ${rankColors[index]}`} /> : <span className="text-[11px] font-semibold text-white/40">{index + 1}</span>}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-medium text-white/90 truncate">{member.studentName}</p>
                                            <p className="text-[11px] text-white/25">{member.paymentCount} transaksi</p>
                                        </div>
                                    </div>
                                    <p className={`text-[13px] font-semibold flex-shrink-0 ml-4 ${index < 3 ? rankColors[index] : 'text-white/50'}`}>
                                        {formatCurrency(member.totalPaid)}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* CTA */}
            <section className="px-5 sm:px-8 lg:px-12 pb-20">
                <div className="rounded-2xl bg-gradient-to-br from-blue-500/[0.08] to-violet-500/[0.06] border border-blue-500/[0.08] p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
                            Lihat Detail Pembayaranmu
                        </h3>
                        <p className="text-white/30 text-sm max-w-md leading-relaxed">
                            Login untuk melihat riwayat pembayaran, total kontribusi, dan status keuanganmu.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/login')}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-[#09090b] hover:bg-white/90 transition-all text-sm font-semibold flex-shrink-0 shadow-lg shadow-white/5"
                    >
                        Login Sekarang
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/[0.04]">
                <div className="px-5 sm:px-8 lg:px-12 py-6 sm:py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                            <Wallet className="w-2.5 h-2.5 text-white" />
                        </div>
                        <span className="text-[13px] text-white/20">Kas Kelas TRIFORCE</span>
                    </div>
                    <p className="text-[11px] text-white/15">Data diperbarui secara real-time</p>
                </div>
            </footer>
        </div>
    );
};

export default PublicDashboard;
