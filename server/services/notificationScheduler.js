import cron from 'node-cron';
import Student from '../models/Student.js';
import Payment from '../models/Payment.js';
import Setting from '../models/Setting.js';
import whatsappService from './whatsappService.js';

class NotificationScheduler {
    constructor() {
        this.jobs = [];
    }

    // Hitung current week (respects semester pause)
    async getCurrentWeek() {
        try {
            const [semesterStatusSetting, pausedWeekSetting, startDateSetting] = await Promise.all([
                Setting.findOne({ key: 'semester_status' }),
                Setting.findOne({ key: 'paused_week' }),
                Setting.findOne({ key: 'start_date' }),
            ]);

            const semesterStatus = semesterStatusSetting?.value || 'active';
            const pausedWeek = pausedWeekSetting?.value;

            // If paused, return the paused week (frozen)
            if (semesterStatus === 'paused' && pausedWeek) {
                console.log(`⏸️ Semester PAUSED at Week ${pausedWeek}`);
                return pausedWeek;
            }

            // Calculate normally if active
            const startDate = startDateSetting?.value 
                ? new Date(startDateSetting.value) 
                : new Date(process.env.START_DATE || '2025-10-27');
            
            const now = new Date();
            const days = Math.floor((now - startDate) / (24 * 60 * 60 * 1000));
            return Math.max(0, Math.ceil(days / 7) + 1);
        } catch (error) {
            console.error('Error getting current week:', error);
            // Fallback to env
            const startDate = new Date(process.env.START_DATE || '2025-10-27');
            const now = new Date();
            const days = Math.floor((now - startDate) / (24 * 60 * 60 * 1000));
            return Math.max(0, Math.ceil(days / 7) + 1);
        }
    }

    // Check if semester is paused
    async isSemesterPaused() {
        try {
            const semesterStatusSetting = await Setting.findOne({ key: 'semester_status' });
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

    // Kirim reminder otomatis
    async sendAutomaticReminders(minWeeks = 2) {
        try {
            console.log('🤖 Starting automatic reminder process...');

            const studentsToRemind = await this.getStudentsNeedingReminder(
                minWeeks
            );

            if (studentsToRemind.length === 0) {
                console.log('✅ No students need reminders at this time');
                return {
                    total: 0,
                    success: 0,
                    failed: 0,
                };
            }

            console.log(
                `📱 Sending reminders to ${studentsToRemind.length} students...`
            );

            let successCount = 0;
            let failedCount = 0;

            // Tentukan kategori berdasarkan hari
            const dayOfWeek = new Date().getDay();
            const categories = [
                'friendly',
                'motivational',
                'gentle',
                'energetic',
                'humorous',
            ];
            const selectedCategory = categories[dayOfWeek % categories.length];

            for (const { student, weeksLate, amountOwed } of studentsToRemind) {
                try {
                    // Hindari spam: cek apakah sudah dikirim dalam 3 hari terakhir
                    if (student.lastNotificationSent) {
                        const daysSinceLastSent = Math.floor(
                            (Date.now() -
                                student.lastNotificationSent.getTime()) /
                                (24 * 60 * 60 * 1000)
                        );

                        if (daysSinceLastSent < 3) {
                            console.log(
                                `⏭️  Skipping ${student.name} (last sent ${daysSinceLastSent} days ago)`
                            );
                            continue;
                        }
                    }

                    const result = await whatsappService.sendPaymentReminder(
                        student,
                        weeksLate,
                        amountOwed,
                        selectedCategory
                    );

                    if (result.success) {
                        successCount++;
                        console.log(
                            `✅ Sent to ${student.name} (${weeksLate} weeks late)`
                        );
                    } else {
                        failedCount++;
                        console.log(`❌ Failed to send to ${student.name}`);
                    }

                    // Delay 2 detik antar pesan untuk avoid rate limit
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                } catch (error) {
                    failedCount++;
                    console.error(
                        `Error sending to ${student.name}:`,
                        error.message
                    );
                }
            }

            console.log(`\n📊 Reminder Summary:`);
            console.log(`   Total: ${studentsToRemind.length}`);
            console.log(`   Success: ${successCount}`);
            console.log(`   Failed: ${failedCount}`);

            return {
                total: studentsToRemind.length,
                success: successCount,
                failed: failedCount,
            };
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
        // ========================================
        // 📅 SCHEDULE 1: Senin pagi jam 07:00
        // ========================================
        const mondayMorning = cron.schedule(
            '0 7 * * 1',
            async () => {
                console.log(
                    '\n⏰ [MONDAY REMINDER] Running Monday morning reminder...'
                );
                await this.sendAutomaticReminders(1); // Kirim ke yang telat ≥ 1 minggu
            },
            {
                scheduled: false,
                timezone: 'Asia/Jakarta',
            }
        );

        // ========================================
        // 📅 SCHEDULE 2: Jumat sore jam 15:00
        // ========================================
        const fridayAfternoon = cron.schedule(
            '0 15 * * 5',
            async () => {
                console.log(
                    '\n⏰ [FRIDAY REMINDER] Running Friday afternoon reminder...'
                );
                await this.sendAutomaticReminders(2); // Kirim ke yang telat ≥ 2 minggu
            },
            {
                scheduled: false,
                timezone: 'Asia/Jakarta',
            }
        );

        // ========================================
        // 📅 SCHEDULE 3: Setiap hari jam 10:00 (optional)
        // ========================================
        const dailyReminder = cron.schedule(
            '0 10 * * *',
            async () => {
                console.log(
                    '\n⏰ [DAILY CHECK] Checking for urgent reminders...'
                );
                await this.sendAutomaticReminders(4); // Hanya yang telat ≥ 4 minggu
            },
            {
                scheduled: false,
                timezone: 'Asia/Jakarta',
            }
        );

        this.jobs = [
            {
                name: 'Monday Morning',
                job: mondayMorning,
                schedule: 'Every Monday 07:00',
            },
            {
                name: 'Friday Afternoon',
                job: fridayAfternoon,
                schedule: 'Every Friday 15:00',
            },
            {
                name: 'Daily Urgent',
                job: dailyReminder,
                schedule: 'Every day 10:00',
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
