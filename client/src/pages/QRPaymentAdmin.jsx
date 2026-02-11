import { useState, useEffect } from 'react';
import api from '../services/api';

function QRPaymentAdmin() {
    const [activeTab, setActiveTab] = useState('pending'); // pending, history, manage
    const [qrCodes, setQrCodes] = useState([]);
    const [pendingConfirmations, setPendingConfirmations] = useState([]);
    const [allConfirmations, setAllConfirmations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Upload form state
    const [uploadForm, setUploadForm] = useState({
        paymentMethod: 'dana',
        accountName: '',
        accountNumber: '',
        notes: '',
        qrImage: null,
        uploading: false,
    });
    const [previewUrl, setPreviewUrl] = useState('');

    useEffect(() => {
        if (activeTab === 'pending') {
            fetchPendingConfirmations();
        } else if (activeTab === 'history') {
            fetchAllConfirmations();
        } else if (activeTab === 'manage') {
            fetchQRCodes();
        }
    }, [activeTab]);

    const fetchPendingConfirmations = async () => {
        setLoading(true);
        try {
            const response = await api.get('/qr-payment/confirmations/pending');
            if (response.data.success) {
                setPendingConfirmations(response.data.confirmations);
            }
        } catch (error) {
            console.error('Error fetching pending confirmations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllConfirmations = async () => {
        setLoading(true);
        try {
            const response = await api.get('/qr-payment/confirmations/all');
            if (response.data.success) {
                setAllConfirmations(response.data.confirmations);
            }
        } catch (error) {
            console.error('Error fetching confirmations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchQRCodes = async () => {
        setLoading(true);
        try {
            const response = await api.get('/qr-payment/list');
            if (response.data.success) {
                setQrCodes(response.data.qrCodes);
            }
        } catch (error) {
            console.error('Error fetching QR codes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (confirmationId) => {
        if (!confirm('Setujui pembayaran ini?')) return;

        const reviewedBy = prompt('Nama Anda:');
        if (!reviewedBy) return;

        try {
            const response = await api.post(
                `/qr-payment/approve/${confirmationId}`,
                {
                    reviewedBy,
                }
            );

            if (response.data.success) {
                setMessage('✅ Pembayaran berhasil disetujui');
                fetchPendingConfirmations();
            }
        } catch (error) {
            setMessage(
                '❌ ' +
                    (error.response?.data?.message ||
                        'Gagal menyetujui pembayaran')
            );
        }
    };

    const handleReject = async (confirmationId) => {
        const reviewedBy = prompt('Nama Anda:');
        if (!reviewedBy) return;

        const rejectionReason = prompt('Alasan penolakan:');
        if (!rejectionReason) return;

        try {
            const response = await api.post(
                `/qr-payment/reject/${confirmationId}`,
                {
                    reviewedBy,
                    rejectionReason,
                }
            );

            if (response.data.success) {
                setMessage('⚠️ Pembayaran ditolak');
                fetchPendingConfirmations();
            }
        } catch (error) {
            setMessage(
                '❌ ' +
                    (error.response?.data?.message ||
                        'Gagal menolak pembayaran')
            );
        }
    };

    const handleUploadQR = async (e) => {
        e.preventDefault();
        setMessage('');

        if (!uploadForm.qrImage || !uploadForm.accountName) {
            setMessage('QR Image dan Nama Akun harus diisi');
            return;
        }

        const formData = new FormData();
        formData.append('qrImage', uploadForm.qrImage);
        formData.append('paymentMethod', uploadForm.paymentMethod);
        formData.append('accountName', uploadForm.accountName);
        formData.append('accountNumber', uploadForm.accountNumber);
        formData.append('notes', uploadForm.notes);
        formData.append('uploadedBy', 'Admin'); // TODO: Get from auth context

        setUploadForm({ ...uploadForm, uploading: true });

        try {
            const response = await api.post('/qr-payment/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                setMessage('✅ QR Code berhasil diupload');
                setUploadForm({
                    paymentMethod: 'dana',
                    accountName: '',
                    accountNumber: '',
                    notes: '',
                    qrImage: null,
                    uploading: false,
                });
                setPreviewUrl('');
                fetchQRCodes();
            }
        } catch (error) {
            setMessage(
                '❌ ' +
                    (error.response?.data?.message ||
                        'Gagal mengupload QR Code')
            );
            setUploadForm({ ...uploadForm, uploading: false });
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setMessage('Ukuran file maksimal 5MB');
                return;
            }

            setUploadForm({ ...uploadForm, qrImage: file });
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleDeleteQR = async (qrId) => {
        if (!confirm('Hapus QR Code ini?')) return;

        try {
            const response = await api.delete(`/qr-payment/${qrId}`);
            if (response.data.success) {
                setMessage('✅ QR Code berhasil dihapus');
                fetchQRCodes();
            }
        } catch (error) {
            setMessage(
                '❌ ' +
                    (error.response?.data?.message || 'Gagal menghapus QR Code')
            );
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6 text-slate-100">
                ⚙️ Kelola QR Payment
            </h1>

            {/* Tabs */}
            <div className="flex space-x-2 mb-6 border-b">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-4 py-2 font-semibold transition ${
                        activeTab === 'pending'
                            ? 'border-b-2 border-blue-600 text-sky-300'
                            : 'text-slate-200 hover:text-slate-100'
                    }`}
                >
                    🔔 Pending ({pendingConfirmations.length})
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 font-semibold transition ${
                        activeTab === 'history'
                            ? 'border-b-2 border-blue-600 text-sky-300'
                            : 'text-slate-200 hover:text-slate-100'
                    }`}
                >
                    📜 Riwayat
                </button>
                <button
                    onClick={() => setActiveTab('manage')}
                    className={`px-4 py-2 font-semibold transition ${
                        activeTab === 'manage'
                            ? 'border-b-2 border-blue-600 text-sky-300'
                            : 'text-slate-200 hover:text-slate-100'
                    }`}
                >
                    📷 Kelola QR Code
                </button>
            </div>

            {message && (
                <div
                    className={`mb-4 p-3 rounded-lg ${
                        message.startsWith('✅')
                            ? 'bg-cyan-500/10 text-cyan-300'
                            : message.startsWith('⚠️')
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                    }`}
                >
                    {message}
                </div>
            )}

            {/* Pending Confirmations Tab */}
            {activeTab === 'pending' && (
                <div>
                    {loading ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : pendingConfirmations.length === 0 ? (
                        <div className="bg-slate-800/60 rounded-lg p-8 text-center">
                            <p className="text-slate-200">
                                Tidak ada konfirmasi pending
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {pendingConfirmations.map((conf) => (
                                <div
                                    key={conf._id}
                                    className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-lg shadow-md p-6"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-100">
                                                {conf.studentId.name}
                                            </h3>
                                            <p className="text-sm text-slate-200">
                                                {conf.studentId.phone}
                                            </p>
                                        </div>
                                        <span className="bg-amber-500/30 text-amber-200 px-3 py-1 rounded-full text-xs font-semibold">
                                            Pending
                                        </span>
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-2xl font-bold text-cyan-400">
                                            Rp
                                            {conf.amount.toLocaleString(
                                                'id-ID'
                                            )}
                                        </p>
                                        <p className="text-xs text-slate-300">
                                            Submitted:{' '}
                                            {new Date(
                                                conf.submittedAt
                                            ).toLocaleString('id-ID')}
                                        </p>
                                    </div>

                                    {conf.notes && (
                                        <div className="mb-4 p-2 bg-sky-500/20 rounded text-sm text-sky-300">
                                            💬 {conf.notes}
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <img
                                            src={`${
                                                import.meta.env
                                                    .VITE_API_BASE_URL
                                            }${conf.proofImageUrl}`}
                                            alt="Bukti Transfer"
                                            className="w-full rounded-lg border cursor-pointer hover:opacity-90 transition"
                                            onClick={() =>
                                                window.open(
                                                    `${
                                                        import.meta.env
                                                            .VITE_API_BASE_URL
                                                    }${conf.proofImageUrl}`,
                                                    '_blank'
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() =>
                                                handleApprove(conf._id)
                                            }
                                            className="flex-1 bg-green-600 text-slate-50 py-2 px-4 rounded-lg hover:bg-green-700 transition font-semibold"
                                        >
                                            ✓ Setujui
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleReject(conf._id)
                                            }
                                            className="flex-1 bg-red-600 text-slate-50 py-2 px-4 rounded-lg hover:bg-red-700 transition font-semibold"
                                        >
                                            ✗ Tolak
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
                <div>
                    {loading ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : (
                        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-lg shadow-md overflow-hidden">
                            <table className="min-w-full divide-y divide-slate-700/50">
                                <thead className="bg-slate-800/60">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                                            Siswa
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                                            Jumlah
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                                            Tanggal
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                                            Reviewer
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-700/50">
                                    {allConfirmations.map((conf) => (
                                        <tr key={conf._id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-slate-50">
                                                    {conf.studentId.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-slate-50">
                                                    Rp
                                                    {conf.amount.toLocaleString(
                                                        'id-ID'
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        conf.status ===
                                                        'approved'
                                                            ? 'bg-cyan-500/30 text-cyan-200'
                                                            : conf.status ===
                                                              'rejected'
                                                            ? 'bg-rose-500/30 text-rose-200'
                                                            : 'bg-amber-500/30 text-amber-200'
                                                    }`}
                                                >
                                                    {conf.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                                {new Date(
                                                    conf.submittedAt
                                                ).toLocaleDateString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                                {conf.reviewedBy || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Manage QR Tab */}
            {activeTab === 'manage' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Upload Form */}
                    <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4 text-slate-100">
                            Upload QR Code Baru
                        </h2>
                        <form onSubmit={handleUploadQR} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-200 mb-1">
                                    Metode Pembayaran
                                </label>
                                <select
                                    value={uploadForm.paymentMethod}
                                    onChange={(e) =>
                                        setUploadForm({
                                            ...uploadForm,
                                            paymentMethod: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-slate-700/50 rounded-lg"
                                >
                                    <option value="dana">DANA</option>
                                    <option value="gopay">GoPay</option>
                                    <option value="ovo">OVO</option>
                                    <option value="bank">Bank Transfer</option>
                                    <option value="other">Lainnya</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-200 mb-1">
                                    Nama Akun *
                                </label>
                                <input
                                    type="text"
                                    value={uploadForm.accountName}
                                    onChange={(e) =>
                                        setUploadForm({
                                            ...uploadForm,
                                            accountName: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-slate-700/50 rounded-lg"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-200 mb-1">
                                    Nomor Akun
                                </label>
                                <input
                                    type="text"
                                    value={uploadForm.accountNumber}
                                    onChange={(e) =>
                                        setUploadForm({
                                            ...uploadForm,
                                            accountNumber: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-slate-700/50 rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-200 mb-1">
                                    Gambar QR Code *
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="w-full text-sm"
                                    required
                                />
                            </div>

                            {previewUrl && (
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="w-48 h-48 object-contain border rounded"
                                />
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-200 mb-1">
                                    Catatan
                                </label>
                                <textarea
                                    value={uploadForm.notes}
                                    onChange={(e) =>
                                        setUploadForm({
                                            ...uploadForm,
                                            notes: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-slate-700/50 rounded-lg"
                                    rows="2"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={uploadForm.uploading}
                                className="w-full bg-blue-600 text-slate-50 py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-semibold"
                            >
                                {uploadForm.uploading
                                    ? 'Uploading...'
                                    : '📤 Upload'}
                            </button>
                        </form>
                    </div>

                    {/* QR List */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-slate-100">
                            Daftar QR Code
                        </h2>
                        {loading ? (
                            <div className="text-center py-8">Loading...</div>
                        ) : (
                            <div className="space-y-4">
                                {qrCodes.map((qr) => (
                                    <div
                                        key={qr._id}
                                        className={`bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-lg shadow-md p-4 ${
                                            qr.isActive
                                                ? 'border-2 border-green-500'
                                                : ''
                                        }`}
                                    >
                                        <div className="flex items-start space-x-4">
                                            <img
                                                src={`${
                                                    import.meta.env
                                                        .VITE_API_BASE_URL
                                                }${qr.imageUrl}`}
                                                alt="QR"
                                                className="w-24 h-24 object-contain rounded border"
                                            />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-semibold text-slate-100">
                                                            {qr.accountName}
                                                        </p>
                                                        <p className="text-sm text-slate-200 uppercase">
                                                            {qr.paymentMethod}
                                                        </p>
                                                        {qr.accountNumber && (
                                                            <p className="text-xs text-slate-300">
                                                                {
                                                                    qr.accountNumber
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                    {qr.isActive && (
                                                        <span className="bg-cyan-500/30 text-cyan-200 px-2 py-1 rounded text-xs font-semibold">
                                                            Active
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-300 mt-2">
                                                    Uploaded:{' '}
                                                    {new Date(
                                                        qr.uploadedAt
                                                    ).toLocaleDateString(
                                                        'id-ID'
                                                    )}
                                                </p>
                                                <button
                                                    onClick={() =>
                                                        handleDeleteQR(qr._id)
                                                    }
                                                    className="mt-2 text-rose-300 hover:text-rose-300 text-sm font-semibold"
                                                >
                                                    🗑️ Hapus
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default QRPaymentAdmin;
