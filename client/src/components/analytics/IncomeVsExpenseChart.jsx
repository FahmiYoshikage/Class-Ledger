import React, { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';

const IncomeVsExpenseChart = ({ payments = [], expenses = [], timeRange = '30' }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const chartData = useMemo(() => {
        const now = new Date();
        const days = Number(timeRange) || 30;
        const rangeDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        // Group by ISO date string (YYYY-MM-DD)
        const dateMap = new Map();

        const getISODateKey = (d) => {
            const date = new Date(d);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        // Aggregate payments
        payments.forEach((payment) => {
            if (!payment.date) return;
            const pDate = new Date(payment.date);
            if (pDate >= rangeDate) {
                const key = getISODateKey(pDate);
                if (!dateMap.has(key)) {
                    dateMap.set(key, {
                        isoDate: key,
                        timestamp: new Date(key).getTime(),
                        displayDate: pDate.toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                        }),
                        income: 0,
                        expense: 0,
                    });
                }
                dateMap.get(key).income += payment.amount || 0;
            }
        });

        // Aggregate expenses
        expenses.forEach((expense) => {
            if (!expense.date) return;
            const eDate = new Date(expense.date);
            if (eDate >= rangeDate) {
                const key = getISODateKey(eDate);
                if (!dateMap.has(key)) {
                    dateMap.set(key, {
                        isoDate: key,
                        timestamp: new Date(key).getTime(),
                        displayDate: eDate.toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                        }),
                        income: 0,
                        expense: 0,
                    });
                }
                dateMap.get(key).expense += expense.amount || 0;
            }
        });

        // Sort chronologically by timestamp
        const sorted = Array.from(dateMap.values()).sort(
            (a, b) => a.timestamp - b.timestamp
        );

        // Add cumulative net calculation
        let runningNet = 0;
        return sorted.map((item) => {
            runningNet += item.income - item.expense;
            return {
                ...item,
                netBalance: runningNet,
            };
        });
    }, [payments, expenses, timeRange]);

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
            const net = (data.income || 0) - (data.expense || 0);

            return (
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-xl text-slate-900 dark:text-white min-w-[180px]">
                    <p className="font-bold text-slate-800 dark:text-white mb-2 text-sm">
                        {data.displayDate}
                    </p>
                    <div className="space-y-1 text-xs">
                        <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            Pemasukan: {formatCurrency(data.income)}
                        </p>
                        <p className="text-rose-600 dark:text-rose-400 font-semibold">
                            Pengeluaran: {formatCurrency(data.expense)}
                        </p>
                        <div className="border-t border-slate-200 dark:border-white/10 pt-1 mt-1">
                            <p
                                className={`font-bold ${
                                    net >= 0
                                        ? 'text-indigo-600 dark:text-indigo-400'
                                        : 'text-rose-600 dark:text-rose-400'
                                }`}
                            >
                                Selisih: {formatCurrency(net)}
                            </p>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (chartData.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-slate-400 dark:text-white/50">
                <p>Tidak ada transaksi dalam rentang waktu ini</p>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
                />
                <XAxis
                    dataKey="displayDate"
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
                <Line
                    type="monotone"
                    dataKey="income"
                    name="Pemasukan"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ fill: '#10b981', r: 3.5 }}
                    activeDot={{ r: 6 }}
                />
                <Line
                    type="monotone"
                    dataKey="expense"
                    name="Pengeluaran"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    dot={{ fill: '#f43f5e', r: 3.5 }}
                    activeDot={{ r: 6 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default IncomeVsExpenseChart;
