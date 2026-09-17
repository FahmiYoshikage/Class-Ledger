import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

const ChangePassword = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const isFirstLogin = location.state?.firstLogin;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (newPassword.length < 6) {
            setError('Password baru minimal 6 karakter');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Password baru dan konfirmasi tidak cocok');
            return;
        }

        setLoading(true);

        try {
            await authAPI.changePassword({
                currentPassword,
                newPassword,
            });

            alert('Password berhasil diubah!');
            navigate('/dashboard');
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    'Gagal mengubah password. Coba lagi.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white dark:bg-[#1e1e22] border border-slate-200 dark:border-white/[0.12] rounded-2xl p-8 shadow-xl">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                            {isFirstLogin
                                ? 'Set Password Baru'
                                : 'Ubah Password'}
                        </h2>
                        {isFirstLogin && (
                            <div className="bg-amber-50 dark:bg-amber-500/[0.06] border-l-4 border-amber-500 p-3 rounded-xl text-left">
                                <div className="flex items-start">
                                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-yellow-400 mr-2 mt-0.5 shrink-0" />
                                    <p className="text-sm text-amber-800 dark:text-amber-300">
                                        Untuk keamanan, silakan ubah password
                                        default Anda.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="mb-4 bg-rose-50 dark:bg-rose-500/[0.05] border-l-4 border-rose-500 p-4 rounded-xl">
                            <div className="flex items-center">
                                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-red-400 mr-2 shrink-0" />
                                <p className="text-rose-700 dark:text-rose-300 text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Current Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-2">
                                Password Saat Ini
                            </label>
                            <div className="relative">
                                <input
                                    type={showCurrent ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) =>
                                        setCurrentPassword(e.target.value)
                                    }
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.06] border border-slate-300 dark:border-white/[0.1] rounded-xl focus:ring-2 focus:ring-indigo-400/25 focus:border-indigo-500 dark:focus:border-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 pr-12 transition-all"
                                    placeholder="Masukkan password saat ini"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrent(!showCurrent)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-white/60 hover:text-slate-600 dark:hover:text-white transition-colors"
                                >
                                    {showCurrent ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-2">
                                Password Baru
                            </label>
                            <div className="relative">
                                <input
                                    type={showNew ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) =>
                                        setNewPassword(e.target.value)
                                    }
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.06] border border-slate-300 dark:border-white/[0.1] rounded-xl focus:ring-2 focus:ring-indigo-400/25 focus:border-indigo-500 dark:focus:border-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 pr-12 transition-all"
                                    placeholder="Minimal 6 karakter"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-white/60 hover:text-slate-600 dark:hover:text-white transition-colors"
                                >
                                    {showNew ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-white/60 mt-1">
                                Minimal 6 karakter
                            </p>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-2">
                                Konfirmasi Password Baru
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.06] border border-slate-300 dark:border-white/[0.1] rounded-xl focus:ring-2 focus:ring-indigo-400/25 focus:border-indigo-500 dark:focus:border-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 pr-12 transition-all"
                                    placeholder="Ketik ulang password baru"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-white/60 hover:text-slate-600 dark:hover:text-white transition-colors"
                                >
                                    {showConfirm ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Password Match Indicator */}
                        {newPassword && confirmPassword && (
                            <div
                                className={`flex items-center gap-2 text-sm font-medium ${
                                    newPassword === confirmPassword
                                        ? 'text-emerald-600 dark:text-indigo-400'
                                        : 'text-rose-600 dark:text-rose-300'
                                }`}
                            >
                                {newPassword === confirmPassword ? (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Password cocok</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="w-4 h-4" />
                                        <span>Password tidak cocok</span>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl transition font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Mengubah...
                                </div>
                            ) : (
                                'Ubah Password'
                            )}
                        </button>

                        {!isFirstLogin && (
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.07] text-slate-700 dark:text-white/60 py-3 rounded-xl transition font-medium border border-slate-200 dark:border-transparent"
                            >
                                Batal
                            </button>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;
