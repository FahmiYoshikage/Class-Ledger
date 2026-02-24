import React, { useState, useEffect } from 'react';
import {
    Settings as SettingsIcon,
    Save,
    Calendar,
    DollarSign,
    RefreshCw,
    Pause,
    Play,
    BookOpen,
} from 'lucide-react';
import { settingsAPI } from '../services/api';

const Settings = ({ onStartDateChange, currentStartDate, onWeekChange }) => {
    const [startDate, setStartDate] = useState('');
    const [weeklyAmount, setWeeklyAmount] = useState(2000);
    const [lateThreshold, setLateThreshold] = useState(4);
    const [className, setClassName] = useState('');
    const [semesterStatus, setSemesterStatus] = useState('active');
    const [semesterName, setSemesterName] = useState('');
    const [pausedWeek, setPausedWeek] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    useEffect(() => {
        if (currentStartDate) {
            setStartDate(formatDateForInput(currentStartDate));
        }
    }, [currentStartDate]);

    const formatDateForInput = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const loadSettings = async () => {
        setLoading(true);
        try {
            // Load all settings
            const [
                startDateRes,
                amountRes,
                thresholdRes,
                classNameRes,
                semesterStatusRes,
                semesterNameRes,
                pausedWeekRes,
            ] = await Promise.all([
                settingsAPI.get('start_date').catch(() => null),
                settingsAPI.get('weekly_amount').catch(() => null),
                settingsAPI.get('late_threshold').catch(() => null),
                settingsAPI.get('class_name').catch(() => null),
                settingsAPI.get('semester_status').catch(() => null),
                settingsAPI.get('semester_name').catch(() => null),
                settingsAPI.get('paused_week').catch(() => null),
            ]);

            if (startDateRes?.data?.value) {
                setStartDate(formatDateForInput(startDateRes.data.value));
            }
            if (amountRes?.data?.value) {
                setWeeklyAmount(amountRes.data.value);
            }
            if (thresholdRes?.data?.value) {
                setLateThreshold(thresholdRes.data.value);
            }
            if (classNameRes?.data?.value) {
                setClassName(classNameRes.data.value);
            }
            if (semesterStatusRes?.data?.value) {
                setSemesterStatus(semesterStatusRes.data.value);
            }
            if (semesterNameRes?.data?.value) {
                setSemesterName(semesterNameRes.data.value);
            }
            if (pausedWeekRes?.data?.value) {
                setPausedWeek(pausedWeekRes.data.value);
            }
        } catch (err) {
            console.log('Using default settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Save all settings
            await Promise.all([
                settingsAPI.set('start_date', startDate),
                settingsAPI.set('weekly_amount', weeklyAmount),
                settingsAPI.set('late_threshold', lateThreshold),
                settingsAPI.set('class_name', className),
                settingsAPI.set('semester_name', semesterName),
            ]);

            // Notify parent component about start date change
            if (onStartDateChange) {
                onStartDateChange(new Date(startDate));
            }

            setSuccess('✅ Pengaturan berhasil disimpan!');

            // Auto hide success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('❌ Gagal menyimpan pengaturan: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePauseSemester = async () => {
        if (
            !confirm(
                '⏸️ Pause semester?\n\nSistem akan berhenti menghitung tunggakan dan mengirim reminder otomatis.\n\nWeek counter akan di-freeze untuk dilanjutkan nanti.'
            )
        ) {
            return;
        }

        setLoading(true);
        try {
            // Calculate current week before pausing
            const response = await fetch(
                `${
                    import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
                }/settings/current-week`
            );
            const data = await response.json();
            const currentWeek = data.currentWeek || 1;

            await Promise.all([
                settingsAPI.set('semester_status', 'paused'),
                settingsAPI.set('paused_week', currentWeek),
                settingsAPI.set('paused_at', new Date().toISOString()),
            ]);

            setSemesterStatus('paused');
            setPausedWeek(currentWeek);
            setSuccess(
                '⏸️ Semester berhasil di-pause! System freeze di Week ' +
                    currentWeek
            );
            setTimeout(() => setSuccess(''), 5000);

            // Notify parent to refresh current week
            if (onWeekChange) {
                onWeekChange();
            }

            // Reload to refresh all data
            setTimeout(() => window.location.reload(), 2000);
        } catch (err) {
            setError('❌ Gagal pause semester: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResumeSemester = async () => {
        const newSemesterName = prompt(
            '📚 Mulai Semester Baru\n\nMasukkan nama semester:',
            semesterName || 'Semester 1 2024/2025'
        );

        if (!newSemesterName) {
            return;
        }

        if (
            !confirm(
                `▶️ Resume dengan semester baru: "${newSemesterName}"?\n\n✅ Week counter akan reset ke Week 1\n✅ Tunggakan siswa tetap dipertahankan (carry over)\n✅ Payment history tetap tersimpan\n✅ Leaderboard akumulasi sepanjang tahun\n✅ Auto-reminder akan aktif kembali`
            )
        ) {
            return;
        }

        setLoading(true);
        try {
            // Set new start date to today (new semester starts now)
            const today = formatDateForInput(new Date());

            // Calculate accumulated weeks: previous accumulated + paused week (from current semester)
            // This carries over the total weeks from all previous semesters
            // Default to 7 = semester 1 had 7 weeks (hardcoded initial carry-over)
            let prevAccumulated = 7;
            try {
                const accRes = await settingsAPI.get('accumulated_weeks');
                if (accRes?.data?.value != null) {
                    prevAccumulated = parseInt(accRes.data.value);
                }
            } catch (e) {
                // No accumulated_weeks in DB yet, use hardcoded default
            }
            const newAccumulatedWeeks = prevAccumulated + (pausedWeek || 0);

            await Promise.all([
                settingsAPI.set('semester_status', 'active'),
                settingsAPI.set('semester_name', newSemesterName),
                settingsAPI.set('start_date', today), // Reset week calculation
                settingsAPI.set('resumed_at', new Date().toISOString()),
                settingsAPI.set('accumulated_weeks', newAccumulatedWeeks), // Carry over total weeks
                settingsAPI.set('paused_week', null), // Clear paused week
            ]);

            setSemesterStatus('active');
            setSemesterName(newSemesterName);
            setStartDate(today);
            setPausedWeek(null);
            setSuccess(
                `▶️ Semester "${newSemesterName}" dimulai! Week counter reset ke Week 1`
            );
            setTimeout(() => setSuccess(''), 5000);

            // Notify parent to refresh current week
            if (onWeekChange) {
                onWeekChange();
            }

            // Notify parent and reload
            if (onStartDateChange) {
                onStartDateChange(new Date(today));
            }

            setTimeout(() => window.location.reload(), 2000);
        } catch (err) {
            setError('❌ Gagal resume semester: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        if (window.confirm('Reset ke pengaturan default?')) {
            setStartDate('2025-10-27');
            setWeeklyAmount(2000);
            setLateThreshold(4);
            setClassName('');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="rounded-xl bg-white/[0.035] border border-white/[0.1] p-6">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-500 p-3 rounded-xl">
                        <SettingsIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            Pengaturan Sistem
                        </h2>
                        <p className="text-white/60">
                            Konfigurasi sistem kas kelas
                        </p>
                    </div>
                </div>
            </div>

            {/* Success & Error Messages */}
            {success && (
                <div className="bg-blue-500/[0.06]0/[0.06] border-l-4 border-green-400 p-4 rounded">
                    <p className="text-blue-400">{success}</p>
                </div>
            )}

            {error && (
                <div className="bg-rose-500/[0.06] border-l-4 border-red-400 p-4 rounded">
                    <p className="text-rose-400">{error}</p>
                </div>
            )}

            {/* Settings Form */}
            <form onSubmit={handleSave} className="rounded-xl bg-white/[0.035] border border-white/[0.1]">
                <div className="p-6 space-y-6">
                    {/* Class Name */}
                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-2">
                            Nama Kelas
                        </label>
                        <input
                            type="text"
                            value={className}
                            onChange={(e) => setClassName(e.target.value)}
                            placeholder="Contoh: XII IPA 1"
                            className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition-all duration-200 text-white"
                        />
                        <p className="text-xs text-white/60 mt-1">
                            Akan ditampilkan di header aplikasi
                        </p>
                    </div>

                    {/* Semester Control Section */}
                    <div className="border-t border-white/[0.12] pt-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            Kontrol Semester
                        </h3>

                        {/* Semester Name */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-white/60 mb-2">
                                Nama Semester
                            </label>
                            <input
                                type="text"
                                value={semesterName}
                                onChange={(e) =>
                                    setSemesterName(e.target.value)
                                }
                                placeholder="Contoh: Semester 1 2024/2025"
                                className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition-all duration-200 text-white"
                            />
                            <p className="text-xs text-white/60 mt-1">
                                Nama semester yang sedang berjalan
                            </p>
                        </div>

                        {/* Status Indicator */}
                        <div
                            className={`p-4 rounded-lg mb-4 ${
                                semesterStatus === 'active'
                                    ? 'bg-blue-500/[0.06]0/[0.06] border border-green-200'
                                    : 'bg-amber-500/[0.06]0/[0.06] border border-yellow-200'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {semesterStatus === 'active' ? (
                                        <>
                                            <Play className="w-6 h-6 text-blue-400" />
                                            <div>
                                                <p className="font-semibold text-green-900">
                                                    Semester Aktif
                                                </p>
                                                <p className="text-sm text-blue-400">
                                                    Sistem berjalan normal, week
                                                    counter aktif
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <Pause className="w-6 h-6 text-amber-400" />
                                            <div>
                                                <p className="font-semibold text-yellow-900">
                                                    Semester Di-Pause (LIBUR)
                                                </p>
                                                <p className="text-sm text-amber-400">
                                                    Week counter freeze di Week{' '}
                                                    {pausedWeek}, auto-reminder
                                                    off
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            {semesterStatus === 'active' ? (
                                <button
                                    type="button"
                                    onClick={handlePauseSemester}
                                    disabled={loading}
                                    className="flex-1 px-4 py-3 bg-amber-500/[0.06]0/15 text-amber-400 border border-amber-500/20 rounded-lg hover:bg-amber-500/[0.06]0/25 transition flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                                >
                                    <Pause className="w-5 h-5" />
                                    Pause Semester (Mulai Libur)
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResumeSemester}
                                    disabled={loading}
                                    className="flex-1 px-4 py-3 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/25 transition flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                                >
                                    <Play className="w-5 h-5" />
                                    Resume Semester Baru
                                </button>
                            )}
                        </div>

                        {/* Info Box for Semester */}
                        <div className="mt-4 bg-blue-500/[0.06]0/[0.06] border border-blue-200 rounded-lg p-3">
                            <p className="text-xs text-blue-500 font-medium mb-2">
                                ℹ️ Cara Kerja Semester Control:
                            </p>
                            <ul className="text-xs text-blue-500 space-y-1 list-disc list-inside">
                                <li>
                                    <strong>Pause:</strong> Freeze week counter,
                                    disable auto-reminder, siswa tidak dapat
                                    tunggakan baru
                                </li>
                                <li>
                                    <strong>Resume:</strong> Week reset ke 1,
                                    tunggakan lama tetap ada, payment history
                                    tersimpan
                                </li>
                                <li>
                                    <strong>Leaderboard:</strong> Tetap
                                    akumulasi sepanjang tahun (tidak reset)
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Start Date */}
                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-2">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Tanggal Mulai Pembayaran
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition-all duration-200 text-white"
                        />
                        <p className="text-xs text-white/60 mt-1">
                            Tanggal mulai perhitungan minggu pertama
                        </p>
                    </div>

                    {/* Weekly Amount */}
                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-2">
                            <DollarSign className="w-4 h-4 inline mr-1" />
                            Jumlah Kas Per Minggu
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="text-white/60">Rp</span>
                            <input
                                type="number"
                                value={weeklyAmount}
                                onChange={(e) =>
                                    setWeeklyAmount(parseInt(e.target.value))
                                }
                                min="1000"
                                step="500"
                                required
                                className="flex-1 px-4 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition-all duration-200 text-white"
                            />
                        </div>
                        <p className="text-xs text-white/60 mt-1">
                            Jumlah uang kas yang harus dibayar setiap minggu
                        </p>
                    </div>

                    {/* Late Threshold */}
                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-2">
                            Batas Keterlambatan (Minggu)
                        </label>
                        <input
                            type="number"
                            value={lateThreshold}
                            onChange={(e) =>
                                setLateThreshold(parseInt(e.target.value))
                            }
                            min="1"
                            max="12"
                            required
                            className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition-all duration-200 text-white"
                        />
                        <p className="text-xs text-white/60 mt-1">
                            Siswa akan mendapat status "TELAT" jika tunggakan ≥{' '}
                            {lateThreshold} minggu (Rp{' '}
                            {(lateThreshold * weeklyAmount).toLocaleString(
                                'id-ID'
                            )}
                            )
                        </p>
                    </div>

                    {/* Preview Section */}
                    <div className="bg-white/[0.04] p-4 rounded-lg border border-white/[0.1] bg-white/[0.04] text-white">
                        <h3 className="font-semibold text-white mb-3">
                            Preview Perhitungan:
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-white/60">
                                    Kas per minggu:
                                </span>
                                <span className="font-semibold">
                                    Rp {weeklyAmount.toLocaleString('id-ID')}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/60">
                                    Kas per bulan (4 minggu):
                                </span>
                                <span className="font-semibold">
                                    Rp{' '}
                                    {(weeklyAmount * 4).toLocaleString('id-ID')}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/60">
                                    Batas telat:
                                </span>
                                <span className="font-semibold text-rose-400">
                                    Rp{' '}
                                    {(
                                        lateThreshold * weeklyAmount
                                    ).toLocaleString('id-ID')}
                                </span>
                            </div>
                            {startDate && (
                                <div className="flex justify-between">
                                    <span className="text-white/60">
                                        Tanggal mulai:
                                    </span>
                                    <span className="font-semibold">
                                        {new Date(startDate).toLocaleDateString(
                                            'id-ID',
                                            {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            }
                                        )}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="px-6 py-4 bg-white/[0.04] border-t border-white/[0.12] flex justify-between rounded-b-lg">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-4 py-2 text-white/60 rounded-xl bg-white/[0.035] border border-white/[0.1] hover:bg-white/[0.04] transition flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Reset Default
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-500/[0.06]0 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Simpan Pengaturan
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Info Box */}
            <div className="bg-blue-500/[0.06]0/[0.06] border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">
                    ℹ️ Informasi Penting:
                </h4>
                <ul className="text-sm text-blue-500 space-y-1 list-disc list-inside">
                    <li>
                        Perubahan tanggal mulai akan mempengaruhi perhitungan
                        tunggakan semua siswa
                    </li>
                    <li>
                        Jumlah kas per minggu akan digunakan untuk perhitungan
                        otomatis
                    </li>
                    <li>
                        Batas keterlambatan menentukan kapan status "TELAT"
                        muncul
                    </li>
                    <li>
                        Refresh halaman setelah menyimpan untuk melihat
                        perubahan
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default Settings;
