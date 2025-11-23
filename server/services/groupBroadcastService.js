import axios from 'axios';
import Setting from '../models/Setting.js';
import Student from '../models/Student.js';
import Payment from '../models/Payment.js';
import Expense from '../models/Expense.js';

class GroupBroadcastService {
    constructor() {
        this.apiUrl = 'https://api.fonnte.com/send';
        this.apiToken = process.env.FONNTE_API_TOKEN;
        this.groupId = process.env.FONNTE_GROUP_ID;
    }

    // Generate bi-weekly summary report text
    async generateSummaryReport() {
        try {
            // Get start date for filtering semester data
            const startDateSetting = await Setting.findOne({
                key: 'start_date',
            });
            const startDate = startDateSetting?.value
                ? new Date(startDateSetting.value)
                : new Date(process.env.START_DATE || '2025-10-27');

            console.log('📊 Broadcast Report Generation:');
            console.log('  Start Date:', startDate.toISOString().split('T')[0]);

            const [
                students,
                allPayments,
                allExpenses,
                semesterNameSetting,
                classNameSetting,
            ] = await Promise.all([
                Student.find({ status: 'Aktif' }),
                Payment.find(),
                Expense.find(),
                Setting.findOne({ key: 'semester_name' }),
                Setting.findOne({ key: 'class_name' }),
            ]);

            // Filter payments and expenses for current semester only
            // IMPORTANT: Only count payments WITH studentId (exclude custom payments)
            const payments = allPayments.filter(
                (p) => new Date(p.date) >= startDate && p.studentId != null
            );
            const expenses = allExpenses.filter(
                (e) => new Date(e.date) >= startDate
            );

            console.log('  Total Students (Aktif):', students.length);
            console.log('  Student Payments Only:', payments.length);
            console.log(
                '  All Payments (incl custom):',
                allPayments.filter((p) => new Date(p.date) >= startDate).length
            );
            console.log('  Total Payments (semester):', payments.length);
            console.log('  Total Expenses (semester):', expenses.length);

            const semesterName =
                semesterNameSetting?.value || 'Semester 2024/2025';
            const className = classNameSetting?.value || 'Kelas';

            // Calculate statistics (semester only)
            const totalIncome = payments.reduce(
                (sum, p) => sum + (p.amount || 0),
                0
            );
            const totalExpenses = expenses.reduce(
                (sum, e) => sum + (e.amount || 0),
                0
            );
            const balance = totalIncome - totalExpenses;

            console.log('  Total Income:', totalIncome);
            console.log('  Total Expenses:', totalExpenses);
            console.log('  Balance:', balance);

            // Get recent 2 weeks payments
            const twoWeeksAgo = new Date();
            twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
            const recentPayments = payments.filter(
                (p) => new Date(p.date) >= twoWeeksAgo
            );
            const recentIncome = recentPayments.reduce(
                (sum, p) => sum + p.amount,
                0
            );

            // Calculate tunggakan (SAME LOGIC AS DASHBOARD)
            const currentWeek = await this.getCurrentWeek();
            const weeklyAmount = 2000;

            const studentsWithStatus = students.map((student) => {
                const studentPayments = payments.filter(
                    (p) => p.studentId?.toString() === student._id.toString()
                );
                const totalPaid = studentPayments.reduce(
                    (sum, p) => sum + p.amount,
                    0
                );
                // Use same formula as dashboard: shouldPay - totalPaid
                const shouldPay = currentWeek * weeklyAmount;
                const tunggakan = Math.max(0, shouldPay - totalPaid);

                return {
                    name: student.nickname || student.name,
                    tunggakan,
                    isLunas: tunggakan === 0,
                };
            });

            const lunasCount = studentsWithStatus.filter(
                (s) => s.isLunas
            ).length;
            const belumLunasCount = students.length - lunasCount;

            console.log('  Current Week:', currentWeek);
            console.log(
                '  Lunas:',
                lunasCount,
                '| Belum Lunas:',
                belumLunasCount
            );

            // Top 3 contributors (ALL TIME - match leaderboard)
            const contributorMap = {};
            payments.forEach((p) => {
                const student = students.find(
                    (s) => s._id.toString() === p.studentId?.toString()
                );
                if (student) {
                    const name = student.nickname || student.name;
                    contributorMap[name] =
                        (contributorMap[name] || 0) + p.amount;
                }
            });

            const topContributors = Object.entries(contributorMap)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([name, amount], idx) => {
                    const medal = ['🥇', '🥈', '🥉'][idx];
                    return `${medal} ${name}: Rp ${amount.toLocaleString(
                        'id-ID'
                    )}`;
                });

            console.log('  Top 3 Contributors:', topContributors);

            // Students with highest tunggakan
            const topDebtors = studentsWithStatus
                .filter((s) => s.tunggakan > 0)
                .sort((a, b) => b.tunggakan - a.tunggakan)
                .slice(0, 5)
                .map(
                    (s, idx) =>
                        `${idx + 1}. ${s.name}: Rp ${s.tunggakan.toLocaleString(
                            'id-ID'
                        )}`
                );

            console.log('  Top 5 Debtors:', topDebtors);

            // Build message
            const message = `
📊 *LAPORAN KAS KELAS* 📊
${className} - ${semesterName}
━━━━━━━━━━━━━━━━━━━━

💰 *RINGKASAN KEUANGAN:*
• Total Pemasukan: Rp ${totalIncome.toLocaleString('id-ID')}
• Total Pengeluaran: Rp ${totalExpenses.toLocaleString('id-ID')}
• Saldo Kas: *Rp ${balance.toLocaleString('id-ID')}*

📅 *PERIODE:*
• Minggu Ke-${currentWeek}
• Kas per minggu: Rp 2.000
• Status Telat: Tunggakan ≥ Rp 8.000

📈 *2 MINGGU TERAKHIR:*
• Pemasukan: Rp ${recentIncome.toLocaleString('id-ID')}
• Transaksi: ${recentPayments.length}x pembayaran

👥 *STATUS SISWA:*
• ✅ Lunas: ${lunasCount} siswa
• ⚠️ Belum Lunas: ${belumLunasCount} siswa

${
    topContributors.length > 0
        ? `🏆 *TOP CONTRIBUTORS:*
${topContributors.join('\n')}`
        : ''
}

${
    topDebtors.length > 0
        ? `⚠️ *TUNGGAKAN TERBESAR:*
${topDebtors.join('\n')}

_Segera lunasi ya teman-teman!_ 💪`
        : ''
}

━━━━━━━━━━━━━━━━━━━━
🏆 Cek Leaderboard Lengkap:
https://triforce.fahmi.app/leaderboard

💡 _Keterangan:_
_• Data hanya menghitung pembayaran siswa_
_• Tunggakan dihitung per minggu (Rp 2.000/minggu)_

_Laporan ini dikirim otomatis setiap 2 minggu_
_Terima kasih atas partisipasinya!_ 🙏
            `.trim();

            return message;
        } catch (error) {
            console.error('Error generating summary report:', error);
            throw error;
        }
    }

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
            const weeks = Math.ceil(days / 7);

            // MATCH DASHBOARD FORMULA: weeks + 1
            if (weeks < 0) return 0;
            return weeks + 1;
        } catch (error) {
            return 1;
        }
    }

    // Send message to group (with optional PDF attachment)
    async sendToGroup(message, pdfUrl = null) {
        try {
            if (!this.groupId) {
                console.log(
                    '⚠️ FONNTE_GROUP_ID not set, skipping group broadcast'
                );
                return { success: false, error: 'Group ID not configured' };
            }

            if (!this.apiToken) {
                console.log('⚠️ FONNTE_API_TOKEN not set');
                return { success: false, error: 'API token not configured' };
            }

            console.log(`📤 Sending broadcast to group: ${this.groupId}`);

            const payload = {
                target: this.groupId,
                message: message,
                countryCode: '62',
            };

            // Add PDF URL if provided
            if (pdfUrl) {
                payload.url = pdfUrl; // Fonnte uses 'url' parameter for file attachments
                console.log(`📎 Attaching PDF: ${pdfUrl}`);
            }

            const response = await axios.post(this.apiUrl, payload, {
                headers: {
                    Authorization: this.apiToken,
                },
            });

            console.log('✅ Group broadcast sent successfully');

            return {
                success: response.data.status === true,
                messageId: response.data.id,
                detail: response.data.detail,
            };
        } catch (error) {
            console.error('❌ Error sending group broadcast:', error.message);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    // Main broadcast function
    async sendBiWeeklyReport(pdfUrl = null) {
        try {
            console.log('📊 Generating bi-weekly report...');
            const message = await this.generateSummaryReport();

            console.log('📤 Sending to WhatsApp group...');
            const result = await this.sendToGroup(message, pdfUrl);

            if (result.success) {
                console.log('✅ Bi-weekly report broadcast completed!');
            } else {
                console.error(
                    '❌ Bi-weekly report broadcast failed:',
                    result.error
                );
            }

            return result;
        } catch (error) {
            console.error('❌ Error in bi-weekly report broadcast:', error);
            return { success: false, error: error.message };
        }
    }
}

export default new GroupBroadcastService();
