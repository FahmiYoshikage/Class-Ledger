# 🔍 Panduan Verifikasi Fitur Pause

## ✅ Test Script Results

**Hasil test otomatis menunjukkan:**
```
✓ Week Frozen: ✅ PASS
✓ Status Paused: ✅ PASS  
✓ Settings Correct: ✅ PASS

🎉 ALL TESTS PASSED! Pause feature is working correctly.
```

### Detail:
- **Start Date**: 27 Oktober 2025
- **Days Passed**: 59 hari
- **Actual Week** (tanpa pause): Week 10
- **Current Week** (dengan pause): **Week 7** ✅ FROZEN!
- **Tunggakan NOT increasing**: Rp 6.000 (3 minggu × Rp 2.000)

---

## 📋 Cara Verifikasi Manual di Browser

### 1. Cek Week Counter (Dashboard)

**Buka**: http://localhost:3000/app/dashboard

**Cek**: 
- Header dashboard menunjukkan **"Minggu ke-7"**
- Jika muncul Week 9 atau 10 → ❌ Bug, pause tidak bekerja
- Jika muncul Week 7 → ✅ Benar, pause bekerja!

### 2. Verifikasi Tunggakan Siswa

**Rumus yang benar**:
```
Tunggakan = (Week 7 × Rp 2.000) - Total Bayar
```

**Contoh yang diharapkan**:

| Nama Siswa | Total Bayar | Should Pay | Tunggakan | Status |
|------------|-------------|------------|-----------|--------|
| Fahmi Ilham | Rp 0 | Rp 14.000 | Rp 14.000 | ❌ Telat |
| Wahyu Yoga | Rp 10.000 | Rp 14.000 | Rp 4.000 | ❌ Telat |
| Muhammad Zainza | Rp 14.000 | Rp 14.000 | Rp 0 | ✅ Lunas |
| Irhamna Nadhifah | Rp 22.000 | Rp 14.000 | -Rp 8.000 | ✅ Lunas |

**Cara Cek**:
1. Buka tab **"Tunggakan"**
2. Lihat kolom "TUNGGAKAN" untuk setiap siswa
3. Hitung manual: (7 × Rp 2.000) - Total Bayar
4. Harus sama dengan yang ditampilkan!

### 3. Cek Settings (Pengaturan)

**Buka**: Tab "Pengaturan"

**Pastikan**:
- Status: **"⏸️ PAUSED"** (ada badge merah/kuning)
- Start Date: **27 Oktober 2025**
- Paused at Week: **7**

### 4. Test Notifikasi Tidak Terkirim

**Cara Test**:
1. Buka tab **"Notifikasi"**
2. Coba kirim reminder manual (seharusnya ada peringatan)
3. Atau tunggu jadwal auto-reminder:
   - Senin jam 07:00
   - Jumat jam 15:00
4. Cek log server, seharusnya muncul:
   ```
   ⏸️ Semester paused - skipping reminder check
   ```

### 5. Test Resume Semester

**PENTING**: Jangan test di production!

**Di localhost/development**:
1. Buka tab "Pengaturan"
2. Klik tombol **"▶️ Resume Semester"**
3. Masukkan nama semester baru: "Semester 1 2024/2025"
4. Confirm
5. Setelah reload:
   - Week counter reset ke **Week 1**
   - Tunggakan siswa **TETAP** (carry over)
   - Status berubah jadi **"ACTIVE"**

---

## 🧪 Test Script (Automated)

Jalankan script test untuk verifikasi lengkap:

```bash
cd /home/fahmi/Documents/Project/kas-kelas/server
source .env
export MONGODB_URI
node test-pause-feature.js
```

**Output yang diharapkan**:
```
✅ PASS: System is paused at Week 7
✅ PASS: Week is frozen! (10 → 7)
✅ PASS: Tunggakan NOT increasing by Rp 6.000
🎉 ALL TESTS PASSED!
```

---

## 🔄 Timeline Explanation

```
27 Okt 2025 ────────> 9 Des 2025 ────────> 25 Des 2025
Start Date           Week 7 (PAUSE)       Today
                     │
                     └─> Freeze di sini!
                     
Tanpa Pause:  Week 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10
Dengan Pause: Week 1 → 2 → 3 → 4 → 5 → 6 → 7 ──────────> 7
                                            ↑
                                         FROZEN!
```

**Kesimpulan**:
- Hari ini sebenarnya sudah **Week 10**
- Tapi karena di-pause di **Week 7**, counter tetap 7
- Tunggakan dihitung dari Week 7, bukan Week 10
- Siswa **TIDAK** kena tambah tunggakan 3 minggu (Rp 6.000)

---

## 📊 Production Verification

Untuk memastikan production juga benar:

### Via Browser Console

1. Buka https://nrtforce.fahmi.app
2. Buka DevTools (F12) → Console
3. Jalankan:
```javascript
fetch('/api/settings/current-week')
  .then(r => r.json())
  .then(data => console.log('Current Week:', data));
```

**Expected Output**:
```json
{
  "currentWeek": 7,
  "status": "paused",
  "message": "System paused at Week 7"
}
```

### Via Curl

```bash
curl https://nrtforce.fahmi.app/api/settings/current-week | jq
```

---

## ✅ Checklist Verifikasi

- [ ] Week counter menunjukkan Week 7 (bukan 9 atau 10)
- [ ] Badge "PAUSED" muncul di Settings
- [ ] Tunggakan siswa sesuai formula: (7 × Rp 2.000) - Total Bayar
- [ ] Notifikasi auto tidak terkirim (cek log: "⏸️ Semester paused")
- [ ] Test script menunjukkan "ALL TESTS PASSED"
- [ ] Production juga menunjukkan Week 7 frozen

---

## 🚨 Troubleshooting

### Issue: Week masih bertambah (9 atau 10)

**Penyebab**: Client masih menggunakan kode lama

**Solusi**:
```bash
# Rebuild client
cd client
npm run build

# Clear browser cache
Ctrl + Shift + R (hard reload)
```

### Issue: Tunggakan terlalu besar

**Penyebab**: Database settings salah (paused_week bukan 7)

**Solusi**:
```bash
cd server
node fix-settings.js
```

### Issue: API return error

**Cek**:
```bash
# Test endpoint
curl http://localhost:5000/api/settings/current-week

# Cek server logs
```

---

## 📞 Support

Jika ada issue:
1. Jalankan test script dulu: `node test-pause-feature.js`
2. Cek output untuk detail error
3. Screenshot hasil test untuk debugging
