import assert from 'assert';

console.log(`
════════════════════════════════════════════════════════════════════
   🚀 TESTING PRODUCT REUSABILITY & FIRST SETUP WIZARD LOGIC
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
// 1. SETUP STATUS & BACKWARD COMPATIBILITY SIMULATION
// ─────────────────────────────────────────────────────────────────────────────
console.log('┌── TEST 1: Setup Status & Auto-Migration Detection ──────────────');

function simulateCheckSetupCompleted({ setupSetting, userCount }) {
    if (setupSetting?.value === true) return true;
    if (userCount > 0) return true; // auto-migrate existing installation
    return false;
}

it('Fresh install with 0 users and no setup setting returns setupCompleted: false', () => {
    const res = simulateCheckSetupCompleted({ setupSetting: null, userCount: 0 });
    assert.strictEqual(res, false);
});

it('Existing installation with userCount > 0 automatically treats setup as completed', () => {
    const res = simulateCheckSetupCompleted({ setupSetting: null, userCount: 1 });
    assert.strictEqual(res, true);
});

it('Completed setup setting returns setupCompleted: true', () => {
    const res = simulateCheckSetupCompleted({ setupSetting: { value: true }, userCount: 0 });
    assert.strictEqual(res, true);
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. DYNAMIC PAYMENT FORMATTING
// ─────────────────────────────────────────────────────────────────────────────
console.log('┌── TEST 2: Dynamic Payment Info Formatting ───────────────────────');

function formatPaymentInfo(accounts, notes, baseUrl = 'http://localhost:5000') {
    if (Array.isArray(accounts) && accounts.length > 0) {
        const lines = accounts.map((acc) => {
            const holder = acc.accountHolder ? ` (a.n ${acc.accountHolder})` : '';
            return `• ${acc.bankName || acc.provider}: *${acc.accountNumber}*${holder}`;
        });
        const notesLine = notes ? `\n_${notes}_\n` : '\n_Mohon konfirmasi setelah transfer ya!_ ✅\n';
        return `💳 *INFORMASI PEMBAYARAN:*\n${lines.join('\n')}\n━━━━━━━━━━━━━━━━━━━━${notesLine}\n🏆 *Cek Leaderboard:*\n${baseUrl}/leaderboard`;
    }
    return `💳 *INFORMASI PEMBAYARAN:*\nSilakan hubungi Bendahara Kelas untuk rekening pembayaran.\n━━━━━━━━━━━━━━━━━━━━\n🏆 *Cek Leaderboard:*\n${baseUrl}/leaderboard`;
}

it('Formats custom bank accounts and custom account holders dynamically without hardcoding', () => {
    const accounts = [
        { bankName: 'Bank Mandiri', accountNumber: '1234567890', accountHolder: 'Siti Rahma' },
        { provider: 'GoPay', accountNumber: '08123456789', accountHolder: 'Budi Santoso' },
    ];
    const text = formatPaymentInfo(accounts, 'Beri catatan nama siswa');
    assert.ok(text.includes('Bank Mandiri: *1234567890* (a.n Siti Rahma)'));
    assert.ok(text.includes('GoPay: *08123456789* (a.n Budi Santoso)'));
    assert.ok(text.includes('Beri catatan nama siswa'));
    assert.ok(!text.includes('Fahmi Ilham Bagaskara'));
});

it('Provides safe fallback when no bank accounts are configured yet', () => {
    const text = formatPaymentInfo([], '');
    assert.ok(text.includes('Silakan hubungi Bendahara Kelas'));
    assert.ok(!text.includes('085646745887'));
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. DYNAMIC WEEKLY FEE & TUNGGAKAN CALCULATION
// ─────────────────────────────────────────────────────────────────────────────
console.log('┌── TEST 3: Dynamic Weekly Amount Calculations ────────────────────');

function calculateDebt(totalPaid, totalWeeks, weeklyAmount = 2000) {
    const shouldPay = totalWeeks * weeklyAmount;
    const debt = shouldPay - totalPaid;
    return { shouldPay, debt };
}

it('Correctly calculates debt with custom weekly fee (e.g. Rp 5.000/week)', () => {
    const { shouldPay, debt } = calculateDebt(10000, 4, 5000);
    assert.strictEqual(shouldPay, 20000);
    assert.strictEqual(debt, 10000);
});

it('Handles overpayment (surplus) with custom fee', () => {
    const { debt } = calculateDebt(25000, 4, 5000);
    assert.strictEqual(debt, -5000); // 1 week surplus
});

console.log(`
════════════════════════════════════════════════════════════════════
   TEST RESULT: ${passed} PASSED, ${failed} FAILED
════════════════════════════════════════════════════════════════════
`);

if (failed > 0) {
    process.exit(1);
}
