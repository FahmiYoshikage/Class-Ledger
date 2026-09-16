import React, { useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { TrendingDown, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

const DebtTrendChart = ({
    students = [],
    payments = [],
    currentWeek = 1,
    accumulatedWeeks = 7,
    startDate = null,
    weeklyAmount = 2000,
}) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const { chartData, latestMetrics } = useMemo(() => {
        const activeStudents = students.filter((s) => s.status === 'Aktif');
        const activeWeek = Math.max(1, Number(currentWeek) || 1);
        const accWeeks = Math.max(0, Number(accumulatedWeeks) || 0);

        const semStart = startDate ? new Date(startDate) : new Date('2025-10-27');
        semStart.setHours(0, 0, 0, 0);

        // Precompute payment timeline for all students
        // Sort payments ascending by date
        const sortedPayments = [...payments].sort((a, b) => new Date(a.date) - new Date(b.date));

        const weeklyData = [];

        for (let w = 1; w <= activeWeek; w++) {
            const totalCumulativeWeeks = accWeeks + w;
            const expectedPerStudent = totalCumulativeWeeks * weeklyAmount;
            const totalExpected = activeStudents.length * expectedPerStudent;

            // Cutoff date for week w: semStart + (w * 7 days)
            const weekCutoff = new Date(semStart.getTime() + w * 7 * 24 * 60 * 60 * 1000);

            // Calculate paid amount per student up to this week's cutoff
            let totalPaid = 0;
            let totalDebt = 0;
            let studentsWithDebt = 0;
            let totalSurplus = 0;

            activeStudents.forEach((student) => {
                const studentPayments = sortedPayments.filter((p) => {
                    const sId = p.studentId?._id || p.studentId || p.student?._id || p.student;
                    if (sId !== student._id) return false;
                    // Payments on or before this week cutoff
                    return new Date(p.date) <= weekCutoff;
                });

                const studentPaid = studentPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
                totalPaid += studentPaid;

                const diff = expectedPerStudent - studentPaid;
                if (diff > 0) {
                    totalDebt += diff;
                    studentsWithDebt++;
                } else if (diff < 0) {
                    totalSurplus += Math.abs(diff);
                }
            });

            const avgDebt = activeStudents.length > 0 ? totalDebt / activeStudents.length : 0;
            const collectionRate = totalExpected > 0 ? Math.min(100, (totalPaid / totalExpected) * 100) : 0;

            weeklyData.push({
                week: `M${w}`,
                weekNumber: w,
                totalDebt,
                studentsWithDebt,
                avgDebt,
                collectionRate,
                totalExpected,
                totalPaid,
                totalSurplus,
            });
        }

        // Compare latest vs previous week
        const latest = weeklyData[weeklyData.length - 1] || null;
        const previous = weeklyData.length > 1 ? weeklyData[weeklyData.length - 2] : null;

        const debtDiff = latest && previous ? latest.totalDebt - previous.totalDebt : 0;
        const isImproving = debtDiff <= 0;

        return {
            chartData: weeklyData,
            latestMetrics: {
                latest,
                debtDiff,
                isImproving,
            },
        };
    }, [students, payments, currentWeek, accumulatedWeeks, startDate, weeklyAmount]);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-xl text-slate-900 dark:text-white min-w-[200px]">
                    <p className="font-bold text-slate-800 dark:text-white mb-2 text-sm">
                        Minggu ke-{data.weekNumber}
                    </p>
                    <div className="space-y-1 text-xs">
                        <p className="text-rose-600 dark:text-rose-400 font-semibold">
                            Total Tunggakan: {formatCurrency(data.totalDebt)}
                        </p>
                        <p className="text-amber-600 dark:text-amber-400">
                            Siswa Menunggak: {data.studentsWithDebt} siswa
                        </p>
                        <p className="text-slate-500 dark:text-white/60">
                            Rata-rata: {formatCurrency(data.avgDebt)}
                        </p>
                        <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            Koleksi: {data.collectionRate.toFixed(1)}%
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (chartData.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-slate-400 dark:text-white/50">
                <p>Tidak ada data tunggakan</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Trend Indicator Banner */}
            {latestMetrics.latest && (
                <div
                    className={`p-3 sm:p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm ${
                        latestMetrics.isImproving
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                            : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-800 dark:text-rose-300'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        {latestMetrics.isImproving ? (
                            <TrendingDown className="w-5 h-5 text-emerald-500 shrink-0" />
                        ) : (
                            <TrendingUp className="w-5 h-5 text-rose-500 shrink-0" />
                        )}
                        <div>
                            <p className="font-bold">
                                {latestMetrics.isImproving
                                    ? 'Trend Positif: Tunggakan Terkendali'
                                    : 'Perhatian: Tunggakan Mengalami Kenaikan'}
                            </p>
                            <p className="text-xs opacity-80">
                                {latestMetrics.debtDiff !== 0
                                    ? `${latestMetrics.isImproving ? 'Penurunan' : 'Kenaikan'} ${formatCurrency(
                                          Math.abs(latestMetrics.debtDiff)
                                      )} dibandingkan minggu sebelumnya.`
                                    : 'Jumlah tunggakan sama seperti minggu lalu.'}
                            </p>
                        </div>
                    </div>
                    <div className="font-mono font-bold text-right self-end sm:self-auto">
                        Tingkat Koleksi: {latestMetrics.latest.collectionRate.toFixed(1)}%
                    </div>
                </div>
            )}

            {/* Area Chart */}
            <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartData} margin={{ top: 15, right: 20, left: 10, bottom: 5 }}>
                    <defs>
                        <linearGradient id="debtGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                        </linearGradient>
                    </defs>
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
                        tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                    <Area
                        type="monotone"
                        dataKey="totalDebt"
                        name="Total Tunggakan"
                        stroke="#f43f5e"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#debtGradient)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default DebtTrendChart;
