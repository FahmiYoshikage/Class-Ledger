import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
    LogOut,
    Shield,
    Home,
    Activity,
    Laptop,
    Key,
    Menu,
    X,
    QrCode,
    HardDrive,
    Sun,
    Moon,
} from 'lucide-react';

const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
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
        const base = 'flex items-center gap-1.5 px-3 py-1.5 text-[12px] sm:text-[13px] font-medium rounded-xl transition-all duration-200';
        const variants = {
            primary: 'text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/20',
            danger: 'text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-300 border border-transparent hover:border-rose-200 dark:hover:border-rose-500/20',
            default: active
                ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/15 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/[0.06] border border-transparent',
        };
        return (
            <button onClick={onClick} className={`${base} ${variants[variant]}`}>
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
            </button>
        );
    };

    const MobileNavButton = ({ onClick, icon: Icon, label, variant = 'default' }) => {
        const base = 'w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium rounded-xl transition-all duration-200';
        const variants = {
            primary: 'text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/20',
            danger: 'text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10',
            default: 'text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]',
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
        <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#09090b] dark:text-white selection:bg-indigo-500/30 transition-colors duration-200">
            {/* Top Navigation */}
            <nav className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-white/[0.08] bg-white/85 dark:bg-zinc-950/80 backdrop-blur-2xl shadow-sm dark:shadow-xl dark:shadow-black/40 transition-colors duration-200">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14">
                        {/* User Info with Live Status Indicator */}
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/20">
                                <Shield className="w-4 h-4 text-white" />
                            </div>
                            <div className="hidden sm:block">
                                <div className="flex items-center gap-1.5">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    <p className="text-[13px] font-semibold text-slate-900 dark:text-white leading-tight">
                                        {user?.fullName || 'Bendahara'}
                                    </p>
                                </div>
                                <p className="text-[10px] text-indigo-600 dark:text-indigo-300/80 font-mono tracking-wider uppercase">
                                    Official Ledger Admin
                                </p>
                            </div>
                        </div>

                        {/* Desktop Nav */}
                        <div className="hidden lg:flex items-center gap-1.5">
                            {location.pathname !== '/app/dashboard' && (
                                <NavButton
                                    onClick={() => navigate('/app/dashboard')}
                                    icon={Home}
                                    label="Dashboard"
                                    variant="primary"
                                />
                            )}
                            <NavButton
                                onClick={() => navigate('/app/qr-admin')}
                                icon={QrCode}
                                label="QR Admin"
                                active={location.pathname === '/app/qr-admin'}
                            />
                            <NavButton
                                onClick={() => navigate('/app/backup')}
                                icon={HardDrive}
                                label="Backup"
                                active={location.pathname === '/app/backup'}
                            />
                            <NavButton
                                onClick={() => navigate('/app/audit-logs')}
                                icon={Activity}
                                label="Logs"
                                active={location.pathname === '/app/audit-logs'}
                            />
                            <NavButton
                                onClick={() => navigate('/app/sessions')}
                                icon={Laptop}
                                label="Sesi"
                                active={location.pathname === '/app/sessions'}
                            />
                            <NavButton
                                onClick={() => navigate('/app/change-password')}
                                icon={Key}
                                label="Ganti Password"
                                active={location.pathname === '/app/change-password'}
                            />

                            {/* Theme Toggle Button */}
                            <button
                                onClick={toggleTheme}
                                className="ml-1 p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-amber-300 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
                                title={theme === 'dark' ? 'Ganti ke Mode Terang (Light Mode)' : 'Ganti ke Mode Gelap (Dark Mode)'}
                                aria-label="Toggle Theme"
                            >
                                {theme === 'dark' ? (
                                    <Sun className="w-4 h-4 text-amber-400" />
                                ) : (
                                    <Moon className="w-4 h-4 text-indigo-600" />
                                )}
                            </button>

                            <div className="w-px h-5 bg-slate-200 dark:bg-white/[0.08] mx-1" />
                            <NavButton
                                onClick={handleLogout}
                                icon={LogOut}
                                label="Logout"
                                variant="danger"
                            />
                        </div>

                        {/* Mobile Menu & Theme Toggle */}
                        <div className="flex lg:hidden items-center gap-2">
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-amber-300 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all"
                                title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                            >
                                {theme === 'dark' ? (
                                    <Sun className="w-4 h-4 text-amber-400" />
                                ) : (
                                    <Moon className="w-4 h-4 text-indigo-600" />
                                )}
                            </button>
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="p-2 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] rounded-xl transition-colors"
                            >
                                {mobileMenuOpen ? (
                                    <X className="w-5 h-5" />
                                ) : (
                                    <Menu className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="lg:hidden border-t border-slate-200 dark:border-white/[0.08] py-2.5 pb-4 space-y-1 animate-fade-in">
                            {location.pathname !== '/app/dashboard' && (
                                <MobileNavButton onClick={() => navigate('/app/dashboard')} icon={Home} label="Dashboard" variant="primary" />
                            )}
                            <MobileNavButton onClick={() => navigate('/app/qr-admin')} icon={QrCode} label="QR Admin" />
                            <MobileNavButton onClick={() => navigate('/app/backup')} icon={HardDrive} label="Backup & Restore" />
                            <MobileNavButton onClick={() => navigate('/app/audit-logs')} icon={Activity} label="Audit Logs" />
                            <MobileNavButton onClick={() => navigate('/app/sessions')} icon={Laptop} label="Sesi Aktif" />
                            <MobileNavButton onClick={() => navigate('/app/change-password')} icon={Key} label="Ganti Password" />
                            <div className="border-t border-slate-200 dark:border-white/[0.08] my-1.5" />
                            <MobileNavButton onClick={handleLogout} icon={LogOut} label="Logout" variant="danger" />
                        </div>
                    )}
                </div>
            </nav>

            {/* Page Content - Full Width & Functional */}
            <main className="w-full px-3 sm:px-6 lg:px-8 py-3 sm:py-5">
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout;
