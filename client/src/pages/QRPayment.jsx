import { useState, useEffect } from 'react';
import api from '../services/api';

function QRPayment() {
    const [activeQR, setActiveQR] = useState(null);
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [proofImage, setProofImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [tunggakan, setTunggakan] = useState(0);

    useEffect(() => {
        fetchActiveQR();
        fetchStudents();
    }, []);

    const fetchActiveQR = async () => {
        try {
            const response = await api.get('/qr-payment/active');
            if (response.data.success) {
                setActiveQR(response.data.qrCode);
            }
        } catch (error) {
            console.error('Error fetching QR code:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        try {
            const response = await api.get('/students');
            if (response.data.success) {
                setStudents(response.data.students);
            }
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const calculateTunggakan = async (studentId) => {
        if (!studentId) return;

        try {
            const response = await api.get(`/payments/tunggakan/${studentId}`);
            if (response.data.success) {
                setTunggakan(response.data.tunggakan);
                setAmount(response.data.tunggakan.toString());
            }
        } catch (error) {
            console.error('Error calculating tunggakan:', error);
        }
    };

    const handleStudentChange = (e) => {
        const studentId = e.target.value;
        setSelectedStudent(studentId);
        calculateTunggakan(studentId);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setMessage('Ukuran file maksimal 5MB');
                return;
            }

            setProofImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (!selectedStudent || !amount || !proofImage) {
            setMessage('Semua field harus diisi');
            return;
        }

        const formData = new FormData();
        formData.append('studentId', selectedStudent);
        formData.append('amount', amount);
        formData.append('notes', notes);
        formData.append('proofImage', proofImage);

        setSubmitting(true);

        try {
            const response = await api.post('/qr-payment/confirm', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                setMessage('✅ ' + response.data.message);
                // Reset form
                setSelectedStudent('');
                setAmount('');
                setNotes('');
                setProofImage(null);
                setPreviewUrl('');
                setTunggakan(0);
            }
        } catch (error) {
            setMessage(
                '❌ ' +
                    (error.response?.data?.message ||
                        'Gagal mengirim konfirmasi')
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="text-center py-8">Loading...</div>;
    }

    if (!activeQR) {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                    <p className="text-yellow-800">
                        QR Code pembayaran belum tersedia. Silakan hubungi
                        bendahara.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">
                💳 Pembayaran via QR Code
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* QR Code Display */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">
                        QR Code Pembayaran
                    </h2>
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <img
                            src={`${import.meta.env.VITE_API_BASE_URL}${
                                activeQR.imageUrl
                            }`}
                            alt="QR Code"
                            className="w-full max-w-xs mx-auto rounded-lg shadow"
                        />
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Metode:</span>
                            <span className="font-semibold uppercase">
                                {activeQR.paymentMethod}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Nama Akun:</span>
                            <span className="font-semibold">
                                {activeQR.accountName}
                            </span>
                        </div>
                        {activeQR.accountNumber && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">Nomor:</span>
                                <span className="font-mono">
                                    {activeQR.accountNumber}
                                </span>
                            </div>
                        )}
                        {activeQR.notes && (
                            <div className="mt-3 p-2 bg-blue-50 rounded text-blue-800">
                                💡 {activeQR.notes}
                            </div>
                        )}
                    </div>
                </div>

                {/* Confirmation Form */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">
                        Konfirmasi Pembayaran
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nama Siswa
                            </label>
                            <select
                                value={selectedStudent}
                                onChange={handleStudentChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">Pilih Siswa</option>
                                {students.map((student) => (
                                    <option
                                        key={student._id}
                                        value={student._id}
                                    >
                                        {student.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {tunggakan > 0 && (
                            <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
                                <p className="text-sm text-red-800">
                                    <strong>Tunggakan:</strong> Rp
                                    {tunggakan.toLocaleString('id-ID')}
                                </p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Jumlah (Rp)
                            </label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Contoh: 20000"
                                required
                                min="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Bukti Transfer
                            </label>
                            <input
                                type="file"
                                accept="image/jpeg,image/jpg,image/png"
                                onChange={handleImageChange}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Format: JPG, JPEG, PNG. Max: 5MB
                            </p>
                        </div>

                        {previewUrl && (
                            <div className="mt-2">
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="w-full max-w-xs rounded-lg border"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Catatan (Opsional)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows="2"
                                placeholder="Tambahkan catatan jika perlu"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-semibold"
                        >
                            {submitting ? 'Mengirim...' : '📤 Kirim Konfirmasi'}
                        </button>
                    </form>

                    {message && (
                        <div
                            className={`mt-4 p-3 rounded-lg ${
                                message.startsWith('✅')
                                    ? 'bg-green-50 text-green-800'
                                    : 'bg-red-50 text-red-800'
                            }`}
                        >
                            {message}
                        </div>
                    )}
                </div>
            </div>

            {/* Instructions */}
            <div className="mt-6 bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    📋 Cara Pembayaran:
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>Scan QR Code menggunakan aplikasi pembayaran Anda</li>
                    <li>Masukkan jumlah yang ingin dibayar</li>
                    <li>Selesaikan pembayaran</li>
                    <li>Screenshot bukti pembayaran</li>
                    <li>Upload bukti dan kirim konfirmasi di form sebelah</li>
                    <li>Tunggu verifikasi dari bendahara</li>
                </ol>
            </div>
        </div>
    );
}

export default QRPayment;
