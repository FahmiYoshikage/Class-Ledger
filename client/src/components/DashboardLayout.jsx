import React, { useState } from 'react';
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
    Key,
    Edit,
    Menu,
    X,
    QrCode,
} from 'lucide-react';

const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        if (window.confirm('Yakin ingin logout?')) {
            await logout();
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen bg-[#f5f5f7]">
            {/* Top Navigation Bar */}
            <div className="bg-white/72 backdrop-blur-xl backdrop-saturate-150 border-b border-gray-200/80 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14 sm:h-16">
                        {/* User Info */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="bg-blue-50 p-1.5 sm:p-2 rounded-lg">
                                {user?.role === 'admin' ? (
                                    <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-[#0071e3]" />
                                ) : (
                                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#0071e3]" />
                                )}
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-sm font-semibold text-gray-900">
                                    {user?.fullName}
                                </p>
                                <p className="text-xs text-gray-500 capitalize">
                                    {user?.role === 'admin' && '👑 '}
                                    {user?.role}
                                </p>
                            </div>
                        </div>

                        {/* Desktop Actions - Hidden on mobile */}
                        <div className="hidden lg:flex items-center gap-2">
                            {location.pathname !== '/app/dashboard' && (
                                <button
                                    onClick={() => navigate('/app/dashboard')}
                                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#0071e3] hover:bg-blue-50 rounded-lg transition"
                                >
                                    <Home className="w-4 h-4" />
                                    <span>Dashboard</span>
                                </button>
                            )}

                            <button
                                onClick={() => navigate('/app/qr-payment')}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#0071e3] hover:bg-blue-50 rounded-lg transition"
                            >
                                <QrCode className="w-4 h-4" />
                                <span>QR Pay</span>
                            </button>

                            {user?.role === 'admin' && (
                                <>
                                    <button
                                        onClick={() =>
                                            navigate('/app/qr-admin')
                                        }
                                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                    >
                                        <QrCode className="w-4 h-4" />
                                        <span>QR Admin</span>
                                    </button>
                                    <button
                                        onClick={() => navigate('/app/users')}
                                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                    >
                                        <UsersIcon className="w-4 h-4" />
                                        <span>Users</span>
                                    </button>
                                    <button
                                        onClick={() =>
                                            navigate('/app/audit-logs')
                                        }
                                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                    >
                                        <Activity className="w-4 h-4" />
                                        <span>Logs</span>
                                    </button>
                                </>
                            )}

                            <button
                                onClick={() => navigate('/app/profile')}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            >
                                <Edit className="w-4 h-4" />
                                <span>Profile</span>
                            </button>

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Logout</span>
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        >
                            {mobileMenuOpen ? (
                                <X className="w-5 h-5" />
                            ) : (
                                <Menu className="w-5 h-5" />
                            )}
                        </button>
                    </div>

                    {/* Mobile Menu Dropdown */}
                    {mobileMenuOpen && (
                        <div className="lg:hidden border-t border-gray-100 py-2 space-y-1">
                            {location.pathname !== '/app/dashboard' && (
                                <button
                                    onClick={() => {
                                        navigate('/app/dashboard');
                                        setMobileMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-[#0071e3] hover:bg-blue-50 rounded-lg transition"
                                >
                                    <Home className="w-4 h-4" />
                                    <span>Dashboard</span>
                                </button>
                            )}

                            <button
                                onClick={() => {
                                    navigate('/app/qr-payment');
                                    setMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-[#0071e3] hover:bg-blue-50 rounded-lg transition"
                            >
                                <QrCode className="w-4 h-4" />
                                <span>QR Payment</span>
                            </button>

                            {user?.role === 'admin' && (
                                <>
                                    <button
                                        onClick={() => {
                                            navigate('/app/qr-admin');
                                            setMobileMenuOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                    >
                                        <QrCode className="w-4 h-4" />
                                        <span>QR Admin</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigate('/app/users');
                                            setMobileMenuOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                    >
                                        <UsersIcon className="w-4 h-4" />
                                        <span>Manage Users</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigate('/app/audit-logs');
                                            setMobileMenuOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                    >
                                        <Activity className="w-4 h-4" />
                                        <span>Audit Logs</span>
                                    </button>
                                </>
                            )}

                            <button
                                onClick={() => {
                                    navigate('/app/profile');
                                    setMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            >
                                <Edit className="w-4 h-4" />
                                <span>Edit Profile</span>
                            </button>

                            <button
                                onClick={() => {
                                    navigate('/app/change-password');
                                    setMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            >
                                <Key className="w-4 h-4" />
                                <span>Change Password</span>
                            </button>

                            <button
                                onClick={() => {
                                    navigate('/app/sessions');
                                    setMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            >
                                <Laptop className="w-4 h-4" />
                                <span>Sessions</span>
                            </button>

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <Outlet />
        </div>
    );
};

export default DashboardLayout;
