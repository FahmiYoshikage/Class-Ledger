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

const WeeklyPaymentBarChart = ({ payments }) => {
    const chartData = useMemo(() => {
        const startDate = new Date('2025-10-27');
        const now = new Date();
        const days = Math.floor((now - startDate) / (24 * 60 * 60 * 1000));
        const currentWeek = Math.max(0, Math.ceil(days / 7) + 1);

        // Create map for weekly data
        const weeklyMap = new Map();

        // Initialize weeks
        for (let i = 1; i <= Math.min(currentWeek, 12); i++) {
            weeklyMap.set(i, {
                week: `Minggu ${i}`,
                weekNumber: i,
                amount: 0,
                count: 0,
            });
        }

        // Aggregate payments by week
        payments.forEach((payment) => {
            const paymentDate = new Date(payment.date);
            const daysSinceStart = Math.floor(
                (paymentDate - startDate) / (24 * 60 * 60 * 1000)
            );
            const weekNumber = Math.ceil(daysSinceStart / 7) + 1;

            if (
                weekNumber >= 1 &&
                weekNumber <= currentWeek &&
                weekNumber <= 12
            ) {
                const weekData = weeklyMap.get(weekNumber);
                weekData.amount += payment.amount;
                weekData.count += 1;
            }
        });

        return Array.from(weeklyMap.values());
    }, [payments]);

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
                <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
                    <p className="font-semibold text-gray-800 mb-2">
                        {data.week}
                    </p>
                    <div className="space-y-1">
                        <p className="text-sm text-indigo-600">
                            Total: {formatCurrency(data.amount)}
                        </p>
                        <p className="text-sm text-gray-600">
                            Transaksi: {data.count}
                        </p>
                        <p className="text-sm text-gray-500">
                            Rata-rata:{' '}
                            {formatCurrency(
                                data.count > 0 ? data.amount / data.count : 0
                            )}
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    // Color based on amount
    const getBarColor = (amount) => {
        if (amount === 0) return '#e5e7eb';
        if (amount < 30000) return '#fbbf24';
        if (amount < 50000) return '#60a5fa';
        return '#10b981';
    };

    if (chartData.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-gray-500">
                <p>Tidak ada data pembayaran</p>
            </div>
        );
    }

    return (
        <div>
            <ResponsiveContainer width="100%" height={350}>
                <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis
                        dataKey="week"
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                    />
                    <YAxis
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                        tickFormatter={(value) =>
                            `${(value / 1000).toFixed(0)}k`
                        }
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '14px' }} />
                    <Bar
                        dataKey="amount"
                        name="Total Pembayaran"
                        radius={[8, 8, 0, 0]}
                    >
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={getBarColor(entry.amount)}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            {/* Legend for colors */}
            <div className="flex items-center justify-center gap-4 mt-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gray-300" />
                    <span className="text-gray-600">Tidak ada</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-400" />
                    <span className="text-gray-600">&lt; 30k</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-400" />
                    <span className="text-gray-600">30k - 50k</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-500" />
                    <span className="text-gray-600">&gt; 50k</span>
                </div>
            </div>
        </div>
    );
};

export default WeeklyPaymentBarChart;
