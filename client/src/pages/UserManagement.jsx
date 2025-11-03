import React, { useState, useEffect } from 'react';
import { authAPI, studentsAPI } from '../services/api';
import {
    Users,
    Plus,
    Trash2,
    Shield,
    User,
    Edit,
    CheckCircle,
    XCircle,
    AlertCircle,
    Key,
    Copy,
    Eye,
} from 'lucide-react';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddUser, setShowAddUser] = useState(false);
    const [error, setError] = useState('');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [resetPasswordData, setResetPasswordData] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [usersRes, studentsRes] = await Promise.all([
                authAPI.getUsers(),
                studentsAPI.getAll(),
            ]);
            setUsers(usersRes.data.users);
            setStudents(studentsRes.data);
        } catch (err) {
            setError('Gagal memuat data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Yakin ingin menghapus user ini?')) return;

        try {
            await authAPI.deleteUser(userId);
            setUsers(users.filter((u) => u._id !== userId));
            alert('User berhasil dihapus');
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menghapus user');
        }
    };

    const handleResetPassword = async (user) => {
        if (
            !window.confirm(
                `Reset password untuk ${user.username}?\n\nPassword akan direset ke: ${user.username}123`
            )
        )
            return;

        try {
            const response = await authAPI.resetPassword(user._id);
            setResetPasswordData({
                username: response.data.username,
                password: response.data.defaultPassword,
            });
            setShowPasswordModal(true);
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal reset password');
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Password copied to clipboard!');
    };

    const handleToggleActive = async (user) => {
        try {
            await authAPI.updateUser(user._id, { isActive: !user.isActive });
            setUsers(
                users.map((u) =>
                    u._id === user._id ? { ...u, isActive: !u.isActive } : u
                )
            );
        } catch (err) {
            alert('Gagal mengubah status user');
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        try {
            const userData = {
                username: formData.get('username'),
                password: formData.get('password'),
                fullName: formData.get('fullName'),
                email: formData.get('email') || undefined,
                role: formData.get('role'),
                studentId: formData.get('studentId') || undefined,
            };

            const response = await authAPI.register(userData);
            setUsers([response.data.user, ...users]);
            setShowAddUser(false);
            alert('User berhasil ditambahkan!');
            e.target.reset();
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menambahkan user');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading users...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-3 sm:p-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
                            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
                            User Management
                        </h1>
                        <p className="text-sm sm:text-base text-gray-500 mt-1 sm:mt-2">
                            Kelola akun pengguna sistem
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddUser(true)}
                        className="w-full sm:w-auto bg-indigo-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 font-semibold text-sm sm:text-base"
                    >
                        <Plus className="w-5 h-5" />
                        Tambah User
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded mb-6">
                    <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                        <p className="text-red-800">{error}</p>
                    </div>
                </div>
            )}

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                            <tr>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                                    User
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                                    Role
                                </th>
                                <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                                    Linked Student
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                                    Status
                                </th>
                                <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                                    Last Login
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user._id} className="hover:bg-gray-50">
                                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm sm:text-base">
                                                {user.fullName}
                                            </p>
                                            <p className="text-xs sm:text-sm text-gray-500">
                                                @{user.username}
                                            </p>
                                            {user.email && (
                                                <p className="text-xs text-gray-400">
                                                    {user.email}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                                        <span
                                            className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                                                user.role === 'admin'
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : user.role === 'member'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}
                                        >
                                            {user.role === 'admin' ? (
                                                <Shield className="w-3 h-3" />
                                            ) : (
                                                <User className="w-3 h-3" />
                                            )}
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">
                                        {user.studentId
                                            ? `${user.studentId.absen} - ${user.studentId.name}`
                                            : '-'}
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                                        <button
                                            onClick={() =>
                                                handleToggleActive(user)
                                            }
                                            className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                                                user.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}
                                        >
                                            {user.isActive ? (
                                                <>
                                                    <CheckCircle className="w-3 h-3" />
                                                    <span className="hidden sm:inline">
                                                        Active
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="w-3 h-3" />
                                                    <span className="hidden sm:inline">
                                                        Inactive
                                                    </span>
                                                </>
                                            )}
                                        </button>
                                    </td>
                                    <td className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                                        {user.lastLogin
                                            ? new Date(
                                                  user.lastLogin
                                              ).toLocaleDateString('id-ID')
                                            : 'Never'}
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() =>
                                                    handleResetPassword(user)
                                                }
                                                className="text-blue-600 hover:text-blue-800"
                                                title="Reset Password"
                                            >
                                                <Key className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDeleteUser(user._id)
                                                }
                                                className="text-red-600 hover:text-red-800"
                                                title="Delete user"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add User Modal */}
            {showAddUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">
                            Tambah User Baru
                        </h3>
                        <form onSubmit={handleAddUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    name="fullName"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Username *
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email (Optional)
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password *
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    minLength={6}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Minimal 6 karakter
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Role *
                                </label>
                                <select
                                    name="role"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="member">Member</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Link to Student (Optional)
                                </label>
                                <select
                                    name="studentId"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="">None</option>
                                    {students.map((student) => (
                                        <option
                                            key={student._id}
                                            value={student._id}
                                        >
                                            {student.absen} - {student.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddUser(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                                >
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Password Reset Modal */}
            {showPasswordModal && resetPasswordData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <div className="text-center mb-6">
                            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Password Berhasil Direset!
                            </h3>
                            <p className="text-sm text-gray-600">
                                Berikan informasi ini kepada user
                            </p>
                        </div>

                        <div className="space-y-4 bg-gray-50 rounded-lg p-4 mb-6">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase block mb-2">
                                    Username
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={resetPasswordData.username}
                                        readOnly
                                        className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg font-mono text-sm"
                                    />
                                    <button
                                        onClick={() =>
                                            copyToClipboard(
                                                resetPasswordData.username
                                            )
                                        }
                                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition"
                                        title="Copy username"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase block mb-2">
                                    Password Baru
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={resetPasswordData.password}
                                        readOnly
                                        className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg font-mono text-sm font-bold text-indigo-600"
                                    />
                                    <button
                                        onClick={() =>
                                            copyToClipboard(
                                                resetPasswordData.password
                                            )
                                        }
                                        className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition"
                                        title="Copy password"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                            <div className="flex gap-3">
                                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-yellow-800">
                                    <p className="font-semibold mb-1">
                                        Penting:
                                    </p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>
                                            User akan diminta mengganti password
                                            saat login pertama kali
                                        </li>
                                        <li>
                                            Simpan password ini sebelum menutup
                                            dialog
                                        </li>
                                        <li>
                                            Password tidak akan ditampilkan lagi
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setShowPasswordModal(false);
                                setResetPasswordData(null);
                            }}
                            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
