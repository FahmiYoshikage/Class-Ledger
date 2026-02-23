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
        <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <div className="bg-[#0071e3] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-apple">
                        <Wallet className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Kas Kelas TRIFORCE
                    </h1>
                    <p className="text-gray-600">
                        Sistem Pencatatan Keuangan Kelas
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-apple-lg p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        Login ke Akun
                    </h2>

                    {/* Error Alert */}
                    {error && (
                        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded">
                            <div className="flex items-center">
                                <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Username */}
                        <div>
                            <label
                                htmlFor="username"
                                className="block text-sm font-medium text-gray-600 mb-2"
                            >
                                Username
                            </label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 bg-[#f5f5f7] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0071e3] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
                                placeholder="Masukkan username"
                                required
                                autoFocus
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-600 mb-2"
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
                                    className="w-full px-4 py-3 bg-[#f5f5f7] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0071e3] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 pr-12"
                                    placeholder="Masukkan password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-600"
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
                            className="w-full bg-[#0071e3] text-white py-3 rounded-xl hover:bg-[#0077ED] transition-all duration-200 flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
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
                    {/*<div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-500 font-medium mb-2">
                            🔐 Demo Credentials:
                        </p>
                        <div className="text-xs text-blue-500 space-y-1">
                            <p>
                                <strong>Admin:</strong> username: admin /
                                password: admin123
                            </p>
                        </div>
                    </div>*/}
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-600">
                        Lupa password? Hubungi bendahara kelas
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
