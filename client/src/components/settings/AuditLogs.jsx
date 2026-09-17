import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
    Clock,
    Filter,
    Search,
    Activity,
    User,
    CheckCircle,
    XCircle,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        action: '',
        resource: '',
        startDate: '',
        endDate: '',
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0,
    });
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetchLogs();
        fetchStats();
    }, [pagination.page, filters]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                ...filters,
            };

            // Remove empty filters
            Object.keys(params).forEach((key) => {
                if (!params[key]) delete params[key];
            });

            const response = await api.get('/audit-logs', { params });
            setLogs(response.data.data || []);
            setPagination(response.data.pagination || pagination);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const params = {};
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;

            const response = await api.get('/audit-logs/stats', {
                params,
            });
            setStats(response.data.data || null);
        } catch (error) {
            console.error('Error fetching stats:', error);
            setStats(null);
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
        setPagination((prev) => ({ ...prev, page: 1 })); // Reset to page 1
    };

    const clearFilters = () => {
        setFilters({
            action: '',
            resource: '',
            startDate: '',
            endDate: '',
        });
    };

    const getActionBadge = (action) => {
        const colorMap = {
            LOGIN: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30',
            LOGOUT: 'bg-slate-100 text-slate-700 dark:bg-white/[0.08] dark:text-white border border-slate-200 dark:border-white/10',
            CREATE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30',
            UPDATE: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30',
            DELETE: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30',
        };

        const actionType = action.split('_')[1] || action;
        const color = colorMap[actionType] || 'bg-slate-100 text-slate-700 dark:bg-white/[0.08] dark:text-white border border-slate-200 dark:border-white/10';

        return (
            <span
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${color}`}
            >
                {action}
            </span>
        );
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
            <div className="rounded-2xl bg-white/80 dark:bg-zinc-950/60 border border-slate-200 dark:border-white/10 p-6 flex items-center justify-between shadow-sm">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Activity className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        Audit Logs
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-white/60 mt-1">
                        Track semua aktivitas pengguna dan perubahan data di sistem kas
                    </p>
                </div>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/10 p-5 shadow-sm">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/60">
                            Total Actions
                        </h3>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                            {stats.actionStats.reduce(
                                (sum, stat) => sum + stat.count,
                                0
                            )}
                        </p>
                    </div>
                    <div className="rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/10 p-5 shadow-sm">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/60">
                            Success Rate
                        </h3>
                        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
                            {stats.actionStats.length > 0
                                ? (
                                      (stats.actionStats.reduce(
                                          (sum, stat) =>
                                              sum + stat.successCount,
                                          0
                                      ) /
                                          stats.actionStats.reduce(
                                              (sum, stat) =>
                                                  sum + stat.count,
                                              0
                                          )) *
                                      100
                                  ).toFixed(1)
                                : 0}
                            %
                        </p>
                    </div>
                    <div className="rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/10 p-5 shadow-sm">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/60">
                            Active Users
                        </h3>
                        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
                            {stats.topUsers.length}
                        </p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/10 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Filter Log</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-white/70 mb-1.5">
                            Action
                        </label>
                        <select
                            value={filters.action}
                            onChange={(e) =>
                                handleFilterChange('action', e.target.value)
                            }
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.06] border border-slate-300 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all text-xs sm:text-sm text-slate-900 dark:text-white"
                        >
                            <option value="">All Actions</option>
                            <option value="LOGIN">Login</option>
                            <option value="LOGOUT">Logout</option>
                            <option value="USER_CREATE">User Create</option>
                            <option value="USER_UPDATE">User Update</option>
                            <option value="USER_DELETE">User Delete</option>
                            <option value="PAYMENT_CREATE">
                                Payment Create
                            </option>
                            <option value="EXPENSE_CREATE">
                                Expense Create
                            </option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-white/70 mb-1.5">
                            Resource
                        </label>
                        <select
                            value={filters.resource}
                            onChange={(e) =>
                                handleFilterChange(
                                    'resource',
                                    e.target.value
                                )
                            }
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.06] border border-slate-300 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all text-xs sm:text-sm text-slate-900 dark:text-white"
                        >
                            <option value="">All Resources</option>
                            <option value="Auth">Auth</option>
                            <option value="User">User</option>
                            <option value="Student">Student</option>
                            <option value="Payment">Payment</option>
                            <option value="Expense">Expense</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-white/70 mb-1.5">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) =>
                                handleFilterChange(
                                    'startDate',
                                    e.target.value
                                )
                            }
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.06] border border-slate-300 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all text-xs sm:text-sm text-slate-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-white/70 mb-1.5">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) =>
                                handleFilterChange(
                                    'endDate',
                                    e.target.value
                                )
                            }
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.06] border border-slate-300 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all text-xs sm:text-sm text-slate-900 dark:text-white"
                        />
                    </div>
                </div>
                <div className="mt-4">
                    <button
                        onClick={clearFilters}
                        className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                    >
                        Reset Filter
                    </button>
                </div>
            </div>

            {/* Logs Table */}
            <div className="rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-white/[0.04]">
                        <thead className="bg-slate-50 dark:bg-white/[0.04]">
                            <tr>
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-white/60 uppercase tracking-wider">
                                    Waktu
                                </th>
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-white/60 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-white/60 uppercase tracking-wider">
                                    Aksi
                                </th>
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-white/60 uppercase tracking-wider">
                                    Resource
                                </th>
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-white/60 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-white/60 uppercase tracking-wider">
                                    IP Address
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/[0.04]">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="px-6 py-12 text-center text-slate-500 dark:text-white/60"
                                    >
                                        Memuat data log...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="px-6 py-12 text-center text-slate-500 dark:text-white/60"
                                    >
                                        Tidak ada log aktivitas yang ditemukan
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr
                                        key={log._id}
                                        className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-slate-400 dark:text-white/50" />
                                                {formatDate(log.createdAt)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-slate-400 dark:text-white/50" />
                                                <div>
                                                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                                                        {log.user?.fullName ||
                                                            'Unknown'}
                                                    </div>
                                                    <div className="text-xs text-slate-500 dark:text-white/60">
                                                        @{log.user?.username}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getActionBadge(log.action)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                                            {log.resource}
                                            {log.resourceId && (
                                                <span className="text-xs text-slate-500 dark:text-white/60 ml-1">
                                                    #{log.resourceId.slice(-6)}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {log.status === 'SUCCESS' ? (
                                                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span className="text-xs font-semibold">
                                                        Success
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                                                    <XCircle className="w-4 h-4" />
                                                    <span className="text-xs font-semibold">
                                                        Failed
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-white/60 font-mono text-xs">
                                            {log.ipAddress || 'N/A'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && logs.length > 0 && (
                    <div className="bg-slate-50 dark:bg-white/[0.04] px-6 py-4 flex items-center justify-between border-t border-slate-200 dark:border-white/10">
                        <div className="text-xs sm:text-sm text-slate-600 dark:text-white/60">
                            Menampilkan{' '}
                            {(pagination.page - 1) * pagination.limit + 1}{' '}
                            -{' '}
                            {Math.min(
                                pagination.page * pagination.limit,
                                pagination.total
                            )}{' '}
                            dari {pagination.total} log
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() =>
                                    setPagination((prev) => ({
                                        ...prev,
                                        page: prev.page - 1,
                                    }))
                                }
                                disabled={pagination.page === 1}
                                className="p-1.5 border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.06] rounded-lg text-slate-700 dark:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="px-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-white">
                                Halaman {pagination.page} dari {pagination.pages}
                            </span>
                            <button
                                onClick={() =>
                                    setPagination((prev) => ({
                                        ...prev,
                                        page: prev.page + 1,
                                    }))
                                }
                                disabled={
                                    pagination.page >= pagination.pages
                                }
                                className="p-1.5 border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.06] rounded-lg text-slate-700 dark:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLogs;
