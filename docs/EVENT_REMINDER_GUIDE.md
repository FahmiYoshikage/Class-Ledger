# 📅 Event Reminder Feature - Panduan Penggunaan

## 🎯 Tentang Fitur Ini

Fitur **Event Reminder** memungkinkan Anda mengirim reminder khusus untuk pembayaran event (bukan kas mingguan rutin). Event bisa berupa:

-   Study tour
-   Class party
-   Gathering
-   Atau acara khusus lainnya

---

## ✨ Fitur Utama

### 1. **Reminder Berbasis Event**

-   Setiap event memiliki reminder terpisah
-   Pesan disesuaikan dengan nama event, jumlah, dan deadline
-   Tracking progress pembayaran real-time

### 2. **5 Template Kategori**

-   😊 **Friendly** - Santai dan ramah
-   ⚡ **Urgent** - Mendesak untuk deadline dekat
-   📋 **Formal** - Professional dan resmi
-   💪 **Motivational** - Memotivasi untuk bayar
-   😄 **Humorous** - Humor untuk suasana santai

### 3. **Metode Pengiriman**

-   **Individual** - Kirim ke satu siswa
-   **Bulk** - Kirim ke banyak siswa sekaligus
-   **Group** - Kirim ke grup WhatsApp dengan @mention

---

## 📋 Cara Menggunakan

### A. Akses Event Reminder

1. Buka **Notification Center**
2. Klik tab **"Reminder Event"** (ikon kalender)
3. Pilih event dari dropdown

### B. Kirim Reminder Individual

1. Pilih event yang ingin diingatkan
2. Lihat daftar siswa yang belum bayar
3. Pilih style pesan (Friendly, Urgent, dll)
4. Klik tombol **"Kirim"** di samping nama siswa
5. Konfirmasi pengiriman

**Contoh Pesan:**

```
Hai Budi! 👋

Reminder nih untuk event Study Tour Bali 🌴

💰 Jumlah: Rp 500,000
📅 Deadline: 25 Desember 2024

Yuk segera bayar sebelum deadline ya! 🙏

Terima kasih! 😊
```

### C. Kirim Reminder Bulk (Banyak Siswa)

1. Pilih event
2. **Opsi 1:** Centang siswa yang ingin dikirimi reminder
3. **Opsi 2:** Biarkan kosong untuk kirim ke semua yang belum bayar
4. Pilih style pesan
5. Klik **"Preview Pesan"** untuk melihat contoh
6. Klik **"Kirim ke X Siswa"** atau **"Kirim ke Semua"**
7. Konfirmasi pengiriman

**Output:**

```
Pengiriman selesai!

✅ Berhasil: 15
❌ Gagal: 0
⏭️  Dilewati: 2
```

### D. Kirim ke Grup WhatsApp

1. Pilih event
2. Klik **"Kirim ke Grup WA"**
3. Masukkan Group ID (format: `628xxxxxxxxxx-xxxxxxxxx@g.us`)
4. Klik **"Preview Pesan Grup"** untuk melihat contoh
5. Klik **"Kirim ke Grup"**

**Contoh Pesan Grup:**

```
📢 REMINDER PEMBAYARAN EVENT 📢

Event: Study Tour Bali 🌴
💰 Target: Rp 15,000,000
📊 Terkumpul: Rp 8,000,000 (53%)
📅 Deadline: 25 Desember 2024

Yang belum bayar (Rp 500,000/orang):
@6281234567890 Budi
@6281234567891 Ani
@6281234567892 Citra
... dan 12 siswa lainnya

Yuk segera lunasi sebelum deadline! 🙏
Terima kasih! 😊
```

---

## 🎨 Kategori Template

### 1. Friendly (😊)

```
Hai {name}! 👋
Reminder nih untuk event {eventName}

💰 Jumlah: Rp {amount}
📅 Deadline: {deadline}

Yuk segera bayar sebelum deadline ya! 🙏
```

### 2. Urgent (⚡)

```
⚡ URGENT REMINDER ⚡

Hai {name}, event {eventName} deadline-nya sudah dekat!

💰 Yang harus dibayar: Rp {amount}
⏰ Deadline: {deadline}

PENTING: Segera bayar hari ini juga! 🚨
```

### 3. Formal (📋)

```
Kepada Yth. {name}

Dengan ini kami mengingatkan pembayaran untuk:
Event: {eventName}
Nominal: Rp {amount}
Batas Waktu: {deadline}

Mohon segera melakukan pembayaran.
Terima kasih.
```

### 4. Motivational (💪)

```
{name}, mari kita sukses bersama! 🎯

Event {eventName} akan segera tiba!

💰 Investasi: Rp {amount}
📅 Target: {deadline}

Mari kita raih kesuksesan bersama! 💪
Segera lunasi pembayaranmu ya! 🌟
```

### 5. Humorous (😄)

```
Knock knock! 🚪
Siapa? {eventName}! 😄

Halo {name}! 👋
Event kita butuh dukunganmu nih:

💰 Jumlah: Rp {amount}
📅 Deadline: {deadline}

Jangan sampai ketinggalan ya! Bayar sekarang, happy nanti! 🎉
```

---

## 📊 Tracking Progress

Event Reminder menampilkan:

1. **Target Total** - Total dana yang dibutuhkan
2. **Per Siswa** - Jumlah per siswa
3. **Sudah Bayar** - Jumlah siswa yang sudah bayar
4. **Progress Bar** - Visual persentase terkumpul
5. **Daftar Belum Bayar** - Nama dan nomor yang belum bayar

**Contoh Display:**

```
Target Total: Rp 15,000,000
Per Siswa: Rp 500,000
Sudah Bayar: 16 siswa

Progress: ████████████░░░░░░░░ 53%
```

---

## 🔧 Integrasi dengan Event Management

### Kirim dari Event Management

1. Buka halaman **Event Management**
2. Lihat event yang ada
3. Klik tombol **"Send Reminder"** di event card
4. Otomatis membuka Notification Center dengan event terpilih

---

## ⚙️ Konfigurasi

### Environment Variables

```bash
# .env di folder server/
FONNTE_API_TOKEN=your_fonnte_token_here
WA_TEST_MODE=true  # Set false untuk production
```

### Test Mode

-   Saat `WA_TEST_MODE=true`:
    -   Pesan tidak benar-benar dikirim
    -   Hanya simulasi pengiriman
    -   Aman untuk testing
-   Saat `WA_TEST_MODE=false`:
    -   Pesan dikirim ke nomor sebenarnya
    -   Gunakan untuk production

---

## 🎓 Tips & Best Practices

### 1. **Kapan Kirim Reminder?**

-   **1 minggu sebelum deadline** - Reminder pertama (Friendly/Motivational)
-   **3 hari sebelum deadline** - Reminder kedua (Urgent)
-   **1 hari sebelum deadline** - Reminder akhir (Urgent/Formal)

### 2. **Pilih Style yang Tepat**

-   **Friendly** → Reminder awal, suasana santai
-   **Urgent** → Mendekati deadline
-   **Formal** → Event resmi/serius
-   **Motivational** → Memotivasi partisipasi
-   **Humorous** → Komunitas yang akrab

### 3. **Individual vs Bulk vs Group**

-   **Individual** → Siswa VIP atau yang perlu perhatian khusus
-   **Bulk** → Efisien untuk banyak siswa sekaligus
-   **Group** → Transparansi dan peer pressure positif

### 4. **Anti-Spam Protection**

-   Sistem otomatis mencegah spam (cooldown 3 hari)
-   Tidak perlu khawatir kirim terlalu sering
-   Jika dibutuhkan urgent, cooldown bisa di-bypass manual

---

## 📱 Cara Mendapatkan Group ID WhatsApp

### Metode 1: Via Bot Fonnte

1. Tambahkan bot Fonnte ke grup WhatsApp
2. Kirim perintah `/getid` di grup
3. Bot akan reply dengan Group ID
4. Copy Group ID (format: `628xxx-xxx@g.us`)

### Metode 2: Via WhatsApp Web Console

1. Buka WhatsApp Web
2. Buka grup yang diinginkan
3. Buka Developer Console (F12)
4. Ketik: `window.location.href`
5. Copy ID dari URL

---

## 🔍 Troubleshooting

### ❌ "Error loading events"

**Solusi:**

-   Pastikan backend server berjalan
-   Check koneksi ke database MongoDB
-   Pastikan ada event yang sudah dibuat

### ❌ "Tidak ada siswa yang belum bayar"

**Solusi:**

-   Semua siswa sudah bayar ✅
-   Atau belum ada siswa yang terdaftar di event

### ❌ "Invalid Group ID"

**Solusi:**

-   Format harus: `628xxxxxxxxxx-xxxxxxxxx@g.us`
-   Pastikan bot sudah di-add ke grup
-   Check typo di Group ID

### ❌ Pesan tidak terkirim

**Solusi:**

-   Check `WA_TEST_MODE` di .env
-   Pastikan nomor siswa valid (format 628xxx)
-   Check saldo/status API Fonnte
-   Pastikan `enableNotification` siswa = true

---

## 🆚 Perbedaan: Kas Reminder vs Event Reminder

| Aspek              | Kas Reminder                    | Event Reminder         |
| ------------------ | ------------------------------- | ---------------------- |
| **Tujuan**         | Bayar kas mingguan rutin        | Bayar event khusus     |
| **Frekuensi**      | Recurring (setiap minggu)       | One-time (per event)   |
| **Jumlah**         | Tetap (Rp 2,000/minggu)         | Bervariasi per event   |
| **Deadline**       | Rolling (setiap minggu)         | Specific date          |
| **Tracking**       | Berapa minggu telat             | Sudah bayar atau belum |
| **Template**       | 6 kategori (+ Gentle/Energetic) | 5 kategori (+ Urgent)  |
| **Auto-scheduler** | Ya (Senin, Jumat, Daily)        | Coming soon            |

---

## 🚀 Fitur Mendatang

-   ✅ UI Event Reminder (SELESAI)
-   ✅ Backend API Event Reminder (SELESAI)
-   ⏳ Auto-scheduler untuk event reminder
-   ⏳ Reminder otomatis X hari sebelum deadline
-   ⏳ Email notification untuk backup
-   ⏳ WhatsApp Business API integration

---

## 💡 Contoh Use Case

### Scenario: Study Tour Bali

**Event Details:**

-   Nama: Study Tour Bali
-   Target: Rp 15,000,000
-   Per Siswa: Rp 500,000
-   Deadline: 25 Desember 2024
-   Peserta: 30 siswa

**Timeline Reminder:**

**18 Des (1 minggu sebelum):**

```
Style: Friendly
Method: Bulk ke semua yang belum bayar
Result: 10 siswa langsung bayar
```

**22 Des (3 hari sebelum):**

```
Style: Urgent
Method: Individual ke 20 siswa tersisa
Result: 15 siswa bayar
```

**24 Des (H-1):**

```
Style: Urgent
Method: Group message + individual
Result: 3 siswa bayar, 2 konfirmasi besok pagi
```

**Hasil:**

-   28/30 siswa bayar tepat waktu ✅
-   Rp 14,000,000 terkumpul
-   Event bisa berjalan! 🎉

---

## 📞 Support

Jika ada pertanyaan atau kendala:

1. Check dokumentasi ini terlebih dahulu
2. Check file `WHATSAPP_BOT_GUIDE.md` untuk kas reminder
3. Check console browser untuk error log
4. Check server logs di terminal backend

---

**Selamat menggunakan Event Reminder! 🎉**

Semoga pembayaran event jadi lebih lancar dan terorganisir! 💪
