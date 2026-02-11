import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, Wallet, Eye, EyeOff, AlertCircle } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
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
                navigate('/change-password', {
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Wallet className="w-8 h-8 text-slate-50" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-50 mb-2">
                        Kas Kelas TRIFORCE
                    </h1>
                    <p className="text-slate-200">
                        Sistem Pencatatan Keuangan Kelas
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-slate-800/90 border border-slate-700/50 rounded-2xl shadow-xl p-8">
                    <h2 className="text-2xl font-bold text-slate-50 mb-6">
                        Login ke Akun
                    </h2>

                    {/* Error Alert */}
                    {error && (
                        <div className="mb-4 bg-rose-500/20 border-l-4 border-red-400 p-4 rounded">
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
                                className="block text-sm font-medium text-slate-200 mb-2"
                            >
                                Username
                            </label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-700/50 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                                placeholder="Masukkan username"
                                required
                                autoFocus
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-slate-200 mb-2"
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
                                    className="w-full px-4 py-3 border border-slate-700/50 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition pr-12"
                                    placeholder="Masukkan password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-300 hover:text-slate-200"
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
                            className="w-full bg-cyan-600 text-slate-50 py-3 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Logging in...
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    Login
                                </>
                            )}
                        </button>
                    </form>

                    {/* Demo Credentials */}
                    {/*<div className="mt-6 p-4 bg-sky-500/20 rounded-lg">
                        <p className="text-sm text-sky-300 font-medium mb-2">
                            🔐 Demo Credentials:
                        </p>
                        <div className="text-xs text-sky-300 space-y-1">
                            <p>
                                <strong>Admin:</strong> username: admin /
                                password: admin123
                            </p>
                        </div>
                    </div>*/}
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-slate-200">
                        Lupa password? Hubungi bendahara kelas
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
