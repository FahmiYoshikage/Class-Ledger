import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

            const response = await axios.get('/api/audit-logs', { params });
            setLogs(response.data.data);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const params = {};
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;

            const response = await axios.get('/api/audit-logs/stats', {
                params,
            });
            setStats(response.data.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
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
            LOGIN: 'bg-green-100 text-green-800',
            LOGOUT: 'bg-gray-100 text-gray-800',
            CREATE: 'bg-blue-100 text-blue-800',
            UPDATE: 'bg-yellow-100 text-yellow-800',
            DELETE: 'bg-red-100 text-red-800',
        };

        const actionType = action.split('_')[1] || action;
        const color = colorMap[actionType] || 'bg-gray-100 text-gray-800';

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
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Activity className="w-8 h-8 text-indigo-600" />
                        Audit Logs
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Track semua aktivitas user di sistem
                    </p>
                </div>

                {/* Statistics Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow p-4">
                            <h3 className="text-sm font-medium text-gray-500">
                                Total Actions
                            </h3>
                            <p className="text-2xl font-bold text-gray-900 mt-2">
                                {stats.actionStats.reduce(
                                    (sum, stat) => sum + stat.count,
                                    0
                                )}
                            </p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <h3 className="text-sm font-medium text-gray-500">
                                Success Rate
                            </h3>
                            <p className="text-2xl font-bold text-green-600 mt-2">
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
                        <div className="bg-white rounded-lg shadow p-4">
                            <h3 className="text-sm font-medium text-gray-500">
                                Active Users
                            </h3>
                            <p className="text-2xl font-bold text-indigo-600 mt-2">
                                {stats.topUsers.length}
                            </p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-5 h-5 text-gray-500" />
                        <h2 className="text-lg font-semibold">Filters</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Action
                            </label>
                            <select
                                value={filters.action}
                                onChange={(e) =>
                                    handleFilterChange('action', e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div className="mt-4">
                        <button
                            onClick={clearFilters}
                            className="text-sm text-indigo-600 hover:text-indigo-800"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                {/* Logs Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Time
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Action
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Resource
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    IP Address
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="px-6 py-12 text-center text-gray-500"
                                    >
                                        Loading...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="px-6 py-12 text-center text-gray-500"
                                    >
                                        No audit logs found
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr
                                        key={log._id}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                {formatDate(log.createdAt)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {log.user?.fullName ||
                                                            'Unknown'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        @{log.user?.username}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getActionBadge(log.action)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {log.resource}
                                            {log.resourceId && (
                                                <span className="text-xs text-gray-500 ml-1">
                                                    #{log.resourceId.slice(-6)}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {log.status === 'SUCCESS' ? (
                                                <div className="flex items-center gap-1 text-green-600">
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span className="text-sm">
                                                        Success
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-red-600">
                                                    <XCircle className="w-4 h-4" />
                                                    <span className="text-sm">
                                                        Failed
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {log.ipAddress || 'N/A'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {!loading && logs.length > 0 && (
                        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                            <div className="text-sm text-gray-700">
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
                                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
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
                                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
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
