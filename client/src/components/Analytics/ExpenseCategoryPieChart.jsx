import React, { useMemo } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

const ExpenseCategoryPieChart = ({ expenses, timeRange }) => {
    const COLORS = {
        Kebersihan: '#10b981',
        Acara: '#8b5cf6',
        Perlengkapan: '#3b82f6',
        'Lain-lain': '#f59e0b',
    };

    const chartData = useMemo(() => {
        const now = new Date();
        const rangeDate = new Date(
            now.getTime() - timeRange * 24 * 60 * 60 * 1000
        );

        // Filter and group by category
        const categoryMap = new Map();

        expenses
            .filter((e) => new Date(e.date) >= rangeDate)
            .forEach((expense) => {
                const category = expense.category;
                if (!categoryMap.has(category)) {
                    categoryMap.set(category, 0);
                }
                categoryMap.set(
                    category,
                    categoryMap.get(category) + expense.amount
                );
            });

        // Convert to array for chart
        return Array.from(categoryMap.entries()).map(([name, value]) => ({
            name,
            value,
            percentage: 0, // Will be calculated after total
        }));
    }, [expenses, timeRange]);

    // Calculate percentages
    const total = chartData.reduce((sum, item) => sum + item.value, 0);
    chartData.forEach((item) => {
        item.percentage =
            total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
    });

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
                        {data.name}
                    </p>
                    <p className="text-sm text-gray-600">
                        {formatCurrency(data.value)}
                    </p>
                    <p className="text-sm text-gray-500">
                        {data.percentage}% dari total
                    </p>
                </div>
            );
        }
        return null;
    };

    const renderCustomLabel = ({
        cx,
        cy,
        midAngle,
        innerRadius,
        outerRadius,
        percentage,
    }) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        if (percentage < 5) return null; // Don't show label for small slices

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                className="font-semibold text-sm"
            >
                {`${percentage}%`}
            </text>
        );
    };

    if (chartData.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-gray-500">
                <p>Tidak ada data pengeluaran</p>
            </div>
        );
    }

    return (
        <div>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomLabel}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[entry.name] || '#9ca3af'}
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        wrapperStyle={{ fontSize: '14px' }}
                    />
                </PieChart>
            </ResponsiveContainer>

            {/* Summary Table */}
            <div className="mt-4 space-y-2">
                {chartData.map((item) => (
                    <div
                        key={item.name}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                        <div className="flex items-center gap-2">
                            <div
                                className="w-4 h-4 rounded"
                                style={{
                                    backgroundColor:
                                        COLORS[item.name] || '#9ca3af',
                                }}
                            />
                            <span className="text-sm font-medium text-gray-700">
                                {item.name}
                            </span>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-semibold text-gray-800">
                                {formatCurrency(item.value)}
                            </p>
                            <p className="text-xs text-gray-500">
                                {item.percentage}%
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ExpenseCategoryPieChart;
