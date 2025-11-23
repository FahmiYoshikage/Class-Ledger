import Badge from '../models/Badge.js';
import Student from '../models/Student.js';
import Payment from '../models/Payment.js';
import Setting from '../models/Setting.js';

// Badge definitions dengan emoji dan deskripsi
export const BADGE_DEFINITIONS = {
    early_bird: {
        name: 'Early Bird',
        emoji: '🐦',
        description: 'Selalu bayar di minggu pertama',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
    },
    perfect_score: {
        name: 'Perfect Score',
        emoji: '💯',
        description: 'Lunas 8 minggu berturut-turut',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
    },
    speed_demon: {
        name: 'Speed Demon',
        emoji: '⚡',
        description: 'Bayar dalam 24 jam',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
    },
    mega_donor: {
        name: 'Mega Donor',
        emoji: '💎',
        description: 'Total donasi > Rp 50.000',
        color: 'text-pink-600',
        bgColor: 'bg-pink-100',
    },
    streak_master: {
        name: 'Streak Master',
        emoji: '🔥',
        description: '4 minggu berturut tidak telat',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
    },
    comeback_kid: {
        name: 'Comeback Kid',
        emoji: '🚀',
        description: 'Lunas setelah tunggakan besar',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
    },
    consistent_payer: {
        name: 'Consistent Payer',
        emoji: '⭐',
        description: 'Bayar rutin tanpa telat',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100',
    },
};

class BadgeService {
    // Get current week
    async getCurrentWeek() {
        try {
            const [semesterStatusSetting, pausedWeekSetting, startDateSetting] =
                await Promise.all([
                    Setting.findOne({ key: 'semester_status' }),
                    Setting.findOne({ key: 'paused_week' }),
                    Setting.findOne({ key: 'start_date' }),
                ]);

            const semesterStatus = semesterStatusSetting?.value || 'active';
            const pausedWeek = pausedWeekSetting?.value;

            if (semesterStatus === 'paused' && pausedWeek) {
                return pausedWeek;
            }

            const startDate = startDateSetting?.value
                ? new Date(startDateSetting.value)
                : new Date(process.env.START_DATE || '2025-10-27');

            const now = new Date();
            const days = Math.floor((now - startDate) / (24 * 60 * 60 * 1000));
            return Math.max(1, Math.ceil(days / 7));
        } catch (error) {
            return 1;
        }
    }

    // Award badge to student
    async awardBadge(studentId, badgeType, metadata = {}) {
        try {
            const badge = await Badge.findOneAndUpdate(
                { studentId, badgeType },
                {
                    studentId,
                    badgeType,
                    earnedAt: new Date(),
                    metadata,
                },
                { upsert: true, new: true }
            );

            console.log(
                `🏅 Badge awarded: ${badgeType} to student ${studentId}`
            );
            return badge;
        } catch (error) {
            console.error('Error awarding badge:', error);
            return null;
        }
    }

    // Check and award Early Bird badge
    async checkEarlyBird(studentId, payments) {
        // Bayar di minggu 1 (dalam 7 hari pertama)
        const startDateSetting = await Setting.findOne({ key: 'start_date' });
        const startDate = startDateSetting?.value
            ? new Date(startDateSetting.value)
            : new Date(process.env.START_DATE);

        const week1End = new Date(startDate);
        week1End.setDate(week1End.getDate() + 7);

        const earlyPayments = payments.filter(
            (p) => new Date(p.date) <= week1End
        );

        if (earlyPayments.length >= 1) {
            await this.awardBadge(studentId, 'early_bird', {
                firstPaymentDate: earlyPayments[0].date,
            });
        }
    }

    // Check and award Perfect Score badge
    async checkPerfectScore(studentId, payments) {
        // 8 minggu berturut-turut lunas
        const sortedPayments = payments.sort(
            (a, b) => new Date(a.date) - new Date(b.date)
        );

        if (sortedPayments.length >= 8) {
            // Check if payments are consecutive weeks
            let consecutiveWeeks = 1;
            for (let i = 1; i < sortedPayments.length; i++) {
                const diff = Math.floor(
                    (new Date(sortedPayments[i].date) -
                        new Date(sortedPayments[i - 1].date)) /
                        (24 * 60 * 60 * 1000)
                );
                if (diff <= 7) {
                    consecutiveWeeks++;
                    if (consecutiveWeeks >= 8) {
                        await this.awardBadge(studentId, 'perfect_score', {
                            consecutiveWeeks,
                        });
                        break;
                    }
                } else {
                    consecutiveWeeks = 1;
                }
            }
        }
    }

    // Check and award Speed Demon badge
    async checkSpeedDemon(studentId, payments) {
        // Bayar dalam 24 jam (cek payment date vs created date)
        const quickPayments = payments.filter((p) => {
            const paymentDate = new Date(p.date);
            const createdDate = new Date(p.createdAt);
            const diff = Math.abs(paymentDate - createdDate) / (1000 * 60 * 60);
            return diff <= 24;
        });

        if (quickPayments.length >= 1) {
            await this.awardBadge(studentId, 'speed_demon', {
                quickPayments: quickPayments.length,
            });
        }
    }

    // Check and award Mega Donor badge
    async checkMegaDonor(studentId, payments) {
        const totalDonation = payments.reduce((sum, p) => sum + p.amount, 0);

        if (totalDonation >= 50000) {
            await this.awardBadge(studentId, 'mega_donor', {
                totalDonation,
            });
        }
    }

    // Check and award Streak Master badge
    async checkStreakMaster(studentId, payments) {
        // 4 minggu berturut tidak telat
        const currentWeek = await this.getCurrentWeek();
        const weeklyAmount = 2000;

        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const weeksPaid = Math.floor(totalPaid / weeklyAmount);
        const weeksLate = currentWeek - weeksPaid;

        if (weeksLate <= 0 && currentWeek >= 4) {
            await this.awardBadge(studentId, 'streak_master', {
                currentWeek,
                status: 'no_late',
            });
        }
    }

    // Check and award Comeback Kid badge
    async checkComebackKid(studentId, payments) {
        // Lunas setelah tunggakan >= 8 minggu
        const currentWeek = await this.getCurrentWeek();
        const weeklyAmount = 2000;

        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const weeksPaid = Math.floor(totalPaid / weeklyAmount);
        const weeksLate = currentWeek - weeksPaid;

        // Check history: pernah telat >= 8 minggu, sekarang lunas
        if (weeksLate <= 0 && totalPaid >= weeklyAmount * 8) {
            await this.awardBadge(studentId, 'comeback_kid', {
                recovered: true,
            });
        }
    }

    // Check and award Consistent Payer badge
    async checkConsistentPayer(studentId, payments) {
        // Bayar rutin (minimal 1x per 2 minggu) selama 8 minggu
        if (payments.length >= 4) {
            await this.awardBadge(studentId, 'consistent_payer', {
                totalPayments: payments.length,
            });
        }
    }

    // Calculate all badges for a student
    async calculateBadgesForStudent(studentId) {
        try {
            const payments = await Payment.find({ studentId });

            if (payments.length === 0) {
                return [];
            }

            // Run all badge checks
            await Promise.all([
                this.checkEarlyBird(studentId, payments),
                this.checkPerfectScore(studentId, payments),
                this.checkSpeedDemon(studentId, payments),
                this.checkMegaDonor(studentId, payments),
                this.checkStreakMaster(studentId, payments),
                this.checkComebackKid(studentId, payments),
                this.checkConsistentPayer(studentId, payments),
            ]);

            // Get all badges for this student
            const badges = await Badge.find({ studentId });
            return badges;
        } catch (error) {
            console.error('Error calculating badges:', error);
            return [];
        }
    }

    // Calculate badges for all students
    async calculateAllBadges() {
        try {
            console.log('🏅 Calculating badges for all students...');

            const students = await Student.find({ status: 'Aktif' });
            let totalBadges = 0;

            for (const student of students) {
                const badges = await this.calculateBadgesForStudent(
                    student._id
                );
                totalBadges += badges.length;
            }

            console.log(
                `✅ Badge calculation complete! ${totalBadges} badges awarded to ${students.length} students`
            );
            return {
                success: true,
                totalBadges,
                totalStudents: students.length,
            };
        } catch (error) {
            console.error('Error calculating all badges:', error);
            return { success: false, error: error.message };
        }
    }

    // Get badges for a student with definitions
    async getStudentBadges(studentId) {
        try {
            const badges = await Badge.find({ studentId }).sort({
                earnedAt: -1,
            });

            return badges.map((badge) => ({
                ...badge.toObject(),
                ...BADGE_DEFINITIONS[badge.badgeType],
            }));
        } catch (error) {
            console.error('Error getting student badges:', error);
            return [];
        }
    }
}

export default new BadgeService();
