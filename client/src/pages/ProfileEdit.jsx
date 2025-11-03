import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, ArrowLeft, Save, AlertCircle } from 'lucide-react';
import api from '../services/api';

const ProfileEdit = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const [formData, setFormData] = useState({
        username: user?.username || '',
        email: user?.email || '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await api.patch('/auth/profile', formData);

            if (response.data.success) {
                setSuccess('Profile updated successfully!');
                // Update user in context
                updateUser(response.data.user);
                
                // Redirect after 1.5 seconds
                setTimeout(() => {
                    navigate('/app/dashboard');
                }, 1500);
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    'Failed to update profile. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/app/dashboard')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 text-sm sm:text-base"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Kembali ke Dashboard</span>
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        Edit Profile
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-2">
                        Update informasi profile Anda
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
                    {/* Alert Messages */}
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                <p className="text-sm text-green-800">{success}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Username */}
                        <div>
                            <label
                                htmlFor="username"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Username
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="w-5 h-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
                                    placeholder="username"
                                    required
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Username akan digunakan untuk login
                            </p>
                        </div>

                        {/* Email */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Email (Optional)
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="w-5 h-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
                                    placeholder="email@example.com"
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Email untuk notifikasi (optional)
                            </p>
                        </div>

                        {/* Current Info Display */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                Informasi Akun Saat Ini
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Role:</span>
                                    <span className="font-medium text-gray-900 capitalize">
                                        {user?.role}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        Full Name:
                                    </span>
                                    <span className="font-medium text-gray-900">
                                        {user?.fullName}
                                    </span>
                                </div>
                                {user?.studentId && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">
                                            Student Name:
                                        </span>
                                        <span className="font-medium text-gray-900">
                                            {user.studentId?.nama || 'N/A'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                type="button"
                                onClick={() => navigate('/app/dashboard')}
                                className="flex-1 px-4 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base font-medium"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 sm:py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base font-medium"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Updating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        <span>Save Changes</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Info Note */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <p className="font-semibold mb-1">Catatan:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>
                                    Username harus unik dan belum digunakan user lain
                                </li>
                                <li>Email bersifat optional dan bisa dikosongkan</li>
                                <li>
                                    Untuk mengganti password, gunakan menu{' '}
                                    <button
                                        onClick={() =>
                                            navigate('/app/change-password')
                                        }
                                        className="font-semibold underline hover:text-blue-900"
                                    >
                                        Change Password
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileEdit;
