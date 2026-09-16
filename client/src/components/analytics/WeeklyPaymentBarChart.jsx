import React, { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';

const WeeklyPaymentBarChart = ({
    payments = [],
    currentWeek = 1,
    accumulatedWeeks = 7,
    startDate = null,
    semesterStatus = 'active',
}) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const chartData = useMemo(() => {
        const activeWeek = Math.max(1, Number(currentWeek) || 1);
        const semStart = startDate ? new Date(startDate) : new Date('2025-10-27');
        semStart.setHours(0, 0, 0, 0);

        // Map for weekly collections
        const weeklyMap = new Map();

        // Initialize for all weeks up to activeWeek
        for (let i = 1; i <= activeWeek; i++) {
            weeklyMap.set(i, {
                week: `Minggu ${i}`,
                weekNumber: i,
                amount: 0,
                count: 0,
            });
        }

        // Aggregate payments
        payments.forEach((payment) => {
            let weekNumber = null;

            // 1. If payment object has an explicit week number saved
            if (payment.week && Number(payment.week) > 0) {
                weekNumber = Number(payment.week);
            } else if (payment.date) {
                // 2. Otherwise calculate from semester start date
                const paymentDate = new Date(payment.date);
                const diffTime = paymentDate.getTime() - semStart.getTime();
                const diffDays = Math.floor(diffTime / (24 * 60 * 60 * 1000));
                weekNumber = Math.max(1, Math.ceil(diffDays / 7));
            }

            if (weekNumber && weekNumber >= 1) {
                if (!weeklyMap.has(weekNumber)) {
                    weeklyMap.set(weekNumber, {
                        week: `Minggu ${weekNumber}`,
                        weekNumber,
                        amount: 0,
                        count: 0,
                    });
                }
                const entry = weeklyMap.get(weekNumber);
                entry.amount += payment.amount || 0;
                entry.count += 1;
            }
        });

        // Convert to array and sort by week number
        return Array.from(weeklyMap.values()).sort((a, b) => a.weekNumber - b.weekNumber);
    }, [payments, currentWeek, startDate]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-xl text-slate-900 dark:text-white min-w-[170px]">
                    <p className="font-bold text-slate-800 dark:text-white mb-2 text-sm">
                        {data.week}
                    </p>
                    <div className="space-y-1 text-xs">
                        <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            Total: {formatCurrency(data.amount)}
                        </p>
                        <p className="text-slate-500 dark:text-white/60">
                            Transaksi: {data.count} kali
                        </p>
                        <p className="text-slate-500 dark:text-white/60">
                            Rata-rata: {formatCurrency(data.count > 0 ? data.amount / data.count : 0)}
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    // Color gradient / shade based on amount
    const getBarColor = (amount) => {
        if (amount === 0) return isDark ? '#27272a' : '#e2e8f0';
        if (amount < 20000) return '#f59e0b';
        if (amount < 60000) return '#6366f1';
        return '#10b981';
    };

    if (chartData.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-slate-400 dark:text-white/50">
                <p>Tidak ada data pembayaran per minggu</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
                    />
                    <XAxis
                        dataKey="week"
                        tick={{ fontSize: 11, fill: isDark ? 'rgba(255,255,255,0.6)' : '#64748b' }}
                        stroke={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}
                    />
                    <YAxis
                        tick={{ fontSize: 11, fill: isDark ? 'rgba(255,255,255,0.6)' : '#64748b' }}
                        stroke={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                    <Bar
                        dataKey="amount"
                        name="Total Kas Terkumpul"
                        radius={[6, 6, 0, 0]}
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getBarColor(entry.amount)} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            {/* Legend for color indicators */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-xs text-slate-600 dark:text-white/60 pt-2">
                <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded bg-emerald-500" />
                    <span>Tinggi (&ge; Rp 60k)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded bg-indigo-500" />
                    <span>Sedang (Rp 20k - 60k)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded bg-amber-500" />
                    <span>Rendah (&lt; Rp 20k)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className={`w-3.5 h-3.5 rounded ${isDark ? 'bg-zinc-700' : 'bg-slate-300'}`} />
                    <span>Kosong</span>
                </div>
            </div>
        </div>
    );
};

export default WeeklyPaymentBarChart;
