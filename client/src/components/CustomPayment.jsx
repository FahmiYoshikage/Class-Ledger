import React, { useState } from 'react';
import { DollarSign, Plus, X, Gift, TrendingUp } from 'lucide-react';
import { paymentsAPI } from '../services/api';

const CustomPayment = ({ onPaymentAdded }) => {
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        setLoading(true);
        try {
            const customPayment = {
                studentId: null, // Tidak ada studentId untuk custom payment
                amount: parseInt(formData.get('amount')),
                date: formData.get('date'),
                method: formData.get('method'),
                note: formData.get('note'),
                source: 'custom',
                sourceName: formData.get('sourceName'),
            };

            await paymentsAPI.create(customPayment);

            if (onPaymentAdded) {
                onPaymentAdded();
            }

            setShowModal(false);
            e.target.reset();

            alert(
                `✅ Pemasukan custom berhasil ditambahkan: ${formatRp(
                    customPayment.amount
                )}`
            );
        } catch (err) {
            alert(
                '❌ Gagal menambah pemasukan: ' + err.response?.data?.message
            );
        } finally {
            setLoading(false);
        }
    };

    const formatRp = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const sourceExamples = [
        'Sumbangan Dosen',
        'Donasi Alumni',
        'Sponsor Kegiatan',
        'Penjualan Merchandise',
        'Hasil Fundraising',
        'Hibah',
        'Lain-lain',
    ];

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setShowModal(true)}
                className="w-full bg-teal-500/10 text-teal-300 border border-teal-500/15 px-6 py-4 rounded-xl hover:bg-teal-500/18 transition flex items-center justify-center gap-3 "
            >
                <Gift className="w-5 h-5" />
                <span className="font-semibold">Tambah Pemasukan Custom</span>
                <span className="text-xs bg-white/[0.06] px-2 py-1 rounded-md text-white/40">
                    Sumbangan, Donasi, dll
                </span>
            </button>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 backdrop-animate">
                    <div className="bg-[#1e1e22] border border-white/[0.12] rounded-2xl max-w-md w-full modal-animate">
                        {/* Header */}
                        <div className="p-6 border-b">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-500 p-2 rounded-lg">
                                        <Gift className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">
                                            Pemasukan Custom
                                        </h3>
                                        <p className="text-sm text-white/60">
                                            Sumber pemasukan lain untuk kas
                                            kelas
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-1 hover:bg-white/[0.07] rounded"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Source Name */}
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-1">
                                    Sumber Pemasukan{' '}
                                    <span className="text-rose-300">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="sourceName"
                                    required
                                    placeholder="Contoh: Sumbangan Dosen Wali"
                                    list="sourceExamples"
                                    className="w-full px-3 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-xl focus:ring-2 focus:ring-indigo-400/25 focus:border-transparent transition-all duration-200 text-white"
                                />
                                <datalist id="sourceExamples">
                                    {sourceExamples.map((example, idx) => (
                                        <option key={idx} value={example} />
                                    ))}
                                </datalist>
                                <p className="text-xs text-white/60 mt-1">
                                    Nama/deskripsi sumber pemasukan
                                </p>
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-1">
                                    Jumlah{' '}
                                    <span className="text-rose-300">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">
                                        Rp
                                    </span>
                                    <input
                                        type="number"
                                        name="amount"
                                        required
                                        min="1000"
                                        step="500"
                                        placeholder="50000"
                                        className="w-full pl-10 pr-3 py-2 border border-white/[0.1] rounded-lg focus:ring-2 focus:ring-indigo-400/25 focus:border-transparent"
                                    />
                                </div>
                                <p className="text-xs text-white/60 mt-1">
                                    Jumlah uang yang masuk ke kas
                                </p>
                            </div>

                            {/* Date */}
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-1">
                                    Tanggal{' '}
                                    <span className="text-rose-300">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    required
                                    defaultValue={
                                        new Date().toISOString().split('T')[0]
                                    }
                                    className="w-full px-3 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-xl focus:ring-2 focus:ring-indigo-400/25 focus:border-transparent transition-all duration-200 text-white"
                                />
                            </div>

                            {/* Method */}
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-1">
                                    Metode Pembayaran{' '}
                                    <span className="text-rose-300">*</span>
                                </label>
                                <select
                                    name="method"
                                    className="w-full px-3 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-xl focus:ring-2 focus:ring-indigo-400/25 focus:border-transparent transition-all duration-200 text-white"
                                >
                                    <option value="Tunai">Tunai</option>
                                    <option value="Transfer">Transfer</option>
                                </select>
                            </div>

                            {/* Note */}
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-1">
                                    Catatan (Opsional)
                                </label>
                                <textarea
                                    name="note"
                                    rows="3"
                                    placeholder="Keterangan tambahan..."
                                    className="w-full px-3 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-xl focus:ring-2 focus:ring-indigo-400/25 focus:border-transparent transition-all duration-200 text-white"
                                />
                            </div>

                            {/* Info Box */}
                            <div className="bg-indigo-500/[0.05]0/[0.06] border border-blue-200 rounded-lg p-3">
                                <p className="text-xs text-indigo-400">
                                    <strong>ℹ️ Catatan:</strong> Pemasukan ini
                                    akan langsung masuk ke kas kelas dan
                                    ditampilkan di tab Pembayaran dengan label
                                    sumber yang Anda tentukan.
                                </p>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 border border-white/[0.1] rounded-lg hover:bg-white/[0.04] transition disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-indigo-500/[0.05]0 text-white rounded-lg hover:bg-cyan-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4" />
                                            Tambah Pemasukan
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default CustomPayment;
