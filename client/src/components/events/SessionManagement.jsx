import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
    Smartphone,
    Monitor,
    Tablet,
    MapPin,
    Clock,
    AlertTriangle,
    CheckCircle,
    Trash2,
} from 'lucide-react';

const SessionManagement = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, active: 0 });
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check if token exists
        const token = localStorage.getItem('token');
        console.log('Token in localStorage:', token ? 'EXISTS' : 'MISSING');
        console.log('Token length:', token?.length);

        if (!token) {
            setError('No authentication token found. Please login again.');
            setLoading(false);
            return;
        }

        fetchSessions();
        fetchStats();
    }, []);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            console.log('Fetching sessions...');
            const response = await api.get('/sessions');
            console.log('Sessions response:', response.data);
            setSessions(response.data.data || []);
        } catch (error) {
            console.error('Error fetching sessions:', error);
            console.error('Error response:', error.response?.data);
            // Don't show alert, just log the error
            setSessions([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            console.log('Fetching stats...');
            const response = await api.get('/sessions/stats');
            console.log('Stats response:', response.data);
            setStats(response.data.data || { total: 0, active: 0 });
        } catch (error) {
            console.error('Error fetching stats:', error);
            console.error('Error response:', error.response?.data);
            setStats({ total: 0, active: 0 });
        }
    };

    const handleTerminateSession = async (sessionId) => {
        if (
            !window.confirm(
                'Yakin ingin menghentikan sesi ini? Perangkat akan logout otomatis.'
            )
        ) {
            return;
        }

        try {
            await api.delete(`/sessions/${sessionId}`);
            fetchSessions();
            fetchStats();
        } catch (error) {
            console.error('Error terminating session:', error);
            alert('Gagal menghentikan sesi');
        }
    };

    const handleTerminateAll = async () => {
        if (
            !window.confirm(
                'Yakin ingin menghentikan semua sesi lain? Semua perangkat lain akan logout.'
            )
        ) {
            return;
        }

        try {
            await api.delete('/sessions/actions/terminate-all');
            fetchSessions();
            fetchStats();
        } catch (error) {
            console.error('Error terminating all sessions:', error);
            alert('Gagal menghentikan sesi');
        }
    };

    const getDeviceIcon = (device) => {
        switch (device) {
            case 'Mobile':
                return <Smartphone className="w-5 h-5" />;
            case 'Tablet':
                return <Tablet className="w-5 h-5" />;
            default:
                return <Monitor className="w-5 h-5" />;
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="rounded-2xl bg-white/80 dark:bg-zinc-950/60 border border-slate-200 dark:border-white/10 p-6 shadow-sm">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <Monitor className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    Manajemen Sesi Login
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-white/60 mt-1">
                    Kelola perangkat dan sesi aktif yang terhubung dengan akun bendahara Anda
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-rose-500/10 border border-rose-500/25 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                        <div>
                            <h3 className="font-semibold text-rose-700 dark:text-rose-300 text-sm">
                                Error
                            </h3>
                            <p className="text-xs text-rose-600 dark:text-rose-300/90 mt-0.5">
                                {error}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/10 p-5 shadow-sm">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/60">
                        Total Sesi Terdaftar
                    </h3>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                        {stats.total}
                    </p>
                </div>
                <div className="rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/10 p-5 shadow-sm">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/60">
                        Sesi Aktif Sekarang
                    </h3>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
                        {stats.active}
                    </p>
                </div>
            </div>

            {/* Security Notice */}
            <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 sm:p-5">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                        <h3 className="font-bold text-amber-800 dark:text-amber-300 text-sm">
                            Keamanan Akun
                        </h3>
                        <p className="text-xs text-amber-700 dark:text-amber-300/80 mt-1 leading-relaxed">
                            Jika Anda melihat perangkat yang tidak dikenal, segera hentikan sesi tersebut dan ganti password Anda demi keamanan kas kelas.
                        </p>
                        <button
                            onClick={handleTerminateAll}
                            className="mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-sm transition text-xs font-semibold cursor-pointer"
                        >
                            Logout Semua Perangkat Lain
                        </button>
                    </div>
                </div>
            </div>

            {/* Sessions List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/10 p-8 text-center text-slate-500 dark:text-white/60 shadow-sm text-sm">
                        Memuat daftar sesi...
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/10 p-8 text-center text-slate-500 dark:text-white/60 shadow-sm text-sm">
                        Tidak ada sesi aktif ditemukan.
                    </div>
                ) : (
                    sessions.map((session) => (
                        <div
                            key={session._id}
                            className={`rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/10 p-5 sm:p-6 shadow-sm ${
                                session.isCurrent
                                    ? 'ring-2 ring-indigo-500/50'
                                    : ''
                            }`}
                        >
                            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                                <div className="flex items-start gap-3.5 flex-1">
                                    {/* Device Icon */}
                                    <div
                                        className={`p-3 rounded-xl flex items-center justify-center shrink-0 ${
                                            session.isCurrent
                                                ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30'
                                                : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-white/60 border border-slate-200 dark:border-white/10'
                                        }`}
                                    >
                                        {getDeviceIcon(
                                            session.deviceInfo?.device
                                        )}
                                    </div>

                                    {/* Session Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                                                {session.deviceInfo
                                                    ?.browser ||
                                                    'Unknown Browser'}{' '}
                                                di{' '}
                                                {session.deviceInfo?.os ||
                                                    'Unknown OS'}
                                            </h3>
                                            {session.isCurrent && (
                                                <span className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold rounded-full border border-emerald-200 dark:border-emerald-500/30">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Sesi Saat Ini
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-1 text-xs text-slate-500 dark:text-white/60 font-mono">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-white/40" />
                                                <span>
                                                    IP: {session.ipAddress}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-white/40" />
                                                <span>
                                                    Aktivitas terakhir:{' '}
                                                    {formatDate(
                                                        session.lastActivity
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-white/40" />
                                                <span>
                                                    Dibuat:{' '}
                                                    {formatDate(
                                                        session.createdAt
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                {!session.isCurrent && (
                                    <button
                                        onClick={() =>
                                            handleTerminateSession(
                                                session._id
                                            )
                                        }
                                        className="flex items-center gap-1.5 px-3.5 py-1.5 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/20 rounded-xl transition text-xs font-semibold cursor-pointer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Hentikan Sesi
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default SessionManagement;
