import mongoose from 'mongoose';
import Setting from './server/models/Setting.js';
import Student from './server/models/Student.js';
import Payment from './server/models/Payment.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kas-kelas';

// Helper: Calculate current week
async function getCurrentWeek() {
    const [semesterStatusSetting, pausedWeekSetting, startDateSetting] =
        await Promise.all([
            Setting.findOne({ key: 'semester_status' }),
            Setting.findOne({ key: 'paused_week' }),
            Setting.findOne({ key: 'start_date' }),
        ]);

    const semesterStatus = semesterStatusSetting?.value || 'active';
    const pausedWeek = pausedWeekSetting?.value;
    const startDate = startDateSetting?.value
        ? new Date(startDateSetting.value)
        : new Date('2025-10-27');

    // If paused, return the paused week (frozen)
    if (semesterStatus === 'paused' && pausedWeek) {
        return { week: pausedWeek, status: 'paused', frozen: true };
    }

    // Calculate normally if active
    const now = new Date();
    const days = Math.floor((now - startDate) / (24 * 60 * 60 * 1000));
    const week = Math.max(1, Math.ceil(days / 7) + 1);
    
    return { week, status: 'active', frozen: false };
}

// Helper: Calculate tunggakan
function calculateTunggakan(totalPaid, currentWeek) {
    const weeklyAmount = 2000;
    const shouldPay = currentWeek * weeklyAmount;
    return shouldPay - totalPaid;
}

async function testPauseFeature() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // 1. Test Current Week Calculation
        console.log('═══════════════════════════════════════');
        console.log('📅 TEST 1: Week Calculation');
        console.log('═══════════════════════════════════════');
        
        const weekInfo = await getCurrentWeek();
        console.log(`Current Week: ${weekInfo.week}`);
        console.log(`Status: ${weekInfo.status}`);
        console.log(`Frozen: ${weekInfo.frozen ? '✅ YES (Pause Working!)' : '❌ NO'}`);
        
        if (weekInfo.status === 'paused') {
            console.log(`\n✅ PASS: System is paused at Week ${weekInfo.week}`);
        } else {
            console.log(`\n⚠️  WARNING: System is ACTIVE, not paused`);
        }

        // 2. Test Tunggakan Calculation
        console.log('\n═══════════════════════════════════════');
        console.log('💰 TEST 2: Tunggakan Calculation');
        console.log('═══════════════════════════════════════');
        
        const students = await Student.find({ status: 'Aktif' }).limit(5);
        const payments = await Payment.find();
        
        console.log(`Found ${students.length} active students\n`);
        
        for (const student of students) {
            const studentPayments = payments.filter(p => {
                const pStudentId = p.studentId?._id || p.studentId;
                return pStudentId?.toString() === student._id.toString();
            });
            
            const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount, 0);
            const tunggakan = calculateTunggakan(totalPaid, weekInfo.week);
            
            console.log(`${student.name}:`);
            console.log(`  Total Paid: Rp ${totalPaid.toLocaleString('id-ID')}`);
            console.log(`  Should Pay: Rp ${(weekInfo.week * 2000).toLocaleString('id-ID')} (Week ${weekInfo.week} × Rp 2.000)`);
            console.log(`  Tunggakan: Rp ${tunggakan.toLocaleString('id-ID')}`);
            console.log('');
        }

        // 3. Simulate Time Passage
        console.log('═══════════════════════════════════════');
        console.log('⏰ TEST 3: Time Passage Simulation');
        console.log('═══════════════════════════════════════');
        
        const settings = await Setting.find({
            key: { $in: ['semester_status', 'paused_week', 'start_date'] }
        });
        
        console.log('\nCurrent Settings:');
        settings.forEach(s => {
            console.log(`  ${s.key}: ${s.value}`);
        });
        
        const startDateSetting = settings.find(s => s.key === 'start_date');
        if (startDateSetting) {
            const startDate = new Date(startDateSetting.value);
            const today = new Date();
            const daysPassed = Math.floor((today - startDate) / (24 * 60 * 60 * 1000));
            const actualWeek = Math.max(1, Math.ceil(daysPassed / 7) + 1);
            
            console.log(`\nTime Analysis:`);
            console.log(`  Start Date: ${startDate.toISOString().split('T')[0]}`);
            console.log(`  Today: ${today.toISOString().split('T')[0]}`);
            console.log(`  Days Passed: ${daysPassed}`);
            console.log(`  Actual Week (if not paused): ${actualWeek}`);
            console.log(`  Current Week (with pause): ${weekInfo.week}`);
            
            if (weekInfo.frozen && actualWeek > weekInfo.week) {
                console.log(`\n✅ PASS: Week is frozen! (${actualWeek} → ${weekInfo.week})`);
                console.log(`   Tunggakan NOT increasing by Rp ${(actualWeek - weekInfo.week) * 2000}.toLocaleString('id-ID')}`);
            } else if (weekInfo.frozen) {
                console.log(`\n✅ PASS: Pause is working correctly`);
            } else {
                console.log(`\n❌ FAIL: Week should be frozen but it's not!`);
            }
        }

        // 4. Expected Tunggakan Examples
        console.log('\n═══════════════════════════════════════');
        console.log('📊 TEST 4: Expected Values');
        console.log('═══════════════════════════════════════');
        
        console.log(`\nWith Week ${weekInfo.week} frozen:`);
        console.log(`  Student with Rp 0 paid → Tunggakan: Rp ${(weekInfo.week * 2000).toLocaleString('id-ID')}`);
        console.log(`  Student with Rp 14.000 paid → Tunggakan: Rp ${(weekInfo.week * 2000 - 14000).toLocaleString('id-ID')}`);
        console.log(`  Student with Rp 10.000 paid → Tunggakan: Rp ${(weekInfo.week * 2000 - 10000).toLocaleString('id-ID')}`);

        // 5. Summary
        console.log('\n═══════════════════════════════════════');
        console.log('📝 SUMMARY');
        console.log('═══════════════════════════════════════');
        
        const tests = {
            weekFrozen: weekInfo.frozen,
            statusPaused: weekInfo.status === 'paused',
            settingsCorrect: settings.length === 3
        };
        
        const allPassed = Object.values(tests).every(t => t === true);
        
        console.log(`\n✓ Week Frozen: ${tests.weekFrozen ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`✓ Status Paused: ${tests.statusPaused ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`✓ Settings Correct: ${tests.settingsCorrect ? '✅ PASS' : '❌ FAIL'}`);
        
        if (allPassed) {
            console.log('\n🎉 ALL TESTS PASSED! Pause feature is working correctly.');
        } else {
            console.log('\n⚠️  SOME TESTS FAILED. Please check the configuration.');
        }
        
        await mongoose.disconnect();
        console.log('\n✅ Test completed\n');
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testPauseFeature();
