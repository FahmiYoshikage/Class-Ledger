# 💎 Class-Ledger

> **Sistem Manajemen Keuangan & Kas Kelas Modern, Transparan, dan Siap Pakai (Turnkey Open-Source Product).**

Class-Ledger adalah aplikasi web modern untuk mengelola keuangan kas kelas, organisasi siswa, atau komunitas. Dilengkapi dengan **First Setup Wizard**, sistem ini dapat di-*self-host* secara mandiri oleh siapa saja tanpa perlu konfigurasi database manual atau mengubah kode sumber.

---

## ✨ Fitur Unggulan

- 🧙 **Interactive First Setup Wizard (`/setup`)**  
  Pengaturan awal visual 6 langkah untuk nama kelas, instansi, nominal kas mingguan, rekening transfer, bot WhatsApp, dan pembuatan akun bendahara superadmin.
- 🌓 **Dynamic Dark / Light Mode (Cyber Glassmorphic)**  
  Tampilan UI responsif kelas dunia dengan aksen neon cybernetic, glassmorphism, dan tema terang/gelap yang dapat diganti sewaktu-waktu.
- 💳 **Pembayaran Fleksibel (QRIS & Multi-Rekening)**  
  Dukungan QRIS dinamis dan banyak rekening bank / e-wallet (BCA, Mandiri, BRI, SeaBank, Dana, Gopay, ShopeePay, dll.).
- 🟩 **Heatmap Kehadiran Pembayaran Pintar**  
  Visualisasi pembayaran bergaya GitHub commit graph:
  - Mendukung *burst payment* (bayar banyak minggu sekaligus).
  - Menyala melebihi minggu berjalan saat siswa membayar lebih (*glowing surplus*).
  - Reset otomatis sesuai status semester aktif atau pause.
- 🤖 **WhatsApp Gateway & Anti-Ban Bot**  
  Integrasi Fonnte untuk reminder tunggakan otomatis, broadcast laporan ke grup WhatsApp kelas, dan algoritma *human-like anti-ban* (random jitter, variable delays, batch throttling).
- 🏆 **Leaderboard Donatur & Gamifikasi**  
  Peringkat donatur dan ketepatan waktu dengan sistem badge (*Master Ledger, Sultan Kas, Pioneer*).
- 📑 **Export Laporan Lengkap**  
  Cetak laporan keuangan kas masuk, keluar, dan tunggakan siswa dalam format PDF dan Excel (.xlsx) dengan 1 klik.
- 🔒 **Keamanan Tingkat Tinggi**  
  Dilengkapi audit log aktivitas, rate limiting, hashing password Argon2id/Bcrypt, session tracking, dan JWT token.

---

## 🚀 Panduan Self-Hosting Cepat

### Opsi 1: Menggunakan Docker Compose (Direkomendasikan)

Prasyarat: Docker dan Docker Compose telah terpasang.

1. **Clone repositori:**
   ```bash
   git clone https://github.com/FahmiYoshikage/Class-Ledger.git
   cd Class-Ledger
   ```

2. **Salin file environment:**
   ```bash
   cp .env.example .env
   # Edit JWT_SECRET di .env jika diperlukan
   ```

3. **Jalankan container:**
   ```bash
   docker compose -f docker-compose.selfhost.yml up -d
   ```

4. **Buka browser:**
   Akses `http://localhost` (atau IP VPS Anda). Sistem akan otomatis mendeteksi instalasi baru dan membuka **First Setup Wizard** (`/setup`).

---

### Opsi 2: Instalasi Manual (Node.js + MongoDB)

Prasyarat:
- Node.js v18 atau v20+
- MongoDB 5.0+ berjalan secara lokal atau MongoDB Atlas URI

1. **Setup Backend:**
   ```bash
   cd server
   npm install
   cp ../.env.example .env
   # Sesuaikan MONGODB_URI di .env jika perlu
   npm start
   ```

2. **Setup Frontend:**
   ```bash
   cd ../client
   npm install
   npm run build
   # Atau untuk mode development:
   npm run dev
   ```

3. **Buka Browser:**
   Buka `http://localhost:5173` (dev) atau `http://localhost:5000` (production). Selesaikan wizard pada `/setup`.

---

## ⚙️ Variabel Lingkungan (`.env`)

Lihat [`.env.example`](.env.example) untuk daftar lengkap konfigurasi yang tersedia. Seluruh data personal (nama kelas, rekening, dll.) **tidak perlu** diatur di `.env`, melainkan dapat diisi langsung lewat halaman **Setup Wizard** atau tab **Pengaturan** di dashboard bendahara.

| Variabel | Deskripsi | Default |
|---|---|---|
| `PORT` | Port server backend | `5000` |
| `MONGODB_URI` | Koneksi MongoDB | `mongodb://127.0.0.1:27017/kas-kelas` |
| `JWT_SECRET` | Kunci enkripsi token sesi | *Wajib diganti saat production* |
| `BASE_URL` | Domain publik aplikasi Anda | `http://localhost:5000` |
| `FONNTE_API_TOKEN` | Token API WhatsApp Gateway (Opsional) | `-` |
| `AUTO_REMINDER_ENABLED` | Aktifkan reminder WhatsApp otomatis | `true` |

---

## 🛠️ Arsitektur Teknologi

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti
- **Backend**: Node.js, Express.js (ES Modules), Mongoose
- **Database**: MongoDB
- **Autentikasi**: JWT (JSON Web Token) dengan HTTP-Only / Bearer header
- **Notifikasi**: Fonnte WhatsApp API Gateway dengan Anti-Ban Throttler

---

## 📄 Lisensi

Proyek ini dirilis di bawah lisensi [MIT License](LICENSE). Bebas digunakan, dimodifikasi, dan disebarluaskan untuk keperluan sekolah, kampus, maupun organisasi nirlaba.
