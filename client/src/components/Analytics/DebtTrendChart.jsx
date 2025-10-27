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
    Area,
    AreaChart,
} from 'recharts';

const DebtTrendChart = ({ students, payments }) => {
    const chartData = useMemo(() => {
        const startDate = new Date('2025-10-27');
        const now = new Date();
        const days = Math.floor((now - startDate) / (24 * 60 * 60 * 1000));
        const currentWeek = Math.max(0, Math.ceil(days / 7) + 1);

        const activeStudents = students.filter((s) => s.status === 'Aktif');
        const maxWeeks = Math.min(currentWeek, 12);

        const weeklyData = [];

        // Calculate debt for each week
        for (let week = 1; week <= maxWeeks; week++) {
            let totalDebt = 0;
            let studentsWithDebt = 0;
            let totalExpected = 0;
            let totalPaid = 0;

            activeStudents.forEach((student) => {
                // Calculate expected payment up to this week
                const expectedAmount = week * 2000;
                totalExpected += expectedAmount;

                // Calculate total paid up to this week
                const studentPayments = payments.filter((p) => {
                    const studentId = p.studentId?._id || p.studentId;
                    const paymentDate = new Date(p.date);
                    const daysSinceStart = Math.floor(
                        (paymentDate - startDate) / (24 * 60 * 60 * 1000)
                    );
                    const paymentWeek = Math.ceil(daysSinceStart / 7) + 1;

                    return studentId === student._id && paymentWeek <= week;
                });

                const paidAmount = studentPayments.reduce(
                    (sum, p) => sum + p.amount,
                    0
                );
                totalPaid += paidAmount;

                const debt = expectedAmount - paidAmount;
                if (debt > 0) {
                    totalDebt += debt;
                    studentsWithDebt++;
                }
            });

            const avgDebt =
                activeStudents.length > 0
                    ? totalDebt / activeStudents.length
                    : 0;
            const collectionRate =
                totalExpected > 0 ? (totalPaid / totalExpected) * 100 : 0;

            weeklyData.push({
                week: `M${week}`,
                weekNumber: week,
                totalDebt,
                studentsWithDebt,
                avgDebt,
                collectionRate,
                totalExpected,
                totalPaid,
            });
        }

        return weeklyData;
    }, [students, payments]);

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
                        Minggu {data.weekNumber}
                    </p>
                    <div className="space-y-1">
                        <p className="text-sm text-red-600">
                            Total Tunggakan: {formatCurrency(data.totalDebt)}
                        </p>
                        <p className="text-sm text-orange-600">
                            Siswa Menunggak: {data.studentsWithDebt} siswa
                        </p>
                        <p className="text-sm text-yellow-600">
                            Rata-rata Tunggakan: {formatCurrency(data.avgDebt)}
                        </p>
                        <p className="text-sm text-green-600">
                            Tingkat Koleksi: {data.collectionRate.toFixed(1)}%
                        </p>
                        <div className="border-t pt-2 mt-2">
                            <p className="text-xs text-gray-600">
                                Target: {formatCurrency(data.totalExpected)}
                            </p>
                            <p className="text-xs text-gray-600">
                                Terkumpul: {formatCurrency(data.totalPaid)}
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
            <div className="h-64 flex items-center justify-center text-gray-500">
                <p>Tidak ada data tunggakan</p>
            </div>
        );
    }

    // Calculate trend
    const latestDebt = chartData[chartData.length - 1].totalDebt;
    const previousDebt =
        chartData.length > 1 ? chartData[chartData.length - 2].totalDebt : 0;
    const debtChange = latestDebt - previousDebt;
    const isImproving = debtChange <= 0;

    return (
        <div className="space-y-4">
            {/* Trend Indicator */}
            <div
                className={`p-4 rounded-lg ${
                    isImproving
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                }`}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p
                            className={`text-sm font-medium ${
                                isImproving ? 'text-green-700' : 'text-red-700'
                            }`}
                        >
                            {isImproving
                                ? '📉 Trend Membaik'
                                : '📈 Trend Memburuk'}
                        </p>
                        <p
                            className={`text-xs mt-1 ${
                                isImproving ? 'text-green-600' : 'text-red-600'
                            }`}
                        >
                            {isImproving
                                ? 'Tunggakan berkurang dari minggu lalu'
                                : 'Tunggakan bertambah dari minggu lalu'}
                        </p>
                    </div>
                    <div className="text-right">
                        <p
                            className={`text-2xl font-bold ${
                                isImproving ? 'text-green-700' : 'text-red-700'
                            }`}
                        >
                            {debtChange >= 0 ? '+' : ''}
                            {formatCurrency(debtChange)}
                        </p>
                        <p className="text-xs text-gray-600">
                            Perubahan minggu ini
                        </p>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={350}>
                <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient
                            id="colorDebt"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="5%"
                                stopColor="#ef4444"
                                stopOpacity={0.8}
                            />
                            <stop
                                offset="95%"
                                stopColor="#ef4444"
                                stopOpacity={0}
                            />
                        </linearGradient>
                    </defs>
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
                    <Area
                        type="monotone"
                        dataKey="totalDebt"
                        stroke="#ef4444"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorDebt)"
                        name="Total Tunggakan"
                    />
                </AreaChart>
            </ResponsiveContainer>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">
                        Tunggakan Tertinggi
                    </p>
                    <p className="text-xl font-bold text-red-600">
                        {formatCurrency(
                            Math.max(...chartData.map((d) => d.totalDebt))
                        )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        Minggu{' '}
                        {
                            chartData.find(
                                (d) =>
                                    d.totalDebt ===
                                    Math.max(
                                        ...chartData.map((x) => x.totalDebt)
                                    )
                            )?.weekNumber
                        }
                    </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">
                        Rata-rata Tunggakan/Siswa
                    </p>
                    <p className="text-xl font-bold text-orange-600">
                        {formatCurrency(
                            chartData.length > 0
                                ? chartData.reduce(
                                      (sum, d) => sum + d.avgDebt,
                                      0
                                  ) / chartData.length
                                : 0
                        )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        Seluruh periode
                    </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">
                        Tingkat Koleksi Rata-rata
                    </p>
                    <p className="text-xl font-bold text-green-600">
                        {chartData.length > 0
                            ? (
                                  chartData.reduce(
                                      (sum, d) => sum + d.collectionRate,
                                      0
                                  ) / chartData.length
                              ).toFixed(1)
                            : 0}
                        %
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        Target vs Terkumpul
                    </p>
                </div>
            </div>

            {/* Insights */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-2">
                    💡 Insight & Rekomendasi
                </p>
                <ul className="text-sm text-blue-800 space-y-1">
                    {chartData[chartData.length - 1].collectionRate < 70 && (
                        <li>
                            • Tingkat koleksi di bawah 70%, pertimbangkan kirim
                            reminder lebih sering
                        </li>
                    )}
                    {chartData[chartData.length - 1].studentsWithDebt >
                        students.length * 0.5 && (
                        <li>
                            • Lebih dari 50% siswa menunggak, pertimbangkan
                            sistem reward untuk yang rajin bayar
                        </li>
                    )}
                    {isImproving && (
                        <li>
                            • Trend positif! Pertahankan strategi pengumpulan
                            kas saat ini
                        </li>
                    )}
                    {!isImproving && debtChange > 5000 && (
                        <li>
                            • Tunggakan meningkat signifikan, segera lakukan
                            penagihan intensif
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default DebtTrendChart;
