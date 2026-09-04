# 📄 Cara Lampirkan PDF ke Broadcast WhatsApp

## Problem yang Ditemukan

1. **Data Tidak Sesuai Dashboard**:

    - ✅ **SUDAH DIPERBAIKI** - Formula tunggakan sekarang sama dengan dashboard
    - Sebelumnya: `(currentWeek - weeksPaid) * 2000`
    - Sekarang: `(currentWeek * 2000) - totalPaid` ← Sama dengan dashboard

2. **Lampiran PDF ke Broadcast**:
    - ✅ **SUDAH DITAMBAHKAN** - Support PDF URL via Fonnte API

---

## 🎯 Cara Menggunakan Lampiran PDF

### Opsi 1: Manual Trigger via API (RECOMMENDED)

1. **Upload PDF Anda ke server yang publicly accessible**

    - Contoh: Upload ke folder `uploads/reports/` di server
    - URL harus bisa diakses publik (HTTPS lebih baik)
    - Contoh URL: `https://triforce.fahmi.app/uploads/reports/laporan-kas.pdf`

2. **Trigger broadcast dengan PDF**:

```bash
curl -X POST https://triforce.fahmi.app/api/notifications/send-group-broadcast \
  -H "Content-Type: application/json" \
  -d '{
    "pdfUrl": "https://triforce.fahmi.app/uploads/reports/laporan-kas.pdf"
  }'
```

**Atau via JavaScript**:

```javascript
const response = await fetch('/api/notifications/send-group-broadcast', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        pdfUrl: 'https://triforce.fahmi.app/uploads/reports/laporan-kas.pdf',
    }),
});
```

---

### Opsi 2: Auto-generate PDF Saat Broadcast

Jika Anda ingin PDF **auto-generate** setiap kali broadcast, tambahkan fungsi generate PDF ke `groupBroadcastService.js`:

#### Step 1: Install jsPDF di backend

```bash
cd server
npm install jspdf jspdf-autotable
```

#### Step 2: Tambahkan fungsi generate PDF

Edit `/server/services/groupBroadcastService.js`:

```javascript
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import fs from 'fs';
import path from 'path';

// Tambahkan method baru di class GroupBroadcastService:

async generatePDF() {
    try {
        const [students, payments, expenses, settingData] = await Promise.all([
            Student.find({ status: 'Aktif' }),
            Payment.find(),
            Expense.find(),
            Setting.find()
        ]);

        const doc = new jsPDF();

        // Title
        doc.setFontSize(16);
        doc.text('LAPORAN KAS KELAS', 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 105, 27, { align: 'center' });

        // Summary Stats
        const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const balance = totalIncome - totalExpenses;

        doc.setFontSize(10);
        doc.text(`Total Pemasukan: Rp ${totalIncome.toLocaleString('id-ID')}`, 20, 40);
        doc.text(`Total Pengeluaran: Rp ${totalExpenses.toLocaleString('id-ID')}`, 20, 47);
        doc.text(`Saldo Kas: Rp ${balance.toLocaleString('id-ID')}`, 20, 54);

        // Student table
        const currentWeek = await this.getCurrentWeek();
        const tableData = students.map((student) => {
            const studentPayments = payments.filter(
                (p) => p.studentId?.toString() === student._id.toString()
            );
            const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount, 0);
            const shouldPay = currentWeek * 2000;
            const tunggakan = Math.max(0, shouldPay - totalPaid);

            return [
                student.absen,
                student.nickname || student.name,
                `Rp ${totalPaid.toLocaleString('id-ID')}`,
                `Rp ${tunggakan.toLocaleString('id-ID')}`,
                tunggakan === 0 ? 'Lunas' : 'Belum Lunas'
            ];
        });

        autoTable(doc, {
            startY: 65,
            head: [['Absen', 'Nama', 'Total Bayar', 'Tunggakan', 'Status']],
            body: tableData,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [79, 70, 229] }
        });

        // Save to uploads folder
        const uploadsDir = path.join(process.cwd(), 'uploads', 'reports');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filename = `laporan-${new Date().toISOString().split('T')[0]}.pdf`;
        const filepath = path.join(uploadsDir, filename);

        // Save PDF
        fs.writeFileSync(filepath, doc.output('arraybuffer'));

        // Return public URL
        const baseUrl = process.env.BASE_URL || 'https://triforce.fahmi.app';
        const pdfUrl = `${baseUrl}/uploads/reports/${filename}`;

        console.log(`✅ PDF generated: ${pdfUrl}`);
        return pdfUrl;

    } catch (error) {
        console.error('Error generating PDF:', error);
        return null;
    }
}

// Update sendBiWeeklyReport method:
async sendBiWeeklyReport(pdfUrl = null) {
    try {
        console.log('📊 Generating bi-weekly report...');
        const message = await this.generateSummaryReport();

        // Auto-generate PDF if not provided
        if (!pdfUrl) {
            console.log('📄 Generating PDF report...');
            pdfUrl = await this.generatePDF();
        }

        console.log('📤 Sending to WhatsApp group...');
        const result = await this.sendToGroup(message, pdfUrl);

        if (result.success) {
            console.log('✅ Bi-weekly report broadcast completed!');
        } else {
            console.error('❌ Bi-weekly report broadcast failed:', result.error);
        }

        return result;
    } catch (error) {
        console.error('❌ Error in bi-weekly report broadcast:', error);
        return { success: false, error: error.message };
    }
}
```

#### Step 3: Update server.js untuk serve PDF

Pastikan `server.js` sudah serve folder uploads:

```javascript
// server.js
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

#### Step 4: Test

```bash
# Restart server
npm run dev

# Trigger broadcast (akan auto-generate PDF)
curl -X POST http://localhost:5000/api/notifications/send-group-broadcast
```

---

### Opsi 3: Upload PDF Manual via Frontend (Easiest for Non-Tech Users)

1. **Tambahkan UI upload PDF** di NotificationManager component
2. **Upload PDF ke `/uploads/reports/`** via API endpoint
3. **Trigger broadcast** dengan PDF URL

---

## 🔍 Verifikasi Data Sudah Benar

### Test Formula Tunggakan:

```javascript
// Di browser console (halaman dashboard):
const studentId = students[0]._id; // Ambil student pertama
const totalPaid = getTotalPaid(studentId);
const shouldPay = currentWeek * 2000;
const tunggakan = shouldPay - totalPaid;

console.log('Total Paid:', totalPaid);
console.log('Should Pay:', shouldPay);
console.log('Tunggakan:', tunggakan);
```

### Test Broadcast:

```bash
# Without PDF
curl -X POST https://triforce.fahmi.app/api/notifications/send-group-broadcast

# With PDF
curl -X POST https://triforce.fahmi.app/api/notifications/send-group-broadcast \
  -H "Content-Type: application/json" \
  -d '{"pdfUrl": "https://triforce.fahmi.app/uploads/reports/laporan.pdf"}'
```

---

## 📋 Format PDF URL yang Didukung Fonnte

Fonnte API menerima:

-   ✅ **URL** (parameter `url`): Link to PDF/image/video file
-   ✅ **Direct download link** (must be publicly accessible)
-   ❌ **File upload**: Fonnte tidak support multipart upload, harus via URL

**Contoh Valid URLs**:

```
https://triforce.fahmi.app/uploads/reports/laporan-2025-11-23.pdf
https://example.com/public/report.pdf
https://drive.google.com/uc?export=download&id=FILE_ID (Google Drive direct link)
```

---

## 🚀 Quick Start (Recommended)

1. **Export PDF dari dashboard** (tombol "Export PDF" yang sudah ada)
2. **Upload PDF ke server**:
    ```bash
    scp laporan.pdf user@triforce.fahmi.app:/home/fahmi/Documents/Project/kas-kelas/server/uploads/reports/
    ```
3. **Trigger broadcast**:
    ```bash
    curl -X POST https://triforce.fahmi.app/api/notifications/send-group-broadcast \
      -H "Content-Type: application/json" \
      -d '{"pdfUrl": "https://triforce.fahmi.app/uploads/reports/laporan.pdf"}'
    ```

---

## 🐛 Troubleshooting

### PDF tidak terkirim?

-   ✅ Check PDF URL publicly accessible (buka di browser incognito)
-   ✅ Verify URL format (must be full URL with https://)
-   ✅ Check Fonnte API response for errors
-   ✅ Check server logs: `tail -f server/logs/output.log`

### Data masih tidak sesuai?

-   ✅ Restart server setelah update code
-   ✅ Clear cache browser
-   ✅ Verify formula di groupBroadcastService.js line 67
-   ✅ Check `currentWeek` value sama antara dashboard & service

---

## 📝 Environment Variables Required

```env
# .env
FONNTE_API_TOKEN=your_token_here
FONNTE_GROUP_ID=your_group_id_here
BASE_URL=https://triforce.fahmi.app  # For PDF URL generation
```

---

**Need Help?** Check Fonnte API docs: https://fonnte.com/api/send-message/
