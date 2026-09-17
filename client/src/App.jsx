import React, { useState, useEffect, useMemo } from 'react';
// xlsx, file-saver, jspdf, jspdf-autotable di-import secara dynamic
// di dalam fungsi export untuk mengurangi memory build (~400MB hemat)
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
    BarChart3,
    LayoutDashboard,
    CreditCard,
    Receipt,
    AlertTriangle,
    CalendarDays,
    MessageCircle,
    Settings as SettingsIcon,
} from 'lucide-react';
import Settings from './components/settings/Settings';
import ReceiptModal from './components/payments/ReceiptModal';
import SendFinancialReportModal from './components/notifications/SendFinancialReportModal';
import {
    studentsAPI,
    paymentsAPI,
    expensesAPI,
    settingsAPI,
    api,
} from './services/api';
import EventManagement from './components/events/EventManagement';
import CustomPayment from './components/payments/CustomPayment';
import NotificationManager from './components/notifications/NotificationManager';
import DashboardAnalytics from './components/analytics/DashboardAnalytics';
import { useAppConfig } from './context/ConfigContext';

const App = () => {
    const { config, refreshConfig } = useAppConfig();
    const [students, setStudents] = useState([]);
    const [payments, setPayments] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [startDate, setStartDate] = useState(new Date('2025-10-27'));
    const [currentWeek, setCurrentWeek] = useState(1);
    // Default 7 = semester 1 had 7 weeks (hardcoded initial carry-over)
    const [accumulatedWeeks, setAccumulatedWeeks] = useState(7);
    const [semesterStatus, setSemesterStatus] = useState('active');
    // Load activeTab from localStorage or default to 'dashboard'
    const [activeTab, setActiveTab] = useState(() => {
        const savedTab = localStorage.getItem('activeTab');
        return savedTab || 'dashboard';
    });
    const [showAddStudent, setShowAddStudent] = useState(false);
    const [showEditStudent, setShowEditStudent] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [showPayment, setShowPayment] = useState(false);
    const [showExpense, setShowExpense] = useState(false);
    const [selectedReceiptPayment, setSelectedReceiptPayment] = useState(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [showGroupReportModal, setShowGroupReportModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Filter & Search states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('Semua');
    const [filterMethod, setFilterMethod] = useState('Semua');
    const [filterCategory, setFilterCategory] = useState('Semua');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [paymentPage, setPaymentPage] = useState(1);
    const PAYMENTS_PER_PAGE = 15;

    // Save activeTab to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('activeTab', activeTab);
    }, [activeTab]);

    // Load data from backend
    useEffect(() => {
        loadAllData();
        loadCurrentWeek();
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

    // Load current week from server (respects pause)
    const loadCurrentWeek = async () => {
        try {
            const response = await api.get('/settings/current-week');
            if (response.data?.currentWeek) {
                setCurrentWeek(response.data.currentWeek);
                setAccumulatedWeeks(response.data.accumulatedWeeks ?? 7);
                setSemesterStatus(response.data.status || 'active');
            }
        } catch (err) {
            console.error('Error loading current week:', err);
            // Fallback to calculation if API fails
            const now = new Date();
            const days = Math.floor((now - startDate) / (24 * 60 * 60 * 1000));
            const weeks = Math.ceil(days / 7);
            setCurrentWeek(Math.max(1, weeks + 1));
        }
    };

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
                nickname: formData.get('nickname') || '',
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
                nickname: formData.get('nickname') || '',
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
                amount: config.weeklyAmount || 2000,
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

    // Send WhatsApp reminder for tunggakan
    const handleSendWAReminder = (student, tunggakan) => {
        const cleanPhone = (student?.phoneNumber || '').replace(/\D/g, '');
        const intlPhone = cleanPhone.startsWith('0')
            ? '62' + cleanPhone.slice(1)
            : cleanPhone.startsWith('62')
            ? cleanPhone
            : cleanPhone
            ? '62' + cleanPhone
            : '';
        const text = `Halo ${student?.name || 'Teman'}, mengingatkan bahwa kamu memiliki tunggakan uang kas kelas sebesar Rp ${Number(tunggakan || 0).toLocaleString('id-ID')}. Mohon segera melunasi ke Bendahara ya! Terima kasih 🙏`;
        const url = intlPhone
            ? `https://wa.me/${intlPhone}?text=${encodeURIComponent(text)}`
            : `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
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

    // Group payments by student + date + amount (e.g. "Nyla Rp 2.000 × 10")
    const groupedPayments = useMemo(() => {
        const groups = {};
        filteredPayments.forEach((payment) => {
            const studentId = payment.studentId?._id || payment.studentId || 'custom';
            const dateStr = new Date(payment.date).toLocaleDateString('id-ID');
            const key = `${studentId}_${dateStr}_${payment.amount}_${payment.source || 'regular'}`;
            if (!groups[key]) {
                groups[key] = {
                    ...payment,
                    count: 1,
                    totalAmount: payment.amount,
                    paymentIds: [payment._id],
                };
            } else {
                groups[key].count += 1;
                groups[key].totalAmount += payment.amount;
                groups[key].paymentIds.push(payment._id);
            }
        });
        return Object.values(groups);
    }, [filteredPayments]);

    // Pagination for grouped payments
    const totalPaymentPages = Math.ceil(groupedPayments.length / PAYMENTS_PER_PAGE);
    const paginatedPayments = groupedPayments.slice(
        (paymentPage - 1) * PAYMENTS_PER_PAGE,
        paymentPage * PAYMENTS_PER_PAGE
    );

    // Reset page when filters change
    useEffect(() => {
        setPaymentPage(1);
    }, [searchQuery, filterMethod, dateFrom, dateTo]);

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
        return students.filter((s) => {
            if (s.status !== 'Aktif') return false;
            const tunggakan = getTunggakan(s._id);
            return tunggakan > 0; // Punya tunggakan (belum lunas)
        });
    };

    // ===== EXPORT FUNCTIONS =====

    // Export Students to Excel
    const exportStudentsToExcel = async () => {
        const [XLSX, { saveAs }] = await Promise.all([
            import('xlsx'),
            import('file-saver'),
        ]);
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
    const exportPaymentsToExcel = async () => {
        const [XLSX, { saveAs }] = await Promise.all([
            import('xlsx'),
            import('file-saver'),
        ]);
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
    const exportExpensesToExcel = async () => {
        const [XLSX, { saveAs }] = await Promise.all([
            import('xlsx'),
            import('file-saver'),
        ]);
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
    const exportCompleteReport = async () => {
        const [XLSX, { saveAs }] = await Promise.all([
            import('xlsx'),
            import('file-saver'),
        ]);
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

    // ===== PDF EXPORT FUNCTIONS =====

    // Export Students to PDF
    const exportStudentsToPDF = async () => {
        const [{ jsPDF }, { default: autoTable }] = await Promise.all([
            import('jspdf'),
            import('jspdf-autotable'),
        ]);
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('LAPORAN DATA SISWA', 105, 15, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(
            `Tanggal: ${new Date().toLocaleDateString('id-ID')}`,
            105,
            22,
            { align: 'center' }
        );
        doc.text(`Kas Kelas - Minggu ke-${currentWeek}`, 105, 27, {
            align: 'center',
        });

        // Table data
        const tableData = students
            .sort((a, b) => a.absen - b.absen)
            .map((student) => [
                student.absen,
                student.name,
                student.status,
                `Rp ${getTotalPaid(student._id).toLocaleString('id-ID')}`,
                `Rp ${getTunggakan(student._id).toLocaleString('id-ID')}`,
            ]);

        // Generate table
        autoTable(doc, {
            startY: 35,
            head: [['Absen', 'Nama', 'Status', 'Total Bayar', 'Tunggakan']],
            body: tableData,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: {
                fillColor: [79, 70, 229],
                textColor: 255,
                fontStyle: 'bold',
            },
            alternateRowStyles: { fillColor: [245, 247, 250] },
            columnStyles: {
                0: { halign: 'center', cellWidth: 20 },
                1: { cellWidth: 60 },
                2: { halign: 'center', cellWidth: 30 },
                3: { halign: 'right', cellWidth: 40 },
                4: { halign: 'right', cellWidth: 40 },
            },
        });

        // Footer
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`Total Siswa: ${students.length}`, 14, finalY);
        doc.text(
            `Dicetak: ${new Date().toLocaleString('id-ID')}`,
            14,
            finalY + 5
        );

        // Save
        doc.save(`Data-Siswa-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // Export Payments to PDF
    const exportPaymentsToPDF = async () => {
        const [{ jsPDF }, { default: autoTable }] = await Promise.all([
            import('jspdf'),
            import('jspdf-autotable'),
        ]);
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('LAPORAN PEMBAYARAN', 105, 15, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(
            `Tanggal: ${new Date().toLocaleDateString('id-ID')}`,
            105,
            22,
            { align: 'center' }
        );
        doc.text(`Total Pembayaran: ${payments.length} transaksi`, 105, 27, {
            align: 'center',
        });

        // Table data
        const tableData = payments.map((payment) => [
            new Date(payment.date).toLocaleDateString('id-ID'),
            payment.studentId?.name || '-',
            `Rp ${payment.amount.toLocaleString('id-ID')}`,
            payment.method,
            payment.week || '-',
            payment.note || '-',
        ]);

        // Generate table
        autoTable(doc, {
            startY: 35,
            head: [
                ['Tanggal', 'Nama', 'Jumlah', 'Metode', 'Minggu', 'Catatan'],
            ],
            body: tableData,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: {
                fillColor: [79, 70, 229],
                textColor: 255,
                fontStyle: 'bold',
            },
            alternateRowStyles: { fillColor: [245, 247, 250] },
            columnStyles: {
                0: { cellWidth: 28 },
                1: { cellWidth: 45 },
                2: { halign: 'right', cellWidth: 30 },
                3: { halign: 'center', cellWidth: 25 },
                4: { halign: 'center', cellWidth: 20 },
                5: { cellWidth: 42 },
            },
        });

        // Summary
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text(
            `Total Pemasukan: Rp ${totalKasMasuk.toLocaleString('id-ID')}`,
            14,
            finalY
        );

        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100);
        doc.text(
            `Dicetak: ${new Date().toLocaleString('id-ID')}`,
            14,
            finalY + 7
        );

        // Save
        doc.save(`Pembayaran-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // Export Expenses to PDF
    const exportExpensesToPDF = async () => {
        const [{ jsPDF }, { default: autoTable }] = await Promise.all([
            import('jspdf'),
            import('jspdf-autotable'),
        ]);
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('LAPORAN PENGELUARAN', 105, 15, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(
            `Tanggal: ${new Date().toLocaleDateString('id-ID')}`,
            105,
            22,
            { align: 'center' }
        );
        doc.text(`Total Pengeluaran: ${expenses.length} transaksi`, 105, 27, {
            align: 'center',
        });

        // Table data
        const tableData = expenses.map((expense) => [
            new Date(expense.date).toLocaleDateString('id-ID'),
            expense.purpose,
            `Rp ${expense.amount.toLocaleString('id-ID')}`,
            expense.category,
            expense.approvedBy,
        ]);

        // Generate table
        autoTable(doc, {
            startY: 35,
            head: [['Tanggal', 'Keperluan', 'Jumlah', 'Kategori', 'Disetujui']],
            body: tableData,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: {
                fillColor: [79, 70, 229],
                textColor: 255,
                fontStyle: 'bold',
            },
            alternateRowStyles: { fillColor: [245, 247, 250] },
            columnStyles: {
                0: { cellWidth: 28 },
                1: { cellWidth: 60 },
                2: { halign: 'right', cellWidth: 35 },
                3: { cellWidth: 30 },
                4: { cellWidth: 37 },
            },
        });

        // Summary
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text(
            `Total Pengeluaran: Rp ${totalKasKeluar.toLocaleString('id-ID')}`,
            14,
            finalY
        );

        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100);
        doc.text(
            `Dicetak: ${new Date().toLocaleString('id-ID')}`,
            14,
            finalY + 7
        );

        // Save
        doc.save(`Pengeluaran-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // Export Complete Report to PDF
    const exportCompleteReportPDF = () => {
        const doc = new jsPDF();

        // ===== PAGE 1: RINGKASAN =====
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('LAPORAN KAS KELAS', 105, 20, { align: 'center' });
        doc.text('LENGKAP', 105, 28, { align: 'center' });

        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.text(`Periode: Minggu ke-${currentWeek}`, 105, 38, {
            align: 'center',
        });
        doc.text(
            `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            })}`,
            105,
            44,
            { align: 'center' }
        );

        // Summary Box
        doc.setFillColor(79, 70, 229);
        doc.rect(20, 55, 170, 8, 'F');
        doc.setTextColor(255);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('RINGKASAN KEUANGAN', 105, 60, { align: 'center' });

        // Summary Table
        doc.setTextColor(0);
        const summaryData = [
            ['Total Siswa', `${students.length} orang`],
            ['Siswa Belum Bayar', `${getUnpaidStudents().length} orang`],
            ['Total Pemasukan', `Rp ${totalKasMasuk.toLocaleString('id-ID')}`],
            [
                'Total Pengeluaran',
                `Rp ${totalKasKeluar.toLocaleString('id-ID')}`,
            ],
            ['Saldo Kas', `Rp ${saldoKas.toLocaleString('id-ID')}`],
        ];

        autoTable(doc, {
            startY: 68,
            body: summaryData,
            theme: 'plain',
            styles: { fontSize: 11, cellPadding: 4 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 70 },
                1: {
                    halign: 'right',
                    cellWidth: 100,
                    fontStyle: 'bold',
                    textColor: [79, 70, 229],
                },
            },
        });

        // ===== PAGE 2: DATA SISWA =====
        doc.addPage();
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0);
        doc.text('DATA SISWA', 14, 15);

        const studentsData = students
            .sort((a, b) => a.absen - b.absen)
            .map((student) => [
                student.absen,
                student.name,
                student.status,
                `Rp ${getTotalPaid(student._id).toLocaleString('id-ID')}`,
                `Rp ${getTunggakan(student._id).toLocaleString('id-ID')}`,
            ]);

        autoTable(doc, {
            startY: 22,
            head: [['Absen', 'Nama', 'Status', 'Total Bayar', 'Tunggakan']],
            body: studentsData,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: {
                fillColor: [79, 70, 229],
                textColor: 255,
                fontStyle: 'bold',
            },
            alternateRowStyles: { fillColor: [245, 247, 250] },
            columnStyles: {
                0: { halign: 'center', cellWidth: 20 },
                1: { cellWidth: 60 },
                2: { halign: 'center', cellWidth: 30 },
                3: { halign: 'right', cellWidth: 40 },
                4: { halign: 'right', cellWidth: 40 },
            },
        });

        // ===== PAGE 3: PEMBAYARAN =====
        doc.addPage();
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('RIWAYAT PEMBAYARAN', 14, 15);

        const paymentsData = payments
            .slice(0, 50) // Limit untuk PDF
            .map((payment) => [
                new Date(payment.date).toLocaleDateString('id-ID'),
                payment.studentId?.name || '-',
                `Rp ${payment.amount.toLocaleString('id-ID')}`,
                payment.method,
            ]);

        autoTable(doc, {
            startY: 22,
            head: [['Tanggal', 'Nama', 'Jumlah', 'Metode']],
            body: paymentsData,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: {
                fillColor: [79, 70, 229],
                textColor: 255,
                fontStyle: 'bold',
            },
            alternateRowStyles: { fillColor: [245, 247, 250] },
            columnStyles: {
                0: { cellWidth: 35 },
                1: { cellWidth: 70 },
                2: { halign: 'right', cellWidth: 40 },
                3: { halign: 'center', cellWidth: 30 },
            },
        });

        // ===== PAGE 4: PENGELUARAN =====
        doc.addPage();
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('RIWAYAT PENGELUARAN', 14, 15);

        const expensesData = expenses
            .slice(0, 50) // Limit untuk PDF
            .map((expense) => [
                new Date(expense.date).toLocaleDateString('id-ID'),
                expense.purpose,
                `Rp ${expense.amount.toLocaleString('id-ID')}`,
                expense.category,
            ]);

        autoTable(doc, {
            startY: 22,
            head: [['Tanggal', 'Keperluan', 'Jumlah', 'Kategori']],
            body: expensesData,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: {
                fillColor: [79, 70, 229],
                textColor: 255,
                fontStyle: 'bold',
            },
            alternateRowStyles: { fillColor: [245, 247, 250] },
            columnStyles: {
                0: { cellWidth: 35 },
                1: { cellWidth: 75 },
                2: { halign: 'right', cellWidth: 40 },
                3: { cellWidth: 35 },
            },
        });

        // Footer on last page
        const finalY = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text('--- Akhir Laporan ---', 105, finalY, { align: 'center' });
        doc.text(
            `Dicetak: ${new Date().toLocaleString('id-ID')}`,
            105,
            finalY + 5,
            { align: 'center' }
        );

        // Save
        doc.save(
            `Laporan-Kas-Lengkap-${new Date().toISOString().split('T')[0]}.pdf`
        );
    };

    // Calculate totals
    // Tunggakan is cumulative across semesters:
    //   shouldPay = (accumulatedWeeks from prev semesters + currentWeek) * weeklyAmount
    //   totalPaid = ALL payments ever made by the student
    //   tunggakan = shouldPay - totalPaid
    const getTotalPaid = (studentId) => {
        const studentPayments = payments.filter((p) => {
            const pStudentId =
                p.studentId?._id || p.studentId || p.student?._id || p.student;
            return pStudentId === studentId;
        });

        return studentPayments.reduce((sum, p) => sum + p.amount, 0);
    };

    const getTunggakan = (studentId) => {
        const totalPaid = getTotalPaid(studentId);
        const totalWeeks = accumulatedWeeks + currentWeek;
        const fee = config.weeklyAmount || 2000;
        const shouldPay = totalWeeks * fee;
        return shouldPay - totalPaid;
    };

    const isLate = (studentId) => {
        const tunggakan = getTunggakan(studentId);
        const threshold = config.lateThreshold || 4;
        const fee = config.weeklyAmount || 2000;
        return tunggakan >= threshold * fee;
    };

    // Total kas masuk/keluar dari SEMUA data
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
            <div className="min-h-screen bg-[#18181b] flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-4" />
                    <p className="text-white/60">Memuat data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#09090b] dark:text-white selection:bg-indigo-500/30 relative overflow-hidden transition-colors duration-200">
            {/* Ambient Floating Aurora Mesh */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-[15%] left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-indigo-600/10 via-violet-600/8 to-transparent blur-3xl animate-aurora" />
                <div className="absolute top-[35%] -right-[10%] w-[450px] h-[450px] rounded-full bg-gradient-to-br from-pink-600/8 via-purple-600/8 to-transparent blur-3xl animate-aurora" style={{ animationDelay: '-6s' }} />
                <div className="absolute bottom-[5%] left-[10%] w-[450px] h-[450px] rounded-full bg-gradient-to-br from-cyan-600/8 via-teal-600/8 to-transparent blur-3xl animate-aurora" style={{ animationDelay: '-12s' }} />
            </div>

            <div className="relative z-10 w-full px-1 sm:px-3 lg:px-4 py-4 page-transition">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 animate-fade-in">
                    <div className="flex items-center gap-3.5">
                        <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-white/20 animate-levitate">
                            <Wallet className="w-6 h-6 text-white" />
                            <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 hover:opacity-100 transition-opacity" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                    Kas {config.className || 'Kelas'}
                                </h1>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 uppercase tracking-widest">
                                    Bendahara
                                </span>
                            </div>
                            <p className="text-xs sm:text-[13px] text-slate-500 dark:text-white/60">
                                {config.institutionName ? `${config.institutionName} • ` : ''}Sistem Kas {config.className || 'Kelas'} {formatRp(config.weeklyAmount || 2000)}/minggu
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                        <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900/70 border border-slate-200 dark:border-indigo-500/20 shadow-sm flex items-center gap-3 glass-cyber-card">
                            <div className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-500 dark:text-white/50 uppercase tracking-widest font-semibold">
                                    Minggu ke-
                                </p>
                                <p className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums leading-none">
                                    {currentWeek}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={loadAllData}
                            className="p-2.5 hover:bg-slate-100 dark:hover:bg-white/[0.08] rounded-xl transition-all border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 active:scale-95 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white shadow-sm"
                            title="Refresh data"
                        >
                            <RefreshCw
                                className={`w-4 h-4 ${
                                    loading ? 'animate-spin text-indigo-500' : ''
                                }`}
                            />
                        </button>
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-6 animate-slide-down">
                        <div className="flex items-center">
                            <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 mr-2" />
                            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 animate-slide-up">
                    {/* Total Siswa */}
                    <div className="group rounded-2xl bg-white/80 dark:bg-zinc-950/60 border border-slate-200 dark:border-indigo-500/20 p-4 sm:p-5 hover:border-indigo-500/40 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden glass-cyber-card shadow-sm dark:shadow-lg dark:shadow-indigo-950/20">
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500/0 via-indigo-500/80 to-indigo-500/0" />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[11px] sm:text-[13px] text-slate-500 dark:text-white/60 font-medium">
                                    Total Siswa
                                </p>
                                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">
                                    {students.length}
                                </p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                <Users className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* Kas Masuk */}
                    <div className="group rounded-2xl bg-white/80 dark:bg-zinc-950/60 border border-slate-200 dark:border-teal-500/20 p-4 sm:p-5 hover:border-teal-500/40 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden glass-cyber-card shadow-sm dark:shadow-lg dark:shadow-teal-950/20">
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-500/0 via-teal-500/80 to-teal-500/0" />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[11px] sm:text-[13px] text-slate-500 dark:text-white/60 font-medium">
                                    Kas Masuk
                                </p>
                                <p className="text-lg sm:text-xl font-black text-teal-600 dark:text-teal-300 mt-1 tabular-nums">
                                    {formatRp(totalKasMasuk)}
                                </p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-300 group-hover:scale-110 transition-transform">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* Kas Keluar */}
                    <div className="group rounded-2xl bg-white/80 dark:bg-zinc-950/60 border border-slate-200 dark:border-rose-500/20 p-4 sm:p-5 hover:border-rose-500/40 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden glass-cyber-card shadow-sm dark:shadow-lg dark:shadow-rose-950/20">
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-rose-500/0 via-rose-500/80 to-rose-500/0" />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[11px] sm:text-[13px] text-slate-500 dark:text-white/60 font-medium">
                                    Kas Keluar
                                </p>
                                <p className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-300 mt-1 tabular-nums">
                                    {formatRp(totalKasKeluar)}
                                </p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-400/20 text-rose-600 dark:text-rose-300 group-hover:scale-110 transition-transform">
                                <TrendingDown className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* Saldo Kas */}
                    <div className="group rounded-2xl bg-white/80 dark:bg-zinc-950/60 border border-slate-200 dark:border-purple-500/30 p-4 sm:p-5 hover:border-purple-500/50 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden glass-cyber-card shadow-sm dark:shadow-lg dark:shadow-purple-950/30">
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500/0 via-pink-500/80 to-purple-500/0" />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[11px] sm:text-[13px] text-slate-500 dark:text-white/60 font-medium">
                                    Saldo Kas
                                </p>
                                <p className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-indigo-600 to-pink-600 dark:from-teal-300 dark:via-indigo-300 dark:to-pink-300 mt-1 tabular-nums">
                                    {formatRp(saldoKas)}
                                </p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/15 to-pink-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 group-hover:scale-110 transition-transform">
                                <Wallet className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Export & Broadcast Buttons */}
                <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-slide-up stagger-5">
                    <button
                        onClick={exportCompleteReport}
                        className="bg-teal-500/10 hover:bg-teal-500/15 border border-teal-500/25 text-teal-700 dark:text-teal-300 px-5 py-3 rounded-xl transition-all flex items-center justify-center gap-2.5 text-sm font-semibold hover:shadow-lg active:scale-[0.99]"
                    >
                        <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        <span>Ekspor Excel</span>
                    </button>
                    <button
                        onClick={exportCompleteReportPDF}
                        className="bg-rose-500/10 hover:bg-rose-500/15 border border-rose-400/25 text-rose-700 dark:text-rose-300 px-5 py-3 rounded-xl transition-all flex items-center justify-center gap-2.5 text-sm font-semibold hover:shadow-lg active:scale-[0.99]"
                    >
                        <FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        <span>Ekspor PDF</span>
                    </button>
                    <button
                        onClick={() => setShowGroupReportModal(true)}
                        className="bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-5 py-3 rounded-xl transition-all flex items-center justify-center gap-2.5 text-sm font-semibold hover:shadow-lg active:scale-[0.99] group"
                    >
                        <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span>Kirim Laporan WA Grup</span>
                    </button>
                </div>

                {/* Custom Payment Button */}
                <div className="mb-6">
                    <CustomPayment onPaymentAdded={loadAllData} />
                </div>

                {/* Tabs */}
                <div className="rounded-2xl bg-white/80 dark:bg-zinc-950/60 border border-slate-200 dark:border-white/10 mb-6 animate-slide-up shadow-sm dark:shadow-xl dark:shadow-black/30 overflow-hidden glass-cyber-card">
                    <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 dark:divide-white/[0.06]">
                        {[
                            { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                            { key: 'analytics', label: 'Analytics', icon: BarChart3 },
                            { key: 'siswa', label: 'Siswa', icon: Users },
                            { key: 'pembayaran', label: 'Bayar', icon: CreditCard },
                            { key: 'pengeluaran', label: 'Keluar', icon: Receipt },
                            { key: 'tunggakan', label: 'Tunggakan', icon: AlertTriangle },
                            { key: 'event', label: 'Event', icon: CalendarDays },
                            { key: 'notifikasi', label: 'Notifikasi', icon: Bell },
                            { key: 'pengaturan', label: 'Setting', icon: SettingsIcon },
                        ].map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={
                                        'relative flex flex-col items-center justify-center gap-1.5 py-3.5 px-2 text-[11px] sm:text-[12px] font-semibold whitespace-nowrap transition-all duration-200 ' +
                                        (isActive
                                            ? 'text-indigo-600 dark:text-white bg-indigo-50 dark:bg-indigo-500/15 shadow-inner'
                                            : 'text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/[0.04]')
                                    }
                                >
                                    <Icon className={`w-4 h-4 sm:w-[18px] sm:h-[18px] transition-transform duration-200 ${isActive ? 'text-indigo-600 dark:text-indigo-400 scale-110' : 'text-slate-400 dark:text-white/40'}`} />
                                    <span>{tab.label}</span>
                                    {isActive && (
                                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-[2.5px] rounded-full bg-gradient-to-r from-teal-400 via-indigo-500 to-pink-500 shadow-sm shadow-indigo-500" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Search & Filter Bar */}
                {(activeTab === 'siswa' ||
                    activeTab === 'pembayaran' ||
                    activeTab === 'pengeluaran' ||
                    activeTab === 'tunggakan') && (
                    <div className="rounded-2xl bg-white/80 dark:bg-zinc-950/60 border border-slate-200 dark:border-white/10 p-4 sm:p-5 mb-6 glass-cyber-card shadow-sm dark:shadow-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            {/* Search Bar */}
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/40" />
                                <input
                                    type="text"
                                    placeholder="Cari nama atau absen..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-500/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 text-sm transition-all outline-none"
                                />
                            </div>

                            {/* Filter by Status (for siswa) */}
                            {activeTab === 'siswa' && (
                                <select
                                    value={filterStatus}
                                    onChange={(e) =>
                                        setFilterStatus(e.target.value)
                                    }
                                    className="px-4 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-500/50 text-slate-900 dark:text-white text-sm transition-all outline-none cursor-pointer"
                                >
                                    <option value="Semua">Semua Status</option>
                                    <option value="Aktif">Aktif</option>
                                    <option value="Tidak Aktif">Tidak Aktif</option>
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
                                    className="px-4 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-500/50 text-slate-900 dark:text-white text-sm transition-all outline-none cursor-pointer"
                                >
                                    <option value="Semua">Semua Metode</option>
                                    <option value="Tunai">Tunai</option>
                                    <option value="Transfer">Transfer</option>
                                    <option value="QRIS">QRIS</option>
                                </select>
                            )}

                            {/* Filter by Category (for pengeluaran) */}
                            {activeTab === 'pengeluaran' && (
                                <select
                                    value={filterCategory}
                                    onChange={(e) =>
                                        setFilterCategory(e.target.value)
                                    }
                                    className="px-4 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-500/50 text-slate-900 dark:text-white text-sm transition-all outline-none cursor-pointer"
                                >
                                    <option value="Semua">Semua Kategori</option>
                                    <option value="Kebersihan">Kebersihan</option>
                                    <option value="Acara">Acara</option>
                                    <option value="Perlengkapan">Perlengkapan</option>
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
                                    className="px-4 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-500/50 text-slate-900 dark:text-white text-sm transition-all outline-none"
                                />
                            )}

                            {/* Date To */}
                            {(activeTab === 'pembayaran' ||
                                activeTab === 'pengeluaran') && (
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="px-4 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-500/50 text-slate-900 dark:text-white text-sm transition-all outline-none"
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
                                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-700 hover:text-slate-900 dark:text-white/70 dark:hover:text-white rounded-xl transition flex items-center justify-center gap-2 border border-slate-200 dark:border-white/10 text-sm font-medium shadow-sm"
                            >
                                <RefreshCw className="w-4 h-4 text-slate-500 dark:text-white/60" />
                                <span>Reset Filter</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        {studentsWithTunggakan > 0 && (
                            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 p-4 sm:p-5 rounded-2xl glass-cyber-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm dark:shadow-lg dark:shadow-amber-950/20">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 shrink-0">
                                        <AlertCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            Perhatian: <span className="text-amber-700 dark:text-amber-300 font-bold">{studentsWithTunggakan} siswa</span> memiliki tunggakan kas
                                        </p>
                                        <p className="text-xs text-slate-600 dark:text-white/50 mt-0.5">
                                            Periksa tab Tunggakan untuk rincian atau kirim pengingat tagihan instan
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setActiveTab('tunggakan')}
                                    className="px-3.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-500/15 dark:hover:bg-amber-500/25 dark:text-amber-300 text-xs font-semibold border border-amber-300 dark:border-amber-500/30 transition-all shrink-0 self-end sm:self-auto shadow-sm"
                                >
                                    Lihat Tunggakan &rarr;
                                </button>
                            </div>
                        )}

                        <div className="rounded-2xl bg-white/80 dark:bg-zinc-950/60 border border-slate-200 dark:border-white/10 overflow-hidden glass-cyber-card shadow-sm dark:shadow-xl dark:shadow-black/30">
                            <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-wide">
                                        Status Pembayaran Siswa
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-white/50 mt-0.5">
                                        Monitoring kas seluruh siswa minggu ke-{currentWeek}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowPayment(true)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:hover:bg-indigo-500/25 dark:text-indigo-300 text-xs font-semibold border border-indigo-200 dark:border-indigo-500/30 transition-all shadow-sm"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Tambah Kas</span>
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 dark:divide-white/[0.04]">
                                    <thead className="bg-slate-50 dark:bg-white/[0.04]">
                                        <tr>
                                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-white/60 uppercase tracking-wider">
                                                Absen
                                            </th>
                                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-white/60 uppercase tracking-wider">
                                                Nama
                                            </th>
                                            <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-white/60 uppercase tracking-wider">
                                                Total Bayar
                                            </th>
                                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-white/60 uppercase tracking-wider">
                                                Tunggakan
                                            </th>
                                            <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-white/60 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-white/60 uppercase tracking-wider">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-white/[0.04]">
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
                                                                ? 'bg-rose-50/70 hover:bg-rose-100/70 dark:bg-rose-500/[0.05] dark:hover:bg-rose-500/[0.1]'
                                                                : 'hover:bg-slate-50/80 dark:hover:bg-white/[0.04]'
                                                        }
                                                    >
                                                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-900 dark:text-white font-medium">
                                                            {student.absen}
                                                        </td>
                                                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-slate-900 dark:text-white">
                                                            <div className="max-w-[120px] sm:max-w-none truncate">
                                                                {student.name}
                                                            </div>
                                                        </td>
                                                        <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-700 dark:text-white">
                                                            {formatRp(
                                                                getTotalPaid(
                                                                    student._id
                                                                )
                                                            )}
                                                        </td>
                                                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                                                            <span
                                                                className={
                                                                    tunggakan >
                                                                    0
                                                                        ? 'text-rose-600 dark:text-rose-300 font-semibold'
                                                                        : 'text-emerald-600 dark:text-indigo-400 font-semibold'
                                                                }
                                                            >
                                                                {formatRp(
                                                                    tunggakan
                                                                )}
                                                            </span>
                                                        </td>
                                                        <td className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                            {late ? (
                                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 inline-flex items-center gap-1 border border-rose-200 dark:border-transparent">
                                                                    <AlertCircle className="w-3 h-3" />{' '}
                                                                    Telat
                                                                </span>
                                                            ) : tunggakan <=
                                                              0 ? (
                                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 dark:bg-indigo-500/10 dark:text-indigo-400 inline-flex items-center gap-1 border border-emerald-200 dark:border-transparent">
                                                                    <CheckCircle className="w-3 h-3" />{' '}
                                                                    Lunas
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 border border-amber-200 dark:border-transparent">
                                                                    Aktif
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                                                            <button
                                                                onClick={() =>
                                                                    addPaymentQuick(
                                                                        student._id
                                                                    )
                                                                }
                                                                className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/18 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition text-xs sm:text-sm font-medium w-full sm:w-auto border border-indigo-200 dark:border-indigo-500/15 shadow-sm"
                                                            >
                                                                💰 Bayar
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
                {activeTab === 'analytics' && (
                    <DashboardAnalytics
                        students={students}
                        payments={payments}
                        expenses={expenses}
                        currentWeek={currentWeek}
                        accumulatedWeeks={accumulatedWeeks}
                        semesterStatus={semesterStatus}
                        startDate={startDate}
                        weeklyAmount={config.weeklyAmount || 2000}
                        onRefresh={loadAllData}
                    />
                )}

                {/* Siswa Tab */}
                {activeTab === 'siswa' && (
                    <div className="rounded-2xl bg-white/80 dark:bg-zinc-950/60 border border-slate-200 dark:border-white/10 glass-cyber-card shadow-sm dark:shadow-xl dark:shadow-black/30 overflow-hidden">
                        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-white/10">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-wide">
                                        Data Siswa
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-white/50 mt-0.5">
                                        Total {filteredStudents.length} siswa terdaftar
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                    <button
                                        onClick={exportStudentsToExcel}
                                        className="flex-1 sm:flex-none bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:hover:bg-teal-500/20 dark:text-teal-300 px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-semibold border border-teal-200 dark:border-teal-500/20 shadow-sm"
                                    >
                                        <Download className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                                        <span className="hidden sm:inline">
                                            Excel
                                        </span>
                                    </button>
                                    <button
                                        onClick={exportStudentsToPDF}
                                        className="flex-1 sm:flex-none bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-300 px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-semibold border border-rose-200 dark:border-rose-400/20 shadow-sm"
                                    >
                                        <FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                                        <span className="hidden sm:inline">
                                            PDF
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => setShowAddStudent(true)}
                                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500/15 dark:hover:bg-indigo-500/25 dark:text-indigo-300 px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-semibold border border-indigo-600 dark:border-indigo-500/30 shadow-sm"
                                    >
                                        <Plus className="w-4 h-4 text-white dark:text-indigo-400" />
                                        <span>Tambah Siswa</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-white/[0.04]">
                                <thead className="bg-slate-50 dark:bg-white/[0.04]">
                                    <tr>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-white/60 uppercase tracking-wider">
                                            Absen
                                        </th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-white/60 uppercase tracking-wider">
                                            Nama
                                        </th>
                                        <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-white/60 uppercase tracking-wider">
                                            WhatsApp
                                        </th>
                                        <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-white/60 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-white/60 uppercase tracking-wider">
                                            Notifikasi
                                        </th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-white/60 uppercase tracking-wider">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-white/[0.04]">
                                    {filteredStudents.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="6"
                                                className="px-3 sm:px-6 py-8 text-center text-slate-500 dark:text-white/60 text-xs sm:text-sm"
                                            >
                                                Tidak ada data siswa yang sesuai
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudents
                                            .sort((a, b) => a.absen - b.absen)
                                            .map((student) => (
                                                <tr
                                                    key={student._id}
                                                    className="hover:bg-slate-50/80 dark:hover:bg-white/[0.04]"
                                                >
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-900 dark:text-white font-medium">
                                                        {student.absen}
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-slate-900 dark:text-white">
                                                        <div className="max-w-[120px] sm:max-w-none truncate">
                                                            {student.name}
                                                        </div>
                                                    </td>
                                                    <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-600 dark:text-white/60">
                                                        {student.phoneNumber ? (
                                                            <span className="flex items-center gap-1">
                                                                📱{' '}
                                                                {
                                                                    student.phoneNumber
                                                                }
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 dark:text-white/55 italic">
                                                                Belum diset
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                        <span
                                                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                                student.status ===
                                                                'Aktif'
                                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-indigo-500/10 dark:text-indigo-400 border border-emerald-200 dark:border-transparent'
                                                                    : student.status ===
                                                                      'Alumni'
                                                                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-transparent'
                                                                    : 'bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-white/60 border border-slate-200 dark:border-transparent'
                                                            }`}
                                                        >
                                                            {student.status}
                                                        </span>
                                                    </td>
                                                    <td className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                        {student.enableNotification !==
                                                        false ? (
                                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 dark:bg-indigo-500/10 dark:text-indigo-400 border border-emerald-200 dark:border-transparent">
                                                                ✓ Aktif
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-white/60 border border-slate-200 dark:border-transparent">
                                                                ✗ Non-aktif
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() =>
                                                                    openEditStudent(
                                                                        student
                                                                    )
                                                                }
                                                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/18 px-3 py-1.5 rounded-lg transition font-medium border border-slate-200 dark:border-indigo-500/15 text-xs sm:text-sm shadow-sm"
                                                            >
                                                                ✏️ Edit
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    deleteStudent(
                                                                        student._id
                                                                    )
                                                                }
                                                                className="text-rose-500 hover:text-rose-700 dark:text-rose-300/60 dark:hover:text-rose-300 p-1.5 transition-colors"
                                                                title="Hapus"
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
                    <div className="rounded-2xl bg-white/80 dark:bg-zinc-950/60 border border-slate-200 dark:border-white/10 glass-cyber-card shadow-sm dark:shadow-xl dark:shadow-black/30 overflow-hidden">
                        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-white/10">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-wide">
                                        Riwayat Pembayaran
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-white/50 mt-0.5">
                                        Total {filteredPayments.length} transaksi pembayaran tercatat
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                    <button
                                        onClick={exportPaymentsToExcel}
                                        className="flex-1 sm:flex-none bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:hover:bg-teal-500/20 dark:text-teal-300 px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-semibold border border-teal-200 dark:border-teal-500/20 shadow-sm"
                                    >
                                        <Download className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                                        <span className="hidden sm:inline">
                                            Excel
                                        </span>
                                    </button>
                                    <button
                                        onClick={exportPaymentsToPDF}
                                        className="flex-1 sm:flex-none bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-300 px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-semibold border border-rose-200 dark:border-rose-400/20 shadow-sm"
                                    >
                                        <Download className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                                        <span className="hidden sm:inline">
                                            PDF
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => setShowPayment(true)}
                                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500/15 dark:hover:bg-indigo-500/25 dark:text-indigo-300 px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-semibold border border-indigo-600 dark:border-indigo-500/30 shadow-sm"
                                    >
                                        <Plus className="w-4 h-4 text-white dark:text-indigo-400" />
                                        <span>Tambah Pembayaran</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-white/[0.04]">
                                <thead className="bg-slate-50 dark:bg-white/[0.04]">
                                    <tr>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-white/60 uppercase tracking-wider">
                                            Tanggal
                                        </th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-white/60 uppercase tracking-wider">
                                            Nama/Sumber
                                        </th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-white/60 uppercase tracking-wider">
                                            Jumlah
                                        </th>
                                        <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-white/60 uppercase tracking-wider">
                                            Metode
                                        </th>
                                        <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-white/60 uppercase tracking-wider">
                                            Tipe
                                        </th>
                                        <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-white/60 uppercase tracking-wider">
                                            Catatan
                                        </th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-white/60 uppercase tracking-wider">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-white/[0.04]">
                                    {paginatedPayments.map((payment, idx) => {
                                        const studentId =
                                            payment.studentId?._id ||
                                            payment.studentId;
                                        const student = students.find(
                                            (s) => s._id === studentId
                                        );
                                        const displayName =
                                            payment.source === 'custom' ||
                                            payment.source === 'event'
                                                ? payment.sourceName
                                                : student?.name ||
                                                  'Siswa tidak ditemukan';

                                        return (
                                            <tr key={`group-${idx}-${payment._id}`} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.04]">
                                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-600 dark:text-white">
                                                    {new Date(
                                                        payment.date
                                                    ).toLocaleDateString(
                                                        'id-ID',
                                                        {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: '2-digit',
                                                        }
                                                    )}
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-slate-900 dark:text-white">
                                                    <div className="max-w-[200px] sm:max-w-none">
                                                        <span>{displayName}</span>
                                                        {payment.count > 1 && (
                                                            <span className="ml-1.5 text-indigo-600 dark:text-indigo-400 font-semibold">
                                                                ×{payment.count}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-900 dark:text-white">
                                                    {payment.count > 1 ? (
                                                        <div>
                                                            <span className="text-slate-500 dark:text-white/50 text-xs">
                                                                {formatRp(payment.amount)} × {payment.count}
                                                            </span>
                                                            <span className="block font-semibold text-teal-600 dark:text-teal-300">
                                                                = {formatRp(payment.totalAmount)}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="font-semibold">
                                                            {formatRp(payment.amount)}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-transparent">
                                                        {payment.method}
                                                    </span>
                                                </td>
                                                <td className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                                                    {payment.source === 'custom' && (
                                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300 border border-teal-200 dark:border-transparent">Custom</span>
                                                    )}
                                                    {payment.source === 'event' && (
                                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-violet-50 text-violet-700 dark:bg-violet-500/30 dark:text-violet-200 border border-violet-200 dark:border-transparent">Event</span>
                                                    )}
                                                    {payment.source === 'regular' && (
                                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-white/60 border border-slate-200 dark:border-transparent">Kas Reguler</span>
                                                    )}
                                                </td>
                                                <td className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-600 dark:text-white/60">
                                                    <div className="max-w-[200px] truncate">
                                                        {payment.note || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedReceiptPayment(payment);
                                                                setShowReceiptModal(true);
                                                            }}
                                                            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20 transition-colors border border-indigo-200 dark:border-transparent"
                                                            title="Lihat Kwitansi Digital"
                                                        >
                                                            <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                        </button>
                                                        {payment.count > 1 ? (
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => deletePayment(payment.paymentIds[payment.paymentIds.length - 1])}
                                                                    className="px-2 py-1 rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20 transition-colors text-xs font-medium border border-rose-200 dark:border-transparent"
                                                                    title="Hapus 1 pembayaran"
                                                                >
                                                                    −1
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        if (window.confirm(`Hapus SEMUA ${payment.count} pembayaran ini?`)) {
                                                                            payment.paymentIds.forEach((id) => deletePayment(id));
                                                                        }
                                                                    }}
                                                                    className="text-rose-400 hover:text-rose-600 dark:text-rose-300/40 dark:hover:text-rose-300 p-1 transition-colors"
                                                                    title={`Hapus semua ${payment.count}`}
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => deletePayment(payment._id)}
                                                                className="text-rose-500 hover:text-rose-700 dark:text-rose-300/60 dark:hover:text-rose-300 p-1.5 transition-colors"
                                                                title="Hapus"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {totalPaymentPages > 1 && (
                            <div className="p-4 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
                                <p className="text-xs text-slate-500 dark:text-white/40">
                                    Hal. {paymentPage}/{totalPaymentPages} · {groupedPayments.length} grup dari {filteredPayments.length} pembayaran
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setPaymentPage(1)}
                                        disabled={paymentPage === 1}
                                        className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] text-slate-600 dark:text-white/50 dark:hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition border border-slate-200 dark:border-transparent"
                                    >
                                        «
                                    </button>
                                    <button
                                        onClick={() => setPaymentPage((p) => Math.max(1, p - 1))}
                                        disabled={paymentPage === 1}
                                        className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] text-slate-600 dark:text-white/50 dark:hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition border border-slate-200 dark:border-transparent"
                                    >
                                        ‹
                                    </button>
                                    {Array.from({ length: Math.min(5, totalPaymentPages) }, (_, i) => {
                                        let page;
                                        if (totalPaymentPages <= 5) {
                                            page = i + 1;
                                        } else if (paymentPage <= 3) {
                                            page = i + 1;
                                        } else if (paymentPage >= totalPaymentPages - 2) {
                                            page = totalPaymentPages - 4 + i;
                                        } else {
                                            page = paymentPage - 2 + i;
                                        }
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => setPaymentPage(page)}
                                                className={`px-3 py-1.5 text-xs rounded-lg transition font-medium ${
                                                    paymentPage === page
                                                        ? 'bg-indigo-600 text-white dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-600 dark:border-indigo-500/30'
                                                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] text-slate-700 dark:text-white/50 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-transparent'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    })}
                                    <button
                                        onClick={() => setPaymentPage((p) => Math.min(totalPaymentPages, p + 1))}
                                        disabled={paymentPage === totalPaymentPages}
                                        className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] text-slate-600 dark:text-white/50 dark:hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition border border-slate-200 dark:border-transparent"
                                    >
                                        ›
                                    </button>
                                    <button
                                        onClick={() => setPaymentPage(totalPaymentPages)}
                                        disabled={paymentPage === totalPaymentPages}
                                        className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] text-slate-600 dark:text-white/50 dark:hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition border border-slate-200 dark:border-transparent"
                                    >
                                        »
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Pengeluaran Tab */}
                {activeTab === 'pengeluaran' && (
                    <div className="rounded-2xl bg-white/80 dark:bg-zinc-950/60 border border-slate-200 dark:border-white/10 glass-cyber-card shadow-sm dark:shadow-xl dark:shadow-black/30 overflow-hidden">
                        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-white/10">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-wide">
                                        Riwayat Pengeluaran
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-white/50 mt-0.5">
                                        Total {filteredExpenses.length} pos pengeluaran kas tercatat
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                    <button
                                        onClick={exportExpensesToExcel}
                                        className="flex-1 sm:flex-none bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:hover:bg-teal-500/20 dark:text-teal-300 px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-semibold border border-teal-200 dark:border-teal-500/20 shadow-sm"
                                    >
                                        <Download className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                                        <span className="hidden sm:inline">
                                            Excel
                                        </span>
                                    </button>
                                    <button
                                        onClick={exportExpensesToPDF}
                                        className="flex-1 sm:flex-none bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-300 px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-semibold border border-rose-200 dark:border-rose-400/20 shadow-sm"
                                    >
                                        <Download className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                                        <span className="hidden sm:inline">
                                            PDF
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => setShowExpense(true)}
                                        className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white dark:bg-rose-500/15 dark:hover:bg-rose-500/25 dark:text-rose-300 px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-semibold border border-rose-600 dark:border-rose-500/30 shadow-sm"
                                    >
                                        <Plus className="w-4 h-4 text-white dark:text-rose-400" />
                                        <span>Tambah Pengeluaran</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-white/[0.04]">
                                <thead className="bg-slate-50 dark:bg-white/[0.04]">
                                    <tr>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-white/60 uppercase tracking-wider">
                                            Tanggal
                                        </th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-white/60 uppercase tracking-wider">
                                            Keperluan
                                        </th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-white/60 uppercase tracking-wider">
                                            Jumlah
                                        </th>
                                        <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-white/60 uppercase tracking-wider">
                                            Kategori
                                        </th>
                                        <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-white/60 uppercase tracking-wider">
                                            Disetujui
                                        </th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-white/60 uppercase tracking-wider">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-white/[0.04]">
                                    {filteredExpenses.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="6"
                                                className="px-3 sm:px-6 py-8 text-center text-slate-500 dark:text-white/60 text-xs sm:text-sm"
                                            >
                                                Tidak ada data pengeluaran yang
                                                sesuai
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredExpenses.map((expense) => (
                                            <tr
                                                key={expense._id}
                                                className="hover:bg-slate-50/80 dark:hover:bg-white/[0.04]"
                                            >
                                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-600 dark:text-white">
                                                    {new Date(
                                                        expense.date
                                                    ).toLocaleDateString(
                                                        'id-ID',
                                                        {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: '2-digit',
                                                        }
                                                    )}
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-slate-900 dark:text-white">
                                                    <div className="max-w-[150px] sm:max-w-none truncate">
                                                        {expense.purpose}
                                                    </div>
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-300">
                                                    {formatRp(expense.amount)}
                                                </td>
                                                <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                                                    <span
                                                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                            expense.category ===
                                                            'Kebersihan'
                                                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-transparent'
                                                                : expense.category ===
                                                                  'Acara'
                                                                ? 'bg-violet-50 text-violet-700 dark:bg-violet-500/30 dark:text-violet-200 border border-violet-200 dark:border-transparent'
                                                                : expense.category ===
                                                                  'Perlengkapan'
                                                                ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300 border border-teal-200 dark:border-transparent'
                                                                : 'bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-white/60 border border-slate-200 dark:border-transparent'
                                                        }`}
                                                    >
                                                        {expense.category}
                                                    </span>
                                                </td>
                                                <td className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-600 dark:text-white/60">
                                                    {expense.approvedBy}
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                                                    <button
                                                        onClick={() =>
                                                            deleteExpense(
                                                                expense._id
                                                            )
                                                        }
                                                        className="text-rose-500 hover:text-rose-700 dark:text-rose-300/60 dark:hover:text-rose-300 p-1.5 transition-colors"
                                                        title="Hapus"
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

                {/* Tunggakan Tab */}
                {activeTab === 'tunggakan' && (
                    <div className="rounded-2xl bg-white/80 dark:bg-zinc-950/60 border border-slate-200 dark:border-white/10 glass-cyber-card shadow-sm dark:shadow-xl dark:shadow-black/30 overflow-hidden">
                        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-white/10">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-wide">
                                        Daftar Tunggakan
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-white/50 mt-0.5">
                                        Siswa yang belum bayar minggu ke-{currentWeek}
                                    </p>
                                </div>
                                <div className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-right sm:text-right w-full sm:w-auto flex sm:block items-center justify-between shadow-sm">
                                    <p className="text-[11px] text-slate-500 dark:text-white/60 uppercase tracking-wider">
                                        Total Belum Lunas
                                    </p>
                                    <p className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-300">
                                        {getUnpaidStudents().length} Siswa
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            {getUnpaidStudents().length === 0 ? (
                                <div className="p-12 text-center">
                                    <CheckCircle className="w-16 h-16 text-teal-500 dark:text-teal-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                        Semua Sudah Bayar! 🎉
                                    </h3>
                                    <p className="text-slate-600 dark:text-white/60">
                                        Tidak ada siswa yang memiliki tunggakan
                                        minggu ini
                                    </p>
                                </div>
                            ) : (
                                <table className="w-full divide-y divide-slate-200 dark:divide-white/[0.04]">
                                    <thead className="bg-slate-50 dark:bg-white/[0.04]">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-white/60 uppercase">
                                                Absen
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-white/60 uppercase">
                                                Nama
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-white/60 uppercase">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-white/60 uppercase">
                                                Tunggakan
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-white/60 uppercase">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-white/[0.04]">
                                        {getUnpaidStudents()
                                            .sort((a, b) => a.absen - b.absen)
                                            .map((student) => {
                                                // Use correct getTunggakan function
                                                const tunggakan = getTunggakan(
                                                    student._id
                                                );
                                                return (
                                                    <tr key={student._id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.04]">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white font-medium">
                                                            {student.absen}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                                                            {student.name}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 border border-rose-200 dark:border-transparent">
                                                                Belum Bayar
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-rose-600 dark:text-rose-300 font-semibold">
                                                            {formatRp(
                                                                tunggakan
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() =>
                                                                        addPaymentQuick(
                                                                            student._id
                                                                        )
                                                                    }
                                                                    className="bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:hover:bg-teal-500/18 dark:text-teal-300 px-3 py-1.5 rounded-lg transition text-xs border border-teal-200 dark:border-teal-500/15 font-medium shadow-sm"
                                                                >
                                                                    Bayar Sekarang
                                                                </button>
                                                                <button
                                                                    onClick={() => handleSendWAReminder(student, tunggakan)}
                                                                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-300 px-2.5 py-1.5 rounded-lg transition text-xs border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1.5 font-medium shadow-sm"
                                                                    title="Kirim pengingat tunggakan via WhatsApp"
                                                                >
                                                                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                                                    <span>Ingatkan</span>
                                                                </button>
                                                            </div>
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
                        onWeekChange={loadCurrentWeek}
                        onConfigUpdated={refreshConfig}
                    />
                )}

                {/* Modal Add Student */}
                {showAddStudent && (
                    <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 backdrop-animate">
                        <div className="bg-white dark:bg-[#1e1e22] border border-slate-200 dark:border-white/[0.12] rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto modal-animate text-slate-900 dark:text-white shadow-2xl">
                            <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
                                Tambah Siswa Baru
                            </h3>
                            <form onSubmit={addStudent} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-white/60 mb-1">
                                        Nomor Absen
                                    </label>
                                    <input
                                        type="number"
                                        name="absen"
                                        required
                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/[0.06] border border-slate-300 dark:border-white/[0.1] rounded-xl focus:ring-2 focus:ring-indigo-400/25 focus:border-indigo-500 dark:focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-white/60 mb-1">
                                        Nama Lengkap
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/[0.06] border border-slate-300 dark:border-white/[0.1] rounded-xl focus:ring-2 focus:ring-indigo-400/25 focus:border-indigo-500 dark:focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-white/60 mb-1">
                                        Nama Panggilan (Opsional)
                                    </label>
                                    <input
                                        type="text"
                                        name="nickname"
                                        placeholder="Contoh: Budi, Andi, Siti"
                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/[0.06] border border-slate-300 dark:border-white/[0.1] rounded-xl focus:ring-2 focus:ring-indigo-400/25 focus:border-indigo-500 dark:focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40"
                                    />
                                    <p className="text-xs text-slate-500 dark:text-white/60 mt-1">
                                        Nama panggilan untuk ditampilkan di leaderboard
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-white/60 mb-1">
                                        Nomor WhatsApp (Opsional)
                                    </label>
                                    <input
                                        type="text"
                                        name="phoneNumber"
                                        placeholder="08xxxxxxxxxx atau 628xxxxxxxxxx"
                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/[0.06] border border-slate-300 dark:border-white/[0.1] rounded-xl focus:ring-2 focus:ring-indigo-400/25 focus:border-indigo-500 dark:focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40"
                                    />
                                    <p className="text-xs text-slate-500 dark:text-white/60 mt-1">
                                        Format: 08xxx atau 628xxx (tanpa spasi/strip)
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="enableNotification"
                                        id="enableNotification"
                                        defaultChecked
                                        className="w-4 h-4 text-indigo-600 rounded bg-slate-100 dark:bg-white/[0.04] border-slate-300 dark:border-white/[0.1]"
                                    />
                                    <label
                                        htmlFor="enableNotification"
                                        className="text-sm text-slate-700 dark:text-white/60"
                                    >
                                        Aktifkan notifikasi WhatsApp
                                    </label>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddStudent(false)}
                                        className="flex-1 px-4 py-2 border border-slate-300 dark:border-white/[0.12] rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.07] transition text-slate-700 dark:text-white/60 font-medium"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm transition"
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
                    <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 backdrop-animate">
                        <div className="bg-white dark:bg-[#1e1e22] border border-slate-200 dark:border-white/[0.12] rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto modal-animate text-slate-900 dark:text-white shadow-2xl">
                            <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
                                Edit Data Siswa
                            </h3>
                            <form
                                onSubmit={updateStudent}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-white/60 mb-1">
                                        Nomor Absen
                                    </label>
                                    <input
                                        type="number"
                                        name="absen"
                                        defaultValue={editingStudent.absen}
                                        required
                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/[0.06] border border-slate-300 dark:border-white/[0.1] rounded-xl focus:ring-2 focus:ring-indigo-400/25 focus:border-indigo-500 dark:focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-white/60 mb-1">
                                        Nama Lengkap
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        defaultValue={editingStudent.name}
                                        required
                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/[0.06] border border-slate-300 dark:border-white/[0.1] rounded-xl focus:ring-2 focus:ring-indigo-400/25 focus:border-indigo-500 dark:focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-white/60 mb-1">
                                        Nama Panggilan (Opsional)
                                    </label>
                                    <input
                                        type="text"
                                        name="nickname"
                                        defaultValue={
                                            editingStudent.nickname || ''
                                        }
                                        placeholder="Contoh: Budi, Andi, Siti"
                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/[0.06] border border-slate-300 dark:border-white/[0.1] rounded-xl focus:ring-2 focus:ring-indigo-400/25 focus:border-indigo-500 dark:focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40"
                                    />
                                    <p className="text-xs text-slate-500 dark:text-white/60 mt-1">
                                        Nama panggilan untuk ditampilkan di leaderboard
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-white/60 mb-1">
                                        Nomor WhatsApp
                                    </label>
                                    <input
                                        type="text"
                                        name="phoneNumber"
                                        defaultValue={
                                            editingStudent.phoneNumber || ''
                                        }
                                        placeholder="08xxxxxxxxxx atau 628xxxxxxxxxx"
                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/[0.06] border border-slate-300 dark:border-white/[0.1] rounded-xl focus:ring-2 focus:ring-indigo-400/25 focus:border-indigo-500 dark:focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40"
                                    />
                                    <p className="text-xs text-slate-500 dark:text-white/60 mt-1">
                                        Format: 08xxx atau 628xxx (tanpa spasi/strip)
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-white/60 mb-1">
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        defaultValue={editingStudent.status}
                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/[0.06] border border-slate-300 dark:border-white/[0.1] rounded-xl focus:ring-2 focus:ring-indigo-400/25 focus:border-indigo-500 dark:focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white"
                                    >
                                        <option value="Aktif">Aktif</option>
                                        <option value="Tidak Aktif">Tidak Aktif</option>
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
                                        className="w-4 h-4 text-indigo-600 rounded bg-slate-100 dark:bg-white/[0.04] border-slate-300 dark:border-white/[0.1]"
                                    />
                                    <label
                                        htmlFor="enableNotificationEdit"
                                        className="text-sm text-slate-700 dark:text-white/60"
                                    >
                                        Aktifkan notifikasi WhatsApp
                                    </label>
                                </div>
                                <div className="bg-indigo-50 dark:bg-indigo-500/8 border border-indigo-200 dark:border-indigo-500/15 rounded-xl p-3">
                                    <p className="text-xs text-indigo-700 dark:text-indigo-400">
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
                                        className="flex-1 px-4 py-2 border border-slate-300 dark:border-white/[0.12] rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.07] transition text-slate-700 dark:text-white/60 font-medium"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm transition"
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
                    <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 backdrop-animate">
                        <div className="bg-white dark:bg-[#1e1e22] border border-slate-200 dark:border-white/[0.12] rounded-2xl modal-animate max-w-md w-full p-6 text-slate-900 dark:text-white shadow-2xl">
                            <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
                                Tambah Pembayaran
                            </h3>
                            <form onSubmit={addPayment} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-white/60 mb-1">
                                        Siswa
                                    </label>
                                    <select
                                        name="student"
                                        required
                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/[0.06] border border-slate-300 dark:border-white/[0.1] rounded-xl focus:ring-2 focus:ring-indigo-400/25 focus:border-indigo-500 dark:focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white"
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
                                    <label className="block text-sm font-medium text-slate-700 dark:text-white/60 mb-1">
                                        Jumlah
                                    </label>
                                    <input
                                        type="number"
                                        name="amount"
                                        defaultValue={config.weeklyAmount || 2000}
                                        required
                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/[0.06] border border-slate-300 dark:border-white/[0.1] rounded-xl focus:ring-2 focus:ring-indigo-400/25 focus:border-indigo-500 dark:focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-white/60 mb-1">
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
                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/[0.06] border border-slate-300 dark:border-white/[0.1] rounded-xl focus:ring-2 focus:ring-indigo-400/25 focus:border-indigo-500 dark:focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-white/60 mb-1">
                                        Metode
                                    </label>
                                    <select
                                        name="method"
                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/[0.06] border border-slate-300 dark:border-white/[0.1] rounded-xl focus:ring-2 focus:ring-indigo-400/25 focus:border-indigo-500 dark:focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white"
                                    >
                                        <option>Tunai</option>
                                        <option>Transfer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-white/60 mb-1">
                                        Catatan (opsional)
                                    </label>
                                    <input
                                        type="text"
                                        name="note"
                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/[0.06] border border-slate-300 dark:border-white/[0.1] rounded-xl focus:ring-2 focus:ring-indigo-400/25 focus:border-indigo-500 dark:focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowPayment(false)}
                                        className="flex-1 px-4 py-2 border border-slate-300 dark:border-white/[0.12] rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.07] transition text-slate-700 dark:text-white/60 font-medium"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm transition"
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
                    <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 backdrop-animate">
                        <div className="bg-white dark:bg-[#1e1e22] border border-slate-200 dark:border-white/[0.12] rounded-2xl max-w-md w-full p-6 modal-animate text-slate-900 dark:text-white shadow-2xl">
                            <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
                                Tambah Pengeluaran
                            </h3>
                            <form onSubmit={addExpense} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-white/60 mb-1">
                                        Keperluan
                                    </label>
                                    <input
                                        type="text"
                                        name="purpose"
                                        required
                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/[0.06] border border-slate-300 dark:border-white/[0.1] rounded-xl focus:ring-2 focus:ring-indigo-400/25 focus:border-indigo-500 dark:focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-white/60 mb-1">
                                        Jumlah
                                    </label>
                                    <input
                                        type="number"
                                        name="amount"
                                        required
                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/[0.06] border border-slate-300 dark:border-white/[0.1] rounded-xl focus:ring-2 focus:ring-indigo-400/25 focus:border-indigo-500 dark:focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-white/60 mb-1">
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
                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/[0.06] border border-slate-300 dark:border-white/[0.1] rounded-xl focus:ring-2 focus:ring-indigo-400/25 focus:border-indigo-500 dark:focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-white/60 mb-1">
                                        Kategori
                                    </label>
                                    <select
                                        name="category"
                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/[0.06] border border-slate-300 dark:border-white/[0.1] rounded-xl focus:ring-2 focus:ring-indigo-400/25 focus:border-indigo-500 dark:focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white"
                                    >
                                        <option>Kebersihan</option>
                                        <option>Acara</option>
                                        <option>Perlengkapan</option>
                                        <option>Lain-lain</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-white/60 mb-1">
                                        Disetujui Oleh
                                    </label>
                                    <input
                                        type="text"
                                        name="approvedBy"
                                        required
                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/[0.06] border border-slate-300 dark:border-white/[0.1] rounded-xl focus:ring-2 focus:ring-indigo-400/25 focus:border-indigo-500 dark:focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowExpense(false)}
                                        className="flex-1 px-4 py-2 border border-slate-300 dark:border-white/[0.12] rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.07] transition text-slate-700 dark:text-white/60 font-medium"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm transition"
                                    >
                                        Simpan
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Digital Receipt Modal */}
                <ReceiptModal
                    isOpen={showReceiptModal}
                    onClose={() => {
                        setShowReceiptModal(false);
                        setSelectedReceiptPayment(null);
                    }}
                    payment={selectedReceiptPayment}
                    student={
                        selectedReceiptPayment
                            ? students.find(
                                  (s) =>
                                      s._id ===
                                      (selectedReceiptPayment.studentId?._id ||
                                          selectedReceiptPayment.studentId)
                              )
                            : null
                    }
                />

                {/* Send Financial Report to WA Group Modal */}
                <SendFinancialReportModal
                    isOpen={showGroupReportModal}
                    onClose={() => setShowGroupReportModal(false)}
                />
            </div>
        </div>
    );
};

export default App;
