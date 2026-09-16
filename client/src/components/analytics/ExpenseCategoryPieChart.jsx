import React, { useMemo } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';

const PALETTE = [
    '#6366f1', // Indigo
    '#10b981', // Emerald
    '#f43f5e', // Rose
    '#f59e0b', // Amber
    '#06b6d4', // Cyan
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#14b8a6', // Teal
    '#3b82f6', // Blue
    '#f97316', // Orange
];

const ExpenseCategoryPieChart = ({ expenses = [], timeRange = '30' }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const chartData = useMemo(() => {
        const now = new Date();
        const days = Number(timeRange) || 30;
        const rangeDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        // Filter and group by category
        const categoryMap = new Map();

        expenses.forEach((expense) => {
            if (!expense.date) return;
            const expDate = new Date(expense.date);
            if (expDate >= rangeDate) {
                const category = expense.category || 'Lain-lain';
                if (!categoryMap.has(category)) {
                    categoryMap.set(category, {
                        name: category,
                        value: 0,
                        count: 0,
                    });
                }
                const entry = categoryMap.get(category);
                entry.value += expense.amount || 0;
                entry.count += 1;
            }
        });

        const list = Array.from(categoryMap.values()).sort((a, b) => b.value - a.value);
        const total = list.reduce((sum, item) => sum + item.value, 0);

        return list.map((item, idx) => ({
            ...item,
            color: PALETTE[idx % PALETTE.length],
            percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : '0',
        }));
    }, [expenses, timeRange]);

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
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-xl text-slate-900 dark:text-white min-w-[160px]">
                    <div className="flex items-center gap-2 mb-1.5">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: data.color }}
                        />
                        <p className="font-bold text-slate-800 dark:text-white text-sm">
                            {data.name}
                        </p>
                    </div>
                    <div className="space-y-1 text-xs">
                        <p className="text-slate-600 dark:text-white/80 font-semibold">
                            {formatCurrency(data.value)}
                        </p>
                        <p className="text-indigo-600 dark:text-indigo-400 font-bold">
                            {data.percentage}% dari total pengeluaran
                        </p>
                        <p className="text-slate-400 dark:text-white/50">
                            {data.count} transaksi
                        </p>
                    </div>
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

        if (Number(percentage) < 6) return null; // Don't crowd small slices

        return (
            <text
                x={x}
                y={y}
                fill="#ffffff"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                className="font-bold text-xs pointer-events-none drop-shadow-md"
            >
                {`${percentage}%`}
            </text>
        );
    };

    if (chartData.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-slate-400 dark:text-white/50">
                <p>Tidak ada pengeluaran dalam periode ini</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <ResponsiveContainer width="100%" height={290}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomLabel}
                        outerRadius={95}
                        innerRadius={42}
                        paddingAngle={3}
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        verticalAlign="bottom"
                        wrapperStyle={{
                            fontSize: '12px',
                            paddingTop: '8px',
                            color: isDark ? 'rgba(255,255,255,0.7)' : '#475569',
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ExpenseCategoryPieChart;
