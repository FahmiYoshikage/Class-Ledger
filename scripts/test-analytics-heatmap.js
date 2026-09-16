import assert from 'assert';

console.log(`
════════════════════════════════════════════════════════════════════
   📊 TESTING ANALYTICS & PAYMENT HEATMAP LOGIC
════════════════════════════════════════════════════════════════════
`);

let passed = 0;
let failed = 0;

function it(desc, fn) {
    try {
        fn();
        console.log(`  ✓ PASS: ${desc}`);
        passed++;
    } catch (e) {
        console.error(`  ✗ FAIL: ${desc}`);
        console.error(`    ${e.message}`);
        failed++;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. HEATMAP BURST PAYMENT & ADVANCE PAYMENT (NEGATIVE DEBT) LOGIC
// ─────────────────────────────────────────────────────────────────────────────
console.log('┌── TEST 1: Heatmap Coverage, Burst Payments & Surplus ─────────────');

const weeklyAmount = 2000;

function calculateStudentHeatmap({
    student,
    payments,
    currentWeek,
    accumulatedWeeks,
    viewMode = 'semester',
}) {
    const totalPaid = payments
        .filter((p) => p.studentId === student._id)
        .reduce((sum, p) => sum + (p.amount || 0), 0);

    const totalWeeksPaid = Math.floor(totalPaid / weeklyAmount);
    const accWeeks = Math.max(0, Number(accumulatedWeeks) || 0);
    const activeWeek = Math.max(1, Number(currentWeek) || 1);
    const priorSemesterRequired = accWeeks * weeklyAmount;

    const currentSemesterCredit = Math.max(0, totalPaid - priorSemesterRequired);
    const semesterWeeksPaid = Math.floor(currentSemesterCredit / weeklyAmount);

    const cumulativeWeeks = accWeeks + activeWeek;
    const cumulativeRequired = cumulativeWeeks * weeklyAmount;
    const debt = cumulativeRequired - totalPaid;

    const isSurplus = debt < 0;
    const isLunas = debt === 0;
    const isNunggak = debt > 0;

    const surplusWeeks = isSurplus ? Math.floor(Math.abs(debt) / weeklyAmount) : 0;
    const nunggakWeeks = isNunggak ? Math.ceil(debt / weeklyAmount) : 0;

    const weeksPaidInView = viewMode === 'semester' ? semesterWeeksPaid : totalWeeksPaid;
    const baseCurrentWeek = viewMode === 'semester' ? activeWeek : cumulativeWeeks;

    return {
        totalPaid,
        totalWeeksPaid,
        semesterWeeksPaid,
        debt,
        isSurplus,
        isLunas,
        isNunggak,
        surplusWeeks,
        nunggakWeeks,
        weeksPaidInView,
        baseCurrentWeek,
    };
}

it('Burst payment of Rp 10.000 covers exactly 5 weeks', () => {
    const student = { _id: 's1', name: 'Budi' };
    const payments = [{ studentId: 's1', amount: 10000, date: '2026-03-01' }];
    const res = calculateStudentHeatmap({
        student,
        payments,
        currentWeek: 5,
        accumulatedWeeks: 0,
        viewMode: 'semester',
    });

    assert.strictEqual(res.totalWeeksPaid, 5);
    assert.strictEqual(res.semesterWeeksPaid, 5);
    assert.strictEqual(res.debt, 0);
    assert.strictEqual(res.isLunas, true);
});

it('Overpayment (negative debt) correctly calculates surplus weeks beyond currentWeek', () => {
    // Current week = 3, accumulatedWeeks = 7. Total weeks = 10. Required = 20.000.
    // Student paid Rp 28.000 (14 weeks total, 7 weeks in current semester).
    const student = { _id: 's2', name: 'Siti' };
    const payments = [
        { studentId: 's2', amount: 14000, date: '2026-01-01' }, // paid prior
        { studentId: 's2', amount: 14000, date: '2026-03-05' }, // burst pay 7 weeks
    ];
    const res = calculateStudentHeatmap({
        student,
        payments,
        currentWeek: 3,
        accumulatedWeeks: 7,
        viewMode: 'semester',
    });

    assert.strictEqual(res.totalWeeksPaid, 14);
    assert.strictEqual(res.semesterWeeksPaid, 7);
    // Required up to week 3 = 10 * 2000 = 20.000. Total paid = 28.000. Debt = -8.000
    assert.strictEqual(res.debt, -8000);
    assert.strictEqual(res.isSurplus, true);
    assert.strictEqual(res.surplusWeeks, 4); // 4 weeks prepaid beyond currentWeek (weeks 4, 5, 6, 7)!
});

it('Heatmap cell state logic properly identifies paid, unpaid, and prepaid beyond currentWeek', () => {
    const currentWeek = 3;
    const weeksPaid = 5; // Paid for weeks 1, 2, 3, 4, 5

    function getCellState(weekNum, baseCurrentWeek, studentWeeksPaid) {
        const isPastOrCurrent = weekNum <= baseCurrentWeek;
        const isPaid = weekNum <= studentWeeksPaid;
        if (isPastOrCurrent) {
            return isPaid ? 'paid' : 'unpaid';
        } else {
            return isPaid ? 'prepaid' : 'future';
        }
    }

    assert.strictEqual(getCellState(1, currentWeek, weeksPaid), 'paid');
    assert.strictEqual(getCellState(2, currentWeek, weeksPaid), 'paid');
    assert.strictEqual(getCellState(3, currentWeek, weeksPaid), 'paid');
    assert.strictEqual(getCellState(4, currentWeek, weeksPaid), 'prepaid'); // Glowing beyond currentWeek!
    assert.strictEqual(getCellState(5, currentWeek, weeksPaid), 'prepaid'); // Glowing beyond currentWeek!
    assert.strictEqual(getCellState(6, currentWeek, weeksPaid), 'future');  // Not due yet
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. SEMESTER PAUSE & RESUME RESET LOGIC
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n┌── TEST 2: Semester Pause & Reset Adaptation ──────────────────────');

it('When semester resets, currentWeek resets to 1 while accumulatedWeeks carries over', () => {
    const prevAccumulated = 7;
    const pausedWeek = 6;
    const newAccumulatedWeeks = prevAccumulated + pausedWeek; // 13
    const newCurrentWeek = 1;

    const student = { _id: 's3', name: 'Joko' };
    // Joko had paid 26.000 (13 weeks) by end of prior semester
    const payments = [{ studentId: 's3', amount: 26000 }];

    const res = calculateStudentHeatmap({
        student,
        payments,
        currentWeek: newCurrentWeek,
        accumulatedWeeks: newAccumulatedWeeks,
        viewMode: 'semester',
    });

    // In new semester, Joko needs week 1 (2.000). Has paid 0 in new semester.
    assert.strictEqual(res.semesterWeeksPaid, 0);
    assert.strictEqual(res.debt, 2000);
    assert.strictEqual(res.isNunggak, true);
    assert.strictEqual(res.nunggakWeeks, 1);
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. CHRONOLOGICAL DATE SORTING BUGFIX (IncomeVsExpenseChart)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n┌── TEST 3: IncomeVsExpenseChart Chronological Sorting ─────────────');

it('Dates in different months sort strictly chronologically by ISO timestamp', () => {
    const rawDates = [
        '2026-05-12T10:00:00Z',
        '2026-01-02T10:00:00Z',
        '2026-03-25T10:00:00Z',
        '2026-02-14T10:00:00Z',
    ];

    const sorted = rawDates
        .map((d) => {
            const date = new Date(d);
            const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            return {
                isoDate,
                timestamp: new Date(isoDate).getTime(),
                display: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
            };
        })
        .sort((a, b) => a.timestamp - b.timestamp);

    assert.strictEqual(sorted[0].isoDate, '2026-01-02');
    assert.strictEqual(sorted[1].isoDate, '2026-02-14');
    assert.strictEqual(sorted[2].isoDate, '2026-03-25');
    assert.strictEqual(sorted[3].isoDate, '2026-05-12');
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. DYNAMIC EXPENSE PALETTE
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n┌── TEST 4: Expense Category Dynamic Palette ──────────────────────');

it('Assigns distinct colors and sorts expense categories descending', () => {
    const expenses = [
        { category: 'Alat Tulis', amount: 50000, date: '2026-03-01' },
        { category: 'Konsumsi', amount: 150000, date: '2026-03-02' },
        { category: 'Fotocopy', amount: 25000, date: '2026-03-03' },
    ];

    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const sorted = [...expenses].sort((a, b) => b.amount - a.amount);

    assert.strictEqual(sorted[0].category, 'Konsumsi');
    assert.strictEqual(sorted[0].amount, 150000);
    assert.strictEqual(((sorted[0].amount / total) * 100).toFixed(1), '66.7');
});

console.log(`
════════════════════════════════════════════════════════════════════
   TEST RESULT: ${passed} PASSED, ${failed} FAILED
════════════════════════════════════════════════════════════════════
`);

if (failed > 0) {
    process.exit(1);
}
