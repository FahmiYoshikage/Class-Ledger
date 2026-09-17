import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useAppConfig } from '../../context/ConfigContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, Wallet, Eye, EyeOff, AlertCircle, Sun, Moon } from 'lucide-react';

const Login = () => {
    const { config } = useAppConfig();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await login({ username, password });

            // Clear service worker cache on successful login
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map((cacheName) => caches.delete(cacheName))
                );
                console.log('✅ All caches cleared after login');
            }

            // Check if need to change password
            if (response.mustChangePassword) {
                navigate('/app/change-password', {
                    state: { firstLogin: true },
                });
            } else {
                // Force reload to ensure fresh content after cache clear
                window.location.href = '/app/dashboard';
            }
        } catch (err) {
            setError(
                err.response?.data?.message || 'Login failed. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#09090b] dark:text-white flex items-center justify-center p-4 relative transition-colors duration-200">
            {/* Theme Toggle Top Right */}
            <div className="absolute top-4 right-4">
                <button
                    onClick={toggleTheme}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-amber-300 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all shadow-sm"
                    title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                >
                    {theme === 'dark' ? (
                        <Sun className="w-5 h-5 text-amber-400" />
                    ) : (
                        <Moon className="w-5 h-5 text-indigo-600" />
                    )}
                </button>
            </div>

            <div className="max-w-md w-full animate-slide-up">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <div className="bg-gradient-to-br from-indigo-500 to-violet-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-glow shadow-lg shadow-indigo-500/25">
                        <Wallet className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2">
                        Kas {config.className || 'Kelas'}
                    </h1>
                    <p className="text-slate-500 dark:text-white/60 text-sm">
                        {config.institutionName ? `${config.institutionName} • ` : ''}Sistem Pencatatan Keuangan Kelas
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white dark:bg-zinc-950/70 border border-slate-200 dark:border-white/[0.12] rounded-2xl p-6 sm:p-8 shadow-xl">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-6">
                        Login Bendahara
                    </h2>

                    {/* Error Alert */}
                    {error && (
                        <div className="mb-4 bg-rose-500/[0.05] border-l-2 border-rose-400/50 p-4 rounded">
                            <div className="flex items-center">
                                <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                                <p className="text-rose-300 text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Username */}
                        <div>
                            <label
                                htmlFor="username"
                                className="block text-xs font-semibold text-slate-600 dark:text-white/60 mb-2 uppercase tracking-wider"
                            >
                                Username
                            </label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.1] rounded-xl focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all duration-200 text-slate-900 dark:text-white placeholder-slate-400"
                                placeholder="Masukkan username"
                                required
                                autoFocus
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-xs font-semibold text-slate-600 dark:text-white/60 mb-2 uppercase tracking-wider"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.1] rounded-xl focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all duration-200 text-slate-900 dark:text-white placeholder-slate-400 pr-12"
                                    placeholder="Masukkan password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-white/60 hover:text-slate-600 dark:hover:text-white"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-cyber-primary py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Memproses Login...
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    Login Bendahara
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center space-y-2">
                    <p className="text-xs text-slate-500 dark:text-white/40">
                        Portal ini khusus pengurus / bendahara kas kelas
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-semibold transition underline block mx-auto"
                    >
                        ← Kembali ke Dashboard Publik
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
