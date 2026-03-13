import React, { useState, useEffect } from 'react';
import api from '../services/api';
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
            LOGIN: 'bg-indigo-500/[0.05]0/15 text-indigo-400',
            LOGOUT: 'bg-white/[0.04] text-white',
            CREATE: 'bg-indigo-500/[0.05]0/15 text-indigo-400',
            UPDATE: 'bg-amber-500/[0.06]0/15 text-amber-300',
            DELETE: 'bg-rose-500/10 text-rose-300',
        };

        const actionType = action.split('_')[1] || action;
        const color = colorMap[actionType] || 'bg-white/[0.04] text-white';

        return (
            <span
                className={`px-2 py-1 text-xs font-semibold rounded ${color}`}
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
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Activity className="w-8 h-8 text-indigo-400" />
                        Audit Logs
                    </h1>
                    <p className="text-white/60 mt-2">
                        Track semua aktivitas user di sistem
                    </p>
                </div>

                {/* Statistics Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="rounded-xl bg-white/[0.035] border border-white/[0.1] p-4">
                            <h3 className="text-sm font-medium text-white/60">
                                Total Actions
                            </h3>
                            <p className="text-2xl font-bold text-white mt-2">
                                {stats.actionStats.reduce(
                                    (sum, stat) => sum + stat.count,
                                    0
                                )}
                            </p>
                        </div>
                        <div className="rounded-xl bg-white/[0.035] border border-white/[0.1] p-4">
                            <h3 className="text-sm font-medium text-white/60">
                                Success Rate
                            </h3>
                            <p className="text-2xl font-bold text-indigo-400 mt-2">
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
                        <div className="rounded-xl bg-white/[0.035] border border-white/[0.1] p-4">
                            <h3 className="text-sm font-medium text-white/60">
                                Active Users
                            </h3>
                            <p className="text-2xl font-bold text-indigo-400 mt-2">
                                {stats.topUsers.length}
                            </p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="rounded-xl bg-white/[0.035] border border-white/[0.1] p-4 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-5 h-5 text-white/60" />
                        <h2 className="text-lg font-semibold">Filters</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-white/60 mb-1">
                                Action
                            </label>
                            <select
                                value={filters.action}
                                onChange={(e) =>
                                    handleFilterChange('action', e.target.value)
                                }
                                className="w-full px-3 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-xl focus:ring-2 focus:ring-indigo-400/25 focus:border-transparent transition-all duration-200 text-white"
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
                            <label className="block text-sm font-medium text-white/60 mb-1">
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
                                className="w-full px-3 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-xl focus:ring-2 focus:ring-indigo-400/25 focus:border-transparent transition-all duration-200 text-white"
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
                            <label className="block text-sm font-medium text-white/60 mb-1">
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
                                className="w-full px-3 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-xl focus:ring-2 focus:ring-indigo-400/25 focus:border-transparent transition-all duration-200 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-white/60 mb-1">
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
                                className="w-full px-3 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-xl focus:ring-2 focus:ring-indigo-400/25 focus:border-transparent transition-all duration-200 text-white"
                            />
                        </div>
                    </div>
                    <div className="mt-4">
                        <button
                            onClick={clearFilters}
                            className="text-sm text-indigo-400 hover:text-indigo-300"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                {/* Logs Table */}
                <div className="rounded-xl bg-white/[0.035] border border-white/[0.1] overflow-hidden">
                    <table className="min-w-full divide-y divide-white/[0.04]">
                        <thead className="bg-white/[0.04]">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                                    Time
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                                    Action
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                                    Resource
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                                    IP Address
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="px-6 py-12 text-center text-white/60"
                                    >
                                        Loading...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="px-6 py-12 text-center text-white/60"
                                    >
                                        No audit logs found
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr
                                        key={log._id}
                                        className="hover:bg-white/[0.04]"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-white/55" />
                                                {formatDate(log.createdAt)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-white/55" />
                                                <div>
                                                    <div className="text-sm font-medium text-white">
                                                        {log.user?.fullName ||
                                                            'Unknown'}
                                                    </div>
                                                    <div className="text-xs text-white/60">
                                                        @{log.user?.username}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getActionBadge(log.action)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                            {log.resource}
                                            {log.resourceId && (
                                                <span className="text-xs text-white/60 ml-1">
                                                    #{log.resourceId.slice(-6)}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {log.status === 'SUCCESS' ? (
                                                <div className="flex items-center gap-1 text-indigo-400">
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span className="text-sm">
                                                        Success
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-rose-300">
                                                    <XCircle className="w-4 h-4" />
                                                    <span className="text-sm">
                                                        Failed
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                                            {log.ipAddress || 'N/A'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {!loading && logs.length > 0 && (
                        <div className="bg-white/[0.04] px-6 py-4 flex items-center justify-between border-t border-white/[0.12]">
                            <div className="text-sm text-white/60">
                                Showing{' '}
                                {(pagination.page - 1) * pagination.limit + 1}{' '}
                                to{' '}
                                {Math.min(
                                    pagination.page * pagination.limit,
                                    pagination.total
                                )}{' '}
                                of {pagination.total} results
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() =>
                                        setPagination((prev) => ({
                                            ...prev,
                                            page: prev.page - 1,
                                        }))
                                    }
                                    disabled={pagination.page === 1}
                                    className="px-3 py-1 border border-white/[0.1] rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/[0.07]"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="px-3 py-1 text-sm">
                                    Page {pagination.page} of {pagination.pages}
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
                                    className="px-3 py-1 border border-white/[0.1] rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/[0.07]"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;
