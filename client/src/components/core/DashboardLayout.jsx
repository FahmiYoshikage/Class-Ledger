import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
    ChevronDown,
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

    const NavButton = ({ onClick, icon: Icon, label, variant = 'default', active = false }) => {
        const base = 'flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium rounded-lg transition-all duration-200';
        const variants = {
            primary: 'text-indigo-400 hover:bg-indigo-500/8',
            danger: 'text-red-400 hover:bg-red-500/10',
            default: active
                ? 'text-white bg-white/[0.06]'
                : 'text-white/60 hover:text-white/80 hover:bg-white/[0.07]',
        };
        return (
            <button onClick={onClick} className={`${base} ${variants[variant]}`}>
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
            </button>
        );
    };

    const MobileNavButton = ({ onClick, icon: Icon, label, variant = 'default' }) => {
        const base = 'w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium rounded-lg transition-all duration-200';
        const variants = {
            primary: 'text-indigo-400 hover:bg-indigo-500/8',
            danger: 'text-red-400 hover:bg-red-500/10',
            default: 'text-white/60 hover:text-white/90 hover:bg-white/[0.07]',
        };
        return (
            <button
                onClick={() => {
                    onClick();
                    setMobileMenuOpen(false);
                }}
                className={`${base} ${variants[variant]}`}
            >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
            </button>
        );
    };

    return (
        <div className="min-h-screen bg-[#18181b]">
            {/* Top Navigation */}
            <nav className="sticky top-0 z-50 border-b border-white/[0.1] bg-[#18181b]/80 backdrop-blur-2xl">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14">
                        {/* User Info */}
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                                {user?.role === 'admin' ? (
                                    <Shield className="w-4 h-4 text-white" />
                                ) : (
                                    <User className="w-4 h-4 text-white" />
                                )}
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-[13px] font-semibold text-white leading-tight">
                                    {user?.fullName}
                                </p>
                                <p className="text-[11px] text-white/60 capitalize">
                                    {user?.role === 'admin' && '👑 '}
                                    {user?.role}
                                </p>
                            </div>
                        </div>

                        {/* Desktop Nav */}
                        <div className="hidden lg:flex items-center gap-1">
                            {location.pathname !== '/app/dashboard' && (
                                <NavButton
                                    onClick={() => navigate('/app/dashboard')}
                                    icon={Home}
                                    label="Dashboard"
                                    variant="primary"
                                />
                            )}
                            <NavButton
                                onClick={() => navigate('/app/qr-payment')}
                                icon={QrCode}
                                label="QR Pay"
                                variant="primary"
                                active={location.pathname === '/app/qr-payment'}
                            />
                            {user?.role === 'admin' && (
                                <>
                                    <NavButton
                                        onClick={() => navigate('/app/qr-admin')}
                                        icon={QrCode}
                                        label="QR Admin"
                                        active={location.pathname === '/app/qr-admin'}
                                    />
                                    <NavButton
                                        onClick={() => navigate('/app/users')}
                                        icon={UsersIcon}
                                        label="Users"
                                        active={location.pathname === '/app/users'}
                                    />
                                    <NavButton
                                        onClick={() => navigate('/app/audit-logs')}
                                        icon={Activity}
                                        label="Logs"
                                        active={location.pathname === '/app/audit-logs'}
                                    />
                                </>
                            )}
                            <NavButton
                                onClick={() => navigate('/app/profile')}
                                icon={Edit}
                                label="Profile"
                                active={location.pathname === '/app/profile'}
                            />
                            <div className="w-px h-5 bg-white/[0.08] mx-1" />
                            <NavButton
                                onClick={handleLogout}
                                icon={LogOut}
                                label="Logout"
                                variant="danger"
                            />
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden p-2 text-white/60 hover:text-white/80 hover:bg-white/[0.07] rounded-lg transition"
                        >
                            {mobileMenuOpen ? (
                                <X className="w-5 h-5" />
                            ) : (
                                <Menu className="w-5 h-5" />
                            )}
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="lg:hidden border-t border-white/[0.12] py-2 pb-4 space-y-0.5 animate-fade-in">
                            {location.pathname !== '/app/dashboard' && (
                                <MobileNavButton onClick={() => navigate('/app/dashboard')} icon={Home} label="Dashboard" variant="primary" />
                            )}
                            <MobileNavButton onClick={() => navigate('/app/qr-payment')} icon={QrCode} label="QR Payment" variant="primary" />
                            {user?.role === 'admin' && (
                                <>
                                    <MobileNavButton onClick={() => navigate('/app/qr-admin')} icon={QrCode} label="QR Admin" />
                                    <MobileNavButton onClick={() => navigate('/app/users')} icon={UsersIcon} label="Manage Users" />
                                    <MobileNavButton onClick={() => navigate('/app/audit-logs')} icon={Activity} label="Audit Logs" />
                                </>
                            )}
                            <MobileNavButton onClick={() => navigate('/app/profile')} icon={Edit} label="Edit Profile" />
                            <MobileNavButton onClick={() => navigate('/app/change-password')} icon={Key} label="Change Password" />
                            <MobileNavButton onClick={() => navigate('/app/sessions')} icon={Laptop} label="Sessions" />
                            <div className="border-t border-white/[0.12] my-1" />
                            <MobileNavButton onClick={handleLogout} icon={LogOut} label="Logout" variant="danger" />
                        </div>
                    )}
                </div>
            </nav>

            {/* Main Content - Full Width */}
            <main>
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout;
