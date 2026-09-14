import React, { useState } from 'react';
import {
    Printer,
    Share2,
    Copy,
    Check,
    X,
    ShieldCheck,
    Download,
    MessageCircle,
} from 'lucide-react';

function terbilang(n) {
    if (!n || isNaN(n)) return 'Nol';
    const bilangan = [
        '',
        'Satu',
        'Dua',
        'Tiga',
        'Empat',
        'Lima',
        'Enam',
        'Tujuh',
        'Delapan',
        'Sembilan',
        'Sepuluh',
        'Sebelas',
    ];
    if (n < 12) return bilangan[n];
    if (n < 20) return terbilang(n - 10) + ' Belas';
    if (n < 100)
        return (
            terbilang(Math.floor(n / 10)) +
            ' Puluh' +
            (n % 10 !== 0 ? ' ' + terbilang(n % 10) : '')
        );
    if (n < 200)
        return (
            'Seratus' + (n % 100 !== 0 ? ' ' + terbilang(n % 100) : '')
        );
    if (n < 1000)
        return (
            terbilang(Math.floor(n / 100)) +
            ' Ratus' +
            (n % 100 !== 0 ? ' ' + terbilang(n % 100) : '')
        );
    if (n < 2000)
        return (
            'Seribu' + (n % 1000 !== 0 ? ' ' + terbilang(n % 1000) : '')
        );
    if (n < 1000000)
        return (
            terbilang(Math.floor(n / 1000)) +
            ' Ribu' +
            (n % 1000 !== 0 ? ' ' + terbilang(n % 1000) : '')
        );
    if (n < 1000000000)
        return (
            terbilang(Math.floor(n / 1000000)) +
            ' Juta' +
            (n % 1000000 !== 0 ? ' ' + terbilang(n % 1000000) : '')
        );
    return n.toString();
}

const ReceiptModal = ({ isOpen, onClose, payment, student }) => {
    const [copied, setCopied] = useState(false);

    if (!isOpen || !payment) return null;

    const studentName =
        payment.source === 'custom' || payment.source === 'event'
            ? payment.sourceName
            : student?.name || payment.studentId?.name || 'Siswa Kas';

    const absen = student?.absen || payment.studentId?.absen || '-';
    const amount = payment.totalAmount || payment.amount || 0;
    const dateObj = new Date(payment.date || Date.now());
    const formattedDate = dateObj.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
    const receiptNo = `KW-${dateObj.getFullYear()}${String(
        dateObj.getMonth() + 1
    ).padStart(2, '0')}-${(payment._id || 'TX9999').slice(-6).toUpperCase()}`;

    const purpose =
        payment.source === 'event'
            ? `Iuran Event: ${payment.sourceName || 'Kegiatan Kelas'}`
            : payment.source === 'custom'
            ? `Kas Custom: ${payment.sourceName || 'Pemasukan Lain'}`
            : `Uang Kas Reguler (Minggu ke-${payment.week || '-'})`;

    const cleanPhone = (student?.phoneNumber || '').replace(/\D/g, '');
    const intlPhone = cleanPhone.startsWith('0')
        ? '62' + cleanPhone.slice(1)
        : cleanPhone.startsWith('62')
        ? cleanPhone
        : cleanPhone
        ? '62' + cleanPhone
        : '';

    const waMessageText = `🧾 *BUKTI KWITANSI PEMBAYARAN KAS KELAS*
No. Bukti  : ${receiptNo}
Tanggal    : ${formattedDate}
Nama Siswa : ${studentName} (Absen: ${absen})
Nominal    : Rp ${amount.toLocaleString('id-ID')}
Terbilang  : ${terbilang(amount)} Rupiah
Keperluan  : ${purpose}${payment.note ? `\nCatatan    : ${payment.note}` : ''}
Metode     : ${payment.method || 'Tunai'}
Status     : *LUNAS* ✅

Terima kasih atas kontribusinya! 🙏
_Kas Kelas Official Digital Ledger_`;

    const handleCopy = () => {
        navigator.clipboard.writeText(waMessageText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleSendWA = () => {
        const url = intlPhone
            ? `https://wa.me/${intlPhone}?text=${encodeURIComponent(
                  waMessageText
              )}`
            : `https://wa.me/?text=${encodeURIComponent(waMessageText)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="relative w-full max-w-lg my-8 bg-zinc-950/90 border border-white/10 rounded-2xl shadow-2xl overflow-hidden glass-cyber-card print:border-none print:shadow-none print:bg-white print:text-black">
                {/* Close Button (Hidden on Print) */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-white/50 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors z-10 print:hidden"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Receipt Card Body */}
                <div id="printable-receipt" className="p-6 sm:p-8">
                    {/* Header */}
                    <div className="border-b border-dashed border-white/15 pb-5 text-center relative print:border-black/20">
                        <div className="inline-flex items-center justify-center p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-3 print:border-zinc-300">
                            <ShieldCheck className="w-7 h-7 text-indigo-400 print:text-black" />
                        </div>
                        <h2 className="text-xl font-extrabold text-white tracking-wide uppercase print:text-black">
                            Kwitansi Pembayaran Kas
                        </h2>
                        <p className="text-xs text-white/60 font-mono mt-1 print:text-zinc-600">
                            No. Bukti: <span className="text-indigo-300 font-bold print:text-black">{receiptNo}</span>
                        </p>
                    </div>

                    {/* Meta Info */}
                    <div className="grid grid-cols-2 gap-3 py-4 text-xs sm:text-sm border-b border-dashed border-white/15 print:border-black/20">
                        <div>
                            <span className="text-white/40 block text-[11px] uppercase tracking-wider print:text-zinc-500">
                                Diterima Dari
                            </span>
                            <span className="font-semibold text-white block mt-0.5 print:text-black">
                                {studentName}
                            </span>
                            <span className="text-xs text-white/50 print:text-zinc-600">
                                Absen: {absen}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-white/40 block text-[11px] uppercase tracking-wider print:text-zinc-500">
                                Tanggal Transaksi
                            </span>
                            <span className="font-semibold text-white block mt-0.5 print:text-black">
                                {formattedDate}
                            </span>
                            <span className="text-xs text-indigo-400 font-medium print:text-zinc-700">
                                Metode: {payment.method || 'Tunai'}
                            </span>
                        </div>
                    </div>

                    {/* Amount Highlight */}
                    <div className="my-5 p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-center relative overflow-hidden print:bg-zinc-100 print:border-zinc-300">
                        <span className="text-[11px] uppercase tracking-widest text-indigo-300/70 font-semibold block mb-1 print:text-zinc-600">
                            Jumlah Diterima
                        </span>
                        <div className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-indigo-300 to-pink-300 font-mono print:text-black">
                            Rp {amount.toLocaleString('id-ID')}
                        </div>
                        <p className="text-xs text-white/70 italic mt-1 font-serif print:text-zinc-700">
                            # {terbilang(amount)} Rupiah #
                        </p>

                        {/* Stamp LUNAS */}
                        <div className="absolute right-3 top-2 border-2 border-teal-400/50 text-teal-400 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest rotate-[-12deg] select-none opacity-80 print:border-black print:text-black">
                            LUNAS
                        </div>
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-2 text-xs sm:text-sm py-2">
                        <div className="flex justify-between items-center text-white/70 print:text-zinc-700">
                            <span>Keperluan:</span>
                            <span className="font-medium text-white text-right print:text-black">
                                {purpose}
                            </span>
                        </div>
                        {payment.count > 1 && (
                            <div className="flex justify-between items-center text-white/70 print:text-zinc-700">
                                <span>Rincian Pembayaran:</span>
                                <span className="font-medium text-indigo-300 print:text-black">
                                    {payment.count}x Minggu (@ Rp {payment.amount?.toLocaleString('id-ID')})
                                </span>
                            </div>
                        )}
                        {payment.note && (
                            <div className="flex justify-between items-start text-white/70 pt-1 print:text-zinc-700">
                                <span>Catatan:</span>
                                <span className="text-white/90 text-right italic max-w-[240px] print:text-black">
                                    "{payment.note}"
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Footer Signature Note */}
                    <div className="mt-6 pt-4 border-t border-dashed border-white/15 flex justify-between items-end text-xs text-white/50 print:border-black/20 print:text-zinc-600">
                        <div>
                            <p className="text-[11px] leading-relaxed">
                                Dokumen ini merupakan bukti pembayaran sah
                                <br />
                                diterbitkan melalui <strong>Class-Ledger</strong>.
                            </p>
                        </div>
                        <div className="text-center font-mono text-[11px]">
                            <p className="text-white/40 mb-8 print:text-zinc-400">Bendahara Kelas</p>
                            <p className="text-white/80 font-bold border-t border-white/20 pt-1 print:text-black print:border-black">
                                Verified Digital
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Bar (Hidden on Print) */}
                <div className="p-4 bg-white/[0.02] border-t border-white/10 flex flex-wrap items-center justify-between gap-2 print:hidden">
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors border border-white/10"
                        >
                            <Printer className="w-4 h-4 text-white/70" />
                            <span>Cetak PDF</span>
                        </button>
                        <button
                            onClick={handleCopy}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors border border-white/10"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4 text-teal-400" />
                                    <span className="text-teal-400">Tersalin</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4 text-white/70" />
                                    <span>Salin WA</span>
                                </>
                            )}
                        </button>
                    </div>

                    <button
                        onClick={handleSendWA}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all border border-emerald-500/30 shadow-lg shadow-emerald-950/50"
                    >
                        <MessageCircle className="w-4 h-4 text-emerald-400" />
                        <span>Kirim ke WhatsApp</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReceiptModal;
