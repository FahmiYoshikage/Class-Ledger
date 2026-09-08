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
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Monitor className="w-8 h-8 text-indigo-400" />
                        Session Management
                    </h1>
                    <p className="text-white/60 mt-2">
                        Kelola perangkat yang terhubung dengan akun Anda
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-rose-500/[0.05] border border-rose-500/20 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-rose-300" />
                            <div>
                                <h3 className="font-semibold text-rose-300">
                                    Error
                                </h3>
                                <p className="text-sm text-rose-300 mt-1">
                                    {error}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="rounded-xl bg-white/[0.035] border border-white/[0.1] p-4">
                        <h3 className="text-sm font-medium text-white/60">
                            Total Sessions
                        </h3>
                        <p className="text-2xl font-bold text-white mt-2">
                            {stats.total}
                        </p>
                    </div>
                    <div className="rounded-xl bg-white/[0.035] border border-white/[0.1] p-4">
                        <h3 className="text-sm font-medium text-white/60">
                            Active Sessions
                        </h3>
                        <p className="text-2xl font-bold text-indigo-400 mt-2">
                            {stats.active}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-300 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="font-semibold text-amber-300">
                                Keamanan Akun
                            </h3>
                            <p className="text-sm text-amber-300 mt-1">
                                Jika Anda melihat perangkat yang tidak dikenal,
                                segera hentikan sesi tersebut dan ganti password
                                Anda.
                            </p>
                            <button
                                onClick={handleTerminateAll}
                                className="mt-3 px-4 py-2 bg-amber-500/[0.06]0/15 text-amber-300 border border-amber-400/15 rounded-lg hover:bg-amber-500/[0.06]0/25 transition text-sm font-medium"
                            >
                                Logout Semua Perangkat Lain
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sessions List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="rounded-xl bg-white/[0.035] border border-white/[0.1] p-8 text-center text-white/60">
                            Loading sessions...
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="rounded-xl bg-white/[0.035] border border-white/[0.1] p-8 text-center text-white/60">
                            Tidak ada sesi aktif
                        </div>
                    ) : (
                        sessions.map((session) => (
                            <div
                                key={session._id}
                                className={`rounded-xl bg-white/[0.035] border border-white/[0.1] p-6 ${
                                    session.isCurrent
                                        ? 'ring-2 ring-[#0071e3]'
                                        : ''
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4 flex-1">
                                        {/* Device Icon */}
                                        <div
                                            className={`p-3 rounded-lg ${
                                                session.isCurrent
                                                    ? 'bg-indigo-500/[0.05]0/[0.06] text-indigo-400'
                                                    : 'bg-white/[0.04] text-white/60'
                                            }`}
                                        >
                                            {getDeviceIcon(
                                                session.deviceInfo?.device
                                            )}
                                        </div>

                                        {/* Session Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold text-white">
                                                    {session.deviceInfo
                                                        ?.browser ||
                                                        'Unknown Browser'}{' '}
                                                    on{' '}
                                                    {session.deviceInfo?.os ||
                                                        'Unknown OS'}
                                                </h3>
                                                {session.isCurrent && (
                                                    <span className="flex items-center gap-1 px-2 py-1 bg-indigo-500/[0.05]0/15 text-indigo-400 text-xs font-semibold rounded">
                                                        <CheckCircle className="w-3 h-3" />
                                                        Current Session
                                                    </span>
                                                )}
                                            </div>

                                            <div className="space-y-1 text-sm text-white/60">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4" />
                                                    <span>
                                                        IP: {session.ipAddress}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4" />
                                                    <span>
                                                        Last activity:{' '}
                                                        {formatDate(
                                                            session.lastActivity
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4" />
                                                    <span>
                                                        Created:{' '}
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
                                            className="flex items-center gap-2 px-3 py-2 text-rose-300 hover:bg-rose-500/[0.05] rounded-lg transition text-sm font-medium"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Terminate
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default SessionManagement;
