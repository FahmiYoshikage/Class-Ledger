import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LogOut,
    User,
    Shield,
    Users as UsersIcon,
    Home,
    Activity,
    Laptop,
} from 'lucide-react';

const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        if (window.confirm('Yakin ingin logout?')) {
            await logout();
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Top Navigation Bar */}
            <div className="bg-white shadow-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* User Info */}
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 p-2 rounded-lg">
                                {user?.role === 'admin' ? (
                                    <Shield className="w-5 h-5 text-indigo-600" />
                                ) : (
                                    <User className="w-5 h-5 text-indigo-600" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">
                                    {user?.fullName}
                                </p>
                                <p className="text-xs text-gray-500 capitalize">
                                    {user?.role === 'admin' && '👑 '}
                                    {user?.role}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            {/* Back to Dashboard (if not on dashboard) */}
                            {location.pathname !== '/dashboard' && (
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                >
                                    <Home className="w-4 h-4" />
                                    <span className="hidden sm:inline">
                                        Dashboard
                                    </span>
                                </button>
                            )}

                            {/* User Management (Admin Only) */}
                            {user?.role === 'admin' && (
                                <>
                                    <button
                                        onClick={() => navigate('/users')}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
                                    >
                                        <UsersIcon className="w-4 h-4" />
                                        <span className="hidden sm:inline">
                                            Manage Users
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => navigate('/audit-logs')}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
                                    >
                                        <Activity className="w-4 h-4" />
                                        <span className="hidden sm:inline">
                                            Audit Logs
                                        </span>
                                    </button>
                                </>
                            )}

                            {/* Change Password */}
                            <button
                                onClick={() => navigate('/change-password')}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
                            >
                                <User className="w-4 h-4" />
                                <span className="hidden sm:inline">
                                    Profile
                                </span>
                            </button>

                            {/* Sessions */}
                            <button
                                onClick={() => navigate('/sessions')}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
                            >
                                <Laptop className="w-4 h-4" />
                                <span className="hidden sm:inline">
                                    Sessions
                                </span>
                            </button>

                            {/* Logout */}
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <Outlet />
        </div>
    );
};

export default DashboardLayout;
