# CHECKPOINT: Progress Report & Next Steps

## 📊 Current Status: Optimization for 1GB RAM / 2 vCPU VPS (COMPLETED & VERIFIED)

The project has been refactored, optimized, and verified to run smoothly on a low-spec VPS (1GB RAM, 2 vCPU cores). Both backend API and frontend Nginx containers are running healthy with minimal resource consumption (~55 MB RAM total).

---

## 🚀 Ringkasan Solusi Masalah Docker Compose & Penyesuaian

### 1. Perbaikan Error Frontend Build & Broken Imports (28 File Diperbaiki)
- **Masalah Utama**:
  1. `client/src/main.jsx` terpotong dan import `ProtectedRoute` serta `DashboardLayout` masih mengarah ke `./components/` lama.
  2. Reorganisasi folder sebelumnya memindahkan file ke dalam subfolder (`core/`, `payments/`, `events/`, `settings/`), namun path relative import (`../services/api`, `../context/AuthContext`, `./components/*`) di 18 file belum disesuaikan.
  3. `vite build` kehabisan memori (OOM / JavaScript heap out of memory) saat dibatasi `--max-old-space-size=256` di Dockerfile karena memproses bundle monolitik 1.7MB.
- **Solusi yang Diterapkan**:
  - Memperbaiki semua 28 broken relative imports di `client/src/` (termasuk `App.jsx`, `main.jsx`, `Login.jsx`, `AdminDashboard.jsx`, `PublicDashboard.jsx`, `Settings.jsx`, `EventManagement.jsx`, dll.).
  - Mengimplementasikan **Chunk Splitting / manualChunks** di [client/vite.config.js](file:///home/fahmi/Documents/Class-Ledger/client/vite.config.js) (`vendor-react`, `vendor-icons`, `vendor-charts`, `vendor-export`). Build size terbagi rapi dan build hanya memakan waktu ~5 detik!
  - Menaikkan build-time memory limit ke `--max-old-space-size=512` dan **memisahkan build frontend dari `docker compose build`** menggunakan [`deploy.sh`](file:///home/fahmi/Documents/Class-Ledger/deploy.sh). Frontend di-build di container Docker terpisah (tanpa memory limit), lalu `dist/` di-copy ke nginx image. Ini menghindari OOM saat build di VPS 1GB.

### 2. Perbaikan Error Backend API Container Unhealthy (`kas-kelas-api`)
- **Masalah Utama**:
  - Container API exit terus-menerus dengan pesan:
    ```
    node: --optimize-for-size is not allowed in NODE_OPTIONS
    ```
    Node.js V8 melarang flag `--optimize-for-size` jika dimasukkan ke dalam environment variable `NODE_OPTIONS`.
- **Solusi yang Diterapkan**:
  - Menghapus flag `--optimize-for-size` dari `NODE_OPTIONS` di [docker-compose.yml](file:///home/fahmi/Documents/Class-Ledger/docker-compose.yml) dan [server/Dockerfile](file:///home/fahmi/Documents/Class-Ledger/server/Dockerfile).
  - Menempatkan `--optimize-for-size` langsung sebagai argumen CLI pada `CMD ["node", "--optimize-for-size", "server.js"]`.
  - Di `NODE_OPTIONS`, hanya menyisakan flag heap `--max-old-space-size=192`.

### 3. Penyelarasan Routing Backend & Single-Admin Mode
- **Masalah Utama**:
  - Pada commit single-admin sebelumnya, route `/api/students`, `/api/notifications`, `/api/sessions`, dan `/api/audit-logs` terhapus dari `server.js`, dan route lainnya hanya di-mount di `/api/admin/*` dengan proteksi ketat. Akibatnya, `PublicDashboard` yang membutuhkan data publik (pembayaran, pengeluaran, siswa) tidak dapat mengambil data, dan komponen admin gagal memanggil endpoint standar.
  - `User.js` menghapus field `role`, sehingga saat login `user.role` menjadi `undefined`. Hal ini menyebabkan komponen UI seperti `ProtectedRoute`, `DashboardLayout`, dan `DashboardRouter` menampilkan "Access Denied" karena pengecekan `user?.role === 'admin'`.
  - `auditLogs.js` mengimpor `authorize` dari `auth.js` yang sebelumnya hilang.
- **Solusi yang Diterapkan**:
  - [server/models/User.js](file:///home/fahmi/Documents/Class-Ledger/server/models/User.js): Menambahkan kembali field `role: { type: String, default: 'admin' }`.
  - [server/routes/auth.js](file:///home/fahmi/Documents/Class-Ledger/server/routes/auth.js): Mengembalikan `role: user.role || 'admin'` pada endpoint `/init-admin`, `/login`, dan `/me`.
  - [server/middleware/auth.js](file:///home/fahmi/Documents/Class-Ledger/server/middleware/auth.js): Menambahkan dan mengekspor fungsi `authorize` (backward-compatible) di samping `authorizeAdmin`.
  - [server/server.js](file:///home/fahmi/Documents/Class-Ledger/server/server.js): Memasang semua route inti (`/api/students`, `/api/payments`, `/api/expenses`, `/api/settings`, `/api/events`, `/api/notifications`, `/api/leaderboard`, `/api/badges`, `/api/qr-payment`, `/api/sessions`, `/api/audit-logs`) sekaligus alias `/api/admin/*` untuk kompatibilitas penuh.
  - [client/src/components/core/PublicDashboard.jsx](file:///home/fahmi/Documents/Class-Ledger/client/src/components/core/PublicDashboard.jsx): Mengakses endpoint publik `/payments`, `/expenses`, `/students` sehingga tamu/publik bisa melihat data kas tanpa token admin.

### 4. Setup Volume & Izin Direktori
- Membuat direktori `server/public/reports` dan `server/uploads` lengkap dengan `.gitkeep` agar container tidak mengalami error permission denied saat menyimpan kuitansi QRIS atau PDF report.

---

## 📈 Metrik Penggunaan Sumber Daya (VPS 1GB RAM)

Hasil verifikasi langsung dari `docker stats` saat kedua container berjalan:

| Container | Image | Status | CPU % | RAM Usage / Limit | RAM % |
|---|---|---|---|---|---|
| **kas-kelas-api** | `class-ledger-api` | Up (healthy) | 0.18% | **40.96 MiB** / 256 MiB | 16.0% |
| **kas-kelas-frontend** | `class-ledger-frontend` | Up (healthy) | 0.00% | **14.63 MiB** / 64 MiB | 22.8% |
| **TOTAL** | - | - | **~0.18%** | **~55.59 MiB** | **~5.5% dari VPS 1GB** |

> [!TIP]
> Penggunaan RAM kedua container hanya **~55 MB**, menyisakan lebih dari **900 MB RAM bebas** di VPS 1GB Anda!

---

## 🌐 Verifikasi Endpoint & Akses

1. **Backend Health Check**:
   ```bash
   curl -s http://localhost:5001/api/health
   # Response: {"status":"OK","message":"Server is running", ...}
   ```
2. **Frontend Nginx**:
   ```bash
   curl -s -I http://localhost:8767
   # Response: HTTP/1.1 200 OK (Nginx alpine)
   ```
3. **Public Data Endpoints**:
   ```bash
   curl -s http://localhost:5001/api/students
   curl -s http://localhost:5001/api/payments
   curl -s http://localhost:5001/api/expenses
   ```

---

## 🛠️ Langkah Menjalankan / Deploy Ulang

### Deploy di VPS (Recommended — Low Memory Safe)
```bash
# 1. Masuk ke folder project
cd /opt/Class-Ledger # atau folder project Anda

# 2. Deploy (build frontend di container terpisah + docker compose)
./deploy.sh

# 3. Atau via Makefile:
make deploy        # sama seperti ./deploy.sh
make update        # git pull + deploy
```

### Cara Kerja `deploy.sh`
1. Build frontend di **container Docker terpisah** (bukan via `docker compose build`)
   - Ini menghindari masalah OOM karena Vite butuh ~512MB heap
   - Container build terpisah tidak terkena memory limit dari `docker-compose.yml`
2. Extract `dist/` dari container ke `client/dist/`
3. `docker compose build` — frontend Dockerfile hanya COPY `dist/` ke nginx (< 3 detik)
4. `docker compose up -d`
5. Cleanup: hapus temporary `dist/` dan builder image

### Quick Restart (tanpa rebuild frontend)
```bash
docker compose up -d --build  # atau: make up
```

### Cek Status
```bash
docker compose ps
docker stats --no-stream
```

Semua konfigurasi dan kode telah sinkron dan siap digunakan!