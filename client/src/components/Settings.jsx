import React, { useState, useEffect } from 'react';
import {
    Settings as SettingsIcon,
    Save,
    Calendar,
    DollarSign,
    RefreshCw,
} from 'lucide-react';
import { settingsAPI } from '../services/api';

const Settings = ({ onStartDateChange, currentStartDate }) => {
    const [startDate, setStartDate] = useState('');
    const [weeklyAmount, setWeeklyAmount] = useState(2000);
    const [lateThreshold, setLateThreshold] = useState(4);
    const [className, setClassName] = useState('');
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
            const [startDateRes, amountRes, thresholdRes, classNameRes] =
                await Promise.all([
                    settingsAPI.get('start_date').catch(() => null),
                    settingsAPI.get('weekly_amount').catch(() => null),
                    settingsAPI.get('late_threshold').catch(() => null),
                    settingsAPI.get('class_name').catch(() => null),
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
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 p-3 rounded-lg">
                        <SettingsIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                            Pengaturan Sistem
                        </h2>
                        <p className="text-gray-500">
                            Konfigurasi sistem kas kelas
                        </p>
                    </div>
                </div>
            </div>

            {/* Success & Error Messages */}
            {success && (
                <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                    <p className="text-green-800">{success}</p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                    <p className="text-red-800">{error}</p>
                </div>
            )}

            {/* Settings Form */}
            <form onSubmit={handleSave} className="bg-white rounded-lg shadow">
                <div className="p-6 space-y-6">
                    {/* Class Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nama Kelas
                        </label>
                        <input
                            type="text"
                            value={className}
                            onChange={(e) => setClassName(e.target.value)}
                            placeholder="Contoh: XII IPA 1"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Akan ditampilkan di header aplikasi
                        </p>
                    </div>

                    {/* Start Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Tanggal Mulai Pembayaran
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Tanggal mulai perhitungan minggu pertama
                        </p>
                    </div>

                    {/* Weekly Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <DollarSign className="w-4 h-4 inline mr-1" />
                            Jumlah Kas Per Minggu
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-600">Rp</span>
                            <input
                                type="number"
                                value={weeklyAmount}
                                onChange={(e) =>
                                    setWeeklyAmount(parseInt(e.target.value))
                                }
                                min="1000"
                                step="500"
                                required
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Jumlah uang kas yang harus dibayar setiap minggu
                        </p>
                    </div>

                    {/* Late Threshold */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Siswa akan mendapat status "TELAT" jika tunggakan ≥{' '}
                            {lateThreshold} minggu (Rp{' '}
                            {(lateThreshold * weeklyAmount).toLocaleString(
                                'id-ID'
                            )}
                            )
                        </p>
                    </div>

                    {/* Preview Section */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h3 className="font-semibold text-gray-800 mb-3">
                            Preview Perhitungan:
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">
                                    Kas per minggu:
                                </span>
                                <span className="font-semibold">
                                    Rp {weeklyAmount.toLocaleString('id-ID')}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">
                                    Kas per bulan (4 minggu):
                                </span>
                                <span className="font-semibold">
                                    Rp{' '}
                                    {(weeklyAmount * 4).toLocaleString('id-ID')}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">
                                    Batas telat:
                                </span>
                                <span className="font-semibold text-red-600">
                                    Rp{' '}
                                    {(
                                        lateThreshold * weeklyAmount
                                    ).toLocaleString('id-ID')}
                                </span>
                            </div>
                            {startDate && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
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
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between rounded-b-lg">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Reset Default
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50"
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">
                    ℹ️ Informasi Penting:
                </h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
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
