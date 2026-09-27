import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
    Eye,
    Download,
    Copy,
    Check,
    X,
    Search,
    Filter,
    MessageCircle,
    Image as ImageIcon,
    FileText,
    QrCode,
} from 'lucide-react';

const QUICK_REJECTION_REASONS = [
    'Bukti transfer tidak terbaca / buram',
    'Nominal transfer tidak sesuai',
    'Nama pengirim / rekening tidak cocok',
    'Bukti transfer sudah pernah digunakan (duplikat)',
    'Dana belum masuk ke rekening kas',
];

const METHOD_GUIDES = {
    qris: {
        label: 'QRIS (Semua Bank & E-Wallet) [Rekomendasi]',
        accountNameLabel: 'Nama Merchant / Toko QRIS *',
        accountNamePlaceholder: 'Contoh: KAS KELAS XII RPL 1 atau BENDAHARA',
        accountNameHelp: 'Nama merchant resmi yang muncul di layar siswa saat QRIS discan.',
        accountNumberLabel: 'NMID atau No. HP Alternatif (Opsional)',
        accountNumberPlaceholder: 'Contoh: ID10200xxxx atau No. HP (Boleh dikosongkan)',
        accountNumberHelp: 'Opsional. Boleh dikosongkan jika murni transaksi scan gambar QR.',
        tip: '💡 QRIS mendukung seluruh mobile banking (BCA, Mandiri, BRI, BNI, Seabank, dll.) dan seluruh e-wallet (DANA, GoPay, OVO, ShopeePay). Siswa cukup memindai gambar QRIS ini.',
    },
    dana: {
        label: 'DANA',
        accountNameLabel: 'Nama Pemilik Akun DANA *',
        accountNamePlaceholder: 'Contoh: Siti Rahmawati',
        accountNameHelp: 'Nama pemegang akun DANA.',
        accountNumberLabel: 'Nomor HP Akun DANA',
        accountNumberPlaceholder: 'Contoh: 081234567890',
        accountNumberHelp: 'Nomor HP yang terhubung dengan akun DANA.',
    },
    gopay: {
        label: 'GoPay',
        accountNameLabel: 'Nama Pemilik Akun GoPay *',
        accountNamePlaceholder: 'Contoh: Siti Rahmawati',
        accountNameHelp: 'Nama pemegang akun GoPay.',
        accountNumberLabel: 'Nomor HP Akun GoPay',
        accountNumberPlaceholder: 'Contoh: 081234567890',
        accountNumberHelp: 'Nomor HP yang terhubung dengan akun GoPay.',
    },
    ovo: {
        label: 'OVO',
        accountNameLabel: 'Nama Pemilik Akun OVO *',
        accountNamePlaceholder: 'Contoh: Siti Rahmawati',
        accountNameHelp: 'Nama pemegang akun OVO.',
        accountNumberLabel: 'Nomor HP Akun OVO',
        accountNumberPlaceholder: 'Contoh: 081234567890',
        accountNumberHelp: 'Nomor HP yang terhubung dengan akun OVO.',
    },
    shopeepay: {
        label: 'ShopeePay',
        accountNameLabel: 'Nama Pemilik Akun ShopeePay *',
        accountNamePlaceholder: 'Contoh: Siti Rahmawati',
        accountNameHelp: 'Nama pemegang akun ShopeePay.',
        accountNumberLabel: 'Nomor HP Akun ShopeePay',
        accountNumberPlaceholder: 'Contoh: 081234567890',
        accountNumberHelp: 'Nomor HP yang terhubung dengan akun ShopeePay.',
    },
    bank: {
        label: 'Transfer Bank',
        accountNameLabel: 'Nama Pemilik Rekening Bank *',
        accountNamePlaceholder: 'Contoh: Siti Rahmawati',
        accountNameHelp: 'Nama nasabah pemilik rekening bank.',
        accountNumberLabel: 'Nomor Rekening Bank',
        accountNumberPlaceholder: 'Contoh: 1234567890',
        accountNumberHelp: 'Nomor rekening bank tujuan transfer.',
    },
    other: {
        label: 'Lainnya',
        accountNameLabel: 'Nama Akun / Penerima *',
        accountNamePlaceholder: 'Contoh: Nama Akun / Toko',
        accountNameHelp: 'Nama penerima pembayaran.',
        accountNumberLabel: 'Nomor Akun / Referensi',
        accountNumberPlaceholder: 'Contoh: Nomor akun atau nomor HP',
        accountNumberHelp: 'Nomor akun atau keterangan transfer.',
    },
};

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

    // Detail & Proof modal state
    const [detailModal, setDetailModal] = useState({
        isOpen: false,
        confirmation: null,
    });
    const [copiedSummary, setCopiedSummary] = useState(false);

    // History search and filter state
    const [historySearch, setHistorySearch] = useState('');
    const [historyStatusFilter, setHistoryStatusFilter] = useState('all'); // 'all', 'approved', 'rejected', 'pending'

    // Filtered confirmations for history tab
    const filteredConfirmations = useMemo(() => {
        return allConfirmations.filter((conf) => {
            if (historyStatusFilter !== 'all' && conf.status !== historyStatusFilter) {
                return false;
            }
            if (historySearch.trim()) {
                const query = historySearch.toLowerCase();
                const studentName = (conf.studentId?.name || '').toLowerCase();
                const studentPhone = (conf.studentId?.phoneNumber || conf.studentId?.phone || '').toLowerCase();
                const notes = (conf.notes || '').toLowerCase();
                const reviewer = (conf.reviewedBy || '').toLowerCase();
                const reason = (conf.rejectionReason || '').toLowerCase();

                return (
                    studentName.includes(query) ||
                    studentPhone.includes(query) ||
                    notes.includes(query) ||
                    reviewer.includes(query) ||
                    reason.includes(query)
                );
            }
            return true;
        });
    }, [allConfirmations, historyStatusFilter, historySearch]);

    const openDetailModal = (conf) => {
        setDetailModal({
            isOpen: true,
            confirmation: conf,
        });
    };

    const closeDetailModal = () => {
        setDetailModal({
            isOpen: false,
            confirmation: null,
        });
    };

    const handleDownloadProof = (imageUrl, studentName) => {
        if (!imageUrl) return;
        const cleanName = (studentName || 'Siswa').replace(/[^a-zA-Z0-9]/g, '_');
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `Bukti_Transfer_${cleanName}_${new Date().toISOString().slice(0, 10)}.png`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCopySummary = (conf) => {
        const sName = conf.studentId?.name || 'Siswa';
        const sAbsen = conf.studentId?.absen ? ` (Absen #${conf.studentId.absen})` : '';
        const phone = conf.studentId?.phoneNumber || conf.studentId?.phone || '-';
        const amountStr = `Rp ${conf.amount?.toLocaleString('id-ID')}`;
        const statusStr =
            conf.status === 'approved'
                ? 'Disetujui'
                : conf.status === 'rejected'
                ? `Ditolak (${conf.rejectionReason || '-'})`
                : 'Pending';
        const dateStr = new Date(conf.submittedAt).toLocaleString('id-ID');
        const reviewerStr = conf.reviewedBy || '-';
        const proofUrl = conf.proofImageUrl
            ? conf.proofImageUrl.startsWith('http')
                ? conf.proofImageUrl
                : `${window.location.origin}${conf.proofImageUrl}`
            : '-';

        const text = `📋 [CATATAN PEMBAYARAN QR KAS]\n• Siswa: ${sName}${sAbsen}\n• No. WA: ${phone}\n• Nominal: ${amountStr}\n• Status: ${statusStr}\n• Waktu: ${dateStr}\n• Reviewer: ${reviewerStr}\n• Link Bukti: ${proofUrl}`;

        navigator.clipboard.writeText(text);
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2000);
    };

    const handleApproveFromDetail = async (conf) => {
        closeDetailModal();
        await handleApprove(conf);
    };

    const handleRejectFromDetail = (conf) => {
        closeDetailModal();
        openRejectModal(conf);
    };

    // Close modals on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (detailModal.isOpen) closeDetailModal();
                if (rejectModal.isOpen) closeRejectModal();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [detailModal.isOpen, rejectModal.isOpen]);

    // Upload form state
    const [uploadForm, setUploadForm] = useState({
        paymentMethod: 'qris',
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
                    paymentMethod: 'qris',
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
                                        <div
                                            className="relative group cursor-pointer rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-950 flex items-center justify-center p-1"
                                            onClick={() => openDetailModal(conf)}
                                            title="Klik untuk melihat bukti transfer penuh"
                                        >
                                            <img
                                                src={conf.proofImageUrl}
                                                alt="Bukti Transfer"
                                                className="w-full max-h-64 object-contain rounded-lg group-hover:scale-[1.01] transition-transform"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-semibold text-xs rounded-xl backdrop-blur-[1px]">
                                                <Eye className="w-4 h-4" />
                                                <span>Klik untuk Periksa Detail Bukti</span>
                                            </div>
                                        </div>
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
                <div className="space-y-4">
                    {/* Search and Filter Bar */}
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                        {/* Status Filters */}
                        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 dark:bg-white/[0.04] rounded-xl border border-slate-200 dark:border-white/10">
                            {[
                                { key: 'all', label: 'Semua', count: allConfirmations.length },
                                {
                                    key: 'approved',
                                    label: '✓ Disetujui',
                                    count: allConfirmations.filter((c) => c.status === 'approved').length,
                                },
                                {
                                    key: 'rejected',
                                    label: '✗ Ditolak',
                                    count: allConfirmations.filter((c) => c.status === 'rejected').length,
                                },
                                {
                                    key: 'pending',
                                    label: '⏳ Pending',
                                    count: allConfirmations.filter((c) => c.status === 'pending').length,
                                },
                            ].map((item) => (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => setHistoryStatusFilter(item.key)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                                        historyStatusFilter === item.key
                                            ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                            : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    <span>{item.label}</span>
                                    <span
                                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                            historyStatusFilter === item.key
                                                ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
                                                : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-white/50'
                                        }`}
                                    >
                                        {item.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Search Input */}
                        <div className="relative min-w-[240px]">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={historySearch}
                                onChange={(e) => setHistorySearch(e.target.value)}
                                placeholder="Cari siswa, no. WA, reviewer..."
                                className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-zinc-800 border border-slate-300 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {historySearch && (
                                <button
                                    type="button"
                                    onClick={() => setHistorySearch('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-12 text-slate-500 dark:text-white/60">
                            Memuat data riwayat...
                        </div>
                    ) : (
                        <div className="rounded-xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 dark:divide-white/[0.06]">
                                    <thead className="bg-slate-50 dark:bg-white/[0.04]">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white/60 uppercase tracking-wider">
                                                Bukti
                                            </th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white/60 uppercase tracking-wider">
                                                Siswa
                                            </th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white/60 uppercase tracking-wider">
                                                Jumlah
                                            </th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white/60 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white/60 uppercase tracking-wider">
                                                Tanggal
                                            </th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white/60 uppercase tracking-wider">
                                                Reviewer
                                            </th>
                                            <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 dark:text-white/60 uppercase tracking-wider">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-white/[0.06]">
                                        {filteredConfirmations.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={7}
                                                    className="px-6 py-12 text-center text-sm text-slate-500 dark:text-white/50"
                                                >
                                                    {historySearch || historyStatusFilter !== 'all'
                                                        ? 'Tidak ada riwayat konfirmasi yang cocok dengan filter / pencarian.'
                                                        : 'Belum ada riwayat konfirmasi pembayaran.'}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredConfirmations.map((conf) => (
                                                <tr
                                                    key={conf._id}
                                                    onClick={() => openDetailModal(conf)}
                                                    className="hover:bg-blue-50/30 dark:hover:bg-white/[0.03] transition-colors cursor-pointer group"
                                                    title="Klik untuk membuka detail & foto bukti transfer"
                                                >
                                                    {/* Bukti Thumbnail */}
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openDetailModal(conf);
                                                            }}
                                                            className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-900 shadow-sm group/thumb shrink-0 flex items-center justify-center cursor-pointer"
                                                            title="Klik untuk melihat bukti transfer penuh"
                                                        >
                                                            {conf.proofImageUrl ? (
                                                                <img
                                                                    src={conf.proofImageUrl}
                                                                    alt="Bukti"
                                                                    className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-200"
                                                                    loading="lazy"
                                                                />
                                                            ) : (
                                                                <ImageIcon className="w-5 h-5 text-slate-400" />
                                                            )}
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                                <Eye className="w-4 h-4" />
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Siswa */}
                                                    <td className="px-5 py-3 whitespace-nowrap">
                                                        <div className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                            {conf.studentId?.name || 'Siswa'}
                                                        </div>
                                                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                                                            {conf.studentId?.absen ? `Absen #${conf.studentId.absen} • ` : ''}
                                                            {conf.studentId?.phoneNumber || conf.studentId?.phone || 'Tanpa No. WA'}
                                                        </div>
                                                    </td>

                                                    {/* Jumlah */}
                                                    <td className="px-5 py-3 whitespace-nowrap">
                                                        <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                                                            Rp {conf.amount?.toLocaleString('id-ID')}
                                                        </div>
                                                    </td>

                                                    {/* Status */}
                                                    <td className="px-5 py-3">
                                                        <span
                                                            className={`px-2.5 py-1 inline-flex text-xs leading-4 font-semibold rounded-full border ${
                                                                conf.status === 'approved'
                                                                    ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20'
                                                                    : conf.status === 'rejected'
                                                                    ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/20'
                                                                    : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20'
                                                        }`}
                                                        >
                                                            {conf.status === 'approved'
                                                                ? '✓ Disetujui'
                                                                : conf.status === 'rejected'
                                                                ? '✗ Ditolak'
                                                                : '⏳ Pending'}
                                                        </span>
                                                        {conf.status === 'rejected' && conf.rejectionReason && (
                                                            <div
                                                                className="text-xs text-rose-600 dark:text-rose-400 mt-1 max-w-[200px] truncate"
                                                                title={conf.rejectionReason}
                                                            >
                                                                💬 {conf.rejectionReason}
                                                            </div>
                                                        )}
                                                        {conf.notes && (
                                                            <div
                                                                className="text-[11px] text-slate-500 dark:text-white/50 mt-1 max-w-[200px] truncate"
                                                                title={conf.notes}
                                                            >
                                                                📝 {conf.notes}
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Tanggal */}
                                                    <td className="px-5 py-3 whitespace-nowrap text-xs text-slate-500 dark:text-white/60">
                                                        <div>{new Date(conf.submittedAt).toLocaleDateString('id-ID')}</div>
                                                        <div className="text-[11px] text-slate-400">
                                                            {new Date(conf.submittedAt).toLocaleTimeString('id-ID', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </div>
                                                    </td>

                                                    {/* Reviewer */}
                                                    <td className="px-5 py-3 whitespace-nowrap text-xs text-slate-600 dark:text-white/70">
                                                        {conf.reviewedBy || '-'}
                                                    </td>

                                                    {/* Aksi Button */}
                                                    <td className="px-5 py-3 whitespace-nowrap text-center">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openDetailModal(conf);
                                                            }}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20 text-xs font-semibold transition shadow-sm"
                                                            title="Buka rincian lengkap & foto bukti transfer"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                            <span>Lihat Detail</span>
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
                        {(() => {
                            const currentGuide = METHOD_GUIDES[uploadForm.paymentMethod] || METHOD_GUIDES.other;
                            return (
                                <form onSubmit={handleUploadQR} className="space-y-4">
                                    {/* Tips Callout */}
                                    {currentGuide.tip && (
                                        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                                            {currentGuide.tip}
                                        </div>
                                    )}

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
                                            <option value="qris">QRIS (Semua Bank & E-Wallet) [Rekomendasi]</option>
                                            <option value="dana">DANA</option>
                                            <option value="gopay">GoPay</option>
                                            <option value="ovo">OVO</option>
                                            <option value="shopeepay">ShopeePay</option>
                                            <option value="bank">Bank Transfer</option>
                                            <option value="other">Lainnya</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-1">
                                            {currentGuide.accountNameLabel}
                                        </label>
                                        <input
                                            type="text"
                                            value={uploadForm.accountName}
                                            placeholder={currentGuide.accountNamePlaceholder}
                                            onChange={(e) =>
                                                setUploadForm({
                                                    ...uploadForm,
                                                    accountName: e.target.value,
                                                })
                                            }
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            required
                                        />
                                        <p className="text-[11px] text-slate-500 dark:text-white/40 mt-1">
                                            {currentGuide.accountNameHelp}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-1">
                                            {currentGuide.accountNumberLabel}
                                        </label>
                                        <input
                                            type="text"
                                            value={uploadForm.accountNumber}
                                            placeholder={currentGuide.accountNumberPlaceholder}
                                            onChange={(e) =>
                                                setUploadForm({
                                                    ...uploadForm,
                                                    accountNumber: e.target.value,
                                                })
                                            }
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                        <p className="text-[11px] text-slate-500 dark:text-white/40 mt-1">
                                            {currentGuide.accountNumberHelp}
                                        </p>
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
                            );
                        })()}
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
                                                        {qr.paymentMethod === 'qris' ? (
                                                            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                                                QRIS Universal
                                                            </span>
                                                        ) : (
                                                            <p className="text-sm text-slate-500 dark:text-white/60 uppercase">
                                                                {qr.paymentMethod}
                                                            </p>
                                                        )}
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

            {/* Detail & Proof Modal for Record Inspection */}
            {detailModal.isOpen && detailModal.confirmation && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) closeDetailModal();
                    }}
                >
                    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-2xl max-w-4xl w-full my-auto shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
                        {/* Header */}
                        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/70 dark:bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                                            Rincian Pembayaran QR & Bukti Transfer
                                        </h3>
                                        <span
                                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                                detailModal.confirmation.status === 'approved'
                                                    ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30'
                                                    : detailModal.confirmation.status === 'rejected'
                                                    ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/30'
                                                    : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30'
                                            }`}
                                        >
                                            {detailModal.confirmation.status === 'approved'
                                                ? '✓ Disetujui'
                                                : detailModal.confirmation.status === 'rejected'
                                                ? '✗ Ditolak'
                                                : '⏳ Pending'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-white/50 mt-0.5">
                                        ID Konfirmasi: <span className="font-mono">{detailModal.confirmation._id}</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={closeDetailModal}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition"
                                title="Tutup (Esc)"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Column: Photo Frame */}
                                <div className="flex flex-col space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/60">
                                            Foto Bukti Transfer
                                        </span>
                                        <span className="text-[11px] text-slate-400">
                                            klik gambar untuk zoom penuh
                                        </span>
                                    </div>
                                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-950 flex items-center justify-center p-2 min-h-[300px] max-h-[460px] group shadow-inner">
                                        {detailModal.confirmation.proofImageUrl ? (
                                            <img
                                                src={detailModal.confirmation.proofImageUrl}
                                                alt="Bukti Transfer"
                                                className="max-h-[440px] w-auto max-w-full object-contain rounded-xl cursor-zoom-in transition-transform duration-200 group-hover:scale-[1.02]"
                                                onClick={() =>
                                                    window.open(detailModal.confirmation.proofImageUrl, '_blank')
                                                }
                                                title="Klik untuk membuka ukuran penuh di tab baru"
                                            />
                                        ) : (
                                            <div className="text-center p-8 text-slate-400">
                                                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                <p className="text-xs">Gambar tidak ditemukan</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons for Image */}
                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                window.open(detailModal.confirmation.proofImageUrl, '_blank')
                                            }
                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-white text-xs font-semibold border border-slate-200 dark:border-white/10 transition"
                                        >
                                            <Eye className="w-4 h-4 text-blue-500" />
                                            <span>Buka Tab Baru</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleDownloadProof(
                                                    detailModal.confirmation.proofImageUrl,
                                                    detailModal.confirmation.studentId?.name
                                                )
                                            }
                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-white text-xs font-semibold border border-slate-200 dark:border-white/10 transition"
                                        >
                                            <Download className="w-4 h-4 text-emerald-500" />
                                            <span>Unduh Gambar</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Right Column: Details */}
                                <div className="flex flex-col justify-between space-y-4">
                                    <div className="space-y-4">
                                        {/* Amount Card */}
                                        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-500/20 flex items-center justify-between">
                                            <div>
                                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                                    Nominal Transfer Siswa
                                                </span>
                                                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5">
                                                    Rp {detailModal.confirmation.amount?.toLocaleString('id-ID')}
                                                </div>
                                            </div>
                                            <div className="p-3 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                                                <QrCode className="w-6 h-6" />
                                            </div>
                                        </div>

                                        {/* Status Explanations */}
                                        {detailModal.confirmation.status === 'approved' && (
                                            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                                                <p className="font-semibold flex items-center gap-1.5">
                                                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                    Pembayaran Kas Telah Disetujui
                                                </p>
                                                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                                                    Transaksi sudah otomatis dicatat ke buku kas kelas dan terhitung pada saldo serta papan peringkat leaderboard.
                                                </p>
                                            </div>
                                        )}

                                        {detailModal.confirmation.status === 'rejected' && (
                                            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-800 dark:text-rose-300 space-y-1.5">
                                                <p className="font-semibold flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                                                    <X className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                                                    Pembayaran Ditolak dengan Alasan:
                                                </p>
                                                <p className="font-semibold text-rose-900 dark:text-rose-200 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                                                    "{detailModal.confirmation.rejectionReason || 'Alasan tidak disebutkan'}"
                                                </p>
                                                <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80">
                                                    Pemberitahuan penolakan telah dikirimkan ke nomor WhatsApp siswa yang bersangkutan.
                                                </p>
                                            </div>
                                        )}

                                        {/* Student Information */}
                                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-3">
                                            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/60">
                                                Data Siswa & Kontak
                                            </h4>
                                            <div className="space-y-2 text-xs">
                                                <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-white/5">
                                                    <span className="text-slate-500 dark:text-white/50">Nama Lengkap</span>
                                                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                                                        {detailModal.confirmation.studentId?.name || 'Siswa'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-white/5">
                                                    <span className="text-slate-500 dark:text-white/50">Nomor Absen</span>
                                                    <span className="font-semibold text-slate-800 dark:text-white/90">
                                                        {detailModal.confirmation.studentId?.absen
                                                            ? `#${detailModal.confirmation.studentId.absen}`
                                                            : '-'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-white/5">
                                                    <span className="text-slate-500 dark:text-white/50">Nomor WhatsApp</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-slate-800 dark:text-white/90">
                                                            {detailModal.confirmation.studentId?.phoneNumber ||
                                                                detailModal.confirmation.studentId?.phone ||
                                                                '-'}
                                                        </span>
                                                        {(detailModal.confirmation.studentId?.phoneNumber ||
                                                            detailModal.confirmation.studentId?.phone) && (
                                                            <a
                                                                href={`https://wa.me/${(
                                                                    detailModal.confirmation.studentId.phoneNumber ||
                                                                    detailModal.confirmation.studentId.phone
                                                                ).replace(/[^0-9]/g, '')}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                                                            >
                                                                <MessageCircle className="w-3.5 h-3.5" />
                                                                <span>Chat WA</span>
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                                {detailModal.confirmation.notes && (
                                                    <div className="pt-1">
                                                        <span className="text-slate-500 dark:text-white/50 block mb-1">
                                                            Catatan Siswa:
                                                        </span>
                                                        <div className="p-2.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-500/10 border border-indigo-200/60 dark:border-indigo-500/20 text-indigo-800 dark:text-indigo-300 italic">
                                                            "{detailModal.confirmation.notes}"
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Audit & Review History */}
                                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-2 text-xs">
                                            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/60 mb-2">
                                                Riwayat Peninjauan & Audit
                                            </h4>
                                            <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-white/5">
                                                <span className="text-slate-500 dark:text-white/50">Waktu Diajukan</span>
                                                <span className="font-medium text-slate-800 dark:text-white/90">
                                                    {new Date(detailModal.confirmation.submittedAt).toLocaleString(
                                                        'id-ID',
                                                        {
                                                            dateStyle: 'medium',
                                                            timeStyle: 'short',
                                                        }
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-white/5">
                                                <span className="text-slate-500 dark:text-white/50">Waktu Ditinjau</span>
                                                <span className="font-medium text-slate-800 dark:text-white/90">
                                                    {detailModal.confirmation.reviewedAt
                                                        ? new Date(detailModal.confirmation.reviewedAt).toLocaleString(
                                                              'id-ID',
                                                              {
                                                                  dateStyle: 'medium',
                                                                  timeStyle: 'short',
                                                              }
                                                          )
                                                        : '-'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between py-1">
                                                <span className="text-slate-500 dark:text-white/50">Reviewer</span>
                                                <span className="font-bold text-slate-900 dark:text-white">
                                                    {detailModal.confirmation.reviewedBy || '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Copy Summary for Bookkeeping */}
                                    <div className="pt-2">
                                        <button
                                            type="button"
                                            onClick={() => handleCopySummary(detailModal.confirmation)}
                                            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-white text-xs font-semibold border border-slate-200 dark:border-white/10 transition shadow-sm"
                                        >
                                            {copiedSummary ? (
                                                <>
                                                    <Check className="w-4 h-4 text-emerald-500" />
                                                    <span className="text-emerald-600 dark:text-emerald-400">
                                                        Rincian Berhasil Disalin ke Clipboard!
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-4 h-4 text-slate-500" />
                                                    <span>Salin Rincian untuk Kebutuhan Pencatatan</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] flex items-center justify-between gap-3">
                            <span className="text-xs text-slate-400 dark:text-white/40 hidden sm:inline">
                                Tekan tombol Tutup atau klik area luar modal untuk keluar
                            </span>
                            <div className="flex items-center gap-2 ml-auto">
                                {detailModal.confirmation.status === 'pending' && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleApproveFromDetail(detailModal.confirmation)
                                            }
                                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
                                        >
                                            <Check className="w-4 h-4" />
                                            <span>Setujui</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleRejectFromDetail(detailModal.confirmation)
                                            }
                                            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
                                        >
                                            <X className="w-4 h-4" />
                                            <span>Tolak</span>
                                        </button>
                                    </>
                                )}
                                <button
                                    type="button"
                                    onClick={closeDetailModal}
                                    className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/15 text-slate-800 dark:text-white text-xs font-semibold transition"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default QRPaymentAdmin;
