import React, { useMemo } from 'react';
import { CheckCircle, XCircle, MinusCircle } from 'lucide-react';

const PaymentHeatmap = ({ students, payments }) => {
    const heatmapData = useMemo(() => {
        const startDate = new Date('2025-10-27');
        const now = new Date();
        const days = Math.floor((now - startDate) / (24 * 60 * 60 * 1000));
        const currentWeek = Math.max(0, Math.ceil(days / 7) + 1);

        // Sort students by absen
        const sortedStudents = [...students]
            .filter((s) => s.status === 'Aktif')
            .sort((a, b) => a.absen - b.absen);

        // Create payment map for quick lookup
        const paymentMap = new Map();
        payments.forEach((payment) => {
            const studentId = payment.studentId?._id || payment.studentId;
            const paymentDate = new Date(payment.date);
            const daysSinceStart = Math.floor(
                (paymentDate - startDate) / (24 * 60 * 60 * 1000)
            );
            const weekNumber = Math.ceil(daysSinceStart / 7) + 1;

            if (!paymentMap.has(studentId)) {
                paymentMap.set(studentId, new Set());
            }
            paymentMap.get(studentId).add(weekNumber);
        });

        // Generate heatmap data
        const maxWeeks = Math.min(currentWeek, 12); // Show max 12 weeks
        const data = sortedStudents.map((student) => {
            const studentPayments = paymentMap.get(student._id) || new Set();
            const weeks = [];

            for (let week = 1; week <= maxWeeks; week++) {
                weeks.push({
                    week,
                    paid: studentPayments.has(week),
                });
            }

            // Calculate payment rate
            const paidCount = weeks.filter((w) => w.paid).length;
            const paymentRate = maxWeeks > 0 ? (paidCount / maxWeeks) * 100 : 0;

            return {
                student,
                weeks,
                paymentRate,
                paidCount,
                totalWeeks: maxWeeks,
            };
        });

        return { data, maxWeeks };
    }, [students, payments]);

    const getStatusColor = (paid) => {
        if (paid) return 'bg-green-500';
        return 'bg-red-200';
    };

    const getStatusIcon = (paid) => {
        if (paid) return <CheckCircle className="w-3 h-3 text-white" />;
        return <XCircle className="w-3 h-3 text-red-500" />;
    };

    const getRateColor = (rate) => {
        if (rate >= 90) return 'text-green-600 bg-green-50';
        if (rate >= 70) return 'text-blue-600 bg-blue-50';
        if (rate >= 50) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    if (heatmapData.data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-gray-500">
                <p>Tidak ada data siswa</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Legend */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-gray-700">Sudah Bayar</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-red-200 rounded flex items-center justify-center">
                        <XCircle className="w-4 h-4 text-red-500" />
                    </div>
                    <span className="text-sm text-gray-700">Belum Bayar</span>
                </div>
                <div className="sm:ml-auto text-sm text-gray-600">
                    Total: {heatmapData.data.length} siswa ×{' '}
                    {heatmapData.maxWeeks} minggu
                </div>
                <div className="text-xs text-gray-500 italic">
                    💡 Scroll horizontal untuk melihat semua minggu
                </div>
            </div>

            {/* Heatmap Table */}
            <div
                className="overflow-x-auto shadow-sm"
                style={{ WebkitOverflowScrolling: 'touch' }}
            >
                <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200 table-fixed">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        className="sticky left-0 z-20 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[200px] border-r-2 border-gray-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                                        style={{
                                            willChange: 'transform',
                                            transform: 'translateZ(0)',
                                        }}
                                    >
                                        Siswa
                                    </th>
                                    {Array.from(
                                        { length: heatmapData.maxWeeks },
                                        (_, i) => (
                                            <th
                                                key={i}
                                                className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase"
                                            >
                                                W{i + 1}
                                            </th>
                                        )
                                    )}
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                        Rate
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {heatmapData.data.map((row, rowIndex) => {
                                    const bgColor =
                                        rowIndex % 2 === 0
                                            ? 'bg-white'
                                            : 'bg-gray-50';
                                    return (
                                        <tr
                                            key={row.student._id}
                                            className={bgColor}
                                        >
                                            <td
                                                className={`sticky left-0 z-10 ${bgColor} px-4 py-3 whitespace-nowrap min-w-[200px] border-r-2 border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`}
                                                style={{
                                                    willChange: 'transform',
                                                    transform: 'translateZ(0)',
                                                    backfaceVisibility:
                                                        'hidden',
                                                }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-gray-500 font-semibold bg-gray-100 px-2 py-1 rounded min-w-[40px] text-center">
                                                        {row.student.absen}
                                                    </span>
                                                    <span
                                                        className="text-sm font-medium text-gray-900 truncate flex-1"
                                                        title={row.student.name}
                                                    >
                                                        {row.student.name}
                                                    </span>
                                                </div>
                                            </td>
                                            {row.weeks.map(
                                                (week, weekIndex) => (
                                                    <td
                                                        key={weekIndex}
                                                        className="px-2 py-3 text-center"
                                                    >
                                                        <div className="flex items-center justify-center">
                                                            <div
                                                                className={`w-6 h-6 rounded flex items-center justify-center ${getStatusColor(
                                                                    week.paid
                                                                )}`}
                                                                title={`Minggu ${
                                                                    week.week
                                                                }: ${
                                                                    week.paid
                                                                        ? 'Sudah Bayar'
                                                                        : 'Belum Bayar'
                                                                }`}
                                                            >
                                                                {getStatusIcon(
                                                                    week.paid
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                )
                                            )}
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRateColor(
                                                        row.paymentRate
                                                    )}`}
                                                >
                                                    {row.paymentRate.toFixed(0)}
                                                    %
                                                    <span className="ml-1 text-xs">
                                                        ({row.paidCount}/
                                                        {row.totalWeeks})
                                                    </span>
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Statistics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">
                        Perfect Record
                    </p>
                    <p className="text-2xl font-bold text-green-700">
                        {
                            heatmapData.data.filter(
                                (d) => d.paymentRate === 100
                            ).length
                        }
                    </p>
                    <p className="text-xs text-green-600">Siswa 100% bayar</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">
                        Good Record
                    </p>
                    <p className="text-2xl font-bold text-blue-700">
                        {
                            heatmapData.data.filter(
                                (d) =>
                                    d.paymentRate >= 70 && d.paymentRate < 100
                            ).length
                        }
                    </p>
                    <p className="text-xs text-blue-600">Siswa 70-99% bayar</p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-yellow-600 font-medium">
                        Need Improvement
                    </p>
                    <p className="text-2xl font-bold text-yellow-700">
                        {
                            heatmapData.data.filter(
                                (d) => d.paymentRate >= 50 && d.paymentRate < 70
                            ).length
                        }
                    </p>
                    <p className="text-xs text-yellow-600">
                        Siswa 50-69% bayar
                    </p>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-red-600 font-medium">Critical</p>
                    <p className="text-2xl font-bold text-red-700">
                        {
                            heatmapData.data.filter((d) => d.paymentRate < 50)
                                .length
                        }
                    </p>
                    <p className="text-xs text-red-600">Siswa &lt;50% bayar</p>
                </div>
            </div>
        </div>
    );
};

export default PaymentHeatmap;
