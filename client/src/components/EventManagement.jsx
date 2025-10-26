import React, { useState, useEffect } from 'react';
import {
    Calendar,
    DollarSign,
    Users,
    Target,
    Plus,
    Trash2,
    CheckCircle,
    AlertCircle,
    TrendingUp,
    X,
} from 'lucide-react';
import { eventsAPI, eventPaymentsAPI, studentsAPI } from '../services/api';

const EventManagement = () => {
    const [events, setEvents] = useState([]);
    const [students, setStudents] = useState([]);
    const [activeEvent, setActiveEvent] = useState(null);
    const [eventPayments, setEventPayments] = useState([]);
    const [showCreateEvent, setShowCreateEvent] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [eventsRes, studentsRes] = await Promise.all([
                eventsAPI.getAll(),
                studentsAPI.getAll(),
            ]);
            setEvents(eventsRes.data);
            setStudents(studentsRes.data);
        } catch (err) {
            setError('Gagal memuat data');
        } finally {
            setLoading(false);
        }
    };

    const loadEventPayments = async (eventId) => {
        try {
            const response = await eventPaymentsAPI.getByEvent(eventId);
            setEventPayments(response.data);
        } catch (err) {
            console.error('Error loading payments:', err);
        }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const targetAmount = parseInt(formData.get('targetAmount'));
        const totalStudents = students.length;
        const calculatedPerStudent =
            totalStudents > 0 ? Math.ceil(targetAmount / totalStudents) : 0;

        try {
            const newEvent = {
                name: formData.get('name'),
                description: formData.get('description'),
                targetAmount: targetAmount,
                perStudentAmount:
                    parseInt(formData.get('perStudentAmount')) ||
                    calculatedPerStudent,
                startDate: formData.get('startDate'),
                endDate: formData.get('endDate'),
            };

            const response = await eventsAPI.create(newEvent);
            setEvents([response.data, ...events]);
            setShowCreateEvent(false);
            e.target.reset();
            alert('Event berhasil dibuat!');
        } catch (err) {
            console.error('Error creating event:', err);
            alert(
                'Gagal membuat event: ' +
                    (err.response?.data?.message || err.message)
            );
        }
    };

    const handleAddPayment = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        try {
            const payment = {
                studentId: formData.get('studentId'),
                amount: parseInt(formData.get('amount')),
                date: formData.get('date'),
                method: formData.get('method'),
                note: formData.get('note'),
            };

            await eventPaymentsAPI.create(activeEvent._id, payment);
            await loadData();
            await loadEventPayments(activeEvent._id);

            // Update active event
            const updatedEvent = events.find((e) => e._id === activeEvent._id);
            setActiveEvent(updatedEvent);

            setShowPaymentModal(false);
            e.target.reset();
        } catch (err) {
            alert('Gagal menambah pembayaran: ' + err.response?.data?.message);
        }
    };

    const handleCompleteEvent = async (eventId) => {
        if (
            !window.confirm(
                'Selesaikan event ini? Surplus akan ditransfer ke kas.'
            )
        ) {
            return;
        }

        try {
            const response = await eventsAPI.complete(eventId);
            alert(
                `Event selesai! Surplus Rp ${response.data.surplus.toLocaleString(
                    'id-ID'
                )} ditransfer ke kas.`
            );
            await loadData();
            setActiveEvent(null);
        } catch (err) {
            alert('Gagal menyelesaikan event: ' + err.response?.data?.message);
        }
    };

    const handleDeleteEvent = async (eventId) => {
        if (
            !window.confirm(
                'Hapus event ini? Semua data pembayaran akan dihapus.'
            )
        ) {
            return;
        }

        try {
            await eventsAPI.delete(eventId);
            setEvents(events.filter((e) => e._id !== eventId));
            if (activeEvent?._id === eventId) {
                setActiveEvent(null);
            }
        } catch (err) {
            alert('Gagal menghapus event');
        }
    };

    const formatRp = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getEventProgress = (event) => {
        const percentage = (event.totalCollected / event.targetAmount) * 100;
        return Math.min(percentage, 100);
    };

    const getUnpaidStudents = (event) => {
        if (!event) return [];
        const paidIds = event.studentsPaid.map((s) => s._id || s);
        return students.filter((s) => !paidIds.includes(s._id));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-600 p-3 rounded-lg">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">
                                Event Management
                            </h2>
                            <p className="text-gray-500">
                                Kelola iuran event & kegiatan kelas
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreateEvent(true)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Buat Event Baru
                    </button>
                </div>
            </div>

            {/* Active Events */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events
                    .filter((e) => e.status === 'aktif')
                    .map((event) => {
                        const progress = getEventProgress(event);
                        const unpaid = getUnpaidStudents(event);
                        const surplus =
                            event.totalCollected - event.targetAmount;

                        return (
                            <div
                                key={event._id}
                                className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer"
                                onClick={() => {
                                    setActiveEvent(event);
                                    loadEventPayments(event._id);
                                }}
                            >
                                <div className="p-4 border-b">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-bold text-lg text-gray-800">
                                            {event.name}
                                        </h3>
                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                            Aktif
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {event.description}
                                    </p>
                                </div>

                                <div className="p-4 space-y-3">
                                    {/* Progress Bar */}
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-600">
                                                Progress
                                            </span>
                                            <span className="font-semibold text-purple-600">
                                                {progress.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-purple-600 h-2 rounded-full transition-all"
                                                style={{
                                                    width: `${progress}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <p className="text-gray-500">
                                                Target
                                            </p>
                                            <p className="font-semibold">
                                                {formatRp(event.targetAmount)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">
                                                Terkumpul
                                            </p>
                                            <p className="font-semibold text-green-600">
                                                {formatRp(event.totalCollected)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">
                                                Per Siswa
                                            </p>
                                            <p className="font-semibold">
                                                {formatRp(
                                                    event.perStudentAmount
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">
                                                Sudah Bayar
                                            </p>
                                            <p className="font-semibold">
                                                {event.studentsPaid.length}{' '}
                                                siswa
                                            </p>
                                        </div>
                                    </div>

                                    {/* Surplus Info */}
                                    {surplus > 0 && (
                                        <div className="bg-green-50 border border-green-200 rounded p-2 text-sm">
                                            <p className="text-green-800 font-semibold">
                                                Surplus: {formatRp(surplus)}
                                            </p>
                                            <p className="text-xs text-green-600">
                                                Akan masuk ke kas saat event
                                                selesai
                                            </p>
                                        </div>
                                    )}

                                    {/* Unpaid Count */}
                                    {unpaid.length > 0 && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                                            <p className="text-xs text-yellow-800">
                                                <AlertCircle className="w-3 h-3 inline mr-1" />
                                                {unpaid.length} siswa belum
                                                bayar
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
            </div>

            {/* Completed Events */}
            {events.filter((e) => e.status === 'selesai').length > 0 && (
                <div className="bg-white rounded-lg shadow">
                    <div className="p-4 border-b">
                        <h3 className="font-bold text-gray-800">
                            Event Selesai
                        </h3>
                    </div>
                    <div className="p-4 space-y-2">
                        {events
                            .filter((e) => e.status === 'selesai')
                            .map((event) => (
                                <div
                                    key={event._id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                                >
                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            {event.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Terkumpul:{' '}
                                            {formatRp(event.totalCollected)} •
                                            Surplus:{' '}
                                            {formatRp(
                                                event.totalCollected -
                                                    event.targetAmount
                                            )}
                                        </p>
                                    </div>
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Event Detail Modal */}
            {activeEvent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="p-6 border-b sticky top-0 bg-white">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-800">
                                        {activeEvent.name}
                                    </h3>
                                    <p className="text-gray-500 mt-1">
                                        {activeEvent.description}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setActiveEvent(null)}
                                    className="p-2 hover:bg-gray-100 rounded"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Progress Summary */}
                            <div className="mt-4 grid grid-cols-4 gap-4">
                                <div className="bg-purple-50 p-3 rounded">
                                    <p className="text-xs text-purple-600 mb-1">
                                        Target
                                    </p>
                                    <p className="font-bold text-purple-900">
                                        {formatRp(activeEvent.targetAmount)}
                                    </p>
                                </div>
                                <div className="bg-green-50 p-3 rounded">
                                    <p className="text-xs text-green-600 mb-1">
                                        Terkumpul
                                    </p>
                                    <p className="font-bold text-green-900">
                                        {formatRp(activeEvent.totalCollected)}
                                    </p>
                                </div>
                                <div className="bg-blue-50 p-3 rounded">
                                    <p className="text-xs text-blue-600 mb-1">
                                        Per Siswa
                                    </p>
                                    <p className="font-bold text-blue-900">
                                        {formatRp(activeEvent.perStudentAmount)}
                                    </p>
                                </div>
                                <div className="bg-yellow-50 p-3 rounded">
                                    <p className="text-xs text-yellow-600 mb-1">
                                        Sudah Bayar
                                    </p>
                                    <p className="font-bold text-yellow-900">
                                        {activeEvent.studentsPaid.length}/
                                        {students.length}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6">
                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowPaymentModal(true)}
                                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Tambah Pembayaran
                                </button>
                                {activeEvent.totalCollected >=
                                    activeEvent.targetAmount && (
                                    <button
                                        onClick={() =>
                                            handleCompleteEvent(activeEvent._id)
                                        }
                                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Selesaikan Event
                                    </button>
                                )}
                                <button
                                    onClick={() =>
                                        handleDeleteEvent(activeEvent._id)
                                    }
                                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Unpaid Students */}
                            {getUnpaidStudents(activeEvent).length > 0 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-yellow-900 mb-2">
                                        Siswa Belum Bayar (
                                        {getUnpaidStudents(activeEvent).length})
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {getUnpaidStudents(activeEvent).map(
                                            (student) => (
                                                <span
                                                    key={student._id}
                                                    className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm"
                                                >
                                                    {student.absen}.{' '}
                                                    {student.name}
                                                </span>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Payment History */}
                            <div>
                                <h4 className="font-semibold text-gray-800 mb-3">
                                    Riwayat Pembayaran
                                </h4>
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                                    Tanggal
                                                </th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                                    Nama
                                                </th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                                    Jumlah
                                                </th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                                    Metode
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {eventPayments.map((payment) => (
                                                <tr key={payment._id}>
                                                    <td className="px-4 py-2 text-sm">
                                                        {new Date(
                                                            payment.date
                                                        ).toLocaleDateString(
                                                            'id-ID'
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm font-medium">
                                                        {payment.studentId
                                                            ?.name || '-'}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm">
                                                        {formatRp(
                                                            payment.amount
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm">
                                                        <span
                                                            className={`px-2 py-1 text-xs rounded-full ${
                                                                payment.method ===
                                                                'Tunai'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-blue-100 text-blue-800'
                                                            }`}
                                                        >
                                                            {payment.method}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Event Modal */}
            {showCreateEvent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full p-6">
                        <h3 className="text-xl font-bold mb-4">
                            Buat Event Baru
                        </h3>
                        <form
                            onSubmit={handleCreateEvent}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nama Event
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    placeholder="Contoh: Study Tour"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Deskripsi
                                </label>
                                <textarea
                                    name="description"
                                    rows="2"
                                    placeholder="Deskripsi singkat event"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Target Iuran Total
                                    </label>
                                    <input
                                        type="number"
                                        name="targetAmount"
                                        required
                                        id="targetAmount"
                                        onChange={(e) => {
                                            const target =
                                                parseInt(e.target.value) || 0;
                                            const perStudent =
                                                students.length > 0
                                                    ? Math.ceil(
                                                          target /
                                                              students.length
                                                      )
                                                    : 0;
                                            document.getElementById(
                                                'perStudentAmount'
                                            ).value = perStudent;
                                            document.getElementById(
                                                'calculatedInfo'
                                            ).textContent =
                                                students.length > 0
                                                    ? `${formatRp(target)} ÷ ${
                                                          students.length
                                                      } siswa = ${formatRp(
                                                          perStudent
                                                      )}`
                                                    : 'Belum ada data siswa. Silakan tambahkan siswa terlebih dahulu.';
                                        }}
                                        placeholder="100000"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Iuran Per Siswa
                                    </label>
                                    <input
                                        type="number"
                                        name="perStudentAmount"
                                        required
                                        id="perStudentAmount"
                                        placeholder="3500"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                                <p
                                    className="text-blue-800"
                                    id="calculatedInfo"
                                >
                                    Masukkan target iuran untuk kalkulasi
                                    otomatis
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tanggal Mulai
                                    </label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        required
                                        defaultValue={
                                            new Date()
                                                .toISOString()
                                                .split('T')[0]
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tanggal Selesai
                                    </label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateEvent(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                                >
                                    Buat Event
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Payment Modal */}
            {showPaymentModal && activeEvent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">
                            Tambah Pembayaran Event
                        </h3>
                        <form onSubmit={handleAddPayment} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Siswa
                                </label>
                                <select
                                    name="studentId"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="">Pilih Siswa</option>
                                    {students
                                        .sort((a, b) => a.absen - b.absen)
                                        .map((student) => (
                                            <option
                                                key={student._id}
                                                value={student._id}
                                            >
                                                {student.absen}. {student.name}
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
                                    defaultValue={activeEvent.perStudentAmount}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Default:{' '}
                                    {formatRp(activeEvent.perStudentAmount)}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tanggal
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    defaultValue={
                                        new Date().toISOString().split('T')[0]
                                    }
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Metode
                                </label>
                                <select
                                    name="method"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
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

export default EventManagement;
