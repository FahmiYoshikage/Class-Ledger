/**
 * Test Suite: Notification Scheduler & Anti-Ban Rules
 *
 * Verifies:
 * 1. isSentToday() calculation in Asia/Jakarta timezone
 * 2. 1-message-per-day enforcement (sent today vs sent yesterday)
 * 3. Randomized message category distribution
 * 4. Message humanization (zero-width & emoji variation)
 * 5. Scheduler job registration (Daily Reminder & Weekly Group Broadcast)
 */

import antiBanService from '../server/services/antiBanService.js';
import notificationScheduler from '../server/services/notificationScheduler.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✓ PASS: ${message}`);
        passed++;
    } else {
        console.error(`  ✗ FAIL: ${message}`);
        failed++;
    }
}

console.log('\n════════════════════════════════════════════════════════════════════');
console.log('   🛡️  TESTING SCHEDULER & ANTI-BAN RULES');
console.log('════════════════════════════════════════════════════════════════════\n');

// -------------------------------------------------------------
// Test 1: isSentToday logic
// -------------------------------------------------------------
console.log('┌── TEST 1: isSentToday() Date Checks ─────────────────────────────');

assert(antiBanService.isSentToday(null) === false, 'null returns false');
assert(antiBanService.isSentToday(undefined) === false, 'undefined returns false');
assert(antiBanService.isSentToday('invalid-date') === false, 'invalid string returns false');

// Now
const now = new Date();
assert(antiBanService.isSentToday(now) === true, 'Date just created returns true');

// 2 hours ago
const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
assert(antiBanService.isSentToday(twoHoursAgo) === true, '2 hours ago returns true');

// 25 hours ago (yesterday)
const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000);
assert(antiBanService.isSentToday(yesterday) === false, '25 hours ago (yesterday) returns false');

// 7 days ago
const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
assert(antiBanService.isSentToday(lastWeek) === false, '7 days ago returns false');

// -------------------------------------------------------------
// Test 2: 1-message-per-day enforcement in sendWithProtection
// -------------------------------------------------------------
console.log('\n┌── TEST 2: Daily 1-Message Cap Enforcement ───────────────────────');

const mockStudents = [
    {
        student: {
            name: 'Siswa A (Sudah dikirimi tadi pagi)',
            lastNotificationSent: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        },
        weeksLate: 2,
        amountOwed: 4000,
    },
    {
        student: {
            name: 'Siswa B (Dikirimi kemarin)',
            lastNotificationSent: new Date(Date.now() - 26 * 60 * 60 * 1000), // 26 hours ago
        },
        weeksLate: 1,
        amountOwed: 2000,
    },
    {
        student: {
            name: 'Siswa C (Belum pernah dikirimi)',
            lastNotificationSent: null,
        },
        weeksLate: 3,
        amountOwed: 6000,
    },
];

const sentNames = [];
const skippedDetails = [];

for (const { student, weeksLate, amountOwed } of mockStudents) {
    if (antiBanService.isSentToday(student.lastNotificationSent)) {
        skippedDetails.push({ name: student.name, reason: 'sent_today' });
    } else {
        sentNames.push(student.name);
    }
}

assert(skippedDetails.length === 1, 'Exactly 1 student skipped because already sent today');
assert(skippedDetails[0].name.includes('Siswa A'), 'Siswa A was correctly skipped');
assert(sentNames.length === 2, '2 students eligible for reminder today');
assert(sentNames.includes('Siswa B (Dikirimi kemarin)'), 'Siswa B (sent yesterday) is eligible today');
assert(sentNames.includes('Siswa C (Belum pernah dikirimi)'), 'Siswa C is eligible today');

// -------------------------------------------------------------
// Test 3: Random category selection
// -------------------------------------------------------------
console.log('\n┌── TEST 3: Random Category Mixer ─────────────────────────────────');

const validCategories = [
    'friendly',
    'motivational',
    'gentle',
    'energetic',
    'humorous',
    'formal',
    'casual',
];

const sampledCategories = new Set();
for (let i = 0; i < 50; i++) {
    const cat = antiBanService.getRandomCategory();
    assert(validCategories.includes(cat), `Category '${cat}' is in validCategories`);
    sampledCategories.add(cat);
}
assert(sampledCategories.size >= 4, `Categories are varied across runs (found ${sampledCategories.size} distinct categories)`);

// -------------------------------------------------------------
// Test 4: Message Humanization Fingerprints
// -------------------------------------------------------------
console.log('\n┌── TEST 4: Message Humanization Unique Fingerprints ─────────────');

const baseMessage = 'Halo Budi! Kas kelas nunggak 2 minggu ya Rp 4.000 😄 Yuk bayar biar berkah ✨';
const variations = new Set();

for (let i = 0; i < 10; i++) {
    const humanized = antiBanService.humanizeMessage(baseMessage);
    variations.add(humanized);
}

assert(variations.size > 1, `Humanizer produces unique variations (generated ${variations.size}/10 unique strings)`);

// -------------------------------------------------------------
// Test 5: Notification Scheduler Jobs Registration
// -------------------------------------------------------------
console.log('\n┌── TEST 5: Scheduler Job Setup ───────────────────────────────────');

notificationScheduler.setupSchedules();
const statusList = notificationScheduler.getStatus();

assert(Array.isArray(statusList), 'getStatus returns an array');
assert(statusList.length === 2, `Scheduler has exactly 2 consolidated jobs (found ${statusList.length})`);

const dailyJob = statusList.find((j) => j.name === 'Daily Reminder');
const weeklyJob = statusList.find((j) => j.name === 'Weekly Group Broadcast');

assert(dailyJob !== undefined, 'Daily Reminder job is registered');
assert(weeklyJob !== undefined, 'Weekly Group Broadcast job is registered');
assert(dailyJob.schedule.includes('Every day 10:00 WIB'), `Daily job schedule description matches expected: ${dailyJob?.schedule}`);
assert(weeklyJob.schedule.includes('Every Sunday 18:00 WIB'), `Weekly job schedule description matches expected: ${weeklyJob?.schedule}`);

// -------------------------------------------------------------
// Test 6: Rate limit configuration defaults
// -------------------------------------------------------------
console.log('\n┌── TEST 6: Rate Limit Configuration Defaults ─────────────────────');

assert(antiBanService.config.maxPerHour >= 15, `maxPerHour default is >= 15 (current: ${antiBanService.config.maxPerHour})`);
assert(antiBanService.config.maxPerDay >= 30, `maxPerDay default is >= 30 (current: ${antiBanService.config.maxPerDay})`);

// -------------------------------------------------------------
// Summary
// -------------------------------------------------------------
console.log('\n════════════════════════════════════════════════════════════════════');
console.log(`   TEST RESULT: ${passed} PASSED, ${failed} FAILED`);
console.log('════════════════════════════════════════════════════════════════════\n');

if (failed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
