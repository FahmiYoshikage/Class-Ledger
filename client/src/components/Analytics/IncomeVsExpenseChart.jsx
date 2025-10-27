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

const IncomeVsExpenseChart = ({ payments, expenses, timeRange }) => {
    const chartData = useMemo(() => {
        const now = new Date();
        const rangeDate = new Date(
            now.getTime() - timeRange * 24 * 60 * 60 * 1000
        );

        // Group by date
        const dataMap = new Map();

        // Process payments
        payments
            .filter((p) => new Date(p.date) >= rangeDate)
            .forEach((payment) => {
                const dateKey = new Date(payment.date).toLocaleDateString(
                    'id-ID',
                    {
                        day: '2-digit',
                        month: 'short',
                    }
                );

                if (!dataMap.has(dateKey)) {
                    dataMap.set(dateKey, {
                        date: dateKey,
                        income: 0,
                        expense: 0,
                    });
                }

                dataMap.get(dateKey).income += payment.amount;
            });

        // Process expenses
        expenses
            .filter((e) => new Date(e.date) >= rangeDate)
            .forEach((expense) => {
                const dateKey = new Date(expense.date).toLocaleDateString(
                    'id-ID',
                    {
                        day: '2-digit',
                        month: 'short',
                    }
                );

                if (!dataMap.has(dateKey)) {
                    dataMap.set(dateKey, {
                        date: dateKey,
                        income: 0,
                        expense: 0,
                    });
                }

                dataMap.get(dateKey).expense += expense.amount;
            });

        // Convert to array and sort by date
        return Array.from(dataMap.values()).sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateA - dateB;
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
            return (
                <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
                    <p className="font-semibold text-gray-800 mb-2">
                        {payload[0].payload.date}
                    </p>
                    <div className="space-y-1">
                        <p className="text-sm text-green-600">
                            Pemasukan: {formatCurrency(payload[0].value)}
                        </p>
                        <p className="text-sm text-red-600">
                            Pengeluaran: {formatCurrency(payload[1].value)}
                        </p>
                        <p className="text-sm font-semibold text-gray-700 border-t pt-1">
                            Selisih:{' '}
                            {formatCurrency(
                                payload[0].value - payload[1].value
                            )}
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (chartData.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-gray-500">
                <p>Tidak ada data untuk ditampilkan</p>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                />
                <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '14px' }} iconType="line" />
                <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Pemasukan"
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6 }}
                />
                <Line
                    type="monotone"
                    dataKey="expense"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Pengeluaran"
                    dot={{ fill: '#ef4444', r: 4 }}
                    activeDot={{ r: 6 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default IncomeVsExpenseChart;
