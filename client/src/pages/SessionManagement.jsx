import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
            const response = await axios.get('/api/sessions');
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
            const response = await axios.get('/api/sessions/stats');
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
            await axios.delete(`/api/sessions/${sessionId}`);
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
            await axios.delete('/api/sessions/actions/terminate-all');
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
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Monitor className="w-8 h-8 text-indigo-600" />
                        Session Management
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Kelola perangkat yang terhubung dengan akun Anda
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <div>
                                <h3 className="font-semibold text-red-900">
                                    Error
                                </h3>
                                <p className="text-sm text-red-800 mt-1">
                                    {error}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-4">
                        <h3 className="text-sm font-medium text-gray-500">
                            Total Sessions
                        </h3>
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                            {stats.total}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <h3 className="text-sm font-medium text-gray-500">
                            Active Sessions
                        </h3>
                        <p className="text-2xl font-bold text-green-600 mt-2">
                            {stats.active}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="font-semibold text-yellow-900">
                                Keamanan Akun
                            </h3>
                            <p className="text-sm text-yellow-800 mt-1">
                                Jika Anda melihat perangkat yang tidak dikenal,
                                segera hentikan sesi tersebut dan ganti password
                                Anda.
                            </p>
                            <button
                                onClick={handleTerminateAll}
                                className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition text-sm font-medium"
                            >
                                Logout Semua Perangkat Lain
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sessions List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                            Loading sessions...
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                            Tidak ada sesi aktif
                        </div>
                    ) : (
                        sessions.map((session) => (
                            <div
                                key={session._id}
                                className={`bg-white rounded-lg shadow p-6 ${
                                    session.isCurrent
                                        ? 'ring-2 ring-indigo-500'
                                        : ''
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4 flex-1">
                                        {/* Device Icon */}
                                        <div
                                            className={`p-3 rounded-lg ${
                                                session.isCurrent
                                                    ? 'bg-indigo-100 text-indigo-600'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            {getDeviceIcon(
                                                session.deviceInfo?.device
                                            )}
                                        </div>

                                        {/* Session Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold text-gray-900">
                                                    {session.deviceInfo
                                                        ?.browser ||
                                                        'Unknown Browser'}{' '}
                                                    on{' '}
                                                    {session.deviceInfo?.os ||
                                                        'Unknown OS'}
                                                </h3>
                                                {session.isCurrent && (
                                                    <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                                                        <CheckCircle className="w-3 h-3" />
                                                        Current Session
                                                    </span>
                                                )}
                                            </div>

                                            <div className="space-y-1 text-sm text-gray-600">
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
                                            className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition text-sm font-medium"
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
