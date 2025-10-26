# 🤖 WhatsApp Notification Bot - Setup Guide

## 📱 Fitur WhatsApp Notification Bot

Sistem notifikasi otomatis via WhatsApp untuk mengingatkan siswa yang belum membayar kas kelas dengan cara yang **kreatif dan variatif**!

### ✨ Keunggulan Fitur Ini:

1. **🎨 6 Kategori Pesan Kreatif**

    - 😊 Friendly & Santai - Pesan hangat dan bersahabat
    - 💪 Motivational - Pesan yang memotivasi
    - 📋 Formal - Pesan resmi tapi tetap ramah
    - ⚡ Energetic - Pesan penuh energi dan semangat
    - 😄 Humorous - Pesan lucu dan menghibur
    - 🌸 Gentle - Pesan lembut dan halus

2. **🎲 Random Template**

    - Setiap kategori punya 2-3 variasi template
    - Sistem akan random pilih template agar tidak monoton
    - Total ada 15+ template pesan yang berbeda!

3. **📊 Dashboard Lengkap**

    - Lihat siswa yang perlu diingatkan
    - Statistik pengiriman pesan
    - Riwayat notifikasi
    - Preview pesan sebelum kirim

4. **⏰ Auto-Reminder Scheduler**

    - Senin pagi 07:00 - Reminder untuk yang telat ≥ 1 minggu
    - Jumat sore 15:00 - Reminder untuk yang telat ≥ 2 minggu
    - Setiap hari 10:00 - Reminder urgent (≥ 4 minggu)

5. **🛡️ Anti-Spam Protection**

    - Tidak akan kirim ulang dalam 3 hari
    - Respek ke siswa yang sudah disable notifikasi

6. **🧪 Test Mode**
    - Testing tanpa kirim pesan real
    - Log di console untuk cek hasilnya

---

## 🚀 Cara Setup (Step by Step)

### Step 1: Daftar di Fonnte (5 menit)

1. Buka **https://fonnte.com**
2. Klik **"Daftar"** atau **"Sign Up"**
3. Isi data (email, password, dll)
4. Verifikasi email Anda
5. Login ke dashboard

### Step 2: Connect WhatsApp (3 menit)

1. Di dashboard Fonnte, klik **"Connect Device"**
2. Scan QR Code dengan WhatsApp Anda
3. **PENTING**: Gunakan nomor WA khusus untuk bot (jangan WA pribadi)
4. Tunggu sampai status jadi **"Connected"**

### Step 3: Dapatkan API Token (1 menit)

1. Di dashboard Fonnte, cari menu **"API Token"**
2. Copy token yang ada (format: xxxxx-xxxxx-xxxxx)
3. Simpan token ini dengan aman

### Step 4: Konfigurasi Backend (2 menit)

Edit file `/server/.env`:

```bash
# WhatsApp Configuration
FONNTE_API_TOKEN=paste_token_fonnte_disini
WA_TEST_MODE=true
AUTO_REMINDER_ENABLED=false
START_DATE=2025-10-27
```

**Penjelasan:**

-   `FONNTE_API_TOKEN`: Token dari Fonnte
-   `WA_TEST_MODE`:
    -   `true` = Testing (tidak kirim real)
    -   `false` = Production (kirim real)
-   `AUTO_REMINDER_ENABLED`:
    -   `false` = Manual only
    -   `true` = Auto-scheduler aktif
-   `START_DATE`: Tanggal mulai perhitungan minggu

### Step 5: Tambahkan Nomor WA Siswa (varies)

Ada 2 cara:

#### Cara 1: Via UI (Recommended)

1. Buka aplikasi
2. Masuk ke tab **"Siswa"**
3. Edit data siswa satu per satu
4. Tambahkan nomor WhatsApp

#### Cara 2: Via Database (Bulk)

```javascript
// Update via MongoDB shell atau Compass
db.students.updateMany(
    {},
    {
        $set: {
            phoneNumber: '628xxxxxxxxxx',
            enableNotification: true,
        },
    }
);
```

**Format Nomor yang Valid:**

-   ✅ `08123456789`
-   ✅ `628123456789`
-   ❌ `+628123456789` (jangan pakai +)
-   ❌ `0812-3456-789` (jangan pakai tanda strip)

### Step 6: Testing (5 menit)

#### Test 1: Cek Status API

```bash
curl http://localhost:5000/api/notifications/status
```

Harusnya return:

```json
{
    "connected": true,
    "device": "Your Device Name",
    "testMode": true,
    "apiToken": "✓ Set"
}
```

#### Test 2: Preview Pesan

Di UI:

1. Buka tab **"Notifikasi"**
2. Pilih style pesan
3. Klik **"Preview Pesan"**
4. Lihat contoh pesannya

#### Test 3: Kirim Test (Mode Test)

1. Pastikan `WA_TEST_MODE=true`
2. Di UI, pilih 1 siswa
3. Klik **"Kirim"**
4. Cek console log server (pesan muncul tapi tidak dikirim)

#### Test 4: Kirim Real (Be Careful!)

1. Ubah `WA_TEST_MODE=false`
2. Restart server
3. Pilih 1 siswa (pilih teman/diri sendiri dulu)
4. Klik **"Kirim"**
5. Cek WhatsApp - pesan harus masuk!

### Step 7: Aktivasi Auto-Reminder (Optional)

Edit `/server/.env`:

```bash
AUTO_REMINDER_ENABLED=true
```

Restart server, dan scheduler akan aktif!

---

## 🎯 Cara Pakai

### 1. Kirim Manual (Satu per Satu)

1. Buka tab **"Notifikasi"**
2. Lihat daftar siswa yang perlu reminder
3. Pilih style pesan yang diinginkan
4. Klik **"Preview"** untuk lihat contoh
5. Klik **"Kirim"** di samping nama siswa

### 2. Kirim Bulk (Banyak Sekaligus)

1. Pilih **minimum minggu telat** (1, 2, 3, atau 4)
2. Pilih **style pesan**
3. Centang siswa yang mau dikirimi (atau **"Pilih Semua"**)
4. Klik **"Kirim Reminder (X)"**
5. Konfirmasi
6. Tunggu proses selesai

### 3. Lihat Riwayat

1. Buka tab **"Riwayat"**
2. Lihat semua pesan yang pernah dikirim
3. Cek status: sent, failed, pending

### 4. Statistik

Dashboard menampilkan:

-   Total pesan terkirim
-   Total gagal
-   Pengiriman 7 hari terakhir
-   Jumlah siswa yang perlu reminder

---

## 📝 Contoh Template Pesan

### 😊 Friendly

```
Halo Budi! 👋

Kangen bayar kas ya? 😄
Udah 3 minggu nih belum bayar
Total: Rp 6.000

Yuk buruan bayar biar adem hatinya 🥰
Ditunggu ya bestie! 💙
```

### 💪 Motivational

```
Budi, setiap pembayaran adalah investasi! 💎

Dengan membayar kas, kita bersama-sama
membangun kelas yang lebih baik 🏆

Tunggakan: 3 minggu
Nominal: Rp 6.000

Mari jadi teladan! ⭐
```

### 😄 Humorous

```
Breaking News! 📰

Budi masuk trending topic
kategori "Belum Bayar Kas" 😱

Durasi trending: 3 minggu
Cara turun trending: Bayar Rp 6.000

Gaskeun biar viral positif! 📈
```

---

## ⚙️ Konfigurasi Lanjutan

### Ubah Schedule Auto-Reminder

Edit `/server/services/notificationScheduler.js`:

```javascript
// Senin jam 07:00
const mondayMorning = cron.schedule('0 7 * * 1', ...);

// Format cron:
// * * * * *
// │ │ │ │ │
// │ │ │ │ └─ Day of Week (0-7, 0=Sunday)
// │ │ │ └─── Month (1-12)
// │ │ └───── Day of Month (1-31)
// │ └─────── Hour (0-23)
// └───────── Minute (0-59)
```

Contoh custom:

```javascript
// Setiap Selasa & Kamis jam 14:30
cron.schedule('30 14 * * 2,4', ...)

// Setiap hari jam 08:00
cron.schedule('0 8 * * *', ...)

// Setiap akhir bulan jam 10:00
cron.schedule('0 10 28-31 * *', ...)
```

### Tambah Template Baru

Edit `/server/services/whatsappService.js`:

```javascript
const CREATIVE_TEMPLATES = {
    // Tambah kategori baru
    super_formal: [
        (name, weeks, amount) =>
            `Yang Terhormat Sdr/i ${name},\n\n` +
            `Dengan hormat kami sampaikan...\n` +
            // dst...
    ],

    // Atau tambah template ke kategori existing
    friendly: [
        // ... template existing

        // Template baru
        (name, weeks, amount) =>
            `Hai ${name}! 🌟\n\n` +
            `Custom message baru...\n`,
    ],
};
```

### Disable Anti-Spam

Edit `/server/services/notificationScheduler.js`:

```javascript
// Comment bagian ini:
/*
if (student.lastNotificationSent) {
    const daysSinceLastSent = ...
    if (daysSinceLastSent < 3) {
        continue;
    }
}
*/
```

---

## ❓ Troubleshooting

### Pesan Tidak Terkirim

**Problem**: Status "failed" di riwayat

**Solusi**:

1. Cek API Token valid:

    ```bash
    curl -X POST https://api.fonnte.com/validate \
      -H "Authorization: YOUR_TOKEN"
    ```

2. Cek WhatsApp masih connect di Fonnte dashboard

3. Cek nomor format valid (08xxx atau 628xxx)

4. Cek quota Fonnte (free account ada limit)

### Server Error "FONNTE_API_TOKEN not found"

**Solusi**:

1. Pastikan file `.env` ada di `/server/.env`
2. Restart server setelah edit `.env`
3. Cek typo di nama variable

### Scheduler Tidak Jalan

**Solusi**:

1. Cek `AUTO_REMINDER_ENABLED=true`
2. Restart server
3. Lihat console log, harusnya ada:
    ```
    ⏰ Notification Scheduler initialized!
    ✅ Started: Monday Morning
    ✅ Started: Friday Afternoon
    ```

### Nomor WA Tidak Valid

**Solusi**:

-   Remove spasi, strip, dan karakter khusus
-   Pakai format: `08123456789` atau `628123456789`
-   Jangan pakai `+62`

---

## 💡 Tips & Best Practices

### 1. Gunakan Nomor WA Khusus

Jangan pakai nomor pribadi, buat nomor khusus untuk bot kas kelas.

### 2. Testing Dulu

Selalu test dengan `WA_TEST_MODE=true` sebelum production.

### 3. Variasi Template

Ganti-ganti style pesan agar tidak monoton dan membosankan.

### 4. Jangan Spam

Respect anti-spam protection. Jangan kirim berulang-ulang dalam waktu singkat.

### 5. Monitor Riwayat

Cek riwayat secara berkala untuk lihat efektivitas.

### 6. Backup Token

Simpan API token di tempat aman (password manager).

### 7. Update Nomor

Pastikan nomor WA siswa selalu update dan valid.

---

## 📊 Statistik & Monitoring

### Lihat Stats via API

```bash
curl http://localhost:5000/api/notifications/stats
```

Response:

```json
{
    "total": 150,
    "sent": 140,
    "failed": 5,
    "pending": 5,
    "last7Days": 45,
    "byType": [
        { "_id": "payment_reminder", "count": 120 },
        { "_id": "thank_you", "count": 25 },
        { "_id": "custom", "count": 5 }
    ]
}
```

### Manual Trigger Auto-Reminder

```javascript
// Via Node console atau API endpoint baru
import notificationScheduler from './services/notificationScheduler.js';
await notificationScheduler.sendAutomaticReminders(2);
```

---

## 🎉 Fitur Bonus

### Send Thank You Message

Setelah siswa bayar, kirim ucapan terima kasih otomatis!

```javascript
// Di backend, setelah create payment
import whatsappService from './services/whatsappService.js';

// ... setelah payment berhasil
await whatsappService.sendThankYou(student);
```

Template thank you:

```
Makasih banget Budi! 🎉

Pembayaranmu udah diterima! ✅
Kamu keren banget! 💪

Keep being awesome! 🌟
```

### Custom Message

Kirim pesan custom untuk pengumuman khusus:

1. Buka tab "Notifikasi"
2. (Bisa tambah UI untuk custom message)
3. Atau via API:

```bash
curl -X POST http://localhost:5000/api/notifications/send-custom \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "xxx",
    "message": "Pengumuman: Besok ada rapat kas kelas!"
  }'
```

---

## 🚀 Ready to Go!

Sekarang sistem WhatsApp Bot Anda sudah siap digunakan!

**Quick Start Checklist:**

-   ✅ Daftar Fonnte & connect WhatsApp
-   ✅ Set API token di `.env`
-   ✅ Tambah nomor WA siswa
-   ✅ Test kirim pesan
-   ✅ Aktivasi auto-reminder (optional)
-   ✅ Enjoy! 🎉

**Need Help?**
Buka tab "Pengaturan" di aplikasi untuk panduan lengkap!

---

Made with ❤️ for efficient class financial management!
