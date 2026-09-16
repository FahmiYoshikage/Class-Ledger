import React, { useState, useMemo } from 'react';
import {
    CheckCircle2,
    XCircle,
    Sparkles,
    Minus,
    Search,
    Filter,
    Calendar,
    AlertCircle,
    Info,
    TrendingUp,
    ShieldCheck,
    Layers,
    PauseCircle,
} from 'lucide-react';

const PaymentHeatmap = ({
    students = [],
    payments = [],
    currentWeek = 1,
    accumulatedWeeks = 7,
    semesterStatus = 'active',
    startDate = null,
    weeklyAmount = 2000,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'surplus', 'lunas', 'debt'
    const [viewMode, setViewMode] = useState('semester'); // 'semester' (reset on resume) or 'cumulative'

    // Format currency helper
    const formatRp = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    // Calculate per-student payment coverage and heatmap data
    const heatmapData = useMemo(() => {
        const activeStudents = [...students]
            .filter((s) => s.status === 'Aktif')
            .sort((a, b) => (a.absen || 0) - (b.absen || 0));

        // Group total payments by student ID
        const paymentTotals = new Map();
        payments.forEach((payment) => {
            const sId = payment.studentId?._id || payment.studentId || payment.student?._id || payment.student;
            if (sId) {
                paymentTotals.set(sId, (paymentTotals.get(sId) || 0) + (payment.amount || 0));
            }
        });

        const activeWeek = Math.max(1, Number(currentWeek) || 1);
        const accWeeks = Math.max(0, Number(accumulatedWeeks) || 0);
        const priorSemesterRequired = accWeeks * weeklyAmount;

        // Process each student's weeks coverage
        const studentRows = activeStudents.map((student) => {
            const totalPaid = paymentTotals.get(student._id) || 0;
            const totalWeeksPaid = Math.floor(totalPaid / weeklyAmount);

            // Active semester calculations
            const currentSemesterCredit = Math.max(0, totalPaid - priorSemesterRequired);
            const semesterWeeksPaid = Math.floor(currentSemesterCredit / weeklyAmount);

            // Prior semester debt if totalPaid doesn't even cover prior semesters
            const priorDebt = Math.max(0, priorSemesterRequired - totalPaid);
            const priorDebtWeeks = Math.ceil(priorDebt / weeklyAmount);

            // Cumulative total required vs paid
            const cumulativeWeeks = accWeeks + activeWeek;
            const cumulativeRequired = cumulativeWeeks * weeklyAmount;
            const cumulativeDebt = cumulativeRequired - totalPaid;

            // In active semester view:
            // debt = (activeWeek * weeklyAmount) - (totalPaid - priorSemesterRequired)
            // which equals cumulativeDebt!
            const debt = cumulativeDebt;
            const isSurplus = debt < 0;
            const isLunas = debt === 0;
            const isNunggak = debt > 0;

            const surplusWeeks = isSurplus ? Math.floor(Math.abs(debt) / weeklyAmount) : 0;
            const nunggakWeeks = isNunggak ? Math.ceil(debt / weeklyAmount) : 0;

            const weeksPaidInView = viewMode === 'semester' ? semesterWeeksPaid : totalWeeksPaid;
            const baseCurrentWeek = viewMode === 'semester' ? activeWeek : cumulativeWeeks;

            return {
                student,
                totalPaid,
                totalWeeksPaid,
                semesterWeeksPaid,
                priorDebt,
                priorDebtWeeks,
                debt,
                isSurplus,
                isLunas,
                isNunggak,
                surplusWeeks,
                nunggakWeeks,
                weeksPaidInView,
                baseCurrentWeek,
            };
        });

        // Determine max weeks column to display
        // Baseline is current active week. If any student has overpaid / surplus,
        // expand columns beyond currentWeek to show prepaid glowing weeks!
        const maxCoveredInView = studentRows.reduce((max, s) => {
            return Math.max(max, s.weeksPaidInView);
        }, 0);

        const currentBaseline = viewMode === 'semester'
            ? activeWeek
            : accWeeks + activeWeek;

        // Display up to maxCovered or currentBaseline, whichever is larger (at least currentBaseline)
        const displayMaxWeeks = Math.max(currentBaseline, maxCoveredInView);

        // Build individual week cell states for each student
        const processedRows = studentRows.map((row) => {
            const cells = [];
            for (let w = 1; w <= displayMaxWeeks; w++) {
                const isPastOrCurrent = w <= row.baseCurrentWeek;
                const isPaid = w <= row.weeksPaidInView;

                let cellState = 'unpaid';
                if (isPastOrCurrent) {
                    cellState = isPaid ? 'paid' : 'unpaid';
                } else {
                    // Future week beyond currentWeek
                    cellState = isPaid ? 'prepaid' : 'future';
                }

                cells.push({
                    weekNumber: w,
                    cellState,
                    isPaid,
                    isPastOrCurrent,
                    isPrepaid: cellState === 'prepaid',
                });
            }

            return {
                ...row,
                cells,
            };
        });

        return {
            rows: processedRows,
            displayMaxWeeks,
            currentBaseline,
            activeWeek,
            accWeeks,
            totalStudents: activeStudents.length,
            surplusCount: studentRows.filter((s) => s.isSurplus).length,
            lunasCount: studentRows.filter((s) => s.isLunas).length,
            nunggakCount: studentRows.filter((s) => s.isNunggak).length,
        };
    }, [students, payments, currentWeek, accumulatedWeeks, weeklyAmount, viewMode]);

    // Filter rows based on search and status filter
    const filteredRows = useMemo(() => {
        return heatmapData.rows.filter((row) => {
            const matchesSearch =
                !searchQuery.trim() ||
                row.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                String(row.student.absen).includes(searchQuery.trim());

            if (!matchesSearch) return false;

            if (statusFilter === 'surplus') return row.isSurplus;
            if (statusFilter === 'lunas') return row.isLunas;
            if (statusFilter === 'debt') return row.isNunggak;
            return true;
        });
    }, [heatmapData.rows, searchQuery, statusFilter]);

    // Cell styling helper
    const getCellClass = (cellState) => {
        switch (cellState) {
            case 'paid':
                // Lunas - Emerald Green
                return 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 shadow-sm';
            case 'unpaid':
                // Nunggak - Rose Red
                return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/25 shadow-sm';
            case 'prepaid':
                // Bayar di Depan / Surplus - Glowing Cyan / Neon Indigo
                return 'bg-cyan-500/25 text-cyan-600 dark:text-cyan-300 border border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.4)] dark:shadow-[0_0_16px_rgba(6,182,212,0.5)] ring-1 ring-cyan-400/50 animate-pulse hover:bg-cyan-500/35';
            case 'future':
            default:
                // Masa depan belum ditagih - Neutral slate dash
                return 'bg-slate-100 dark:bg-white/[0.03] text-slate-400 dark:text-white/20 border border-slate-200 dark:border-white/5';
        }
    };

    const getCellIcon = (cellState) => {
        switch (cellState) {
            case 'paid':
                return <CheckCircle2 className="w-3.5 h-3.5" />;
            case 'unpaid':
                return <XCircle className="w-3.5 h-3.5" />;
            case 'prepaid':
                return <Sparkles className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-300" />;
            case 'future':
            default:
                return <Minus className="w-3 h-3 opacity-40" />;
        }
    };

    const getCellTooltip = (row, cell) => {
        const weekStr = viewMode === 'semester'
            ? `Minggu ${cell.weekNumber} (Semester Ini)`
            : `Minggu ${cell.weekNumber} (Total Kumulatif)`;

        if (cell.cellState === 'paid') {
            return `${row.student.name} • ${weekStr}: Lunas! Kas tercakup.`;
        }
        if (cell.cellState === 'prepaid') {
            return `${row.student.name} • ${weekStr}: 🔥 BAYAR DI DEPAN! Membayar melebihi minggu berjalan.`;
        }
        if (cell.cellState === 'unpaid') {
            return `${row.student.name} • ${weekStr}: Belum Bayar (Tunggakan).`;
        }
        return `${row.student.name} • ${weekStr}: Belum berjalan (Masa depan).`;
    };

    if (heatmapData.rows.length === 0) {
        return (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 dark:text-white/60">
                <Info className="w-8 h-8 text-indigo-400 mb-2 opacity-60" />
                <p>Tidak ada data siswa aktif.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-5">
            {/* Semester Pause Alert Banner */}
            {semesterStatus === 'paused' && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 sm:p-4 flex items-center gap-3 animate-slide-down">
                    <PauseCircle className="w-5 h-5 text-amber-500 shrink-0" />
                    <div className="text-xs sm:text-sm text-amber-700 dark:text-amber-300">
                        <span className="font-bold">Semester Sedang Di-Pause:</span> Perhitungan minggu dibekukan di Minggu ke-{heatmapData.activeWeek}. Heatmap disesuaikan dengan kondisi terakhir.
                    </div>
                </div>
            )}

            {/* Quick Metrics & View Mode Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-xl bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10">
                {/* Metric Badges */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/80 shadow-sm">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                        <span>Minggu Berjalan: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{heatmapData.currentBaseline}</strong></span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 shadow-sm">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span>Lunas: <strong>{heatmapData.lunasCount}</strong></span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 text-cyan-700 dark:text-cyan-300 shadow-sm">
                        <Sparkles className="w-4 h-4 text-cyan-500" />
                        <span>Bayar di Depan: <strong>{heatmapData.surplusCount}</strong></span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 shadow-sm">
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                        <span>Nunggak: <strong>{heatmapData.nunggakCount}</strong></span>
                    </div>
                </div>

                {/* View Mode Toggle: Semester Aktif vs Kumulatif */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/80 dark:bg-zinc-900 border border-slate-300/80 dark:border-white/10 self-start lg:self-auto">
                    <button
                        onClick={() => setViewMode('semester')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            viewMode === 'semester'
                                ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-sm'
                                : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
                        }`}
                        title="Tampilkan minggu aktif semester ini (reset saat semester baru dimulai)"
                    >
                        Semester Aktif
                    </button>
                    <button
                        onClick={() => setViewMode('cumulative')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            viewMode === 'cumulative'
                                ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-sm'
                                : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
                        }`}
                        title="Tampilkan seluruh riwayat akumulasi minggu sepanjang masa"
                    >
                        Semua Semester
                    </button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/40" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari siswa atau nomor absen..."
                        className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl input-cyber-glass border border-slate-200 dark:border-white/10"
                    />
                </div>

                {/* Status Filter Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                    {[
                        { id: 'all', label: 'Semua' },
                        { id: 'surplus', label: '🔥 Bayar di Depan' },
                        { id: 'lunas', label: '✅ Lunas' },
                        { id: 'debt', label: '⚠️ Nunggak' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                                statusFilter === tab.id
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/[0.08]'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-5 p-3 rounded-xl bg-white dark:bg-zinc-950/40 border border-slate-200/80 dark:border-white/10 text-xs">
                <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded flex items-center justify-center bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-slate-600 dark:text-white/70 font-medium">Lunas</span>
                </div>

                <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded flex items-center justify-center bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/40">
                        <XCircle className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-slate-600 dark:text-white/70 font-medium">Belum Bayar (Nunggak)</span>
                </div>

                <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded flex items-center justify-center bg-cyan-500/25 text-cyan-600 dark:text-cyan-300 border border-cyan-400/60 shadow-[0_0_8px_rgba(6,182,212,0.4)] animate-pulse">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-300" />
                    </div>
                    <span className="text-cyan-600 dark:text-cyan-300 font-bold">Bayar di Depan (Melebihi Minggu Ini)</span>
                </div>

                <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded flex items-center justify-center bg-slate-100 dark:bg-white/[0.04] text-slate-400 dark:text-white/20 border border-slate-200 dark:border-white/5">
                        <Minus className="w-3 h-3" />
                    </div>
                    <span className="text-slate-500 dark:text-white/40">Belum Berjalan (Masa Depan)</span>
                </div>

                <div className="sm:ml-auto text-[11px] text-slate-500 dark:text-white/50 italic">
                    💡 Pembayaran borongan (burst) langsung meng-cover jumlah minggu yang sesuai
                </div>
            </div>

            {/* Heatmap Table */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-zinc-950/60 shadow-lg shadow-black/5 dark:shadow-black/30">
                <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02]">
                                <th className="sticky left-0 z-20 bg-slate-50 dark:bg-zinc-900/95 backdrop-blur-md px-3 sm:px-4 py-3 text-xs font-bold text-slate-700 dark:text-white/80 uppercase tracking-wider min-w-[180px] sm:min-w-[220px] border-r border-slate-200 dark:border-white/10 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)]">
                                    Siswa
                                </th>
                                {Array.from({ length: heatmapData.displayMaxWeeks }, (_, i) => {
                                    const weekNum = i + 1;
                                    const isCurrentWeek = weekNum === heatmapData.currentBaseline;
                                    const isFuture = weekNum > heatmapData.currentBaseline;
                                    return (
                                        <th
                                            key={weekNum}
                                            className={`px-1.5 py-3 text-center text-xs font-semibold whitespace-nowrap min-w-[36px] ${
                                                isCurrentWeek
                                                    ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 font-black'
                                                    : isFuture
                                                    ? 'text-cyan-600 dark:text-cyan-400/80 bg-cyan-500/[0.04]'
                                                    : 'text-slate-600 dark:text-white/60'
                                            }`}
                                            title={isCurrentWeek ? 'Minggu Berjalan Saat Ini' : isFuture ? 'Minggu Masa Depan (Surplus / Bayar Lebih Awal)' : `Minggu ke-${weekNum}`}
                                        >
                                            W{weekNum}
                                            {isCurrentWeek && (
                                                <span className="block text-[9px] font-mono text-indigo-500">NOW</span>
                                            )}
                                        </th>
                                    );
                                })}
                                <th className="px-3 py-3 text-center text-xs font-bold text-slate-700 dark:text-white/80 uppercase tracking-wider min-w-[110px]">
                                    Terbayar
                                </th>
                                <th className="px-3 py-3 text-center text-xs font-bold text-slate-700 dark:text-white/80 uppercase tracking-wider min-w-[140px]">
                                    Status Kas
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/70 dark:divide-white/[0.06]">
                            {filteredRows.map((row, rowIndex) => {
                                return (
                                    <tr
                                        key={row.student._id}
                                        className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                                    >
                                        {/* Sticky Student Info Column */}
                                        <td className="sticky left-0 z-10 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md px-3 sm:px-4 py-2.5 whitespace-nowrap min-w-[180px] sm:min-w-[220px] border-r border-slate-200 dark:border-white/10 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)]">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <span className="text-[11px] font-bold text-slate-500 dark:text-white/60 bg-slate-100 dark:bg-white/[0.06] w-6 h-6 rounded-md flex items-center justify-center shrink-0">
                                                    {row.student.absen || '-'}
                                                </span>
                                                <div className="truncate flex-1">
                                                    <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-white truncate" title={row.student.name}>
                                                        {row.student.name}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 dark:text-white/40">
                                                        Total: {formatRp(row.totalPaid)}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Heatmap Week Cells */}
                                        {row.cells.map((cell) => (
                                            <td key={cell.weekNumber} className="px-1 py-2 text-center">
                                                <div className="flex items-center justify-center">
                                                    <div
                                                        className={`w-6 h-6 rounded-md flex items-center justify-center transition-transform hover:scale-110 cursor-help ${getCellClass(
                                                            cell.cellState
                                                        )}`}
                                                        title={getCellTooltip(row, cell)}
                                                    >
                                                        {getCellIcon(cell.cellState)}
                                                    </div>
                                                </div>
                                            </td>
                                        ))}

                                        {/* Total Weeks Covered */}
                                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-white/80">
                                                {row.weeksPaidInView} Minggu
                                            </span>
                                        </td>

                                        {/* Status Badge */}
                                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                            {row.isSurplus ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                                                    <Sparkles className="w-3 h-3 text-cyan-500" />
                                                    Surplus {row.surplusWeeks} Mgg
                                                </span>
                                            ) : row.isLunas ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                    Lunas
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30">
                                                    <XCircle className="w-3 h-3 text-rose-500" />
                                                    Nunggak {row.nunggakWeeks} Mgg
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Heatmap Footer Summary */}
            <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-white/50 px-1 gap-2">
                <span>
                    Menampilkan <strong>{filteredRows.length}</strong> dari <strong>{heatmapData.totalStudents}</strong> siswa aktif
                </span>
                <span>
                    {viewMode === 'semester'
                        ? 'Mode: Semester Aktif (Menyesuaikan jeda & reset semester)'
                        : 'Mode: Kumulatif (Menghitung seluruh riwayat kas)'}
                </span>
            </div>
        </div>
    );
};

export default PaymentHeatmap;
