import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
    Wallet,
    Users,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    CheckCircle,
    Plus,
    Trash2,
    RefreshCw,
    Search,
    Filter,
    Download,
    FileText,
    Bell,
} from 'lucide-react';
import Settings from './components/Settings';
import {
    studentsAPI,
    paymentsAPI,
    expensesAPI,
    settingsAPI,
} from './services/api';
import EventManagement from './components/EventManagement';
import CustomPayment from './components/CustomPayment';
import NotificationManager from './components/NotificationManager';
import DashboardAnalytics from './components/Analytics/DashboardAnalytics';
import { BarChart3 } from 'lucide-react';

const App = () => {
    const [students, setStudents] = useState([]);
    const [payments, setPayments] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [startDate, setStartDate] = useState(new Date('2025-10-27'));
    const [activeTab, setActiveTab] = useState('dashboard');
    const [showAddStudent, setShowAddStudent] = useState(false);
    const [showEditStudent, setShowEditStudent] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [showPayment, setShowPayment] = useState(false);
    const [showExpense, setShowExpense] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Filter & Search states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('Semua');
    const [filterMethod, setFilterMethod] = useState('Semua');
    const [filterCategory, setFilterCategory] = useState('Semua');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Load data from backend
    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [studentsRes, paymentsRes, expensesRes] = await Promise.all([
                studentsAPI.getAll(),
                paymentsAPI.getAll(),
                expensesAPI.getAll(),
            ]);

            setStudents(studentsRes.data);
            setPayments(paymentsRes.data);
            setExpenses(expensesRes.data);
        } catch (err) {
            setError('Gagal memuat data. Pastikan server berjalan.');
            console.error('Error loading data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStartDate();
    }, []);

    const loadStartDate = async () => {
        try {
            const response = await settingsAPI.get('start_date');
            if (response.data?.value) {
                setStartDate(new Date(response.data.value));
            }
        } catch (err) {
            console.log('Using default start date');
        }
    };

    const getCurrentWeek = () => {
        const now = new Date();
        const days = Math.floor((now - startDate) / (24 * 60 * 60 * 1000));
        const weeks = Math.ceil(days / 7);

        if (weeks < 0) return 0;
        return weeks + 1;
    };

    const currentWeek = getCurrentWeek();

    const handleStartDateChange = (newStartDate) => {
        setStartDate(newStartDate);
        // Reload data untuk recalculate
        loadAllData();
    };

    // Add student
    const addStudent = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        try {
            const newStudent = {
                name: formData.get('name'),
                absen: parseInt(formData.get('absen')),
                status: 'Aktif',
                phoneNumber: formData.get('phoneNumber') || '',
                enableNotification: formData.get('enableNotification') === 'on',
            };

            const response = await studentsAPI.create(newStudent);
            setStudents([...students, response.data]);
            setShowAddStudent(false);
            e.target.reset();
        } catch (err) {
            alert('Gagal menambah siswa: ' + err.response?.data?.message);
        }
    };

    // Edit student
    const openEditStudent = (student) => {
        setEditingStudent(student);
        setShowEditStudent(true);
    };

    const updateStudent = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        try {
            const updatedData = {
                name: formData.get('name'),
                absen: parseInt(formData.get('absen')),
                status: formData.get('status'),
                phoneNumber: formData.get('phoneNumber') || '',
                enableNotification: formData.get('enableNotification') === 'on',
            };

            const response = await studentsAPI.update(
                editingStudent._id,
                updatedData
            );
            setStudents(
                students.map((s) =>
                    s._id === editingStudent._id ? response.data : s
                )
            );
            setShowEditStudent(false);
            setEditingStudent(null);
        } catch (err) {
            alert('Gagal mengupdate siswa: ' + err.response?.data?.message);
        }
    };

    // Delete student
    const deleteStudent = async (id) => {
        if (window.confirm('Yakin ingin menghapus siswa ini?')) {
            try {
                await studentsAPI.delete(id);
                setStudents(students.filter((s) => s._id !== id));
            } catch (err) {
                alert('Gagal menghapus siswa: ' + err.response?.data?.message);
            }
        }
    };

    // Add payment quick
    const addPaymentQuick = async (studentId) => {
        try {
            const newPayment = {
                studentId: studentId,
                amount: 2000,
                date: new Date().toISOString(),
                week: currentWeek,
                method: 'Tunai',
                note: '',
            };

            const response = await paymentsAPI.create(newPayment);
            setPayments([response.data, ...payments]);
        } catch (err) {
            alert('Gagal menambah pembayaran: ' + err.response?.data?.message);
        }
    };

    // Add payment manual
    const addPayment = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        try {
            const newPayment = {
                studentId: formData.get('student'),
                amount: parseInt(formData.get('amount')),
                date: formData.get('date'),
                week: currentWeek,
                method: formData.get('method'),
                note: formData.get('note'),
            };

            const response = await paymentsAPI.create(newPayment);
            setPayments([response.data, ...payments]);
            setShowPayment(false);
            e.target.reset();
        } catch (err) {
            alert('Gagal menambah pembayaran: ' + err.response?.data?.message);
        }
    };

    // Add expense
    const addExpense = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        try {
            const newExpense = {
                purpose: formData.get('purpose'),
                amount: parseInt(formData.get('amount')),
                date: formData.get('date'),
                category: formData.get('category'),
                approvedBy: formData.get('approvedBy'),
            };

            const response = await expensesAPI.create(newExpense);
            setExpenses([response.data, ...expenses]);
            setShowExpense(false);
            e.target.reset();
        } catch (err) {
            alert('Gagal menambah pengeluaran: ' + err.response?.data?.message);
        }
    };

    // Delete payment
    const deletePayment = async (id) => {
        if (window.confirm('Yakin ingin menghapus pembayaran ini?')) {
            try {
                await paymentsAPI.delete(id);
                setPayments(payments.filter((p) => p._id !== id));
            } catch (err) {
                alert(
                    'Gagal menghapus pembayaran: ' + err.response?.data?.message
                );
            }
        }
    };

    // Delete expense
    const deleteExpense = async (id) => {
        if (window.confirm('Yakin ingin menghapus pengeluaran ini?')) {
            try {
                await expensesAPI.delete(id);
                setExpenses(expenses.filter((e) => e._id !== id));
            } catch (err) {
                alert(
                    'Gagal menghapus pengeluaran: ' +
                        err.response?.data?.message
                );
            }
        }
    };

    // ===== FILTER & SEARCH FUNCTIONS =====

    // Filter students by search query and status
    const filteredStudents = students.filter((student) => {
        const matchSearch =
            student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.absen.toString().includes(searchQuery);
        const matchStatus =
            filterStatus === 'Semua' || student.status === filterStatus;
        return matchSearch && matchStatus;
    });

    // Filter payments by search, method, and date
    const filteredPayments = payments.filter((payment) => {
        // Fix: Cek studentId bisa berupa object atau string
        const studentId = payment.studentId?._id || payment.studentId;
        const student = students.find((s) => s._id === studentId);

        const matchSearch = student
            ? student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              student.absen.toString().includes(searchQuery)
            : true; // Jika tidak ada filter search, tampilkan semua

        const matchMethod =
            filterMethod === 'Semua' || payment.method === filterMethod;

        const paymentDate = new Date(payment.date);
        const fromDate = dateFrom ? new Date(dateFrom) : null;
        const toDate = dateTo ? new Date(dateTo + 'T23:59:59') : null;

        const matchDate =
            (!fromDate || paymentDate >= fromDate) &&
            (!toDate || paymentDate <= toDate);

        return matchSearch && matchMethod && matchDate;
    });

    // Filter expenses by search, category, and date
    const filteredExpenses = expenses.filter((expense) => {
        const matchSearch =
            expense.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
            expense.approvedBy
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
        const matchCategory =
            filterCategory === 'Semua' || expense.category === filterCategory;
        const matchDate =
            (!dateFrom || new Date(expense.date) >= new Date(dateFrom)) &&
            (!dateTo || new Date(expense.date) <= new Date(dateTo));
        return matchSearch && matchCategory && matchDate;
    });

    // Get students who haven't paid this week (Tunggakan)
    const getUnpaidStudents = () => {
        const paidStudentsThisWeek = payments
            .filter((p) => p.week === currentWeek)
            .map((p) => p.studentId);
        return students.filter(
            (s) => s.status === 'Aktif' && !paidStudentsThisWeek.includes(s._id)
        );
    };

    // ===== EXPORT FUNCTIONS =====

    // Export Students to Excel
    const exportStudentsToExcel = () => {
        const data = students.map((student) => ({
            'No. Absen': student.absen,
            Nama: student.name,
            Status: student.status,
            'Total Bayar': getTotalPaid(student._id),
            Tunggakan: getTunggakan(student._id),
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        saveAs(
            blob,
            `Data-Siswa-${new Date().toISOString().split('T')[0]}.xlsx`
        );
    };

    // Export Payments to Excel
    const exportPaymentsToExcel = () => {
        const data = payments.map((payment) => ({
            Tanggal: new Date(payment.date).toLocaleDateString('id-ID'),
            Nama: payment.studentId?.name || '-',
            Jumlah: payment.amount,
            Metode: payment.method,
            Minggu: payment.week,
            Catatan: payment.note || '-',
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Pembayaran');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        saveAs(
            blob,
            `Pembayaran-${new Date().toISOString().split('T')[0]}.xlsx`
        );
    };

    // Export Expenses to Excel
    const exportExpensesToExcel = () => {
        const data = expenses.map((expense) => ({
            Tanggal: new Date(expense.date).toLocaleDateString('id-ID'),
            Keperluan: expense.purpose,
            Jumlah: expense.amount,
            Kategori: expense.category,
            'Disetujui Oleh': expense.approvedBy,
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Pengeluaran');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        saveAs(
            blob,
            `Pengeluaran-${new Date().toISOString().split('T')[0]}.xlsx`
        );
    };

    // Export Complete Report to Excel (All in One)
    const exportCompleteReport = () => {
        // Sheet 1: Summary
        const summary = [
            { Keterangan: 'Total Siswa', Nilai: students.length },
            { Keterangan: 'Total Pemasukan', Nilai: totalKasMasuk },
            { Keterangan: 'Total Pengeluaran', Nilai: totalKasKeluar },
            { Keterangan: 'Saldo Kas', Nilai: saldoKas },
            {
                Keterangan: 'Siswa Belum Bayar',
                Nilai: getUnpaidStudents().length,
            },
            { Keterangan: 'Minggu Ke', Nilai: currentWeek },
        ];
        const wsSummary = XLSX.utils.json_to_sheet(summary);

        // Sheet 2: Students
        const studentsData = students.map((student) => ({
            'No. Absen': student.absen,
            Nama: student.name,
            Status: student.status,
            'Total Bayar': getTotalPaid(student._id),
            Tunggakan: getTunggakan(student._id),
        }));
        const wsStudents = XLSX.utils.json_to_sheet(studentsData);

        // Sheet 3: Payments
        const paymentsData = payments.map((payment) => ({
            Tanggal: new Date(payment.date).toLocaleDateString('id-ID'),
            Nama: payment.studentId?.name || '-',
            Jumlah: payment.amount,
            Metode: payment.method,
            Minggu: payment.week,
        }));
        const wsPayments = XLSX.utils.json_to_sheet(paymentsData);

        // Sheet 4: Expenses
        const expensesData = expenses.map((expense) => ({
            Tanggal: new Date(expense.date).toLocaleDateString('id-ID'),
            Keperluan: expense.purpose,
            Jumlah: expense.amount,
            Kategori: expense.category,
        }));
        const wsExpenses = XLSX.utils.json_to_sheet(expensesData);

        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');
        XLSX.utils.book_append_sheet(wb, wsStudents, 'Data Siswa');
        XLSX.utils.book_append_sheet(wb, wsPayments, 'Pembayaran');
        XLSX.utils.book_append_sheet(wb, wsExpenses, 'Pengeluaran');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        saveAs(
            blob,
            `Laporan-Kas-Kelas-${new Date().toISOString().split('T')[0]}.xlsx`
        );
    };

    // Calculate totals
    const getTotalPaid = (studentId) => {
        return payments
            .filter((p) => {
                const pStudentId = p.studentId?._id || p.studentId;
                return pStudentId === studentId;
            })
            .reduce((sum, p) => sum + p.amount, 0);
    };

    const getTunggakan = (studentId) => {
        const totalPaid = getTotalPaid(studentId);
        const shouldPay = currentWeek * 2000;
        return shouldPay - totalPaid;
    };

    const isLate = (studentId) => {
        const tunggakan = getTunggakan(studentId);
        return tunggakan >= 8000;
    };

    const totalKasMasuk = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalKasKeluar = expenses.reduce((sum, e) => sum + e.amount, 0);
    const saldoKas = totalKasMasuk - totalKasKeluar;
    const studentsWithTunggakan = students.filter(
        (s) => getTunggakan(s._id) > 0
    ).length;

    const formatRp = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    if (loading && students.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Memuat data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="max-w-7xl mx-auto p-4 md:p-6">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-600 p-3 rounded-lg">
                                <Wallet className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">
                                    Kas Kelas
                                </h1>
                                <p className="text-gray-500">
                                    Sistem Pencatatan Kas TRIFORCE Rp
                                    2.000/minggu
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm text-gray-500">
                                    Minggu ke-
                                </p>
                                <p className="text-2xl font-bold text-indigo-600">
                                    {currentWeek}
                                </p>
                            </div>
                            <button
                                onClick={loadAllData}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                                title="Refresh data"
                            >
                                <RefreshCw
                                    className={`w-5 h-5 text-gray-600 ${
                                        loading ? 'animate-spin' : ''
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded mb-6">
                        <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                            <p className="text-red-800">{error}</p>
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Total Siswa
                                </p>
                                <p className="text-2xl font-bold text-gray-800">
                                    {students.length}
                                </p>
                            </div>
                            <Users className="w-10 h-10 text-blue-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Kas Masuk
                                </p>
                                <p className="text-xl font-bold text-green-600">
                                    {formatRp(totalKasMasuk)}
                                </p>
                            </div>
                            <TrendingUp className="w-10 h-10 text-green-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Kas Keluar
                                </p>
                                <p className="text-xl font-bold text-red-600">
                                    {formatRp(totalKasKeluar)}
                                </p>
                            </div>
                            <TrendingDown className="w-10 h-10 text-red-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Saldo Kas
                                </p>
                                <p className="text-xl font-bold text-indigo-600">
                                    {formatRp(saldoKas)}
                                </p>
                            </div>
                            <Wallet className="w-10 h-10 text-indigo-500" />
                        </div>
                    </div>
                </div>

                {/* Export Complete Report Button */}
                <div className="mb-6">
                    <button
                        onClick={exportCompleteReport}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-lg hover:from-green-700 hover:to-emerald-700 transition flex items-center justify-center gap-3 shadow-lg"
                    >
                        <FileText className="w-5 h-5" />
                        <span className="font-semibold">
                            Export Laporan Lengkap (Excel)
                        </span>
                        <span className="text-xs bg-white/20 px-2 py-1 rounded">
                            Semua Data
                        </span>
                    </button>
                </div>

                {/* Custom Payment Button */}
                <div className="mb-6">
                    <CustomPayment onPaymentAdded={loadAllData} />
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="flex border-b overflow-x-auto">
                        {[
                            'dashboard',
                            'analytics',
                            'siswa',
                            'pembayaran',
                            'pengeluaran',
                            'tunggakan',
                            'event',
                            'notifikasi',
                            'pengaturan',
                        ].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={
                                    'px-6 py-3 font-medium capitalize whitespace-nowrap flex items-center gap-2 ' +
                                    (activeTab === tab
                                        ? 'border-b-2 border-indigo-600 text-indigo-600'
                                        : 'text-gray-500 hover:text-gray-700')
                                }
                            >
                                {tab === 'notifikasi' && (
                                    <Bell className="w-4 h-4" />
                                )}
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search & Filter Bar */}
                {(activeTab === 'siswa' ||
                    activeTab === 'pembayaran' ||
                    activeTab === 'pengeluaran' ||
                    activeTab === 'tunggakan') && (
                    <div className="bg-white rounded-lg shadow p-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Search Bar */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari nama atau absen..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>

                            {/* Filter by Status (for siswa) */}
                            {activeTab === 'siswa' && (
                                <select
                                    value={filterStatus}
                                    onChange={(e) =>
                                        setFilterStatus(e.target.value)
                                    }
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="Semua">Semua Status</option>
                                    <option value="Aktif">Aktif</option>
                                    <option value="Tidak Aktif">
                                        Tidak Aktif
                                    </option>
                                    <option value="Alumni">Alumni</option>
                                </select>
                            )}

                            {/* Filter by Method (for pembayaran) */}
                            {activeTab === 'pembayaran' && (
                                <select
                                    value={filterMethod}
                                    onChange={(e) =>
                                        setFilterMethod(e.target.value)
                                    }
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="Semua">Semua Metode</option>
                                    <option value="Tunai">Tunai</option>
                                    <option value="Transfer">Transfer</option>
                                </select>
                            )}

                            {/* Filter by Category (for pengeluaran) */}
                            {activeTab === 'pengeluaran' && (
                                <select
                                    value={filterCategory}
                                    onChange={(e) =>
                                        setFilterCategory(e.target.value)
                                    }
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="Semua">
                                        Semua Kategori
                                    </option>
                                    <option value="Kebersihan">
                                        Kebersihan
                                    </option>
                                    <option value="Acara">Acara</option>
                                    <option value="Perlengkapan">
                                        Perlengkapan
                                    </option>
                                    <option value="Lain-lain">Lain-lain</option>
                                </select>
                            )}

                            {/* Date From */}
                            {(activeTab === 'pembayaran' ||
                                activeTab === 'pengeluaran') && (
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) =>
                                        setDateFrom(e.target.value)
                                    }
                                    placeholder="Dari tanggal"
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            )}

                            {/* Date To */}
                            {(activeTab === 'pembayaran' ||
                                activeTab === 'pengeluaran') && (
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    placeholder="Sampai tanggal"
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            )}

                            {/* Reset Filters Button */}
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setFilterStatus('Semua');
                                    setFilterMethod('Semua');
                                    setFilterCategory('Semua');
                                    setDateFrom('');
                                    setDateTo('');
                                }}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Reset Filter
                            </button>
                        </div>
                    </div>
                )}

                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        {studentsWithTunggakan > 0 && (
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                                <div className="flex items-center">
                                    <AlertCircle className="w-5 h-5 text-yellow-400 mr-2" />
                                    <p className="text-yellow-800">
                                        <strong>{studentsWithTunggakan}</strong>{' '}
                                        siswa memiliki tunggakan
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="p-6 border-b">
                                <h2 className="text-xl font-bold text-gray-800">
                                    Status Pembayaran Siswa
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Absen
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Nama
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Total Bayar
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Tunggakan
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {students
                                            .sort((a, b) => a.absen - b.absen)
                                            .map((student) => {
                                                const tunggakan = getTunggakan(
                                                    student._id
                                                );
                                                const late = isLate(
                                                    student._id
                                                );
                                                return (
                                                    <tr
                                                        key={student._id}
                                                        className={
                                                            late
                                                                ? 'bg-red-50'
                                                                : ''
                                                        }
                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {student.absen}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {student.name}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {formatRp(
                                                                getTotalPaid(
                                                                    student._id
                                                                )
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                            <span
                                                                className={
                                                                    tunggakan >
                                                                    0
                                                                        ? 'text-red-600 font-semibold'
                                                                        : 'text-green-600'
                                                                }
                                                            >
                                                                {formatRp(
                                                                    tunggakan
                                                                )}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {late ? (
                                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 flex items-center gap-1 w-fit">
                                                                    <AlertCircle className="w-3 h-3" />{' '}
                                                                    Telat
                                                                </span>
                                                            ) : tunggakan ===
                                                              0 ? (
                                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                                                                    <CheckCircle className="w-3 h-3" />{' '}
                                                                    Lunas
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                                    Aktif
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                            <button
                                                                onClick={() =>
                                                                    addPaymentQuick(
                                                                        student._id
                                                                    )
                                                                }
                                                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
                                                            >
                                                                Bayar Kas
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && <DashboardAnalytics />}

                {/* Siswa Tab */}
                {activeTab === 'siswa' && (
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">
                                Data Siswa
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={exportStudentsToExcel}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" /> Export
                                    Excel
                                </button>
                                <button
                                    onClick={() => setShowAddStudent(true)}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Tambah Siswa
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Absen
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Nama
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            WhatsApp
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Notifikasi
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredStudents.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="6"
                                                className="px-6 py-8 text-center text-gray-500"
                                            >
                                                Tidak ada data siswa yang sesuai
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudents
                                            .sort((a, b) => a.absen - b.absen)
                                            .map((student) => (
                                                <tr key={student._id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {student.absen}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {student.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                        {student.phoneNumber ? (
                                                            <span className="flex items-center gap-1">
                                                                📱{' '}
                                                                {
                                                                    student.phoneNumber
                                                                }
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400 italic">
                                                                Belum diset
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span
                                                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                                student.status ===
                                                                'Aktif'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : student.status ===
                                                                      'Alumni'
                                                                    ? 'bg-blue-100 text-blue-800'
                                                                    : 'bg-gray-100 text-gray-800'
                                                            }`}
                                                        >
                                                            {student.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {student.enableNotification !==
                                                        false ? (
                                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                                ✓ Aktif
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                                                ✗ Non-aktif
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() =>
                                                                    openEditStudent(
                                                                        student
                                                                    )
                                                                }
                                                                className="text-blue-600 hover:text-blue-800 font-medium"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    deleteStudent(
                                                                        student._id
                                                                    )
                                                                }
                                                                className="text-red-600 hover:text-red-800"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Pembayaran Tab */}
                {activeTab === 'pembayaran' && (
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6 border-b flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">
                                    Riwayat Pembayaran
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Total: {filteredPayments.length} pembayaran
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={exportPaymentsToExcel}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" /> Export
                                    Excel
                                </button>
                                <button
                                    onClick={() => setShowPayment(true)}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Tambah
                                    Pembayaran
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Tanggal
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Nama/Sumber
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Jumlah
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Metode
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Tipe
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Catatan
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredPayments.map((payment) => {
                                        const studentId =
                                            payment.studentId?._id ||
                                            payment.studentId;
                                        const student = students.find(
                                            (s) => s._id === studentId
                                        );

                                        return (
                                            <tr key={payment._id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {new Date(
                                                        payment.date
                                                    ).toLocaleDateString(
                                                        'id-ID'
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {payment.source ===
                                                        'custom' ||
                                                    payment.source === 'event'
                                                        ? payment.sourceName
                                                        : student?.name ||
                                                          'Siswa tidak ditemukan'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatRp(payment.amount)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <span
                                                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                            payment.method ===
                                                            'Tunai'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-blue-100 text-blue-800'
                                                        }`}
                                                    >
                                                        {payment.method}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {payment.source ===
                                                        'custom' && (
                                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                                                            Custom
                                                        </span>
                                                    )}
                                                    {payment.source ===
                                                        'event' && (
                                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                                            Event
                                                        </span>
                                                    )}
                                                    {payment.source ===
                                                        'regular' && (
                                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                                            Kas Reguler
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {payment.note || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <button
                                                        onClick={() =>
                                                            deletePayment(
                                                                payment._id
                                                            )
                                                        }
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Pengeluaran Tab */}
                {activeTab === 'pengeluaran' && (
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">
                                Riwayat Pengeluaran
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={exportExpensesToExcel}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" /> Export
                                    Excel
                                </button>
                                <button
                                    onClick={() => setShowExpense(true)}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Tambah
                                    Pengeluaran
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Tanggal
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Keperluan
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Jumlah
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Kategori
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Disetujui
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredExpenses.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="6"
                                                className="px-6 py-8 text-center text-gray-500"
                                            >
                                                Tidak ada data pengeluaran yang
                                                sesuai
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredExpenses.map((expense) => (
                                            <tr key={expense._id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {new Date(
                                                        expense.date
                                                    ).toLocaleDateString(
                                                        'id-ID'
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                    {expense.purpose}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatRp(expense.amount)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span
                                                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                            expense.category ===
                                                            'Kebersihan'
                                                                ? 'bg-green-100 text-green-800'
                                                                : expense.category ===
                                                                  'Acara'
                                                                ? 'bg-purple-100 text-purple-800'
                                                                : expense.category ===
                                                                  'Perlengkapan'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                        }`}
                                                    >
                                                        {expense.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {expense.approvedBy}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <button
                                                        onClick={() =>
                                                            deleteExpense(
                                                                expense._id
                                                            )
                                                        }
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tunggakan Tab - NEW FEATURE */}
                {activeTab === 'tunggakan' && (
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6 border-b">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">
                                        Daftar Tunggakan
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Siswa yang belum bayar minggu ke-{' '}
                                        {currentWeek}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">
                                        Total Tunggakan
                                    </p>
                                    <p className="text-2xl font-bold text-red-600">
                                        {getUnpaidStudents().length} Siswa
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            {getUnpaidStudents().length === 0 ? (
                                <div className="p-12 text-center">
                                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                        Semua Sudah Bayar! 🎉
                                    </h3>
                                    <p className="text-gray-500">
                                        Tidak ada siswa yang memiliki tunggakan
                                        minggu ini
                                    </p>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Absen
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Nama
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Tunggakan
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {getUnpaidStudents()
                                            .sort((a, b) => a.absen - b.absen)
                                            .map((student) => {
                                                const unpaidWeeks =
                                                    currentWeek -
                                                    payments
                                                        .filter(
                                                            (p) =>
                                                                p.studentId ===
                                                                student._id
                                                        )
                                                        .filter(
                                                            (p) =>
                                                                p.week <=
                                                                currentWeek
                                                        ).length;
                                                return (
                                                    <tr key={student._id}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {student.absen}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {student.name}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                                                Belum Bayar
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                                                            {formatRp(
                                                                unpaidWeeks *
                                                                    2000
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                            <button
                                                                onClick={() =>
                                                                    addPaymentQuick(
                                                                        student._id
                                                                    )
                                                                }
                                                                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition text-xs"
                                                            >
                                                                Bayar Sekarang
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {/* Event Tab */}
                {activeTab === 'event' && <EventManagement />}

                {/* Notifikasi Tab - WhatsApp Bot */}
                {activeTab === 'notifikasi' && <NotificationManager />}

                {/* Settings Tab - NEW FEATURE */}
                {activeTab === 'pengaturan' && (
                    <Settings
                        onStartDateChange={handleStartDateChange}
                        currentStartDate={startDate}
                    />
                )}

                {/* Modal Add Student */}
                {showAddStudent && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                            <h3 className="text-xl font-bold mb-4">
                                Tambah Siswa Baru
                            </h3>
                            <form onSubmit={addStudent} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nomor Absen
                                    </label>
                                    <input
                                        type="number"
                                        name="absen"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nama Lengkap
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nomor WhatsApp (Opsional)
                                    </label>
                                    <input
                                        type="text"
                                        name="phoneNumber"
                                        placeholder="08xxxxxxxxxx atau 628xxxxxxxxxx"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Format: 08xxx atau 628xxx (tanpa
                                        spasi/strip)
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="enableNotification"
                                        id="enableNotification"
                                        defaultChecked
                                        className="w-4 h-4 text-indigo-600 rounded"
                                    />
                                    <label
                                        htmlFor="enableNotification"
                                        className="text-sm text-gray-700"
                                    >
                                        Aktifkan notifikasi WhatsApp
                                    </label>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddStudent(false)}
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

                {/* Modal Edit Student */}
                {showEditStudent && editingStudent && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                            <h3 className="text-xl font-bold mb-4">
                                Edit Data Siswa
                            </h3>
                            <form
                                onSubmit={updateStudent}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nomor Absen
                                    </label>
                                    <input
                                        type="number"
                                        name="absen"
                                        defaultValue={editingStudent.absen}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nama Lengkap
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        defaultValue={editingStudent.name}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nomor WhatsApp
                                    </label>
                                    <input
                                        type="text"
                                        name="phoneNumber"
                                        defaultValue={
                                            editingStudent.phoneNumber || ''
                                        }
                                        placeholder="08xxxxxxxxxx atau 628xxxxxxxxxx"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Format: 08xxx atau 628xxx (tanpa
                                        spasi/strip)
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        defaultValue={editingStudent.status}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    >
                                        <option value="Aktif">Aktif</option>
                                        <option value="Tidak Aktif">
                                            Tidak Aktif
                                        </option>
                                        <option value="Alumni">Alumni</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="enableNotification"
                                        id="enableNotificationEdit"
                                        defaultChecked={
                                            editingStudent.enableNotification !==
                                            false
                                        }
                                        className="w-4 h-4 text-indigo-600 rounded"
                                    />
                                    <label
                                        htmlFor="enableNotificationEdit"
                                        className="text-sm text-gray-700"
                                    >
                                        Aktifkan notifikasi WhatsApp
                                    </label>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-xs text-blue-800">
                                        💡 <strong>Tips:</strong> Pastikan nomor
                                        WhatsApp valid agar siswa bisa menerima
                                        reminder pembayaran kas.
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowEditStudent(false);
                                            setEditingStudent(null);
                                        }}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                                    >
                                        Update
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Add Payment */}
                {showPayment && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-md w-full p-6">
                            <h3 className="text-xl font-bold mb-4">
                                Tambah Pembayaran
                            </h3>
                            <form onSubmit={addPayment} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Siswa
                                    </label>
                                    <select
                                        name="student"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    >
                                        <option value="">Pilih Siswa</option>
                                        {students
                                            .sort((a, b) => a.absen - b.absen)
                                            .map((student) => (
                                                <option
                                                    key={student._id}
                                                    value={student._id}
                                                >
                                                    {student.absen} -{' '}
                                                    {student.name}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Jumlah
                                    </label>
                                    <input
                                        type="number"
                                        name="amount"
                                        defaultValue="2000"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tanggal
                                    </label>
                                    <input
                                        type="date"
                                        name="date"
                                        defaultValue={
                                            new Date()
                                                .toISOString()
                                                .split('T')[0]
                                        }
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Metode
                                    </label>
                                    <select
                                        name="method"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    >
                                        <option>Tunai</option>
                                        <option>Transfer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Catatan (opsional)
                                    </label>
                                    <input
                                        type="text"
                                        name="note"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowPayment(false)}
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

                {/* Modal Add Expense */}
                {showExpense && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-md w-full p-6">
                            <h3 className="text-xl font-bold mb-4">
                                Tambah Pengeluaran
                            </h3>
                            <form onSubmit={addExpense} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Keperluan
                                    </label>
                                    <input
                                        type="text"
                                        name="purpose"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Jumlah
                                    </label>
                                    <input
                                        type="number"
                                        name="amount"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tanggal
                                    </label>
                                    <input
                                        type="date"
                                        name="date"
                                        defaultValue={
                                            new Date()
                                                .toISOString()
                                                .split('T')[0]
                                        }
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Kategori
                                    </label>
                                    <select
                                        name="category"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    >
                                        <option>Kebersihan</option>
                                        <option>Acara</option>
                                        <option>Perlengkapan</option>
                                        <option>Lain-lain</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Disetujui Oleh
                                    </label>
                                    <input
                                        type="text"
                                        name="approvedBy"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowExpense(false)}
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
        </div>
    );
};

export default App;
