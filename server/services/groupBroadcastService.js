import axios from 'axios';
import Setting from '../models/Setting.js';
import Student from '../models/Student.js';
import Payment from '../models/Payment.js';
import Expense from '../models/Expense.js';
import pdfReportService from './pdfReportService.js';
import antiBanService from './antiBanService.js';

class GroupBroadcastService {
    constructor() {
        this.apiUrl = 'https://api.fonnte.com/send';
        this.apiToken = process.env.FONNTE_API_TOKEN;
        this.groupId = process.env.FONNTE_GROUP_ID;
    }

    // Generate all bi-weekly summary report templates in a single query pass
    async generateAllTemplates() {
        try {
            // Get settings
            const startDateSetting = await Setting.findOne({
                key: 'start_date',
            });
            const startDate = startDateSetting?.value
                ? new Date(startDateSetting.value)
                : new Date(process.env.START_DATE || '2025-10-27');

            const [
                allStudents,
                allPayments,
                allExpenses,
                semesterNameSetting,
                classNameSetting,
                weeklyAmountSetting,
                lateThresholdSetting,
                paymentAccountsSetting,
                paymentNotesSetting,
            ] = await Promise.all([
                Student.find(),
                Payment.find().populate('studentId'),
                Expense.find(),
                Setting.findOne({ key: 'semester_name' }),
                Setting.findOne({ key: 'class_name' }),
                Setting.findOne({ key: 'weekly_amount' }),
                Setting.findOne({ key: 'late_threshold' }),
                Setting.findOne({ key: 'payment_accounts' }),
                Setting.findOne({ key: 'payment_notes' }),
            ]);

            // 1. Filter ACTIVE students only
            const students = allStudents.filter((s) => s.status === 'Aktif');
            const allPaymentsList = allPayments;

            // Student payments only
            const studentPayments = allPaymentsList.filter((p) => {
                if (!p.studentId || !p.studentId._id) return false;
                const student = students.find(
                    (s) => s._id.toString() === p.studentId._id.toString()
                );
                return student != null;
            });

            const expenses = allExpenses;
            const semesterName =
                semesterNameSetting?.value || 'Semester 2024/2025';
            const className = classNameSetting?.value || 'Kas Kelas';
            const weeklyAmount = Number(weeklyAmountSetting?.value) || 2000;
            const lateThreshold = Number(lateThresholdSetting?.value) || 4;
            const lateAmount = weeklyAmount * lateThreshold;
            const paymentAccounts = Array.isArray(paymentAccountsSetting?.value) ? paymentAccountsSetting.value : [];
            const paymentNotes = paymentNotesSetting?.value || '';

            // Format dynamic payment info text
            let paymentInfoBlock = '';
            if (paymentAccounts.length > 0) {
                const accLines = paymentAccounts.map((acc) => {
                    const holder = acc.accountHolder ? ` (a.n ${acc.accountHolder})` : '';
                    return `• ${acc.bankName || acc.provider}: *${acc.accountNumber}*${holder}`;
                }).join('\n');
                paymentInfoBlock = `💳 *INFORMASI PEMBAYARAN:*\n${accLines}${paymentNotes ? `\n_${paymentNotes}_` : ''}`;
            } else {
                paymentInfoBlock = `💳 *INFORMASI PEMBAYARAN:*\nSilakan hubungi Bendahara Kelas untuk nomor rekening pembayaran.`;
            }

            // Calculate statistics
            const totalIncome = allPaymentsList.reduce(
                (sum, p) => sum + (p.amount || 0),
                0
            );
            const totalExpenses = expenses.reduce(
                (sum, e) => sum + (e.amount || 0),
                0
            );
            const balance = totalIncome - totalExpenses;

            // Recent 2 weeks payments
            const twoWeeksAgo = new Date();
            twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
            const recentPayments = allPaymentsList.filter(
                (p) => new Date(p.date) >= twoWeeksAgo
            );
            const recentIncome = recentPayments.reduce(
                (sum, p) => sum + p.amount,
                0
            );

            // Tunggakan calculation
            const currentWeek = await this.getCurrentWeek();

            let accumulatedWeeks = 7;
            try {
                const accRes = await Setting.findOne({ key: 'accumulated_weeks' });
                if (accRes?.value != null) {
                    accumulatedWeeks = parseInt(accRes.value);
                }
            } catch (e) {
                // Use default
            }

            const getTotalPaid = (studentId) => {
                const studentIdStr = studentId.toString();
                const filtered = studentPayments.filter((p) => {
                    const pStudentId = p.studentId?._id || p.studentId;
                    return pStudentId?.toString() === studentIdStr;
                });
                return filtered.reduce((sum, p) => sum + p.amount, 0);
            };

            const getTunggakan = (studentId) => {
                const totalPaid = getTotalPaid(studentId);
                const totalWeeks = accumulatedWeeks + currentWeek;
                const shouldPay = totalWeeks * weeklyAmount;
                return shouldPay - totalPaid;
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

            // Top contributors
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

            // Top debtors
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

            const summaryTpl = `
📊 *UPDATE KAS KELAS (RINGKAS)* 📊
${className} - ${semesterName}
━━━━━━━━━━━━━━━━━━━━

💰 Total Pemasukan: Rp ${totalIncome.toLocaleString('id-ID')}
💸 Total Pengeluaran: Rp ${totalExpenses.toLocaleString('id-ID')}
💵 Saldo Kas Saat Ini: *Rp ${balance.toLocaleString('id-ID')}*

📅 *Periode:* Minggu Ke-${currentWeek} (Rp ${weeklyAmount.toLocaleString('id-ID')}/minggu)
👥 *Status Siswa:* ✅ ${lunasCount} Lunas | ⚠️ ${belumLunasCount} Belum Lunas

━━━━━━━━━━━━━━━━━━━━
${paymentInfoBlock}

🏆 Cek Rincian: ${process.env.BASE_URL || ''}/leaderboard
_Terima kasih atas kerja samanya!_ 🙏
            `.trim();

            const arrearsTpl = `
⚠️ *PENGINGAT KAS & DAFTAR TUNGGAKAN* ⚠️
${className} - ${semesterName}
━━━━━━━━━━━━━━━━━━━━

💰 Saldo Kas Saat Ini: *Rp ${balance.toLocaleString('id-ID')}*
📅 Periode: Minggu Ke-${currentWeek} (Kas: Rp ${weeklyAmount.toLocaleString('id-ID')}/minggu)
👥 Siswa Belum Lunas: *${belumLunasCount} siswa*

${
    topDebtors.length > 0
        ? `⚠️ *DAFTAR TUNGGAKAN TERBESAR:*
${topDebtors.join('\n')}

_Yuk segera dilunasi ya teman-teman agar operasional kas kelas tetap aman!_ 💪`
        : 'Alhamdulillah semua siswa sudah lunas! 🎉'
}

━━━━━━━━━━━━━━━━━━━━
${paymentInfoBlock}

🏆 Cek Rincian: ${process.env.BASE_URL || ''}/leaderboard
            `.trim();

            const fullTpl = `
📊 *LAPORAN KAS KELAS* 📊
${className} - ${semesterName}
━━━━━━━━━━━━━━━━━━━━

💰 *RINGKASAN KEUANGAN:*
• Total Pemasukan: Rp ${totalIncome.toLocaleString('id-ID')}
• Total Pengeluaran: Rp ${totalExpenses.toLocaleString('id-ID')}
• Saldo Kas: *Rp ${balance.toLocaleString('id-ID')}*

📅 *PERIODE:*
• Minggu Ke-${currentWeek}
• Kas per minggu: Rp ${weeklyAmount.toLocaleString('id-ID')}
• Status Telat: Tunggakan ≥ Rp ${lateAmount.toLocaleString('id-ID')}

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
${paymentInfoBlock}

🏆 Cek Leaderboard Lengkap:
${process.env.BASE_URL || ''}/leaderboard

💡 _Keterangan:_
_• Data hanya menghitung pembayaran siswa_
_• Tunggakan dihitung per minggu (Rp ${weeklyAmount.toLocaleString('id-ID')}/minggu)_

_Laporan ini dikirim otomatis setiap minggu_
_Terima kasih atas partisipasinya!_ 🙏
            `.trim();

            return {
                full: fullTpl,
                summary: summaryTpl,
                arrears: arrearsTpl,
            };
        } catch (error) {
            console.error('Error generating summary report:', error);
            throw error;
        }
    }

    // Generate bi-weekly summary report text
    async generateSummaryReport(templateType = 'full') {
        const templates = await this.generateAllTemplates();
        return templates[templateType] || templates.full;
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
            const diffTime = Math.abs(now - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const currentWeek = Math.max(1, Math.ceil(diffDays / 7));

            return currentWeek;
        } catch (error) {
            return 1;
        }
    }

    // Send message to group (with optional PDF attachment)
    async sendToGroup(message, pdfUrl = null, targetGroupId = null) {
        try {
            const destGroupId =
                targetGroupId ||
                this.groupId ||
                (await Setting.findOne({ key: 'fonnte_group_id' }))?.value ||
                process.env.FONNTE_GROUP_ID;

            if (!destGroupId) {
                console.log(
                    '⚠️ FONNTE_GROUP_ID not set, skipping group broadcast'
                );
                return {
                    success: false,
                    error: 'Group ID WhatsApp belum ditentukan. Silakan masukkan Group ID tujuan.',
                };
            }

            if (!this.apiToken) {
                console.log('⚠️ FONNTE_API_TOKEN not set');
                return {
                    success: false,
                    error: 'API token Fonnte belum dikonfigurasi di server (.env).',
                };
            }

            console.log(`📤 Sending broadcast to group: ${destGroupId}`);

            // 🛡️ Humanisasi pesan grup (anti-ban)
            const humanizedMessage = antiBanService.humanizeMessage(message);

            const payload = {
                target: destGroupId,
                message: humanizedMessage,
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

            console.log('✅ Group broadcast response:', response.data);

            const isSuccess = response.data.status === true;
            return {
                success: isSuccess,
                messageId: response.data.id,
                detail: response.data.detail,
                target: destGroupId,
                error: isSuccess ? null : (response.data.reason || response.data.detail || 'Gagal mengirim pesan via Fonnte'),
            };
        } catch (error) {
            console.error('❌ Error sending group broadcast:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.reason || error.response?.data?.detail || error.message,
            };
        }
    }

    // Main broadcast function (AUTO-GENERATE PDF)
    async sendBiWeeklyReport(pdfUrl = null, customMessage = null, targetGroupId = null, attachPdf = true) {
        try {
            console.log('📊 Generating group report broadcast...');
            const message = customMessage || (await this.generateSummaryReport());

            // Auto-generate PDF if requested and no URL provided
            let attachmentUrl = null;
            if (attachPdf) {
                if (pdfUrl) {
                    attachmentUrl = pdfUrl;
                } else {
                    console.log('📄 Auto-generating PDF report...');
                    try {
                        const pdfResult =
                            await pdfReportService.generateFinancialReport();

                        // Construct public URL
                        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
                        attachmentUrl = `${baseUrl}${pdfResult.url}`;
                        console.log('✅ PDF Generated:', attachmentUrl);
                    } catch (pdfErr) {
                        console.warn('⚠️ Gagal membuat PDF, pesan tetap dikirim tanpa lampiran PDF:', pdfErr.message);
                        attachmentUrl = null;
                    }
                }
            }

            console.log('📤 Sending to WhatsApp group...');
            const result = await this.sendToGroup(message, attachmentUrl, targetGroupId);

            if (result.success) {
                console.log('✅ Group report broadcast completed successfully!');
                return result;
            } else {
                const errorMsg =
                    result.error || result.detail || JSON.stringify(result);
                console.error(
                    '❌ Group report broadcast failed:',
                    errorMsg
                );
                return result;
            }
        } catch (error) {
            console.error(
                '❌ Error in group report broadcast:',
                error.message
            );
            console.error('Stack:', error.stack);
            return { success: false, error: error.message };
        }
    }

    // Alias for weekly report broadcast
    async sendWeeklyReport(pdfUrl = null, customMessage = null, targetGroupId = null, attachPdf = true) {
        return this.sendBiWeeklyReport(pdfUrl, customMessage, targetGroupId, attachPdf);
    }
}

export default new GroupBroadcastService();
