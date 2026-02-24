import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Trophy,
    Medal,
    TrendingUp,
    Clock,
    Users,
    RefreshCw,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Leaderboard = () => {
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
                return 'from-gray-300 to-gray-500';
            case 3:
                return 'from-orange-400 to-orange-600';
            default:
                return 'from-blue-400 to-blue-600';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white/[0.04] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-white/50 text-lg">
                        Memuat leaderboard...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white/[0.04] flex items-center justify-center p-4">
                <div className="bg-[#111113] border border-white/[0.08] rounded-2xl p-8 max-w-md w-full text-center">
                    <div className="text-6xl mb-4">😔</div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Oops!
                    </h2>
                    <p className="text-white/50 mb-6">{error}</p>
                    <button
                        onClick={fetchLeaderboard}
                        className="px-6 py-3 bg-violet-500/15 text-violet-400 border border-violet-500/20 rounded-lg hover:bg-violet-500/25 transition font-medium"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white/[0.04] py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Trophy className="w-12 h-12 text-amber-400 animate-bounce" />
                        <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                            LEADERBOARD
                        </h1>
                        <Trophy className="w-12 h-12 text-amber-400 animate-bounce" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                        🎯 DONATOR KELAS TERBAIK 🎯
                    </h2>
                    <p className="text-white/50 text-sm sm:text-base">
                        Top 10 siswa dengan kontribusi kas terbesar & tercepat
                    </p>
                </div>

                {/* Refresh Badge Button */}
                <div className="flex justify-end mb-4">
                    <button
                        onClick={refreshAllBadges}
                        disabled={refreshingBadges}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                            refreshingBadges
                                ? 'bg-white/[0.08] text-white/50 cursor-not-allowed'
                                : 'bg-blue-500/[0.06]0 text-white hover:bg-blue-600  hover:-lg'
                        }`}
                    >
                        <RefreshCw
                            className={`w-4 h-4 ${
                                refreshingBadges ? 'animate-spin' : ''
                            }`}
                        />
                        {refreshingBadges
                            ? 'Refreshing Badge...'
                            : '🎖️ Refresh Badge'}
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div className="rounded-xl bg-white/[0.025] border border-white/[0.06]-apple p-6 flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-full">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-white/50">
                                Total Donatur
                            </p>
                            <p className="text-2xl font-bold text-white">
                                {stats.totalDonors} Siswa
                            </p>
                        </div>
                    </div>
                    <div className="rounded-xl bg-white/[0.025] border border-white/[0.06]-apple p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-full">
                            <Clock className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-white/50">
                                Update Terakhir
                            </p>
                            <p className="text-lg font-semibold text-white">
                                {stats.lastUpdated?.toLocaleTimeString(
                                    'id-ID',
                                    {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    }
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Leaderboard */}
                {leaderboard.length === 0 ? (
                    <div className="bg-[#111113] border border-white/[0.08] rounded-2xl p-12 text-center">
                        <div className="text-6xl mb-4">📊</div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                            Belum Ada Data
                        </h3>
                        <p className="text-white/50">
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
                                        bg-[#111113] border border-white/[0.08] rounded-2xl overflow-hidden
                                        transform transition-all duration-300 hover:scale-102 hover:shadow-2xl
                                        ${
                                            isTopThree
                                                ? 'ring-4 ring-offset-2'
                                                : ''
                                        }
                                        ${rank === 1 ? 'ring-yellow-400' : ''}
                                        ${rank === 2 ? 'ring-gray-400' : ''}
                                        ${rank === 3 ? 'ring-orange-400' : ''}
                                    `}
                                >
                                    <div className="flex items-center gap-4 p-4 sm:p-6">
                                        {/* Rank Badge */}
                                        <div
                                            className={`
                                            flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 
                                            rounded-full bg-gradient-to-br ${getRankColor(
                                                rank
                                            )} 
                                            flex items-center justify-center text-white 
                                            font-bold text-2xl sm:text-3xl 
                                            ${isTopThree ? 'animate-pulse' : ''}
                                        `}
                                        >
                                            {isTopThree
                                                ? getRankEmoji(rank)
                                                : rank}
                                        </div>

                                        {/* Donor Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="min-w-0">
                                                    <h3 className="text-xl sm:text-2xl font-bold text-white truncate">
                                                        {donor.nickname}
                                                    </h3>
                                                    <p className="text-sm text-white/30">
                                                        Absen {donor.absen} •{' '}
                                                        {donor.paymentCount}x
                                                        bayar
                                                    </p>
                                                </div>
                                                {isTopThree && (
                                                    <Medal className="w-6 h-6 text-amber-400 flex-shrink-0" />
                                                )}
                                            </div>

                                            {/* Donation Amount */}
                                            <div className="flex items-center gap-2 mb-2">
                                                <TrendingUp className="w-5 h-5 text-blue-400" />
                                                <span className="text-2xl sm:text-3xl font-extrabold text-blue-400">
                                                    {formatRupiah(
                                                        donor.totalDonation
                                                    )}
                                                </span>
                                            </div>

                                            {/* Badges */}
                                            {donor.badges &&
                                                donor.badges.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2 mb-2">
                                                        {donor.badges.map(
                                                            (badge, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="group relative inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105"
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
                                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-white/[0.9] text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 ">
                                                                        {
                                                                            badge.description
                                                                        }
                                                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                                                            <div className="border-4 border-transparent border-t-gray-900"></div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                )}

                                            {/* Earliest Payment Badge */}
                                            {donor.earliestPayment && (
                                                <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 rounded-full text-xs font-medium text-blue-400">
                                                    <Clock className="w-3 h-3" />
                                                    Pertama bayar:{' '}
                                                    {new Date(
                                                        donor.earliestPayment
                                                    ).toLocaleDateString(
                                                        'id-ID',
                                                        {
                                                            day: 'numeric',
                                                            month: 'short',
                                                        }
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Top 3 Special Background */}
                                    {isTopThree && (
                                        <div
                                            className={`h-2 bg-gradient-to-r ${getRankColor(
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
                <div className="mt-12 text-center">
                    <p className="text-white/30 text-sm">
                        💪 Ayo semangat bayar kas! Raih posisi teratas! 🚀
                    </p>
                    <button
                        onClick={fetchLeaderboard}
                        className="mt-4 px-6 py-2 bg-violet-500/15 text-violet-400 border border-violet-500/20 rounded-lg hover:bg-violet-500/25 transition font-medium text-sm"
                    >
                        🔄 Refresh Leaderboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
