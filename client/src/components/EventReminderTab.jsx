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
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-200">
                <h3 className="font-bold text-lg mb-3 text-blue-900 flex items-center gap-2">
                    <Calendar className="w-6 h-6" />
                    Reminder Pembayaran Event ke Grup
                </h3>
                <p className="text-gray-700 mb-2">
                    Kirim reminder khusus untuk pembayaran event ke grup
                    WhatsApp dengan mention semua yang belum bayar.
                </p>
                <div className="bg-white/70 p-3 rounded border border-blue-200">
                    <p className="text-sm text-gray-700">
                        <strong>Keunggulan:</strong>
                    </p>
                    <ul className="text-sm text-gray-700 ml-4 mt-2 space-y-1">
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
            <div className="bg-white p-4 rounded-lg border">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pilih Event
                </label>
                <select
                    value={selectedEvent?._id || ''}
                    onChange={(e) => handleEventSelect(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4 rounded-lg border">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">
                                    Target Total
                                </p>
                                <p className="text-xl font-bold text-gray-800">
                                    Rp{' '}
                                    {selectedEvent.targetAmount.toLocaleString(
                                        'id-ID'
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">
                                    Per Siswa
                                </p>
                                <p className="text-xl font-bold text-gray-800">
                                    Rp{' '}
                                    {selectedEvent.perStudentAmount.toLocaleString(
                                        'id-ID'
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">
                                    Sudah Bayar
                                </p>
                                <p className="text-xl font-bold text-green-600">
                                    {selectedEvent.studentsPaid.length} siswa
                                </p>
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Progress Pembayaran</span>
                                <span>
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
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className="bg-green-600 h-3 rounded-full transition-all"
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pilih Style Pesan
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {eventCategories.map((cat) => (
                                <button
                                    key={cat.value}
                                    onClick={() => setEventCategory(cat.value)}
                                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                                        eventCategory === cat.value
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="text-sm font-medium">
                                        {cat.label}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Unpaid Students Summary */}
                    <div className="bg-white rounded-lg border">
                        <div className="p-4 border-b">
                            <h4 className="font-semibold text-gray-800">
                                Siswa yang Belum Bayar (
                                {eventUnpaidStudents.length})
                            </h4>
                        </div>
                        <div className="p-4">
                            {eventUnpaidStudents.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                                    <p className="font-medium text-green-700">
                                        Semua siswa sudah bayar! 🎉
                                    </p>
                                    <p className="text-sm mt-1">
                                        Event ini sudah lunas
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                                        <p className="text-sm text-yellow-800">
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
                                                className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                                            >
                                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm text-gray-800">
                                                        {student.name}
                                                    </p>
                                                    <p className="text-xs text-gray-600">
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
                        <div className="bg-purple-50 rounded-lg border-2 border-purple-200 p-6">
                            <h4 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Kirim ke Grup WhatsApp
                            </h4>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Group ID WhatsApp
                                    </label>
                                    <input
                                        type="text"
                                        value={groupId}
                                        onChange={(e) =>
                                            setGroupId(e.target.value)
                                        }
                                        placeholder="628xxxxxxxxxx-xxxxxxxxx@g.us"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Format: 628xxx-xxx@g.us (dapatkan dari
                                        bot atau WhatsApp Web)
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <button
                                        onClick={handlePreviewEventGroup}
                                        disabled={loading || !groupId.trim()}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 transition-colors"
                                    >
                                        <Eye className="w-5 h-5" />
                                        Preview Pesan
                                    </button>

                                    <button
                                        onClick={handleSendEventToGroup}
                                        disabled={sending || !groupId.trim()}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 transition-colors font-medium"
                                    >
                                        <Send className="w-5 h-5" />
                                        {sending
                                            ? 'Mengirim...'
                                            : `Kirim ke Grup (${eventUnpaidStudents.length} mention)`}
                                    </button>
                                </div>

                                {groupPreview && (
                                    <div className="bg-white p-4 rounded-lg border mt-4">
                                        <p className="text-sm font-medium text-gray-700 mb-2">
                                            Preview Pesan:
                                        </p>
                                        <div className="bg-gray-50 p-3 rounded">
                                            <pre className="text-sm whitespace-pre-wrap text-gray-800 font-mono">
                                                {groupPreview}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* How to get Group ID */}
                    <div className="bg-gray-50 rounded-lg p-4 border">
                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Cara Mendapatkan Group ID
                        </h4>
                        <ol className="text-sm text-gray-700 space-y-2 ml-4">
                            <li>
                                <strong>1. Via Bot Fonnte:</strong>
                                <ul className="ml-4 mt-1 space-y-1">
                                    <li>• Tambahkan bot ke grup WhatsApp</li>
                                    <li>
                                        • Kirim perintah{' '}
                                        <code className="bg-gray-200 px-1 rounded">
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
                                        <code className="bg-gray-200 px-1 rounded">
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
