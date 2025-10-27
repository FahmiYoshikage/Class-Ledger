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
} from 'lucide-react';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddUser, setShowAddUser] = useState(false);
    const [error, setError] = useState('');

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
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                            <Users className="w-8 h-8 text-indigo-600" />
                            User Management
                        </h1>
                        <p className="text-gray-500 mt-2">
                            Kelola akun pengguna sistem
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddUser(true)}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 font-semibold"
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
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Linked Student
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Last Login
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            {user.fullName}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            @{user.username}
                                        </p>
                                        {user.email && (
                                            <p className="text-xs text-gray-400">
                                                {user.email}
                                            </p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span
                                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
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
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {user.studentId
                                        ? `${user.studentId.absen} - ${user.studentId.name}`
                                        : '-'}
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => handleToggleActive(user)}
                                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                                            user.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}
                                    >
                                        {user.isActive ? (
                                            <>
                                                <CheckCircle className="w-3 h-3" />
                                                Active
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-3 h-3" />
                                                Inactive
                                            </>
                                        )}
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {user.lastLogin
                                        ? new Date(
                                              user.lastLogin
                                          ).toLocaleDateString('id-ID')
                                        : 'Never'}
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() =>
                                            handleDeleteUser(user._id)
                                        }
                                        className="text-red-600 hover:text-red-800"
                                        title="Delete user"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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
        </div>
    );
};

export default UserManagement;
