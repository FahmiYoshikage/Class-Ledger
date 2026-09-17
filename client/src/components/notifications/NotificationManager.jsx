import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Bell,
    Send,
    Users,
    MessageSquare,
    CheckCircle,
    XCircle,
    AlertCircle,
    RefreshCw,
    Eye,
    Settings,
    TrendingUp,
    Clock,
    Zap,
    Calendar,
    Target,
    Loader2,
    Radio,
    FileText,
} from 'lucide-react';
import axios from 'axios';
import EventReminderTab from '../events/EventReminderTab';
import SendFinancialReportModal from './SendFinancialReportModal';

// Use Vite-provided API url (set in client/.env) with a sensible fallback to 8012
const API_URL =
    (typeof window !== 'undefined' && window.__ENV__?.VITE_API_URL) ||
    import.meta.env.VITE_API_URL ||
    '/api';

const NotificationManager = () => {
    const [students, setStudents] = useState([]);
    const [needsReminder, setNeedsReminder] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [stats, setStats] = useState(null);
    const [apiStatus, setApiStatus] = useState(null);

    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [messageCategory, setMessageCategory] = useState('friendly');
    const [previewMessage, setPreviewMessage] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [minWeeks, setMinWeeks] = useState(1);

    // Group message states
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [groupId, setGroupId] = useState('120363402325545063@g.us');
    const [groupPreview, setGroupPreview] = useState('');
    const [showFinancialReportModal, setShowFinancialReportModal] = useState(false);

    // Event reminder states
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [eventUnpaidStudents, setEventUnpaidStudents] = useState([]);
    const [eventCategory, setEventCategory] = useState('friendly');
    const [selectedEventStudents, setSelectedEventStudents] = useState([]);

    // Custom message states
    const [customPhoneNumber, setCustomPhoneNumber] = useState('');
    const [customMessage, setCustomMessage] = useState('');
    const [customPreview, setCustomPreview] = useState('');
    const [sendingCustom, setSendingCustom] = useState(false);
    const [selectedStudentForCustom, setSelectedStudentForCustom] =
        useState('');

    // Background job tracking
    const [activeJobs, setActiveJobs] = useState([]);
    const jobPollRef = useRef(null);

    const [activeTab, setActiveTab] = useState('send'); // send, history, stats, group, event, custom

    const categories = [
        { value: 'friendly', label: '😊 Friendly & Santai', color: 'blue' },
        { value: 'motivational', label: '💪 Motivasi', color: 'green' },
        { value: 'formal', label: '📋 Formal', color: 'gray' },
        { value: 'energetic', label: '⚡ Energetik', color: 'yellow' },
        { value: 'humorous', label: '😄 Humor', color: 'pink' },
        { value: 'gentle', label: '🌸 Gentle', color: 'purple' },
        { value: 'casual', label: '🤙 Casual', color: 'orange' },
    ];

    const eventCategories = [
        { value: 'friendly', label: '😊 Friendly & Santai', color: 'blue' },
        { value: 'urgent', label: '⚡ Urgent', color: 'red' },
        { value: 'formal', label: '📋 Formal', color: 'gray' },
        { value: 'motivational', label: '💪 Motivasi', color: 'green' },
        { value: 'humorous', label: '😄 Humor', color: 'pink' },
    ];

    useEffect(() => {
        loadData();
        checkApiStatus();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [studentsRes, reminderRes, notificationsRes, statsRes] =
                await Promise.all([
                    axios.get(`${API_URL}/students`),
                    axios.get(
                        `${API_URL}/notifications/needs-reminder?minWeeks=${minWeeks}`
                    ),
                    axios.get(`${API_URL}/notifications`),
                    axios.get(`${API_URL}/notifications/stats`),
                ]);

            setStudents(studentsRes.data);
            setNeedsReminder(reminderRes.data.students || []);
            setNotifications(notificationsRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkApiStatus = async () => {
        try {
            const response = await axios.get(`${API_URL}/notifications/status`);
            setApiStatus(response.data);
        } catch (error) {
            setApiStatus({ connected: false, error: error.message });
        }
    };

    // ==========================================
    // 📋 Background job polling
    // ==========================================
    const pollActiveJobs = useCallback(async () => {
        try {
            const response = await axios.get(
                `${API_URL}/notifications/send-jobs/active`
            );
            const jobs = response.data;
            setActiveJobs(jobs);

            // Jika semua job selesai, stop polling & reload data
            const hasRunning = jobs.some((j) => j.status === 'running');
            if (!hasRunning && jobs.length > 0) {
                // Refresh data setelah semua selesai
                loadData();
            }
            return hasRunning;
        } catch {
            return false;
        }
    }, []);

    const startJobPolling = useCallback(() => {
        // Jangan dobel polling
        if (jobPollRef.current) return;
        jobPollRef.current = setInterval(async () => {
            const hasRunning = await pollActiveJobs();
            if (!hasRunning && jobPollRef.current) {
                clearInterval(jobPollRef.current);
                jobPollRef.current = null;
            }
        }, 3000); // poll setiap 3 detik
    }, [pollActiveJobs]);

    // Cek job aktif saat pertama kali load (jika ada job dari sebelumnya)
    useEffect(() => {
        pollActiveJobs().then((hasRunning) => {
            if (hasRunning) startJobPolling();
        });
        return () => {
            if (jobPollRef.current) clearInterval(jobPollRef.current);
        };
    }, [pollActiveJobs, startJobPolling]);

    const handlePreview = async () => {
        try {
            const sample = needsReminder[0];
            if (!sample) {
                alert('Tidak ada siswa yang perlu reminder');
                return;
            }

            const response = await axios.post(
                `${API_URL}/notifications/preview`,
                {
                    category: messageCategory,
                    studentName: sample.student.name,
                    weeksLate: sample.weeksLate,
                    amount: sample.amountOwed,
                }
            );

            setPreviewMessage(response.data.message);
            setShowPreview(true);
        } catch (error) {
            alert('Error generating preview: ' + error.message);
        }
    };

    const handleSendBulk = async () => {
        if (selectedStudents.length === 0 && needsReminder.length === 0) {
            alert('Tidak ada siswa yang dipilih atau perlu reminder');
            return;
        }

        const confirmMessage =
            selectedStudents.length > 0
                ? `Kirim reminder ke ${selectedStudents.length} siswa terpilih?`
                : `Kirim reminder ke semua siswa yang telat ≥ ${minWeeks} minggu (${needsReminder.length} siswa)?`;

        if (!confirm(confirmMessage)) return;

        setSending(true);
        try {
            const response = await axios.post(
                `${API_URL}/notifications/send-bulk-reminder`,
                {
                    studentIds:
                        selectedStudents.length > 0
                            ? selectedStudents
                            : undefined,
                    category: messageCategory,
                    minWeeks: minWeeks,
                }
            );

            if (response.data.jobId) {
                // Job dimulai di background — start polling
                startJobPolling();
                setSelectedStudents([]);
            } else {
                alert(response.data.message);
            }
        } catch (error) {
            alert('Error mengirim reminder: ' + error.message);
        } finally {
            setSending(false);
        }
    };

    const handleSendSingle = async (studentData) => {
        if (!confirm(`Kirim reminder ke ${studentData.student.name}?`)) return;

        try {
            console.log('📤 Sending reminder to:', studentData.student.name);

            const response = await axios.post(
                `${API_URL}/notifications/send-reminder/${studentData.student._id}`,
                {
                    category: messageCategory,
                    weeksLate: studentData.weeksLate,
                    amount: studentData.amountOwed,
                }
            );

            console.log('✅ Response:', response.data);

            // Check if actually successful
            if (response.data.success) {
                alert(
                    response.data.testMode
                        ? '✅ Reminder berhasil dikirim! (TEST MODE - cek console)'
                        : '✅ Reminder berhasil dikirim!'
                );
                await loadData();
            } else {
                // Success false - show error
                alert(
                    '❌ Gagal mengirim pesan!\n\n' +
                        'Kemungkinan penyebab:\n' +
                        '1. API Token Fonnte tidak valid atau kadaluarsa\n' +
                        '2. Nomor WhatsApp tidak terdaftar\n' +
                        '3. Format nomor tidak valid\n' +
                        '4. Kuota API habis\n\n' +
                        'Cek console untuk detail error.'
                );
            }
        } catch (error) {
            console.error('❌ Error sending reminder:', error);
            console.error('Error response:', error.response?.data);

            const errorMsg =
                error.response?.data?.error ||
                error.response?.data?.message ||
                error.message ||
                'Terjadi kesalahan tidak diketahui';

            alert('❌ Error: ' + errorMsg);
        }
    };

    const toggleStudentSelection = (studentId) => {
        setSelectedStudents((prev) =>
            prev.includes(studentId)
                ? prev.filter((id) => id !== studentId)
                : [...prev, studentId]
        );
    };

    const selectAll = () => {
        const allIds = needsReminder.map((s) => s.student._id);
        setSelectedStudents(allIds);
    };

    const deselectAll = () => {
        setSelectedStudents([]);
    };

    // Handle preview group message
    const handleGroupPreview = async () => {
        try {
            const response = await axios.post(
                `${API_URL}/notifications/preview-group`,
                {
                    category: messageCategory,
                    minWeeks: minWeeks,
                }
            );

            if (!response.data.message) {
                alert('Tidak ada siswa yang perlu diingatkan');
                return;
            }

            setGroupPreview(response.data.message);
            setShowPreview(true);
        } catch (error) {
            alert('Error generating preview: ' + error.message);
        }
    };

    // Handle send to group
    const handleSendToGroup = async () => {
        if (!groupId.trim()) {
            alert(
                'Group ID tidak boleh kosong!\n\nFormat: 628xxxxxxxxxx-xxxxxxxxx@g.us'
            );
            return;
        }

        if (
            !confirm(
                `Kirim reminder ke grup WhatsApp?\n\n` +
                    `Group ID: ${groupId}\n` +
                    `Siswa yang akan di-mention: ${needsReminder.length}\n` +
                    `Style: ${messageCategory}`
            )
        )
            return;

        setSending(true);
        try {
            const response = await axios.post(
                `${API_URL}/notifications/send-to-group`,
                {
                    groupId: groupId.trim(),
                    category: messageCategory,
                    minWeeks: minWeeks,
                }
            );

            alert(
                `${response.data.testMode ? '🧪 TEST MODE\n\n' : ''}` +
                    `✅ ${response.data.message}\n\n` +
                    `Siswa yang di-mention: ${response.data.studentsCount}`
            );

            setShowGroupModal(false);
            await loadData();
        } catch (error) {
            alert('❌ Error: ' + error.message);
        } finally {
            setSending(false);
        }
    };

    // Event reminder functions
    const loadEvents = async () => {
        try {
            const response = await axios.get(`${API_URL}/events`);
            setEvents(response.data);
        } catch (error) {
            console.error('Error loading events:', error);
        }
    };

    const handleEventSelect = async (eventId) => {
        if (!eventId) {
            setSelectedEvent(null);
            setEventUnpaidStudents([]);
            return;
        }

        try {
            // Fetch fresh event data from API to get latest studentsPaid
            const eventRes = await axios.get(`${API_URL}/events/${eventId}`);
            const event = eventRes.data;
            setSelectedEvent(event);

            // Get list of students who haven't paid for this event
            const allStudentsRes = await axios.get(`${API_URL}/students`);
            const allStudents = allStudentsRes.data;

            // Filter students who haven't paid - show all, not just those with WA
            const unpaid = allStudents.filter(
                (student) =>
                    !event.studentsPaid.some(
                        (paidId) => paidId.toString() === student._id.toString()
                    )
            );

            console.log('Event:', event.name);
            console.log('Total students:', allStudents.length);
            console.log('Students paid:', event.studentsPaid.length);
            console.log('Students paid IDs:', event.studentsPaid);
            console.log('Unpaid students:', unpaid.length);
            console.log(
                'Unpaid list:',
                unpaid.map((s) => s.name)
            );

            setEventUnpaidStudents(unpaid);
        } catch (error) {
            alert('Error loading event details: ' + error.message);
        }
    };

    const handlePreviewEventReminder = async () => {
        if (!selectedEvent) {
            alert('Pilih event terlebih dahulu');
            return;
        }

        if (eventUnpaidStudents.length === 0) {
            alert(
                'Tidak ada siswa yang belum bayar atau memiliki WhatsApp aktif'
            );
            return;
        }

        try {
            const response = await axios.post(
                `${API_URL}/notifications/preview-event-reminder/${selectedEvent._id}`,
                {
                    category: eventCategory,
                }
            );

            setPreviewMessage(response.data.message);
            setShowPreview(true);
        } catch (error) {
            alert('Error generating preview: ' + error.message);
        }
    };

    const handlePreviewEventGroup = async () => {
        if (!selectedEvent) {
            alert('Pilih event terlebih dahulu');
            return;
        }

        try {
            const response = await axios.post(
                `${API_URL}/notifications/preview-event-reminder-group/${selectedEvent._id}`,
                {
                    category: eventCategory,
                }
            );

            setGroupPreview(response.data.message);
            setShowPreview(true);
        } catch (error) {
            alert('Error generating preview: ' + error.message);
        }
    };

    const handleSendEventReminder = async (studentId) => {
        if (!selectedEvent) return;

        if (!confirm('Kirim reminder event ke siswa ini?')) return;

        setSending(true);
        try {
            const response = await axios.post(
                `${API_URL}/notifications/send-event-reminder/${studentId}/${selectedEvent._id}`,
                {
                    category: eventCategory,
                }
            );

            alert(`✅ ${response.data.message}`);
            await handleEventSelect(selectedEvent._id);
        } catch (error) {
            alert('❌ Error: ' + error.message);
        } finally {
            setSending(false);
        }
    };

    const handleSendEventBulk = async () => {
        if (!selectedEvent) {
            alert('Pilih event terlebih dahulu');
            return;
        }

        const studentsToSend =
            selectedEventStudents.length > 0
                ? selectedEventStudents
                : eventUnpaidStudents.map((s) => s._id);

        if (studentsToSend.length === 0) {
            alert('Tidak ada siswa yang dipilih');
            return;
        }

        const confirmMessage =
            selectedEventStudents.length > 0
                ? `Kirim reminder event "${selectedEvent.name}" ke ${selectedEventStudents.length} siswa terpilih?`
                : `Kirim reminder event "${selectedEvent.name}" ke semua siswa yang belum bayar (${eventUnpaidStudents.length} siswa)?`;

        if (!confirm(confirmMessage)) return;

        setSending(true);
        try {
            const response = await axios.post(
                `${API_URL}/notifications/send-event-reminder-bulk/${selectedEvent._id}`,
                {
                    studentIds:
                        selectedEventStudents.length > 0
                            ? selectedEventStudents
                            : undefined,
                    category: eventCategory,
                }
            );

            if (response.data.jobId) {
                // Job dimulai di background — start polling
                startJobPolling();
                setSelectedEventStudents([]);
            } else {
                alert(response.data.message);
            }
        } catch (error) {
            alert('❌ Error: ' + error.message);
        } finally {
            setSending(false);
        }
    };

    const handleSendEventToGroup = async () => {
        if (!selectedEvent) {
            alert('Pilih event terlebih dahulu');
            return;
        }

        if (!groupId.trim()) {
            alert(
                'Group ID tidak boleh kosong!\n\nFormat: 628xxxxxxxxxx-xxxxxxxxx@g.us'
            );
            return;
        }

        if (
            !confirm(
                `Kirim reminder event "${selectedEvent.name}" ke grup WhatsApp?\n\n` +
                    `Group ID: ${groupId}\n` +
                    `Siswa yang akan di-mention: ${eventUnpaidStudents.length}\n` +
                    `Style: ${eventCategory}`
            )
        )
            return;

        setSending(true);
        try {
            const response = await axios.post(
                `${API_URL}/notifications/send-event-reminder-group/${selectedEvent._id}`,
                {
                    groupId: groupId.trim(),
                    category: eventCategory,
                }
            );

            if (response.data.success) {
                alert(
                    `${response.data.testMode ? '🧪 TEST MODE\n\n' : ''}` +
                        `✅ ${response.data.message}\n\n` +
                        `Siswa yang di-mention: ${response.data.studentsCount}`
                );
                setShowGroupModal(false);
                await handleEventSelect(selectedEvent._id);
            } else {
                alert(
                    `❌ Gagal mengirim pesan\n\n` +
                        `Error: ${response.data.error}\n` +
                        `${
                            response.data.detail
                                ? '\nDetail: ' +
                                  JSON.stringify(response.data.detail)
                                : ''
                        }`
                );
            }
        } catch (error) {
            const errorMsg = error.response?.data?.error || error.message;
            const errorDetail = error.response?.data?.detail;

            alert(
                `❌ Error mengirim reminder:\n\n` +
                    `${errorMsg}\n` +
                    `${
                        errorDetail
                            ? '\nDetail: ' + JSON.stringify(errorDetail)
                            : ''
                    }\n\n` +
                    `Cek:\n` +
                    `1. Group ID benar (format: 628xxx-xxx@g.us)\n` +
                    `2. Bot sudah ditambahkan ke grup\n` +
                    `3. API Token Fonnte masih aktif\n` +
                    `4. Nomor WA siswa dalam format yang benar`
            );
            console.error('Send error:', error.response?.data || error);
        } finally {
            setSending(false);
        }
    };

    // Custom message handlers
    const handleCustomPreview = async () => {
        if (!customMessage.trim()) {
            alert('⚠️ Pesan tidak boleh kosong!');
            return;
        }

        try {
            const response = await axios.post(
                `${API_URL}/notifications/preview-custom-message`,
                { message: customMessage }
            );
            setCustomPreview(response.data.preview);
        } catch (error) {
            console.error('Error preview custom message:', error);
            alert('Error saat preview pesan: ' + error.message);
        }
    };

    const handleSendCustomMessage = async () => {
        if (!customPhoneNumber.trim() || !customMessage.trim()) {
            alert('⚠️ Nomor telepon dan pesan harus diisi!');
            return;
        }

        if (
            !confirm(
                `Kirim pesan custom ke:\n${customPhoneNumber}?\n\nPesan akan otomatis ditambahkan info pembayaran.`
            )
        ) {
            return;
        }

        setSendingCustom(true);

        try {
            const response = await axios.post(
                `${API_URL}/notifications/send-custom-message`,
                {
                    phoneNumber: customPhoneNumber,
                    message: customMessage,
                    studentId: selectedStudentForCustom || null,
                }
            );

            if (response.data.success) {
                alert('✅ Pesan berhasil dikirim!');
                setCustomMessage('');
                setCustomPhoneNumber('');
                setSelectedStudentForCustom('');
                setCustomPreview('');
                await loadData();
            } else {
                alert(
                    `❌ Gagal mengirim pesan\n\n${
                        response.data.error || 'Unknown error'
                    }`
                );
            }
        } catch (error) {
            const errorMsg = error.response?.data?.error || error.message;
            alert(`❌ Error mengirim pesan:\n\n${errorMsg}`);
            console.error('Send error:', error.response?.data || error);
        } finally {
            setSendingCustom(false);
        }
    };

    const handleStudentSelectForCustom = (studentId) => {
        setSelectedStudentForCustom(studentId);
        if (studentId) {
            const student = students.find((s) => s._id === studentId);
            if (student && student.phoneNumber) {
                setCustomPhoneNumber(student.phoneNumber);
            }
        } else {
            setCustomPhoneNumber('');
        }
    };

    useEffect(() => {
        loadData();
        loadEvents();
        checkApiStatus();
    }, []);

    useEffect(() => {
        if (activeTab === 'event') {
            loadEvents();
        }
    }, [activeTab]);

    return (
        <div className="max-w-7xl mx-auto p-3 sm:p-6">
            {/* Header */}
            <div className="mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 dark:text-indigo-400" />
                            WhatsApp Notification
                        </h1>
                        <p className="text-sm sm:text-base text-slate-500 dark:text-white/60 mt-1">
                            Kirim reminder otomatis ke siswa yang belum bayar
                            kas
                        </p>
                    </div>

                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-white rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.08] transition-colors shadow-xs"
                    >
                        <RefreshCw
                            className={`w-4 h-4 ${
                                loading ? 'animate-spin' : ''
                            }`}
                        />
                        Refresh
                    </button>
                </div>

                {/* API Status */}
                {apiStatus && (
                    <div
                        className={`flex items-center gap-2 p-3 rounded-lg border ${
                            apiStatus.testMode
                                ? 'bg-amber-50 dark:bg-amber-500/[0.06] border-amber-200 dark:border-amber-500/15'
                                : apiStatus.connected
                                ? 'bg-teal-50 dark:bg-teal-500/[0.06] border-teal-200 dark:border-teal-500/15'
                                : 'bg-rose-50 dark:bg-rose-500/[0.05] border-rose-200 dark:border-rose-500/15'
                        }`}
                    >
                        {apiStatus.testMode ? (
                            <>
                                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-300 flex-shrink-0" />
                                <span className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 font-medium">
                                    TEST MODE - Pesan tidak akan benar-benar
                                    dikirim
                                </span>
                            </>
                        ) : apiStatus.connected ? (
                            <>
                                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 dark:text-teal-300 flex-shrink-0" />
                                <span className="text-xs sm:text-sm text-teal-700 dark:text-teal-300">
                                    WhatsApp API Connected • Device:{' '}
                                    {apiStatus.device}
                                </span>
                            </>
                        ) : (
                            <>
                                <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 dark:text-rose-300 flex-shrink-0" />
                                <span className="text-xs sm:text-sm text-rose-700 dark:text-rose-300">
                                    WhatsApp API Tidak Terhubung - Set
                                    FONNTE_API_TOKEN di .env
                                </span>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* 🔔 Background Job Banner */}
            {activeJobs.length > 0 && (
                <div className="mb-4 sm:mb-6 space-y-3">
                    {activeJobs.map((job) => (
                        <div
                            key={job.id}
                            className={`relative overflow-hidden rounded-xl border ${
                                job.status === 'running'
                                    ? 'bg-indigo-50 dark:bg-indigo-500/[0.06] border-indigo-200 dark:border-indigo-500/20'
                                    : job.status === 'completed'
                                    ? 'bg-teal-50 dark:bg-teal-500/[0.06] border-teal-200 dark:border-teal-500/20'
                                    : 'bg-rose-50 dark:bg-rose-500/[0.05] border-rose-200 dark:border-rose-500/20'
                            }`}
                        >
                            {/* Animated shimmer bar for running jobs */}
                            {job.status === 'running' && (
                                <div className="absolute inset-0 overflow-hidden">
                                    <div
                                        className="absolute inset-y-0 left-0 bg-indigo-500/10 transition-all duration-1000 ease-out"
                                        style={{
                                            width: job.total > 0
                                                ? `${(job.progress / job.total) * 100}%`
                                                : '0%',
                                        }}
                                    />
                                    <div
                                        className="absolute inset-0"
                                        style={{
                                            background:
                                                'linear-gradient(90deg, transparent, rgba(99,102,241,0.08), transparent)',
                                            backgroundSize: '200% 100%',
                                            animation: 'shimmer 2s infinite linear',
                                        }}
                                    />
                                </div>
                            )}

                            <div className="relative p-4">
                                <div className="flex items-start gap-3">
                                    {/* Icon */}
                                    <div className="flex-shrink-0 mt-0.5">
                                        {job.status === 'running' ? (
                                            <div className="relative">
                                                <Radio className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-ping" />
                                            </div>
                                        ) : job.status === 'completed' ? (
                                            <CheckCircle className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className={`text-sm font-semibold ${
                                                job.status === 'running'
                                                    ? 'text-indigo-700 dark:text-indigo-300'
                                                    : job.status === 'completed'
                                                    ? 'text-teal-700 dark:text-teal-300'
                                                    : 'text-rose-700 dark:text-rose-300'
                                            }`}>
                                                {job.status === 'running'
                                                    ? '📡 Sedang mengirim pesan...'
                                                    : job.status === 'completed'
                                                    ? '✅ Pengiriman selesai!'
                                                    : '❌ Pengiriman gagal'}
                                            </h4>
                                            {job.meta?.type === 'event' && job.meta?.eventName && (
                                                <span className="text-xs px-2 py-0.5 bg-violet-50 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/20 rounded-full">
                                                    {job.meta.eventName}
                                                </span>
                                            )}
                                            {job.meta?.type === 'weekly' && (
                                                <span className="text-xs px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 rounded-full">
                                                    Kas Mingguan
                                                </span>
                                            )}
                                        </div>

                                        {/* Progress info */}
                                        <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500 dark:text-white/50">
                                            <span>
                                                {job.progress}/{job.total} pesan
                                            </span>
                                            {job.success > 0 && (
                                                <span className="text-teal-600 dark:text-teal-400 font-medium">
                                                    ✓ {job.success} berhasil
                                                </span>
                                            )}
                                            {job.failed > 0 && (
                                                <span className="text-rose-600 dark:text-rose-400 font-medium">
                                                    ✗ {job.failed} gagal
                                                </span>
                                            )}
                                            {job.skipped > 0 && (
                                                <span className="text-amber-600 dark:text-yellow-400 font-medium">
                                                    ↷ {job.skipped} dilewati
                                                </span>
                                            )}
                                        </div>

                                        {/* Current activity */}
                                        {job.status === 'running' && job.currentStudent && (
                                            <p className="mt-1.5 text-xs text-slate-500 dark:text-white/40 truncate">
                                                {job.currentStudent.startsWith('⏸️') || job.currentStudent.startsWith('⏳')
                                                    ? job.currentStudent
                                                    : `→ ${job.currentStudent}`}
                                            </p>
                                        )}

                                        {/* Subtitle for running */}
                                        {job.status === 'running' && (
                                            <p className="mt-2 text-xs text-slate-400 dark:text-white/30 italic">
                                                Proses berjalan di latar belakang dengan delay acak antar pesan untuk perlindungan anti-ban. Kamu bisa meninggalkan halaman ini.
                                            </p>
                                        )}

                                        {/* Progress bar */}
                                        {job.total > 0 && (
                                            <div className="mt-2.5 h-1.5 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                                        job.status === 'running'
                                                            ? 'bg-indigo-500'
                                                            : job.status === 'completed'
                                                            ? 'bg-teal-500'
                                                            : 'bg-rose-500'
                                                    }`}
                                                    style={{
                                                        width: `${(job.progress / job.total) * 100}%`,
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="bg-white dark:bg-zinc-900/60 p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200 dark:border-white/10 border-l-4 border-l-indigo-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 dark:text-white/60 text-xs sm:text-sm">
                                    Total Terkirim
                                </p>
                                <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                                    {stats.sent}
                                </p>
                            </div>
                            <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-500 dark:text-indigo-400" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900/60 p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200 dark:border-white/10 border-l-4 border-l-rose-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 dark:text-white/60 text-xs sm:text-sm">
                                    Gagal
                                </p>
                                <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                                    {stats.failed}
                                </p>
                            </div>
                            <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-rose-500 dark:text-rose-400" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900/60 p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200 dark:border-white/10 border-l-4 border-l-teal-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 dark:text-white/60 text-xs sm:text-sm">
                                    7 Hari
                                </p>
                                <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                                    {stats.last7Days}
                                </p>
                            </div>
                            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-teal-500 dark:text-teal-400" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900/60 p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200 dark:border-white/10 border-l-4 border-l-amber-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 dark:text-white/60 text-xs sm:text-sm">
                                    Perlu Reminder
                                </p>
                                <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                                    {needsReminder.length}
                                </p>
                            </div>
                            <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500 dark:text-amber-400" />
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="rounded-xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/10 mb-4 sm:mb-6 overflow-hidden shadow-sm">
                <div className="flex overflow-x-auto border-b border-slate-200 dark:border-white/10">
                    <button
                        onClick={() => setActiveTab('send')}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-3 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
                            activeTab === 'send'
                                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                                : 'text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <Send className="w-4 h-4" />
                        <span className="hidden sm:inline">
                            Kirim Individual
                        </span>
                        <span className="sm:hidden">Individual</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('group')}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-3 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
                            activeTab === 'group'
                                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                                : 'text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        <span className="hidden sm:inline">Kirim ke Grup</span>
                        <span className="sm:hidden">Grup</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('event')}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-3 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
                            activeTab === 'event'
                                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                                : 'text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <Calendar className="w-4 h-4" />
                        <span className="hidden md:inline">Reminder Event</span>
                        <span className="md:hidden">Event</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('custom')}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-3 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
                            activeTab === 'custom'
                                ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400'
                                : 'text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <MessageSquare className="w-4 h-4" />
                        <span className="hidden sm:inline">Pesan Custom</span>
                        <span className="sm:hidden">Custom</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-3 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
                            activeTab === 'history'
                                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                                : 'text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <Clock className="w-4 h-4" />
                        Riwayat
                    </button>

                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-3 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
                            activeTab === 'settings'
                                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                                : 'text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <Settings className="w-4 h-4" />
                        <span className="hidden sm:inline">Pengaturan</span>
                        <span className="sm:hidden">Setup</span>
                    </button>
                </div>

                {/* Tab Content */}
                <div className="p-3 sm:p-6">
                    {activeTab === 'send' && (
                        <div className="space-y-6">
                            {/* Configuration */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-2">
                                        Minimum Minggu Telat
                                    </label>
                                    <select
                                        value={minWeeks}
                                        onChange={(e) => {
                                            setMinWeeks(Number(e.target.value));
                                            setTimeout(loadData, 100);
                                        }}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/30 outline-none"
                                    >
                                        <option value="1">≥ 1 Minggu</option>
                                        <option value="2">≥ 2 Minggu</option>
                                        <option value="3">≥ 3 Minggu</option>
                                        <option value="4">≥ 4 Minggu</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-2">
                                        Style Pesan
                                    </label>
                                    <select
                                        value={messageCategory}
                                        onChange={(e) =>
                                            setMessageCategory(e.target.value)
                                        }
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/30 outline-none"
                                    >
                                        {categories.map((cat) => (
                                            <option
                                                key={cat.value}
                                                value={cat.value}
                                            >
                                                {cat.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                <button
                                    onClick={handlePreview}
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-white/70 border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-200 dark:hover:bg-white/[0.07] transition-colors text-sm sm:text-base font-medium"
                                >
                                    <Eye className="w-4 h-4" />
                                    Preview Pesan
                                </button>

                                <div className="flex gap-2 sm:gap-3">
                                    <button
                                        onClick={selectAll}
                                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-indigo-50 dark:bg-indigo-500/[0.06] text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/10 transition-colors text-sm sm:text-base font-medium"
                                    >
                                        Pilih Semua
                                    </button>

                                    <button
                                        onClick={deselectAll}
                                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-white/70 border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-200 dark:hover:bg-white/[0.07] transition-colors text-sm sm:text-base font-medium"
                                    >
                                        Batal
                                    </button>
                                </div>

                                <button
                                    onClick={handleSendBulk}
                                    disabled={sending || activeJobs.some(j => j.status === 'running')}
                                    className="w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base font-semibold shadow-sm"
                                >
                                    {sending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Memulai...
                                        </>
                                    ) : activeJobs.some(j => j.status === 'running') ? (
                                        <>
                                            <Radio className="w-4 h-4 animate-pulse" />
                                            Sedang Berjalan...
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="w-4 h-4" />
                                            Kirim Reminder (
                                            {selectedStudents.length ||
                                                needsReminder.length}
                                            )
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Preview Modal */}
                            {showPreview && (
                                <div className="bg-white dark:bg-zinc-900/60 p-6 rounded-xl border border-slate-200 dark:border-white/[0.1] shadow-sm">
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                            <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                            Preview Pesan
                                        </h3>
                                        <button
                                            onClick={() =>
                                                setShowPreview(false)
                                            }
                                            className="text-slate-400 dark:text-white/60 hover:text-slate-700 dark:hover:text-white"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-black/40 p-4 rounded-lg whitespace-pre-wrap font-mono text-sm border border-slate-200 dark:border-white/[0.1] text-slate-800 dark:text-white">
                                        {previewMessage}
                                    </div>
                                </div>
                            )}

                            {/* Students List */}
                            <div>
                                <h3 className="font-bold text-lg mb-3 text-slate-900 dark:text-white flex items-center gap-2">
                                    <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    Siswa yang Perlu Reminder (
                                    {needsReminder.length})
                                </h3>

                                {needsReminder.length === 0 ? (
                                    <div className="text-center py-12 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl shadow-sm">
                                        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
                                        <p className="text-slate-600 dark:text-white/60 font-medium">
                                            Semua siswa sudah bayar! 🎉
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {needsReminder.map((item) => (
                                            <div
                                                key={item.student._id}
                                                className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 transition-all ${
                                                    selectedStudents.includes(
                                                        item.student._id
                                                    )
                                                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/[0.06] shadow-sm'
                                                        : 'border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.035] hover:border-slate-300 dark:hover:border-white/20'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 sm:gap-4 flex-1 w-full">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedStudents.includes(
                                                            item.student._id
                                                        )}
                                                        onChange={() =>
                                                            toggleStudentSelection(
                                                                item.student._id
                                                            )
                                                        }
                                                        className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 rounded flex-shrink-0"
                                                    />

                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                                                            {item.student.name}
                                                            <span className="text-slate-500 dark:text-white/60 text-xs sm:text-sm ml-2">
                                                                (Absen{' '}
                                                                {
                                                                    item.student
                                                                        .absen
                                                                }
                                                                )
                                                            </span>
                                                        </p>
                                                        <p className="text-xs sm:text-sm text-slate-500 dark:text-white/60 truncate">
                                                            📱{' '}
                                                            {item.student
                                                                .phoneNumber ||
                                                                'No WA belum diset'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto">
                                                    <div className="text-left sm:text-right">
                                                        <p className="text-xs sm:text-sm text-slate-500 dark:text-white/60">
                                                            Telat{' '}
                                                            {item.weeksLate}{' '}
                                                             minggu
                                                        </p>
                                                        <p className="font-bold text-sm sm:text-base text-rose-600 dark:text-rose-400">
                                                            Rp{' '}
                                                            {item.amountOwed.toLocaleString(
                                                                'id-ID'
                                                            )}
                                                        </p>
                                                    </div>

                                                    <button
                                                        onClick={() =>
                                                            handleSendSingle(
                                                                item
                                                            )
                                                        }
                                                        disabled={
                                                            !item.student
                                                                .phoneNumber
                                                        }
                                                        className="px-3 py-1.5 sm:py-1 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-semibold flex-shrink-0"
                                                    >
                                                        Kirim
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'group' && (
                        <div className="space-y-6">
                            {/* Broadcast Laporan Kas Card */}
                            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-emerald-950/10 glass-cyber-card">
                                <div className="flex items-center gap-3.5">
                                    <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-500/20 shrink-0">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                                                Broadcast Laporan Keuangan ke WA Grup
                                            </h4>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                                Template & PDF
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 dark:text-white/60 mt-0.5">
                                            Kirim ringkasan kas realtime, saldo, perolehan, top kontributor & lampiran PDF resmi dalam 1 klik
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowFinancialReportModal(true)}
                                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white dark:text-black font-bold text-xs transition-all shadow-md shadow-emerald-500/25 shrink-0 flex items-center gap-2 active:scale-95"
                                >
                                    <Send className="w-3.5 h-3.5 text-white dark:text-black" />
                                    <span>Buka Laporan WA Grup</span>
                                </button>
                            </div>

                            <div className="bg-white dark:bg-zinc-900/60 p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                                <h3 className="font-bold text-lg mb-3 text-slate-900 dark:text-white flex items-center gap-2">
                                    <Users className="w-6 h-6 text-indigo-500" />
                                    Kirim Reminder ke Grup WhatsApp
                                </h3>
                                <p className="text-slate-600 dark:text-white/60 mb-4">
                                    Fitur ini mengirim satu pesan ke grup
                                    WhatsApp dengan <strong>mention (@)</strong>{' '}
                                    semua siswa yang belum bayar.
                                </p>
                                <div className="bg-slate-50 dark:bg-white/[0.04] p-3 rounded-lg border border-slate-200 dark:border-white/10">
                                    <p className="text-sm font-semibold text-slate-800 dark:text-white/80">
                                        <strong>Keunggulan:</strong>
                                    </p>
                                    <ul className="text-sm text-slate-600 dark:text-white/60 ml-4 mt-2 space-y-1">
                                        <li>
                                            • Hanya 1 pesan untuk semua siswa
                                        </li>
                                        <li>• Hemat kuota API</li>
                                        <li>
                                            • Semua siswa tahu siapa yang belum
                                            bayar
                                        </li>
                                        <li>
                                            • Otomatis @mention setiap nomor
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Configuration */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 rounded-lg focus:ring-2 focus:ring-indigo-500/30 outline-none"
                                    />
                                    <p className="text-xs text-slate-500 dark:text-white/60 mt-1">
                                        Format: 628xxx-xxx@g.us (lihat cara
                                        dapat Group ID di bawah)
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-2">
                                        Minimum Minggu Telat
                                    </label>
                                    <select
                                        value={minWeeks}
                                        onChange={(e) => {
                                            setMinWeeks(Number(e.target.value));
                                            setTimeout(loadData, 100);
                                        }}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500/30 outline-none"
                                    >
                                        <option value="1">≥ 1 Minggu</option>
                                        <option value="2">≥ 2 Minggu</option>
                                        <option value="3">≥ 3 Minggu</option>
                                        <option value="4">≥ 4 Minggu</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-2">
                                    Style Pesan
                                </label>
                                <select
                                    value={messageCategory}
                                    onChange={(e) =>
                                        setMessageCategory(e.target.value)
                                    }
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500/30 outline-none"
                                >
                                    {categories.map((cat) => (
                                        <option
                                            key={cat.value}
                                            value={cat.value}
                                        >
                                            {cat.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleGroupPreview}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-white/80 rounded-lg hover:bg-slate-200 dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/10 transition-colors font-medium text-sm"
                                >
                                    <Eye className="w-4 h-4" />
                                    Preview Pesan
                                </button>

                                <button
                                    onClick={handleSendToGroup}
                                    disabled={sending || !groupId.trim()}
                                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all ml-auto font-medium text-sm shadow-sm"
                                >
                                    {sending ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            Mengirim...
                                        </>
                                    ) : (
                                        <>
                                            <Users className="w-4 h-4" />
                                            Kirim ke Grup (
                                            {needsReminder.length} mention)
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Preview */}
                            {showPreview && groupPreview && (
                                <div className="bg-white dark:bg-zinc-900/60 p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                            <MessageSquare className="w-5 h-5 text-indigo-500" />
                                            Preview Pesan Grup
                                        </h3>
                                        <button
                                            onClick={() =>
                                                setShowPreview(false)
                                            }
                                            className="text-slate-400 hover:text-slate-600 dark:text-white/60 dark:hover:text-white"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-black/40 backdrop-blur-xl p-4 rounded-lg whitespace-pre-wrap font-mono text-sm border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white max-h-96 overflow-y-auto">
                                        {groupPreview}
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-white/60 mt-2">
                                        💡 Setiap @628xxx akan otomatis mention
                                        nomor tersebut di grup
                                    </p>
                                </div>
                            )}

                            {/* Cara Dapatkan Group ID */}
                            <div className="bg-indigo-50/70 dark:bg-indigo-500/[0.06] p-6 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                                <h4 className="font-bold text-indigo-950 dark:text-white mb-3">
                                    📱 Cara Mendapatkan Group ID WhatsApp
                                </h4>
                                <ol className="space-y-2 text-sm text-slate-600 dark:text-white/70">
                                    <li className="flex gap-2">
                                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                            1.
                                        </span>
                                        <div>
                                            <strong className="text-slate-800 dark:text-white">
                                                Via Fonnte Dashboard:
                                            </strong>
                                            <p className="text-slate-600 dark:text-white/60">
                                                Login ke Fonnte → Devices → Klik
                                                device Anda → Lihat daftar grup
                                            </p>
                                        </div>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                            2.
                                        </span>
                                        <div>
                                            <strong className="text-slate-800 dark:text-white">Via API Test:</strong>
                                            <pre className="bg-white dark:bg-black/40 text-emerald-700 dark:text-teal-300 border border-indigo-100 dark:border-indigo-500/20 p-2.5 rounded mt-1 text-xs overflow-x-auto font-mono">
                                                curl -X POST
                                                https://api.fonnte.com/get-devices
                                                \<br />
                                                -H "Authorization: YOUR_TOKEN"
                                            </pre>
                                        </div>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                            3.
                                        </span>
                                        <div>
                                            <strong className="text-slate-800 dark:text-white">Format Group ID:</strong>
                                            <p className="text-slate-600 dark:text-white/60">
                                                628xxxxxxxxxx-xxxxxxxxx@g.us
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-white/60 mt-1">
                                                Contoh:
                                                628123456789-1234567890@g.us
                                            </p>
                                        </div>
                                    </li>
                                </ol>
                            </div>

                            {/* Info Siswa */}
                            <div className="bg-slate-50 dark:bg-zinc-800/60 p-4 rounded-xl border border-slate-200 dark:border-white/10">
                                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                                    Siswa yang akan di-mention:{' '}
                                    {needsReminder.length}
                                </h4>
                                {needsReminder.length > 0 ? (
                                    <div className="text-sm text-slate-600 dark:text-white/60 space-y-1">
                                        {needsReminder
                                            .slice(0, 5)
                                            .map((item) => (
                                                <div key={item.student._id}>
                                                    • {item.student.name} -{' '}
                                                    {item.weeksLate} minggu (Rp{' '}
                                                    {item.amountOwed.toLocaleString(
                                                        'id-ID'
                                                    )}
                                                    )
                                                </div>
                                            ))}
                                        {needsReminder.length > 5 && (
                                            <div className="text-slate-500 dark:text-white/60 italic">
                                                ... dan{' '}
                                                {needsReminder.length - 5} siswa
                                                lainnya
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-slate-500 dark:text-white/60 italic">
                                        Tidak ada siswa yang perlu diingatkan
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'event' && (
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-zinc-900/60 p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                                <h3 className="font-bold text-lg mb-3 text-slate-900 dark:text-white flex items-center gap-2">
                                    <Calendar className="w-6 h-6 text-indigo-500" />
                                    Reminder Pembayaran Event
                                </h3>
                                <p className="text-slate-600 dark:text-white/60 mb-2">
                                    Kirim reminder khusus untuk pembayaran event
                                    (bukan kas mingguan).
                                </p>
                                <div className="bg-slate-50 dark:bg-white/[0.04] p-3 rounded-lg border border-slate-200 dark:border-white/10">
                                    <p className="text-sm font-semibold text-slate-800 dark:text-white/80">
                                        <strong>Fitur:</strong>
                                    </p>
                                    <ul className="text-sm text-slate-600 dark:text-white/60 ml-4 mt-2 space-y-1">
                                        <li>
                                            • Kirim reminder per event dengan
                                            deadline
                                        </li>
                                        <li>
                                            • Tracking progress pembayaran event
                                        </li>
                                        <li>
                                            • Pesan khusus untuk event (bukan
                                            kas rutin)
                                        </li>
                                        <li>• Kirim individual atau grup</li>
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
                                    onChange={(e) =>
                                        handleEventSelect(e.target.value)
                                    }
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500/30 outline-none"
                                >
                                    <option value="">-- Pilih Event --</option>
                                    {events.map((event) => (
                                        <option
                                            key={event._id}
                                            value={event._id}
                                        >
                                            {event.name} - Rp{' '}
                                            {event.perStudentAmount.toLocaleString(
                                                'id-ID'
                                            )}
                                            (Deadline:{' '}
                                            {new Date(
                                                event.endDate
                                            ).toLocaleDateString('id-ID')}
                                            )
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedEvent && (
                                <>
                                    {/* Event Info */}
                                    <div className="bg-white dark:bg-zinc-900/60 p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <p className="text-sm text-slate-500 dark:text-white/60">
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
                                                <p className="text-sm text-slate-500 dark:text-white/60">
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
                                                <p className="text-sm text-slate-500 dark:text-white/60">
                                                    Sudah Bayar
                                                </p>
                                                <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                                                    {
                                                        selectedEvent
                                                            .studentsPaid.length
                                                    }{' '}
                                                    siswa
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-3">
                                            <div className="flex justify-between text-sm text-slate-600 dark:text-white/60 mb-1">
                                                <span>Progress</span>
                                                <span>
                                                    {selectedEvent.studentsPaid
                                                        .length > 0
                                                        ? Math.round(
                                                              ((selectedEvent
                                                                  .studentsPaid
                                                                  .length *
                                                                  selectedEvent.perStudentAmount) /
                                                                  selectedEvent.targetAmount) *
                                                                  100
                                                           )
                                                        : 0}
                                                    %
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-white/[0.06] rounded-full h-2">
                                                <div
                                                    className="bg-teal-500 h-2 rounded-full transition-all"
                                                    style={{
                                                        width: `${
                                                            selectedEvent
                                                                .studentsPaid
                                                                .length > 0
                                                                ? Math.min(
                                                                      ((selectedEvent
                                                                          .studentsPaid
                                                                          .length *
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
                                                    onClick={() =>
                                                        setEventCategory(
                                                            cat.value
                                                        )
                                                    }
                                                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                                                        eventCategory ===
                                                        cat.value
                                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-semibold'
                                                            : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-slate-50 dark:bg-white/[0.02] text-slate-700 dark:text-white/70'
                                                    }`}
                                                >
                                                    <div className="text-sm">
                                                        {cat.label}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Unpaid Students List */}
                                    <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden">
                                        <div className="p-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
                                            <h4 className="font-semibold text-slate-900 dark:text-white">
                                                Siswa yang Belum Bayar (
                                                {eventUnpaidStudents.length})
                                            </h4>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        if (
                                                            selectedEventStudents.length ===
                                                            eventUnpaidStudents.length
                                                        ) {
                                                            setSelectedEventStudents(
                                                                []
                                                            );
                                                        } else {
                                                            setSelectedEventStudents(
                                                                eventUnpaidStudents.map(
                                                                    (s) => s._id
                                                                )
                                                            );
                                                        }
                                                    }}
                                                    className="text-sm px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.07] text-slate-700 dark:text-white/80 rounded-lg transition-colors font-medium"
                                                >
                                                    {selectedEventStudents.length ===
                                                    eventUnpaidStudents.length
                                                        ? 'Unselect All'
                                                        : 'Select All'}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            {eventUnpaidStudents.length ===
                                            0 ? (
                                                <div className="text-center py-8 text-slate-500 dark:text-white/60">
                                                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-teal-500" />
                                                    <p>
                                                        Semua siswa sudah bayar!
                                                        🎉
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                                    {eventUnpaidStudents.map(
                                                        (student) => (
                                                            <div
                                                                key={
                                                                    student._id
                                                                }
                                                                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-transparent rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.07] transition-colors"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedEventStudents.includes(
                                                                            student._id
                                                                        )}
                                                                        onChange={(
                                                                            e
                                                                        ) => {
                                                                            if (
                                                                                e
                                                                                    .target
                                                                                    .checked
                                                                            ) {
                                                                                setSelectedEventStudents(
                                                                                    [
                                                                                        ...selectedEventStudents,
                                                                                        student._id,
                                                                                    ]
                                                                                );
                                                                            } else {
                                                                                setSelectedEventStudents(
                                                                                    selectedEventStudents.filter(
                                                                                        (
                                                                                            id
                                                                                        ) =>
                                                                                            id !==
                                                                                            student._id
                                                                                    )
                                                                                );
                                                                            }
                                                                        }}
                                                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-white/20"
                                                                    />
                                                                    <div>
                                                                        <p className="font-medium text-slate-900 dark:text-white">
                                                                            {
                                                                                student.name
                                                                            }
                                                                        </p>
                                                                        <p className="text-sm text-slate-500 dark:text-white/60">
                                                                            {
                                                                                student.phoneNumber
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() =>
                                                                        handleSendEventReminder(
                                                                            student._id
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        sending
                                                                    }
                                                                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/25 disabled:opacity-50 text-xs sm:text-sm font-semibold"
                                                                >
                                                                    <Send className="w-4 h-4" />
                                                                    Kirim
                                                                </button>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    {eventUnpaidStudents.length > 0 && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <button
                                                onClick={
                                                    handlePreviewEventReminder
                                                }
                                                disabled={loading}
                                                className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.07] text-slate-700 dark:text-white/80 border border-slate-200 dark:border-white/10 rounded-xl font-medium transition-colors"
                                            >
                                                <Eye className="w-5 h-5" />
                                                Preview Pesan
                                            </button>

                                            <button
                                                onClick={handleSendEventBulk}
                                                disabled={
                                                    sending ||
                                                    activeJobs.some(j => j.status === 'running') ||
                                                    eventUnpaidStudents.length ===
                                                        0
                                                }
                                                className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 transition-colors font-medium shadow-sm"
                                            >
                                                <Send className="w-5 h-5" />
                                                {sending
                                                    ? 'Memulai...'
                                                    : activeJobs.some(j => j.status === 'running')
                                                    ? 'Sedang Berjalan...'
                                                    : selectedEventStudents.length >
                                                      0
                                                    ? `Kirim ke ${selectedEventStudents.length} Siswa`
                                                    : `Kirim ke Semua (${eventUnpaidStudents.length})`}
                                            </button>

                                            <button
                                                onClick={() =>
                                                    setShowGroupModal(true)
                                                }
                                                disabled={sending}
                                                className="flex items-center justify-center gap-2 px-4 py-3 bg-violet-50 dark:bg-violet-500/15 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20 rounded-xl hover:bg-violet-100 dark:hover:bg-violet-500/25 disabled:opacity-50 transition-colors font-medium"
                                            >
                                                <Users className="w-5 h-5" />
                                                Kirim ke Grup WA
                                            </button>
                                        </div>
                                    )}

                                    {/* Group Modal for Event */}
                                    {showGroupModal && (
                                        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 backdrop-animate">
                                            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/12 rounded-2xl modal-animate max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                                                <div className="p-6">
                                                    <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
                                                        Kirim Event Reminder ke
                                                        Grup WhatsApp
                                                    </h3>

                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-2">
                                                                Group ID
                                                                WhatsApp
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={groupId}
                                                                onChange={(e) =>
                                                                    setGroupId(
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                placeholder="628xxxxxxxxxx-xxxxxxxxx@g.us"
                                                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 rounded-lg focus:ring-2 focus:ring-indigo-500/30 outline-none"
                                                            />
                                                        </div>

                                                        <div>
                                                            <button
                                                                onClick={
                                                                    handlePreviewEventGroup
                                                                }
                                                                disabled={
                                                                    loading
                                                                }
                                                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.07] text-slate-700 dark:text-white/80 border border-slate-200 dark:border-white/10 rounded-lg font-medium text-sm"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                                Preview Pesan
                                                                Grup
                                                            </button>
                                                        </div>

                                                        {groupPreview && (
                                                            <div className="bg-slate-50 dark:bg-black/40 p-4 rounded-lg border border-slate-200 dark:border-white/10">
                                                                <p className="text-sm font-medium text-slate-700 dark:text-white/70 mb-2">
                                                                    Preview:
                                                                </p>
                                                                <pre className="text-sm whitespace-pre-wrap text-slate-800 dark:text-white font-mono">
                                                                    {
                                                                        groupPreview
                                                                    }
                                                                </pre>
                                                            </div>
                                                        )}

                                                        <div className="flex gap-3">
                                                            <button
                                                                onClick={() => {
                                                                    setShowGroupModal(
                                                                        false
                                                                    );
                                                                    setGroupPreview(
                                                                        ''
                                                                    );
                                                                }}
                                                                className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/80 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.04] font-medium"
                                                            >
                                                                Batal
                                                            </button>
                                                            <button
                                                                onClick={
                                                                    handleSendEventToGroup
                                                                }
                                                                disabled={
                                                                    sending ||
                                                                    !groupId.trim()
                                                                }
                                                                className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg disabled:opacity-50 font-medium shadow-sm"
                                                            >
                                                                {sending
                                                                    ? 'Mengirim...'
                                                                    : 'Kirim ke Grup'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Custom Message Tab */}
                    {activeTab === 'custom' && (
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                                            💌 Pesan Custom
                                        </h3>
                                        <p className="text-sm text-slate-600 dark:text-white/60">
                                            Kirim pesan kustom untuk urusan
                                            personal. Pesan akan otomatis
                                            ditambahkan informasi pembayaran di
                                            akhir.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Form */}
                            <div className="space-y-4">
                                {/* Pilih Siswa (Opsional) */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-2">
                                        Pilih Siswa (Opsional)
                                    </label>
                                    <select
                                        value={selectedStudentForCustom}
                                        onChange={(e) =>
                                            handleStudentSelectForCustom(
                                                e.target.value
                                            )
                                        }
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500/30 outline-none"
                                    >
                                        <option value="">
                                            Manual input nomor telepon
                                        </option>
                                        {students
                                            .filter((s) => s.phoneNumber)
                                            .map((student) => (
                                                <option
                                                    key={student._id}
                                                    value={student._id}
                                                >
                                                    {student.absen} -{' '}
                                                    {student.name} (
                                                    {student.phoneNumber})
                                                </option>
                                            ))}
                                    </select>
                                    <p className="text-xs text-slate-500 dark:text-white/60 mt-1">
                                        Pilih siswa untuk auto-fill nomor
                                        telepon, atau input manual di bawah
                                    </p>
                                </div>

                                {/* Nomor Telepon */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-2">
                                        Nomor Telepon
                                    </label>
                                    <input
                                        type="text"
                                        value={customPhoneNumber}
                                        onChange={(e) =>
                                            setCustomPhoneNumber(e.target.value)
                                        }
                                        placeholder="0856467458xx atau 6285646745xxx"
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 rounded-lg focus:ring-2 focus:ring-purple-500/30 outline-none"
                                    />
                                    <p className="text-xs text-slate-500 dark:text-white/60 mt-1">
                                        Format: 08xxx atau 628xxx
                                    </p>
                                </div>

                                {/* Pesan */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-2">
                                        Pesan Custom
                                    </label>
                                    <textarea
                                        value={customMessage}
                                        onChange={(e) =>
                                            setCustomMessage(e.target.value)
                                        }
                                        placeholder="Ketik pesan Anda di sini...&#10;&#10;Contoh:&#10;Halo! Mau ngingetin nih untuk bayar kas minggu ini ya. Terima kasih! 😊"
                                        rows={6}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 rounded-lg focus:ring-2 focus:ring-purple-500/30 resize-none outline-none"
                                    />
                                    <p className="text-xs text-slate-500 dark:text-white/60 mt-1">
                                        ℹ️ Informasi pembayaran akan otomatis
                                        ditambahkan di akhir pesan
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleCustomPreview}
                                        disabled={!customMessage.trim()}
                                        className="flex items-center justify-center gap-2 px-6 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.07] text-slate-700 dark:text-white/80 border border-slate-200 dark:border-white/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors"
                                    >
                                        <Eye className="w-4 h-4" />
                                        Preview
                                    </button>
                                    <button
                                        onClick={handleSendCustomMessage}
                                        disabled={
                                            sendingCustom ||
                                            !customPhoneNumber.trim() ||
                                            !customMessage.trim()
                                        }
                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-sm transition-colors"
                                    >
                                        {sendingCustom ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                Mengirim...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                Kirim Pesan
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Preview */}
                            {customPreview && (
                                <div className="bg-white dark:bg-zinc-900/60 p-5 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Eye className="w-5 h-5 text-slate-500 dark:text-white/60" />
                                        <h4 className="font-semibold text-slate-900 dark:text-white">
                                            Preview Pesan (Dengan Info
                                            Pembayaran)
                                        </h4>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-black/40 backdrop-blur-xl p-4 rounded-lg border border-slate-200 dark:border-white/10">
                                        <pre className="text-sm whitespace-pre-wrap text-slate-800 dark:text-white font-sans">
                                            {customPreview}
                                        </pre>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-white/60 mt-2">
                                        ✅ Pesan ini yang akan dikirim ke
                                        penerima
                                    </p>
                                </div>
                            )}

                            {/* Info */}
                            <div className="bg-purple-50/70 dark:bg-purple-500/[0.06] border border-purple-200/80 dark:border-purple-500/20 rounded-xl p-4">
                                <h4 className="font-semibold text-purple-950 dark:text-purple-300 mb-2">
                                    💡 Tips Penggunaan:
                                </h4>
                                <ul className="text-sm text-purple-900/80 dark:text-purple-300/80 space-y-1">
                                    <li>
                                        • Pesan bisa untuk urusan
                                        personal/individual
                                    </li>
                                    <li>
                                        • Info pembayaran otomatis ditambahkan
                                    </li>
                                    <li>
                                        • Gunakan bahasa yang sopan dan jelas
                                    </li>
                                    <li>• Preview dulu sebelum mengirim</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="space-y-3">
                            <h3 className="font-bold text-lg mb-3 text-slate-900 dark:text-white">
                                Riwayat Notifikasi
                            </h3>

                            {notifications.length === 0 ? (
                                <div className="text-center py-12 bg-white dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                                    <Clock className="w-16 h-16 text-slate-400 dark:text-white/40 mx-auto mb-3" />
                                    <p className="text-slate-500 dark:text-white/60">
                                        Belum ada notifikasi terkirim
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {notifications.slice(0, 20).map((notif) => (
                                        <div
                                            key={notif._id}
                                            className="bg-white dark:bg-zinc-900/60 p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <p className="font-semibold text-slate-900 dark:text-white">
                                                        {notif.studentId
                                                            ?.name || 'Unknown'}
                                                    </p>
                                                    <p className="text-sm text-slate-500 dark:text-white/60">
                                                        📱 {notif.phoneNumber}
                                                    </p>
                                                </div>

                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                                        notif.status === 'sent'
                                                            ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                                                            : notif.status ===
                                                              'failed'
                                                            ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/20'
                                                            : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20'
                                                    }`}
                                                >
                                                    {notif.status}
                                                </span>
                                            </div>

                                            <p className="text-sm text-slate-800 dark:text-white/90 bg-slate-50 dark:bg-black/30 p-3 rounded-lg whitespace-pre-wrap border border-slate-200 dark:border-white/10 font-mono text-xs">
                                                {notif.message}
                                            </p>

                                            <p className="text-xs text-slate-500 dark:text-white/50 mt-2">
                                                {new Date(
                                                    notif.createdAt
                                                ).toLocaleString('id-ID')}
                                                {notif.templateUsed &&
                                                    ` • Style: ${notif.templateUsed}`}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            <div className="bg-indigo-50/70 dark:bg-indigo-500/[0.04] p-6 rounded-xl border border-indigo-100 dark:border-indigo-500/15">
                                <h3 className="font-bold text-lg mb-4 text-indigo-950 dark:text-white">
                                    🚀 Cara Setup WhatsApp Bot
                                </h3>

                                <div className="space-y-3 text-sm text-slate-700 dark:text-white/70">
                                    <div>
                                        <p className="font-semibold mb-2 text-slate-900 dark:text-white">
                                            1. Daftar di Fonnte
                                        </p>
                                        <p className="ml-4">
                                            • Buka{' '}
                                            <a
                                                href="https://fonnte.com"
                                                target="_blank"
                                                className="text-indigo-600 dark:text-indigo-400 underline font-medium"
                                            >
                                                https://fonnte.com
                                            </a>
                                        </p>
                                        <p className="ml-4">
                                            • Daftar akun baru (gratis)
                                        </p>
                                        <p className="ml-4">
                                            • Login dan connect WhatsApp
                                        </p>
                                    </div>

                                    <div>
                                        <p className="font-semibold mb-2 text-slate-900 dark:text-white">
                                            2. Dapatkan API Token
                                        </p>
                                        <p className="ml-4">
                                            • Masuk ke dashboard Fonnte
                                        </p>
                                        <p className="ml-4">
                                            • Copy API Token Anda
                                        </p>
                                    </div>

                                    <div>
                                        <p className="font-semibold mb-2 text-slate-900 dark:text-white">
                                            3. Set di File .env
                                        </p>
                                        <pre className="ml-4 bg-white dark:bg-black/40 text-emerald-700 dark:text-teal-300 border border-indigo-100 dark:border-indigo-500/20 p-3 rounded-lg mt-2 font-mono text-xs overflow-x-auto">
                                            {`FONNTE_API_TOKEN=your_token_here
WA_TEST_MODE=false
AUTO_REMINDER_ENABLED=true`}
                                        </pre>
                                    </div>

                                    <div>
                                        <p className="font-semibold mb-2 text-slate-900 dark:text-white">
                                            4. Tambahkan Nomor WA Siswa
                                        </p>
                                        <p className="ml-4">
                                            • Masuk ke menu Manajemen Siswa
                                        </p>
                                        <p className="ml-4">
                                            • Edit data siswa dan tambahkan
                                            nomor WhatsApp
                                        </p>
                                        <p className="ml-4">
                                            • Format: 08xxx atau 628xxx
                                        </p>
                                    </div>

                                    <div>
                                        <p className="font-semibold mb-2 text-slate-900 dark:text-white">
                                            5. Test Mode
                                        </p>
                                        <p className="ml-4">
                                            • Set WA_TEST_MODE=true untuk
                                            testing tanpa kirim real
                                        </p>
                                        <p className="ml-4">
                                            • Pesan akan muncul di console log
                                            server
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-50/70 dark:bg-amber-500/[0.04] p-6 rounded-xl border border-amber-200/80 dark:border-amber-500/15">
                                <h3 className="font-bold text-lg mb-3 text-amber-900 dark:text-amber-300">
                                    ⏰ Auto-Reminder Schedule
                                </h3>
                                <ul className="space-y-2 text-sm text-slate-700 dark:text-white/70">
                                    <li>
                                        • <strong>Senin 07:00</strong> -
                                        Reminder ke siswa telat ≥ 1 minggu
                                    </li>
                                    <li>
                                        • <strong>Jumat 15:00</strong> -
                                        Reminder ke siswa telat ≥ 2 minggu
                                    </li>
                                    <li>
                                        • <strong>Setiap hari 10:00</strong> -
                                        Reminder urgent (≥ 4 minggu)
                                    </li>
                                </ul>
                                <p className="mt-3 text-xs text-slate-500 dark:text-white/60">
                                    * Aktifkan dengan set
                                    AUTO_REMINDER_ENABLED=true di .env
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Financial Report Broadcast Modal */}
            <SendFinancialReportModal
                isOpen={showFinancialReportModal}
                onClose={() => setShowFinancialReportModal(false)}
            />
        </div>
    );
};

export default NotificationManager;
