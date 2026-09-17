import React from 'react';
import {
    Calendar,
    Users,
    CheckCircle,
    Eye,
    Send,
    AlertCircle,
} from 'lucide-react';

const EventReminderTab = ({
    events,
    selectedEvent,
    eventUnpaidStudents,
    eventCategory,
    eventCategories,
    groupId,
    groupPreview,
    loading,
    sending,
    handleEventSelect,
    setEventCategory,
    setGroupId,
    handlePreviewEventGroup,
    handleSendEventToGroup,
}) => {
    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-6 rounded-xl border border-blue-200 dark:border-blue-500/20 shadow-sm">
                <h3 className="font-bold text-lg mb-3 text-blue-700 dark:text-blue-300 flex items-center gap-2">
                    <Calendar className="w-6 h-6" />
                    Reminder Pembayaran Event ke Grup
                </h3>
                <p className="text-slate-600 dark:text-white/60 mb-2">
                    Kirim reminder khusus untuk pembayaran event ke grup
                    WhatsApp dengan mention semua yang belum bayar.
                </p>
                <div className="bg-white/60 dark:bg-white/[0.04] p-3 rounded-lg border border-blue-200 dark:border-blue-500/20 shadow-xs">
                    <p className="text-sm text-slate-700 dark:text-white/70 font-semibold">
                        Keunggulan:
                    </p>
                    <ul className="text-sm text-slate-600 dark:text-white/60 ml-4 mt-2 space-y-1">
                        <li>
                            • Satu pesan grup dengan @mention semua yang belum
                            bayar
                        </li>
                        <li>• Tracking progress pembayaran event real-time</li>
                        <li>• Transparansi untuk semua anggota grup</li>
                        <li>• Hemat - hanya 1 API call untuk semua siswa</li>
                    </ul>
                </div>
            </div>

            {/* Event Selection */}
            <div className="bg-white dark:bg-zinc-900/60 p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-2">
                    Pilih Event
                </label>
                <select
                    value={selectedEvent?._id || ''}
                    onChange={(e) => handleEventSelect(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                >
                    <option value="">-- Pilih Event --</option>
                    {events.map((event) => (
                        <option key={event._id} value={event._id}>
                            {event.name} - Rp{' '}
                            {event.perStudentAmount.toLocaleString('id-ID')}{' '}
                            (Deadline:{' '}
                            {new Date(event.endDate).toLocaleDateString(
                                'id-ID'
                            )}
                            )
                        </option>
                    ))}
                </select>
            </div>

            {selectedEvent && (
                <>
                    {/* Event Info */}
                    <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-4 rounded-xl border border-emerald-200 dark:border-emerald-500/20 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-slate-600 dark:text-white/60">
                                    Target Total
                                </p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">
                                    Rp{' '}
                                    {selectedEvent.targetAmount.toLocaleString(
                                        'id-ID'
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600 dark:text-white/60">
                                    Per Siswa
                                </p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">
                                    Rp{' '}
                                    {selectedEvent.perStudentAmount.toLocaleString(
                                        'id-ID'
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600 dark:text-white/60">
                                    Sudah Bayar
                                </p>
                                <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                                    {selectedEvent.studentsPaid.length} siswa
                                </p>
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="flex justify-between text-sm text-slate-600 dark:text-white/60 mb-1">
                                <span>Progress Pembayaran</span>
                                <span className="font-semibold text-slate-900 dark:text-white">
                                    {selectedEvent.studentsPaid.length > 0
                                        ? Math.round(
                                              ((selectedEvent.studentsPaid
                                                  .length *
                                                  selectedEvent.perStudentAmount) /
                                                  selectedEvent.targetAmount) *
                                                  100
                                          )
                                        : 0}
                                    %
                                </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-white/[0.08] rounded-full h-3">
                                <div
                                    className="bg-emerald-600 h-3 rounded-full transition-all"
                                    style={{
                                        width: `${
                                            selectedEvent.studentsPaid.length >
                                            0
                                                ? Math.min(
                                                      ((selectedEvent
                                                          .studentsPaid.length *
                                                          selectedEvent.perStudentAmount) /
                                                          selectedEvent.targetAmount) *
                                                          100,
                                                      100
                                                  )
                                                : 0
                                        }%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Message Category */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-2">
                            Pilih Style Pesan
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {eventCategories.map((cat) => (
                                <button
                                    key={cat.value}
                                    onClick={() => setEventCategory(cat.value)}
                                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                                        eventCategory === cat.value
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 font-semibold shadow-xs'
                                            : 'border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-800/40 text-slate-700 dark:text-white/80 hover:border-slate-300 dark:hover:border-white/20'
                                    }`}
                                >
                                    <div className="text-sm">
                                        {cat.label}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Unpaid Students Summary */}
                    <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm">
                        <div className="p-4 border-b border-slate-100 dark:border-white/10">
                            <h4 className="font-semibold text-slate-900 dark:text-white">
                                Siswa yang Belum Bayar (
                                {eventUnpaidStudents.length})
                            </h4>
                        </div>
                        <div className="p-4">
                            {eventUnpaidStudents.length === 0 ? (
                                <div className="text-center py-8 text-slate-500 dark:text-white/60">
                                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
                                    <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                                        Semua siswa sudah bayar! 🎉
                                    </p>
                                    <p className="text-sm mt-1">
                                        Event ini sudah lunas
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-3 mb-3">
                                        <p className="text-sm text-amber-800 dark:text-amber-300">
                                            <strong>Info:</strong>{' '}
                                            {eventUnpaidStudents.length} siswa
                                            belum melakukan pembayaran. Pesan
                                            grup akan mention semua nomor
                                            mereka.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                                        {eventUnpaidStudents.map((student) => (
                                            <div
                                                key={student._id}
                                                className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/5 rounded-lg"
                                            >
                                                <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm text-slate-900 dark:text-white">
                                                        {student.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-white/60">
                                                        {student.phoneNumber ||
                                                            '(Tanpa WA)'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Group ID Input and Send */}
                    {eventUnpaidStudents.length > 0 && (
                        <div className="bg-purple-50/50 dark:bg-purple-500/10 rounded-xl border border-purple-200 dark:border-purple-500/20 p-6 shadow-sm">
                            <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Kirim ke Grup WhatsApp
                            </h4>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-2">
                                        Group ID WhatsApp
                                    </label>
                                    <input
                                        type="text"
                                        value={groupId}
                                        onChange={(e) =>
                                            setGroupId(e.target.value)
                                        }
                                        placeholder="628xxxxxxxxxx-xxxxxxxxx@g.us"
                                        className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                    <p className="text-xs text-slate-500 dark:text-white/60 mt-1">
                                        Format: 628xxx-xxx@g.us (dapatkan dari
                                        bot atau WhatsApp Web)
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <button
                                        onClick={handlePreviewEventGroup}
                                        disabled={loading || !groupId.trim()}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-100 dark:bg-purple-500/15 border border-purple-300 dark:border-purple-500/25 text-purple-800 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-500/25 disabled:opacity-50 transition-colors font-medium"
                                    >
                                        <Eye className="w-5 h-5" />
                                        Preview Pesan
                                    </button>

                                    <button
                                        onClick={handleSendEventToGroup}
                                        disabled={sending || !groupId.trim()}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 transition-colors font-medium shadow-sm"
                                    >
                                        <Send className="w-5 h-5" />
                                        {sending
                                            ? 'Mengirim...'
                                            : `Kirim ke Grup (${eventUnpaidStudents.length} mention)`}
                                    </button>
                                </div>

                                {groupPreview && (
                                    <div className="bg-white dark:bg-zinc-900/60 p-4 rounded-xl border border-slate-200 dark:border-white/10 mt-4 shadow-sm">
                                        <p className="text-sm font-medium text-slate-700 dark:text-white/70 mb-2">
                                            Preview Pesan:
                                        </p>
                                        <div className="bg-slate-50 dark:bg-white/[0.04] p-3 rounded-lg border border-slate-200 dark:border-white/10">
                                            <pre className="text-sm whitespace-pre-wrap text-slate-800 dark:text-slate-200 font-mono">
                                                {groupPreview}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* How to get Group ID */}
                    <div className="bg-white dark:bg-zinc-900/60 rounded-xl p-4 border border-slate-200 dark:border-white/10 shadow-sm">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Cara Mendapatkan Group ID
                        </h4>
                        <ol className="text-sm text-slate-600 dark:text-white/60 space-y-2 ml-4">
                            <li>
                                <strong>1. Via Bot Fonnte:</strong>
                                <ul className="ml-4 mt-1 space-y-1">
                                    <li>• Tambahkan bot ke grup WhatsApp</li>
                                    <li>
                                        • Kirim perintah{' '}
                                        <code className="bg-slate-100 dark:bg-white/[0.06] text-slate-800 dark:text-slate-200 px-1 rounded">
                                            /getid
                                        </code>{' '}
                                        di grup
                                    </li>
                                    <li>• Bot akan reply dengan Group ID</li>
                                </ul>
                            </li>
                            <li>
                                <strong>2. Via WhatsApp Web:</strong>
                                <ul className="ml-4 mt-1 space-y-1">
                                    <li>• Buka WhatsApp Web dan grup</li>
                                    <li>• Buka Developer Console (F12)</li>
                                    <li>
                                        • Ketik:{' '}
                                        <code className="bg-slate-100 dark:bg-white/[0.06] text-slate-800 dark:text-slate-200 px-1 rounded">
                                            window.location.href
                                        </code>
                                    </li>
                                    <li>• Copy Group ID dari URL</li>
                                </ul>
                            </li>
                        </ol>
                    </div>
                </>
            )}
        </div>
    );
};

export default EventReminderTab;
