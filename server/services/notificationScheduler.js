import cron from 'node-cron';
import Student from '../models/Student.js';
import Payment from '../models/Payment.js';
import Setting from '../models/Setting.js';

// Heavy services are lazy-loaded to reduce startup memory footprint
// (important for low-memory VPS: 1GB RAM / 2 vCPU)

class NotificationScheduler {
    constructor() {
        this.jobs = [];
        this.startedAt = null; // Track when scheduler started
        this._whatsappService = null;
        this._groupBroadcastService = null;
        this._antiBanService = null;
    }

    // Lazy-load heavy services on first use only
    async _getWhatsappService() {
        if (!this._whatsappService) {
            const { default: whatsappService } = await import(
                './whatsappService.js'
            );
            this._whatsappService = whatsappService;
        }
        return this._whatsappService;
    }

    async _getGroupBroadcastService() {
        if (!this._groupBroadcastService) {
            const { default: groupBroadcastService } = await import(
                './groupBroadcastService.js'
            );
            this._groupBroadcastService = groupBroadcastService;
        }
        return this._groupBroadcastService;
    }

    async _getAntiBanService() {
        if (!this._antiBanService) {
            const { default: antiBanService } = await import(
                './antiBanService.js'
            );
            this._antiBanService = antiBanService;
        }
        return this._antiBanService;
    }

    // Hitung current week (respects semester pause) — includes accumulated weeks
    async getCurrentWeek() {
        try {
            const [
                semesterStatusSetting,
                pausedWeekSetting,
                startDateSetting,
                accumulatedWeeksSetting,
            ] = await Promise.all([
                Setting.findOne({ key: 'semester_status' }),
                Setting.findOne({ key: 'paused_week' }),
                Setting.findOne({ key: 'start_date' }),
                Setting.findOne({ key: 'accumulated_weeks' }),
            ]);

            const semesterStatus = semesterStatusSetting?.value || 'active';
            const pausedWeek = pausedWeekSetting?.value;
            // Default 7 = semester 1 had 7 weeks (hardcoded initial carry-over)
            const accumulatedWeeks = accumulatedWeeksSetting
                ? parseInt(accumulatedWeeksSetting.value)
                : 7;

            // If paused, return total weeks (accumulated + paused week)
            if (semesterStatus === 'paused' && pausedWeek) {
                console.log(
                    `⏸️ Semester PAUSED at Week ${pausedWeek} (total: ${accumulatedWeeks + pausedWeek})`
                );
                return accumulatedWeeks + pausedWeek;
            }

            // Calculate normally if active — must match settings.js formula
            const startDate = startDateSetting?.value
                ? new Date(startDateSetting.value)
                : new Date(process.env.START_DATE || '2025-10-27');

            const now = new Date();
            const diffTime = Math.abs(now - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const currentWeek = Math.max(1, Math.ceil(diffDays / 7));

            return accumulatedWeeks + currentWeek;
        } catch (error) {
            console.error('Error getting current week:', error);
            // Fallback: 7 (semester 1) + current semester calculation
            const startDate = new Date(process.env.START_DATE || '2025-10-27');
            const now = new Date();
            const diffTime = Math.abs(now - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return 7 + Math.max(1, Math.ceil(diffDays / 7));
        }
    }

    // Check if semester is paused
    async isSemesterPaused() {
        try {
            const semesterStatusSetting = await Setting.findOne({
                key: 'semester_status',
            });
            return semesterStatusSetting?.value === 'paused';
        } catch (error) {
            return false;
        }
    }

    // Get students yang perlu diingatkan
    async getStudentsNeedingReminder(minWeeks = 1) {
        try {
            // Check if semester is paused
            const isPaused = await this.isSemesterPaused();
            if (isPaused) {
                console.log('⏸️ Semester paused - skipping reminder check');
                return [];
            }

            const students = await Student.find({
                status: 'Aktif',
                phoneNumber: { $exists: true, $ne: '' },
                enableNotification: true,
            });

            const payments = await Payment.find();
            const currentWeek = await this.getCurrentWeek();
            const needsReminder = [];

            for (const student of students) {
                const studentPayments = payments.filter(
                    (p) => p.studentId?.toString() === student._id.toString()
                );

                const totalPaid = studentPayments.reduce(
                    (sum, p) => sum + p.amount,
                    0
                );
                const weeksPaid = Math.floor(totalPaid / 2000);
                const weeksLate = currentWeek - weeksPaid;
                const amountOwed = weeksLate * 2000;

                if (weeksLate >= minWeeks) {
                    needsReminder.push({
                        student,
                        weeksLate,
                        amountOwed,
                    });
                }
            }

            return needsReminder;
        } catch (error) {
            console.error(
                'Error getting students for reminder:',
                error.message
            );
            return [];
        }
    }

// Kirim reminder otomatis — menggunakan anti-ban protection
async sendAutomaticReminders(minWeeks = 1) {
    try {
        console.log(
            '🤖 Starting automatic reminder process (with anti-ban protection)...'
        );

        const studentsToRemind =
            await this.getStudentsNeedingReminder(minWeeks);

        if (studentsToRemind.length === 0) {
            console.log('✅ No students need reminders at this time');
            return {
                total: 0,
                success: 0,
                failed: 0,
            };
        }

        console.log(
            `📱 Preparing reminders for ${studentsToRemind.length} students (anti-ban active)...`
        );

        // Gunakan anti-ban orchestrator
        const antiBanService = await this._getAntiBanService();
        const whatsappService = await this._getWhatsappService();
        const results = await antiBanService.sendWithProtection(
            studentsToRemind,
            async (student, weeksLate, amountOwed, category) => {
                return await whatsappService.sendPaymentReminder(
                    student,
                    weeksLate,
                    amountOwed,
                    category
                );
            }
        );

            console.log(`\n📊 Reminder Summary:`);
            console.log(`   Total: ${results.total}`);
            console.log(`   Success: ${results.success}`);
            console.log(`   Failed: ${results.failed}`);
            console.log(`   Skipped: ${results.skipped}`);
            console.log(`   Rate-limited: ${results.rateLimited}`);

            return results;
        } catch (error) {
            console.error('Error in automatic reminder:', error.message);
            return {
                total: 0,
                success: 0,
                failed: 0,
                error: error.message,
            };
        }
    }

    // Setup cron jobs
    setupSchedules() {
        // Grace period: skip cron triggers within 5 minutes of startup
        // to prevent sending messages immediately on container restart
        const STARTUP_GRACE_MINUTES = 5;

        const isWithinGracePeriod = () => {
            if (!this.startedAt) return true;
            const minutesSinceStart =
                (Date.now() - this.startedAt) / (1000 * 60);
            return minutesSinceStart < STARTUP_GRACE_MINUTES;
        };

        // ========================================
        // 📅 SCHEDULE 1: Daily Reminder (Setiap hari jam 10:00 WIB)
        // ========================================
        // Mengingatkan semua siswa yang menunggak (minWeeks: 1).
        // Diproteksi oleh isSentToday() sehingga tiap siswa maks 1 pesan/hari.
        // Tipe template diacak & pengiriman dijeda secara human-like anti-ban.
        const dailyCronExpression =
            process.env.WA_DAILY_REMINDER_CRON || '0 10 * * *';

        const dailyReminder = cron.schedule(
            dailyCronExpression,
            async () => {
                if (isWithinGracePeriod()) {
                    console.log(
                        '⏳ [DAILY REMINDER] Skipped — container just started'
                    );
                    return;
                }
                console.log(
                    '\n⏰ [DAILY REMINDER] Running daily reminder for students with unpaid dues...'
                );
                try {
                    // 🛡️ Terapkan jitter acak 0-25 menit sebelum mulai kirim
                    const antiBan = await this._getAntiBanService();
                    await antiBan.applyCronJitter('DAILY REMINDER');
                    await this.sendAutomaticReminders(1);
                } catch (err) {
                    console.error(
                        '❌ [DAILY REMINDER] Execution error:',
                        err.message
                    );
                }
            },
            {
                scheduled: false,
                timezone: 'Asia/Jakarta',
            }
        );

        // ========================================
        // 📅 SCHEDULE 2: Weekly Group Broadcast (Setiap Minggu jam 18:00 WIB)
        // ========================================
        // Mengirim info ringkasan kas & siswa yang belum bayar setelah seminggu ke grup WA kelas
        const groupCronExpression =
            process.env.WA_GROUP_BROADCAST_CRON || '0 18 * * 0';

        const weeklyGroupBroadcast = cron.schedule(
            groupCronExpression,
            async () => {
                if (isWithinGracePeriod()) {
                    console.log(
                        '⏳ [WEEKLY GROUP BROADCAST] Skipped — container just started'
                    );
                    return;
                }
                console.log(
                    '\n📊 [WEEKLY GROUP BROADCAST] Sending weekly group summary report...'
                );
                try {
                    // 🛡️ Terapkan jitter acak 0-15 menit
                    const antiBan = await this._getAntiBanService();
                    await antiBan.applyCronJitter('WEEKLY GROUP BROADCAST');
                    const groupBroadcastService =
                        await this._getGroupBroadcastService();
                    await groupBroadcastService.sendBiWeeklyReport();
                } catch (err) {
                    console.error(
                        '❌ [WEEKLY GROUP BROADCAST] Execution error:',
                        err.message
                    );
                }
            },
            {
                scheduled: false,
                timezone: 'Asia/Jakarta',
            }
        );

        this.jobs = [
            {
                name: 'Daily Reminder',
                job: dailyReminder,
                schedule: `Every day 10:00 WIB (${dailyCronExpression})`,
            },
            {
                name: 'Weekly Group Broadcast',
                job: weeklyGroupBroadcast,
                schedule: `Every Sunday 18:00 WIB (${groupCronExpression})`,
            },
        ];

        console.log('\n⏰ Notification Scheduler initialized!');
        console.log('📅 Scheduled jobs:');
        this.jobs.forEach(({ name, schedule }) => {
            console.log(`   - ${name}: ${schedule}`);
        });
    }

    // Start semua scheduled jobs
    start() {
        this.startedAt = Date.now();
        this.setupSchedules();

        // Enable berdasarkan environment variable
        const autoReminderEnabled =
            process.env.AUTO_REMINDER_ENABLED === 'true';

        if (autoReminderEnabled) {
            this.jobs.forEach(({ name, job }) => {
                job.start();
                console.log(`✅ Started: ${name}`);
            });
            console.log('\n✅ All scheduled jobs are now running!\n');
        } else {
            console.log('\n⚠️  Auto-reminder is DISABLED');
            console.log(
                '   Set AUTO_REMINDER_ENABLED=true in .env to enable\n'
            );
        }
    }

    // Stop semua scheduled jobs
    stop() {
        this.jobs.forEach(({ name, job }) => {
            job.stop();
            console.log(`⏹️  Stopped: ${name}`);
        });
    }

    // Get status semua jobs
    getStatus() {
        return this.jobs.map(({ name, schedule, job }) => ({
            name,
            schedule,
            running: job.running || false,
        }));
    }
}

// Export singleton instance
export default new NotificationScheduler();
