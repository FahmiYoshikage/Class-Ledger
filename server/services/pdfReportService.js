import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Student from '../models/Student.js';
import Payment from '../models/Payment.js';
import Expense from '../models/Expense.js';
import Setting from '../models/Setting.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PDFReportService {
    constructor() {
        // Set reports directory path (create on-demand)
        this.reportsDir = path.join(__dirname, '../public/reports');
    }

    // Ensure reports directory exists (with error handling)
    ensureReportsDir() {
        try {
            if (!fs.existsSync(this.reportsDir)) {
                fs.mkdirSync(this.reportsDir, { recursive: true });
            }
            // Test write permission by creating a test file
            const testFile = path.join(this.reportsDir, '.write-test');
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
            console.log('✅ Reports directory writable:', this.reportsDir);
        } catch (error) {
            console.warn(
                '⚠️ Cannot write to reports dir, using /tmp:',
                error.message
            );
            // Fallback to /tmp if permission denied
            this.reportsDir = '/tmp/reports';
            if (!fs.existsSync(this.reportsDir)) {
                fs.mkdirSync(this.reportsDir, { recursive: true });
            }
            console.log('📁 Using fallback directory:', this.reportsDir);
        }
    }

    // Get current week (MATCH DASHBOARD)
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

    // Generate financial report PDF
    async generateFinancialReport() {
        try {
            // Ensure directory exists
            this.ensureReportsDir();

            console.log('📄 Generating PDF Report...');

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
            ] = await Promise.all([
                Student.find(),
                Payment.find().populate('studentId'),
                Expense.find(),
                Setting.findOne({ key: 'semester_name' }),
                Setting.findOne({ key: 'class_name' }),
            ]);

            // Filter data (EXACT DASHBOARD LOGIC)
            // Dashboard uses ALL data without date filtering for totals
            const students = allStudents.filter((s) => s.status === 'Aktif');

            // ALL payments (NO date filter — dashboard sums everything)
            const allPaymentsList = allPayments;

            // Student-only payments from active students (for tunggakan)
            const studentPayments = allPaymentsList.filter((p) => {
                if (!p.studentId || !p.studentId._id) return false;
                const student = students.find(
                    (s) => s._id.toString() === p.studentId._id.toString()
                );
                return student != null;
            });

            // ALL expenses (NO date filter — dashboard sums everything)
            const expenses = allExpenses;

            // Calculate totals
            const currentWeek = await this.getCurrentWeek();
            const weeklyAmount = 2000;
            const totalIncome = allPaymentsList.reduce((sum, p) => sum + (p.amount || 0), 0);
            const totalExpenses = expenses.reduce(
                (sum, e) => sum + e.amount,
                0
            );
            const balance = totalIncome - totalExpenses;

            const semesterName =
                semesterNameSetting?.value || 'Semester 2024/2025';
            const className = classNameSetting?.value || 'Kelas';

            // Get helper functions
            const getTotalPaid = (studentId) => {
                const filtered = studentPayments.filter((p) => {
                    const pStudentId = p.studentId?._id || p.studentId;
                    return pStudentId?.toString() === studentId.toString();
                });
                return filtered.reduce((sum, p) => sum + p.amount, 0);
            };

            // Get accumulatedWeeks from previous semesters (MATCH DASHBOARD)
            let accumulatedWeeks = 7; // default
            try {
                const accRes = await Setting.findOne({ key: 'accumulated_weeks' });
                if (accRes?.value != null) {
                    accumulatedWeeks = parseInt(accRes.value);
                }
            } catch (e) {
                // Use default
            }

            const getTunggakan = (studentId) => {
                const totalPaid = getTotalPaid(studentId);
                const totalWeeks = accumulatedWeeks + currentWeek;
                const shouldPay = totalWeeks * weeklyAmount;
                return shouldPay - totalPaid;
            };

            // Prepare data
            const studentsData = students.map((s) => ({
                name: s.name,
                nickname: s.nickname,
                absen: s.absen,
                totalPaid: getTotalPaid(s._id),
                tunggakan: getTunggakan(s._id),
            }));

            const lunasCount = studentsData.filter(
                (s) => s.tunggakan <= 0
            ).length;
            const belumLunasCount = students.length - lunasCount;

            // Generate filename
            const filename = `Laporan-Kas-${
                new Date().toISOString().split('T')[0]
            }.pdf`;
            const filepath = path.join(this.reportsDir, filename);

            // Create PDF
            const doc = new PDFDocument({ margin: 40 });
            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);

            // ===== HEADER =====
            doc.fontSize(20)
                .font('Helvetica-Bold')
                .text('LAPORAN KAS KELAS', { align: 'center' });
            doc.fontSize(16).text(className, { align: 'center' });
            doc.fontSize(12)
                .font('Helvetica')
                .text(semesterName, { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(10).text(
                `Minggu Ke-${currentWeek} | ${new Date().toLocaleDateString(
                    'id-ID',
                    {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    }
                )}`,
                { align: 'center' }
            );
            doc.moveDown(2);

            // ===== RINGKASAN KEUANGAN =====
            doc.fontSize(14)
                .font('Helvetica-Bold')
                .text('RINGKASAN KEUANGAN', { underline: true });
            doc.moveDown(0.5);

            doc.fontSize(11).font('Helvetica');
            doc.text(
                `Total Pemasukan:          Rp ${totalIncome.toLocaleString(
                    'id-ID'
                )}`
            );
            doc.text(
                `Total Pengeluaran:        Rp ${totalExpenses.toLocaleString(
                    'id-ID'
                )}`
            );
            doc.font('Helvetica-Bold').text(
                `Saldo Kas:                Rp ${balance.toLocaleString(
                    'id-ID'
                )}`
            );
            doc.moveDown(1);

            doc.font('Helvetica').fontSize(11);
            doc.text(`Total Siswa:              ${students.length} orang`);
            doc.text(`Lunas:                    ${lunasCount} siswa`);
            doc.text(`Belum Lunas:              ${belumLunasCount} siswa`);
            doc.moveDown(2);

            // ===== DAFTAR SISWA =====
            doc.fontSize(14)
                .font('Helvetica-Bold')
                .text('DAFTAR SISWA & STATUS PEMBAYARAN', { underline: true });
            doc.moveDown(0.5);

            // Sort by absen
            const sortedStudents = studentsData.sort(
                (a, b) => a.absen - b.absen
            );

            doc.fontSize(9).font('Helvetica');
            let yPosition = doc.y;

            // Table header
            doc.font('Helvetica-Bold');
            doc.text('No', 40, yPosition, { width: 30 });
            doc.text('Nama', 70, yPosition, { width: 120 });
            doc.text('Total Bayar', 200, yPosition, {
                width: 80,
                align: 'right',
            });
            doc.text('Tunggakan', 290, yPosition, {
                width: 80,
                align: 'right',
            });
            doc.text('Status', 380, yPosition, { width: 60, align: 'center' });
            yPosition += 15;

            doc.moveTo(40, yPosition - 5)
                .lineTo(550, yPosition - 5)
                .stroke();

            // Table rows
            doc.font('Helvetica');
            sortedStudents.forEach((student, idx) => {
                // Check page break
                if (yPosition > 700) {
                    doc.addPage();
                    yPosition = 40;

                    // Reprint header
                    doc.font('Helvetica-Bold');
                    doc.text('No', 40, yPosition, { width: 30 });
                    doc.text('Nama', 70, yPosition, { width: 120 });
                    doc.text('Total Bayar', 200, yPosition, {
                        width: 80,
                        align: 'right',
                    });
                    doc.text('Tunggakan', 290, yPosition, {
                        width: 80,
                        align: 'right',
                    });
                    doc.text('Status', 380, yPosition, {
                        width: 60,
                        align: 'center',
                    });
                    yPosition += 15;
                    doc.moveTo(40, yPosition - 5)
                        .lineTo(550, yPosition - 5)
                        .stroke();
                    doc.font('Helvetica');
                }

                const displayName = student.nickname || student.name;
                const status = student.tunggakan <= 0 ? 'LUNAS' : 'BELUM';

                doc.text(`${student.absen}`, 40, yPosition, { width: 30 });
                doc.text(displayName, 70, yPosition, { width: 120 });
                doc.text(
                    `Rp ${student.totalPaid.toLocaleString('id-ID')}`,
                    200,
                    yPosition,
                    { width: 80, align: 'right' }
                );
                doc.text(
                    student.tunggakan > 0
                        ? `Rp ${student.tunggakan.toLocaleString('id-ID')}`
                        : '-',
                    290,
                    yPosition,
                    { width: 80, align: 'right' }
                );
                doc.text(status, 380, yPosition, {
                    width: 60,
                    align: 'center',
                });
                yPosition += 20;
            });

            doc.moveDown(2);

            // ===== FOOTER =====
            doc.fontSize(8)
                .font('Helvetica')
                .text(
                    'Laporan ini dibuat otomatis oleh sistem Kas Kelas',
                    40,
                    750,
                    { align: 'center' }
                );

            // Finalize PDF
            doc.end();

            // Wait for stream to finish
            await new Promise((resolve, reject) => {
                stream.on('finish', resolve);
                stream.on('error', reject);
            });

            console.log('✅ PDF Generated:', filename);

            return {
                filename,
                filepath,
                url: `/reports/${filename}`,
            };
        } catch (error) {
            console.error('❌ PDF Generation Error:', error);
            throw error;
        }
    }
}

export default new PDFReportService();
