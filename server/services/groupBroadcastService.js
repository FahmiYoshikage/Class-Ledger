import axios from 'axios';
import Setting from '../models/Setting.js';
import Student from '../models/Student.js';
import Payment from '../models/Payment.js';
import Expense from '../models/Expense.js';
import pdfReportService from './pdfReportService.js';

class GroupBroadcastService {
    constructor() {
        this.apiUrl = 'https://api.fonnte.com/send';
        this.apiToken = process.env.FONNTE_API_TOKEN;
        this.groupId = process.env.FONNTE_GROUP_ID;
    }

    // Generate bi-weekly summary report text
    async generateSummaryReport() {
        try {
            // ============================================================
            // EXACT DASHBOARD LOGIC - DO NOT MODIFY WITHOUT UPDATING BOTH
            // ============================================================

            // Get settings
            const startDateSetting = await Setting.findOne({
                key: 'start_date',
            });
            const startDate = startDateSetting?.value
                ? new Date(startDateSetting.value)
                : new Date(process.env.START_DATE || '2025-10-27');

            console.log('📊 Broadcast Report Generation:');
            console.log('  Start Date:', startDate.toISOString().split('T')[0]);

            const [
                allStudents,
                allPayments,
                allExpenses,
                semesterNameSetting,
                classNameSetting,
            ] = await Promise.all([
                Student.find(),
                Payment.find().populate('studentId'),
                Expense.find(),
                Setting.findOne({ key: 'semester_name' }),
                Setting.findOne({ key: 'class_name' }),
            ]);

            // ============================================================
            // FILTER LOGIC - MATCH DASHBOARD EXACTLY
            // ============================================================

            // 1. Filter ACTIVE students only
            const students = allStudents.filter((s) => s.status === 'Aktif');

            // 2. Filter payments: semester only + has studentId + student is ACTIVE
            const payments = allPayments.filter((p) => {
                if (!p.date || new Date(p.date) < startDate) return false;
                if (!p.studentId || !p.studentId._id) return false;

                // Check if student is active
                const student = students.find(
                    (s) => s._id.toString() === p.studentId._id.toString()
                );
                return student != null;
            });

            // 3. Filter expenses for semester
            const expenses = allExpenses.filter(
                (e) => new Date(e.date) >= startDate
            );

            console.log('  Total Students (All):', allStudents.length);
            console.log('  Total Students (Aktif):', students.length);
            console.log(
                '  Inactive Students:',
                allStudents.length - students.length
            );
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

            // ============================================================
            // TUNGGAKAN CALCULATION - EXACT DASHBOARD FORMULA
            // ============================================================
            const currentWeek = await this.getCurrentWeek();
            const weeklyAmount = 2000;

            // Helper function: getTotalPaid (match dashboard)
            const getTotalPaid = (studentId) => {
                const studentIdStr = studentId.toString();
                const studentPayments = payments.filter((p) => {
                    // Handle populated studentId (p.studentId is full object)
                    const pStudentId = p.studentId?._id || p.studentId;
                    const pStudentIdStr = pStudentId?.toString();

                    // Debug first match
                    if (
                        studentIdStr === students[0]?._id.toString() &&
                        payments.indexOf(p) === 0
                    ) {
                        console.log('  DEBUG getTotalPaid:', {
                            studentId: studentIdStr,
                            pStudentId: pStudentIdStr,
                            match: pStudentIdStr === studentIdStr,
                            amount: p.amount,
                        });
                    }

                    return pStudentIdStr === studentIdStr;
                });

                const total = studentPayments.reduce(
                    (sum, p) => sum + p.amount,
                    0
                );

                // Debug first student result
                if (studentIdStr === students[0]?._id.toString()) {
                    console.log(
                        '  First student total paid:',
                        total,
                        'from',
                        studentPayments.length,
                        'payments'
                    );
                }

                return total;
            };

            // Helper function: getTunggakan (match dashboard)
            const getTunggakan = (studentId) => {
                const totalPaid = getTotalPaid(studentId);
                const shouldPay = currentWeek * weeklyAmount;
                const tunggakan = shouldPay - totalPaid;

                // SOLUSI BUG MINGGU: Jika sudah bayar sebelum 4 minggu dari sekarang, anggap LUNAS
                // Check apakah ada pembayaran sebelum cutoff date (4 minggu yang lalu)
                const fourWeeksAgo = new Date();
                fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28); // 4 minggu = 28 hari

                const studentPayments = payments.filter((p) => {
                    const pStudentId = p.studentId?._id || p.studentId;
                    return pStudentId?.toString() === studentId.toString();
                });

                const hasOldPayment = studentPayments.some(
                    (p) => new Date(p.date) < fourWeeksAgo
                );

                // Jika punya payment lama DAN total bayar >= 4 minggu (Rp 8k), anggap lunas
                if (hasOldPayment && totalPaid >= 4 * weeklyAmount) {
                    return 0; // LUNAS
                }

                return tunggakan;
            };

            const studentsWithStatus = students.map((student) => {
                const tunggakan = getTunggakan(student._id);
                return {
                    name: student.nickname || student.name,
                    tunggakan,
                    isLunas: tunggakan <= 0,
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

            // ============================================================
            // TOP CONTRIBUTORS - Use getTotalPaid for consistency
            // ============================================================
            const contributorMap = students.map((student) => ({
                name: student.nickname || student.name,
                total: getTotalPaid(student._id),
            }));

            const topContributors = contributorMap
                .filter((c) => c.total > 0)
                .sort((a, b) => b.total - a.total)
                .slice(0, 3)
                .map(({ name, total }, idx) => {
                    const medal = ['🥇', '🥈', '🥉'][idx];
                    return `${medal} ${name}: Rp ${total.toLocaleString(
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

    // Main broadcast function (AUTO-GENERATE PDF)
    async sendBiWeeklyReport(pdfUrl = null) {
        try {
            console.log('📊 Generating bi-weekly report...');
            const message = await this.generateSummaryReport();

            // Auto-generate PDF if no URL provided
            let attachmentUrl = pdfUrl;
            if (!attachmentUrl) {
                console.log('📄 Auto-generating PDF report...');
                const pdfResult =
                    await pdfReportService.generateFinancialReport();

                // Construct public URL (adjust based on your deployment)
                const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
                attachmentUrl = `${baseUrl}${pdfResult.url}`;
                console.log('✅ PDF Generated:', attachmentUrl);
            }

            console.log('📤 Sending to WhatsApp group...');
            const result = await this.sendToGroup(message, attachmentUrl);

            if (result.success) {
                console.log('✅ Bi-weekly report broadcast completed!');
                return result;
            } else {
                const errorMsg =
                    result.error || result.detail || JSON.stringify(result);
                console.error(
                    '❌ Bi-weekly report broadcast failed:',
                    errorMsg
                );
                return result;
            }
        } catch (error) {
            console.error(
                '❌ Error in bi-weekly report broadcast:',
                error.message
            );
            console.error('Stack:', error.stack);
            return { success: false, error: error.message };
        }
    }
}

export default new GroupBroadcastService();
