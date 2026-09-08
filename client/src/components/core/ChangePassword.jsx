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
        <div className="min-h-screen bg-white/[0.04] flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-[#1e1e22] border border-white/[0.12] rounded-2xl p-8">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="bg-indigo-500/[0.05]0/[0.06] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {isFirstLogin
                                ? 'Set Password Baru'
                                : 'Ubah Password'}
                        </h2>
                        {isFirstLogin && (
                            <div className="bg-amber-500/[0.06] border-l-2 border-amber-300/40 p-3 rounded text-left">
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
                        <div className="mb-4 bg-rose-500/[0.05] border-l-2 border-rose-400/50 p-4 rounded">
                            <div className="flex items-center">
                                <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                                <p className="text-rose-300 text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Current Password */}
                        <div>
                            <label className="block text-sm font-medium text-white/60 mb-2">
                                Password Saat Ini
                            </label>
                            <div className="relative">
                                <input
                                    type={showCurrent ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) =>
                                        setCurrentPassword(e.target.value)
                                    }
                                    className="w-full px-4 py-3 border border-white/[0.1] rounded-lg focus:ring-2 focus:ring-indigo-400/25 focus:border-transparent pr-12"
                                    placeholder="Masukkan password saat ini"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrent(!showCurrent)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/60"
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
                            <label className="block text-sm font-medium text-white/60 mb-2">
                                Password Baru
                            </label>
                            <div className="relative">
                                <input
                                    type={showNew ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) =>
                                        setNewPassword(e.target.value)
                                    }
                                    className="w-full px-4 py-3 border border-white/[0.1] rounded-lg focus:ring-2 focus:ring-indigo-400/25 focus:border-transparent pr-12"
                                    placeholder="Minimal 6 karakter"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/60"
                                >
                                    {showNew ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-white/60 mt-1">
                                Minimal 6 karakter
                            </p>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-white/60 mb-2">
                                Konfirmasi Password Baru
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    className="w-full px-4 py-3 border border-white/[0.1] rounded-lg focus:ring-2 focus:ring-indigo-400/25 focus:border-transparent pr-12"
                                    placeholder="Ketik ulang password baru"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/60"
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
                                        ? 'text-indigo-400'
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
                            className="w-full bg-indigo-500/[0.05]0 text-white py-3 rounded-lg hover:bg-blue-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
                                className="w-full bg-white/[0.04] text-white/60 py-3 rounded-lg hover:bg-white/[0.07] transition font-medium"
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
