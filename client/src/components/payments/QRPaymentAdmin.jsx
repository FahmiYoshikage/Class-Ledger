import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const QUICK_REJECTION_REASONS = [
    'Bukti transfer tidak terbaca / buram',
    'Nominal transfer tidak sesuai',
    'Nama pengirim / rekening tidak cocok',
    'Bukti transfer sudah pernah digunakan (duplikat)',
    'Dana belum masuk ke rekening kas',
];

function QRPaymentAdmin() {
    const { user } = useAuth();
    const reviewerName = user?.fullName || user?.username || 'Admin';

    const [activeTab, setActiveTab] = useState('pending'); // pending, history, manage
    const [qrCodes, setQrCodes] = useState([]);
    const [pendingConfirmations, setPendingConfirmations] = useState([]);
    const [allConfirmations, setAllConfirmations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Rejection modal state
    const [rejectModal, setRejectModal] = useState({
        isOpen: false,
        confirmation: null,
        rejectionReason: '',
        submitting: false,
    });

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

    const handleApprove = async (conf) => {
        const studentName = conf.studentId?.name || 'Siswa';
        const amount = conf.amount?.toLocaleString('id-ID') || '0';

        if (
            !confirm(
                `Setujui pembayaran dari ${studentName} sebesar Rp${amount}? Transaksi kas akan otomatis dicatat.`
            )
        )
            return;

        try {
            const response = await api.post(
                `/qr-payment/approve/${conf._id}`,
                {
                    reviewedBy: reviewerName,
                }
            );

            if (response.data.success) {
                setMessage(
                    `✅ ${
                        response.data.message || 'Pembayaran berhasil disetujui'
                    }`
                );
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

    const openRejectModal = (conf) => {
        setRejectModal({
            isOpen: true,
            confirmation: conf,
            rejectionReason: '',
            submitting: false,
        });
    };

    const closeRejectModal = () => {
        setRejectModal({
            isOpen: false,
            confirmation: null,
            rejectionReason: '',
            submitting: false,
        });
    };

    const submitReject = async (e) => {
        if (e) e.preventDefault();
        if (!rejectModal.confirmation) return;
        if (!rejectModal.rejectionReason.trim()) {
            alert('Silakan pilih atau masukkan alasan penolakan.');
            return;
        }

        setRejectModal((prev) => ({ ...prev, submitting: true }));

        try {
            const response = await api.post(
                `/qr-payment/reject/${rejectModal.confirmation._id}`,
                {
                    reviewedBy: reviewerName,
                    rejectionReason: rejectModal.rejectionReason.trim(),
                }
            );

            if (response.data.success) {
                setMessage(
                    `⚠️ ${response.data.message || 'Pembayaran ditolak'}`
                );
                closeRejectModal();
                fetchPendingConfirmations();
            }
        } catch (error) {
            setMessage(
                '❌ ' +
                    (error.response?.data?.message ||
                        'Gagal menolak pembayaran')
            );
            setRejectModal((prev) => ({ ...prev, submitting: false }));
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
        formData.append('uploadedBy', reviewerName);

        setUploadForm({ ...uploadForm, uploading: true });

        try {
            const response = await api.post('/qr-payment/upload', formData, {
                headers: {
                    'Content-Type': undefined,
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
            <h1 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">
                ⚙️ Kelola QR Payment
            </h1>

            {/* Tabs */}
            <div className="flex space-x-2 mb-6 border-b border-slate-200 dark:border-white/10">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-4 py-2 font-semibold transition ${
                        activeTab === 'pending'
                            ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                            : 'text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                    🔔 Pending ({pendingConfirmations.length})
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 font-semibold transition ${
                        activeTab === 'history'
                            ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                            : 'text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                    📜 Riwayat
                </button>
                <button
                    onClick={() => setActiveTab('manage')}
                    className={`px-4 py-2 font-semibold transition ${
                        activeTab === 'manage'
                            ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                            : 'text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                    📷 Kelola QR Code
                </button>
            </div>

            {message && (
                <div
                    className={`mb-4 p-3 rounded-lg border ${
                        message.startsWith('✅')
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20'
                            : message.startsWith('⚠️')
                            ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20'
                            : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/20'
                    }`}
                >
                    {message}
                </div>
            )}

            {/* Pending Confirmations Tab */}
            {activeTab === 'pending' && (
                <div>
                    {loading ? (
                        <div className="text-center py-8 text-slate-500 dark:text-white/60">Loading...</div>
                    ) : pendingConfirmations.length === 0 ? (
                        <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/10 rounded-xl p-8 text-center shadow-sm">
                            <p className="text-slate-500 dark:text-white/60">
                                Tidak ada konfirmasi pending
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {pendingConfirmations.map((conf) => (
                                <div
                                    key={conf._id}
                                    className="rounded-xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/10 p-6 shadow-sm"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                                {conf.studentId?.name || 'Siswa'}
                                            </h3>
                                            <p className="text-sm text-slate-500 dark:text-white/60">
                                                {conf.studentId?.phoneNumber || conf.studentId?.phone ? (
                                                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono text-xs mt-0.5">
                                                        <span>📱</span> {conf.studentId.phoneNumber || conf.studentId.phone}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-400">Tanpa No. WA</span>
                                                )}
                                            </p>
                                        </div>
                                        <span className="bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20 px-3 py-1 rounded-full text-xs font-semibold">
                                            Pending
                                        </span>
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                            Rp
                                            {conf.amount.toLocaleString(
                                                'id-ID'
                                            )}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-white/60">
                                            Submitted:{' '}
                                            {new Date(
                                                conf.submittedAt
                                            ).toLocaleString('id-ID')}
                                        </p>
                                    </div>

                                    {conf.notes && (
                                        <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-lg text-sm text-indigo-700 dark:text-indigo-300">
                                            💬 {conf.notes}
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <img
                                            src={conf.proofImageUrl}
                                            alt="Bukti Transfer"
                                            className="w-full rounded-lg border border-slate-200 dark:border-white/10 cursor-pointer hover:opacity-90 transition"
                                            onClick={() =>
                                                window.open(
                                                    conf.proofImageUrl,
                                                    '_blank'
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() =>
                                                handleApprove(conf)
                                            }
                                            className="flex-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20 py-2.5 px-4 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition font-semibold flex items-center justify-center gap-1.5"
                                        >
                                            <span>✓</span> Setujui
                                        </button>
                                        <button
                                            onClick={() =>
                                                openRejectModal(conf)
                                            }
                                            className="flex-1 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20 py-2.5 px-4 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20 transition font-semibold flex items-center justify-center gap-1.5"
                                        >
                                            <span>✗</span> Tolak
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
                        <div className="text-center py-8 text-slate-500 dark:text-white/60">Loading...</div>
                    ) : (
                        <div className="rounded-xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-white/[0.06]">
                                <thead className="bg-slate-50 dark:bg-white/[0.04]">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-white/60 uppercase">
                                            Siswa
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-white/60 uppercase">
                                            Jumlah
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-white/60 uppercase">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-white/60 uppercase">
                                            Tanggal
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-white/60 uppercase">
                                            Reviewer
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-white/[0.06]">
                                    {allConfirmations.map((conf) => (
                                        <tr key={conf._id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-slate-900 dark:text-white">
                                                    {conf.studentId?.name || 'Siswa'}
                                                </div>
                                                <div className="text-xs text-slate-400 font-mono">
                                                    {conf.studentId?.phoneNumber || conf.studentId?.phone || ''}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    Rp
                                                    {conf.amount.toLocaleString(
                                                        'id-ID'
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                                                        conf.status ===
                                                        'approved'
                                                            ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20'
                                                            : conf.status ===
                                                              'rejected'
                                                            ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/20'
                                                            : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20'
                                                    }`}
                                                >
                                                    {conf.status === 'approved' ? '✓ Disetujui' : conf.status === 'rejected' ? '✗ Ditolak' : '⏳ Pending'}
                                                </span>
                                                {conf.status === 'rejected' && conf.rejectionReason && (
                                                    <div className="text-xs text-rose-600 dark:text-rose-400 mt-1 max-w-[220px] truncate" title={conf.rejectionReason}>
                                                        💬 {conf.rejectionReason}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-white/60">
                                                {new Date(
                                                    conf.submittedAt
                                                ).toLocaleDateString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-white/60">
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
                    <div className="rounded-xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/10 p-6 shadow-sm">
                        <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">
                            Upload QR Code Baru
                        </h2>
                        <form onSubmit={handleUploadQR} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-1">
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
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="dana">DANA</option>
                                    <option value="gopay">GoPay</option>
                                    <option value="ovo">OVO</option>
                                    <option value="bank">Bank Transfer</option>
                                    <option value="other">Lainnya</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-1">
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
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-1">
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
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-1">
                                    Gambar QR Code *
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="w-full text-sm text-slate-600 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/30 dark:file:text-blue-300 hover:file:bg-blue-100"
                                    required
                                />
                            </div>

                            {previewUrl && (
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="w-48 h-48 object-contain border border-slate-200 dark:border-white/10 rounded-lg"
                                />
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-1">
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
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    rows="2"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={uploadForm.uploading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg disabled:opacity-50 transition font-semibold"
                            >
                                {uploadForm.uploading
                                    ? 'Uploading...'
                                    : '📤 Upload'}
                            </button>
                        </form>
                    </div>

                    {/* QR List */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">
                            Daftar QR Code
                        </h2>
                        {loading ? (
                            <div className="text-center py-8 text-slate-500 dark:text-white/60">Loading...</div>
                        ) : (
                            <div className="space-y-4">
                                {qrCodes.map((qr) => (
                                    <div
                                        key={qr._id}
                                        className={`rounded-xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/10 p-4 shadow-sm ${
                                            qr.isActive
                                                ? 'border-2 border-emerald-500 dark:border-emerald-500'
                                                : ''
                                        }`}
                                    >
                                        <div className="flex items-start space-x-4">
                                            <img
                                                src={qr.imageUrl}
                                                alt="QR"
                                                className="w-24 h-24 object-contain rounded-lg border border-slate-200 dark:border-white/10 bg-white"
                                            />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-semibold text-slate-900 dark:text-white">
                                                            {qr.accountName}
                                                        </p>
                                                        <p className="text-sm text-slate-500 dark:text-white/60 uppercase">
                                                            {qr.paymentMethod}
                                                        </p>
                                                        {qr.accountNumber && (
                                                            <p className="text-xs text-slate-500 dark:text-white/60">
                                                                {
                                                                    qr.accountNumber
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                    {qr.isActive && (
                                                        <span className="bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20 px-2 py-1 rounded text-xs font-semibold">
                                                            Active
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-white/60 mt-2">
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
                                                    className="mt-2 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 text-sm font-semibold"
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

            {/* Rejection Modal */}
            {rejectModal.isOpen && rejectModal.confirmation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="text-rose-500">❌</span> Tolak Konfirmasi Pembayaran
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-white/60 mt-1">
                                    Siswa akan menerima pemberitahuan resmi via WhatsApp.
                                </p>
                            </div>
                            <button
                                onClick={closeRejectModal}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xl font-bold p-1 rounded-lg"
                                disabled={rejectModal.submitting}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Detail Siswa & Nominal */}
                        <div className="bg-slate-50 dark:bg-white/[0.04] p-4 rounded-xl border border-slate-200 dark:border-white/10 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-white/60">Siswa:</span>
                                <span className="font-semibold text-slate-900 dark:text-white">
                                    {rejectModal.confirmation.studentId?.name || 'Siswa'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-white/60">Nominal:</span>
                                <span className="font-bold text-rose-600 dark:text-rose-400">
                                    Rp {rejectModal.confirmation.amount?.toLocaleString('id-ID')}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-white/60">No. WhatsApp Siswa:</span>
                                <span className="font-mono text-slate-700 dark:text-white/80">
                                    {rejectModal.confirmation.studentId?.phoneNumber || rejectModal.confirmation.studentId?.phone ? (
                                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                            📱 {rejectModal.confirmation.studentId?.phoneNumber || rejectModal.confirmation.studentId?.phone} (Tersedia)
                                        </span>
                                    ) : (
                                        <span className="text-amber-500 font-semibold">⚠️ Tidak ada nomor WA</span>
                                    )}
                                </span>
                            </div>
                        </div>

                        {/* Quick Reason Buttons */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/60 mb-2">
                                Pilih Alasan Cepat:
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {QUICK_REJECTION_REASONS.map((reason, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() =>
                                            setRejectModal((prev) => ({
                                                ...prev,
                                                rejectionReason: reason,
                                            }))
                                        }
                                        className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                                            rejectModal.rejectionReason === reason
                                                ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                                                : 'bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-white/80 border-slate-200 dark:border-white/10 hover:border-rose-400 dark:hover:border-rose-400'
                                        }`}
                                    >
                                        {reason}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Input Alasan */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-800 dark:text-white/90 mb-1">
                                Alasan Penolakan <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                rows={3}
                                value={rejectModal.rejectionReason}
                                onChange={(e) =>
                                    setRejectModal((prev) => ({
                                        ...prev,
                                        rejectionReason: e.target.value,
                                    }))
                                }
                                placeholder="Tulis alasan penolakan untuk siswa..."
                                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-white/15 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none resize-none"
                                required
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={closeRejectModal}
                                disabled={rejectModal.submitting}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/15 text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/[0.05] font-medium text-sm transition"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={submitReject}
                                disabled={rejectModal.submitting || !rejectModal.rejectionReason.trim()}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {rejectModal.submitting ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        Memproses...
                                    </>
                                ) : (
                                    'Kirim Penolakan'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default QRPaymentAdmin;
