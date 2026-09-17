import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Trophy,
    Medal,
    TrendingUp,
    Clock,
    Users,
    RefreshCw,
    ArrowLeft,
    Sun,
    Moon,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAppConfig } from '../../context/ConfigContext';

const API_URL =
    (typeof window !== 'undefined' && window.__ENV__?.VITE_API_URL) ||
    import.meta.env.VITE_API_URL ||
    '/api';

const Leaderboard = () => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { config } = useAppConfig();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshingBadges, setRefreshingBadges] = useState(false);
    const [stats, setStats] = useState({
        totalDonors: 0,
        lastUpdated: null,
    });

    useEffect(() => {
        fetchLeaderboard();

        // Auto-refresh every 5 minutes
        const interval = setInterval(fetchLeaderboard, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchLeaderboard = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/leaderboard`);

            if (response.data.success) {
                setLeaderboard(response.data.leaderboard);
                setStats({
                    totalDonors: response.data.totalDonors,
                    lastUpdated: new Date(response.data.lastUpdated),
                });
            }
        } catch (err) {
            console.error('Error fetching leaderboard:', err);
            setError('Gagal memuat leaderboard. Silakan refresh halaman.');
        } finally {
            setLoading(false);
        }
    };

    const refreshAllBadges = async () => {
        try {
            setRefreshingBadges(true);
            const response = await axios.post(
                `${API_URL}/badges/calculate-all`
            );

            if (response.data.success) {
                // Refresh leaderboard after badges calculated
                await fetchLeaderboard();
                alert(
                    `✅ Badge berhasil di-refresh!\n\nTotal: ${response.data.totalStudents} siswa\nBadge: ${response.data.totalBadges} badge`
                );
            }
        } catch (err) {
            console.error('Error refreshing badges:', err);
            alert('❌ Gagal refresh badge. Silakan coba lagi.');
        } finally {
            setRefreshingBadges(false);
        }
    };

    const formatRupiah = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getRankEmoji = (rank) => {
        switch (rank) {
            case 1:
                return '🥇';
            case 2:
                return '🥈';
            case 3:
                return '🥉';
            default:
                return '🏅';
        }
    };

    const getRankColor = (rank) => {
        switch (rank) {
            case 1:
                return 'from-yellow-400 to-yellow-600';
            case 2:
                return 'from-slate-300 to-slate-500';
            case 3:
                return 'from-amber-500 to-amber-700';
            default:
                return 'from-indigo-500 to-violet-600';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] flex items-center justify-center transition-colors duration-200">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-indigo-500 mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-white/60 text-base font-medium">
                        Memuat leaderboard...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] flex items-center justify-center p-4 transition-colors duration-200">
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/[0.12] rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
                    <div className="text-5xl mb-4">😔</div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        Oops!
                    </h2>
                    <p className="text-slate-600 dark:text-white/60 mb-6 text-sm">{error}</p>
                    <button
                        onClick={fetchLeaderboard}
                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium shadow-md shadow-indigo-500/20 text-sm"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-white py-8 px-4 sm:px-6 lg:px-8 page-transition transition-colors duration-200 relative selection:bg-indigo-500 selection:text-white">
            {/* Ambient Aurora Glow */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

            <div className="max-w-5xl mx-auto">
                {/* Navigation Bar */}
                <div className="flex items-center justify-between gap-4 mb-8">
                    <button
                        onClick={() => navigate('/')}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.05] text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white font-medium text-xs sm:text-sm backdrop-blur-md transition-all shadow-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Kembali ke Dashboard</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.05] text-slate-600 dark:text-amber-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all shadow-sm backdrop-blur-md"
                            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                        >
                            {theme === 'dark' ? (
                                <Sun className="w-4 h-4 text-amber-400" />
                            ) : (
                                <Moon className="w-4 h-4 text-indigo-600" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Header */}
                <div className="text-center mb-10 animate-slide-up">
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500 dark:text-amber-400 drop-shadow-md" />
                        <h1 className="text-3xl sm:text-5xl font-black bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400 bg-clip-text text-transparent tracking-tight">
                            LEADERBOARD
                        </h1>
                        <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500 dark:text-amber-400 drop-shadow-md" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white/90 mb-2">
                        🎯 DONATUR KAS TERBAIK {config?.className ? `• ${config.className}` : ''} 🎯
                    </h2>
                    <p className="text-slate-600 dark:text-white/60 text-sm sm:text-base max-w-lg mx-auto">
                        Top siswa dengan kontribusi kas terbesar & tercepat
                    </p>
                </div>

                {/* Refresh Badge Button */}
                <div className="flex justify-end mb-4">
                    <button
                        onClick={refreshAllBadges}
                        disabled={refreshingBadges}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm ${
                            refreshingBadges
                                ? 'bg-slate-100 dark:bg-white/[0.08] text-slate-400 dark:text-white/40 cursor-not-allowed border border-slate-200 dark:border-white/10'
                                : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-100 dark:hover:bg-indigo-500/20'
                        }`}
                    >
                        <RefreshCw
                            className={`w-4 h-4 ${
                                refreshingBadges ? 'animate-spin' : ''
                            }`}
                        />
                        {refreshingBadges
                            ? 'Memperbarui Badge...'
                            : '🎖️ Sinkronkan Badge'}
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div className="rounded-2xl bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-white/[0.08] p-5 sm:p-6 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
                        <div className="p-3 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl border border-violet-100 dark:border-violet-500/20">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">
                                Total Donatur
                            </p>
                            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                                {stats.totalDonors} Siswa
                            </p>
                        </div>
                    </div>
                    <div className="rounded-2xl bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-white/[0.08] p-5 sm:p-6 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">
                                Update Terakhir
                            </p>
                            <p className="text-lg font-bold text-slate-900 dark:text-white">
                                {stats.lastUpdated?.toLocaleTimeString(
                                    'id-ID',
                                    {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    }
                                )} WIB
                            </p>
                        </div>
                    </div>
                </div>

                {/* Leaderboard */}
                {leaderboard.length === 0 ? (
                    <div className="bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-white/[0.08] rounded-2xl p-12 text-center shadow-sm">
                        <div className="text-5xl mb-4">📊</div>
                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                            Belum Ada Data
                        </h3>
                        <p className="text-slate-500 dark:text-white/60 text-sm">
                            Leaderboard akan muncul setelah ada pembayaran kas
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {leaderboard.map((donor, index) => {
                            const rank = index + 1;
                            const isTopThree = rank <= 3;

                            return (
                                <div
                                    key={donor.studentId}
                                    className={`
                                        bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-white/[0.08] rounded-2xl overflow-hidden
                                        transform transition-all duration-300 hover:shadow-lg shadow-sm
                                        ${
                                            isTopThree
                                                ? 'ring-2 ring-offset-2 dark:ring-offset-zinc-950 ring-offset-white'
                                                : ''
                                        }
                                        ${rank === 1 ? 'ring-yellow-400 dark:ring-yellow-500' : ''}
                                        ${rank === 2 ? 'ring-slate-300 dark:ring-slate-500' : ''}
                                        ${rank === 3 ? 'ring-amber-500 dark:ring-amber-600' : ''}
                                    `}
                                >
                                    <div className="flex items-center gap-4 p-4 sm:p-6">
                                        {/* Rank Badge */}
                                        <div
                                            className={`
                                            flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 
                                            rounded-2xl bg-gradient-to-br ${getRankColor(
                                                rank
                                            )} 
                                            flex items-center justify-center text-white 
                                            font-black text-2xl sm:text-3xl shadow-md
                                            ${isTopThree ? 'animate-pulse' : ''}
                                        `}
                                        >
                                            {isTopThree
                                                ? getRankEmoji(rank)
                                                : rank}
                                        </div>

                                        {/* Donor Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1.5">
                                                <div className="min-w-0">
                                                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                                                        {donor.nickname}
                                                    </h3>
                                                    <p className="text-xs sm:text-sm text-slate-500 dark:text-white/50">
                                                        Absen {donor.absen} •{' '}
                                                        {donor.paymentCount}x bayar
                                                    </p>
                                                </div>
                                                {isTopThree && (
                                                    <Medal className="w-6 h-6 text-amber-500 dark:text-amber-400 flex-shrink-0" />
                                                )}
                                            </div>

                                            {/* Donation Amount */}
                                            <div className="flex items-center gap-2 mb-2">
                                                <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                                <span className="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                                                    {formatRupiah(
                                                        donor.totalDonation
                                                    )}
                                                </span>
                                            </div>

                                            {/* Badges */}
                                            {donor.badges &&
                                                donor.badges.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 mt-2 mb-2">
                                                        {donor.badges.map(
                                                            (badge, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="group relative inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all hover:scale-105 shadow-xs"
                                                                    style={{
                                                                        backgroundColor:
                                                                            badge.bgColor,
                                                                        color: badge.textColor,
                                                                    }}
                                                                    title={
                                                                        badge.description
                                                                    }
                                                                >
                                                                    <span>
                                                                        {
                                                                            badge.emoji
                                                                        }
                                                                    </span>
                                                                    <span className="hidden sm:inline">
                                                                        {
                                                                            badge.name
                                                                        }
                                                                    </span>

                                                                    {/* Tooltip */}
                                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                                                                        {
                                                                            badge.description
                                                                        }
                                                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                                                            <div className="border-4 border-transparent border-t-slate-900 dark:border-t-white"></div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                )}

                                            {/* Earliest Payment Badge */}
                                            {donor.earliestPayment && (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 rounded-full text-xs font-medium text-slate-700 dark:text-indigo-300">
                                                    <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                                    <span>Pertama bayar: {new Date(
                                                        donor.earliestPayment
                                                    ).toLocaleDateString(
                                                        'id-ID',
                                                        {
                                                            day: 'numeric',
                                                            month: 'short',
                                                        }
                                                    )}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Top 3 Special Strip */}
                                    {isTopThree && (
                                        <div
                                            className={`h-1.5 bg-gradient-to-r ${getRankColor(
                                                rank
                                            )}`}
                                        ></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Footer */}
                <div className="mt-12 text-center pb-8">
                    <p className="text-slate-500 dark:text-white/60 text-sm mb-3">
                        💪 Ayo semangat bayar kas! Raih posisi teratas! 🚀
                    </p>
                    <button
                        onClick={fetchLeaderboard}
                        className="px-5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.05] text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/10 font-medium text-xs sm:text-sm transition-all shadow-sm"
                    >
                        🔄 Segarkan Leaderboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
