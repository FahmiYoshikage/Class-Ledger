import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-slate-800/90 border border-slate-700/50 rounded-2xl shadow-xl p-8">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-8 h-8 text-cyan-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-50 mb-2">
                            {isFirstLogin
                                ? 'Set Password Baru'
                                : 'Ubah Password'}
                        </h2>
                        {isFirstLogin && (
                            <div className="bg-amber-500/20 border-l-4 border-yellow-400 p-3 rounded text-left">
                                <div className="flex items-start">
                                    <AlertCircle className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" />
                                    <p className="text-sm text-amber-300">
                                        Untuk keamanan, silakan ubah password
                                        default Anda.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="mb-4 bg-rose-500/20 border-l-4 border-red-400 p-4 rounded">
                            <div className="flex items-center">
                                <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                                <p className="text-rose-300 text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Current Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-200 mb-2">
                                Password Saat Ini
                            </label>
                            <div className="relative">
                                <input
                                    type={showCurrent ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) =>
                                        setCurrentPassword(e.target.value)
                                    }
                                    className="w-full px-4 py-3 border border-slate-700/50 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent pr-12"
                                    placeholder="Masukkan password saat ini"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrent(!showCurrent)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-300 hover:text-slate-200"
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
                            <label className="block text-sm font-medium text-slate-200 mb-2">
                                Password Baru
                            </label>
                            <div className="relative">
                                <input
                                    type={showNew ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) =>
                                        setNewPassword(e.target.value)
                                    }
                                    className="w-full px-4 py-3 border border-slate-700/50 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent pr-12"
                                    placeholder="Minimal 6 karakter"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-300 hover:text-slate-200"
                                >
                                    {showNew ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-slate-300 mt-1">
                                Minimal 6 karakter
                            </p>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-200 mb-2">
                                Konfirmasi Password Baru
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    className="w-full px-4 py-3 border border-slate-700/50 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent pr-12"
                                    placeholder="Ketik ulang password baru"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-300 hover:text-slate-200"
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
                                className={`flex items-center gap-2 text-sm ${
                                    newPassword === confirmPassword
                                        ? 'text-cyan-400'
                                        : 'text-rose-300'
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
                            className="w-full bg-cyan-600 text-slate-50 py-3 rounded-lg hover:bg-indigo-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
                                className="w-full bg-slate-700/50 text-slate-200 py-3 rounded-lg hover:bg-gray-200 transition font-medium"
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
