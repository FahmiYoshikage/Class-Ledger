# 🔍 Troubleshooting: Pesan WhatsApp Gagal Terkirim

## Kemungkinan Penyebab & Solusi

### 1. ❌ Group ID Salah Format

**Gejala:**

-   Status: Failed
-   Error: Invalid target atau group not found

**Cek:**

```
Format yang BENAR: 628xxxxxxxxxx-xxxxxxxxx@g.us
Contoh: 6285123456789-1234567890@g.us
```

**Cara Dapat Group ID:**

#### Via Bot Fonnte:

1. Tambahkan bot ke grup WhatsApp
2. Kirim perintah `/getid` di grup
3. Bot akan reply dengan Group ID
4. Copy paste Group ID tersebut

#### Via WhatsApp Web:

1. Buka WhatsApp Web
2. Buka grup yang diinginkan
3. Buka Developer Console (F12)
4. Ketik: `window.location.href`
5. Copy Group ID dari URL

---

### 2. ❌ Bot Belum Ditambahkan ke Grup

**Gejala:**

-   Status: Failed
-   Error: Not a participant

**Solusi:**

1. Buka grup WhatsApp
2. Klik info grup
3. Tambahkan nomor bot Fonnte sebagai anggota
4. Tunggu bot join grup
5. Coba kirim lagi

**Cek Status Bot:**

-   Login ke dashboard Fonnte: https://console.fonnte.com
-   Lihat status device: harus "Connected"
-   Pastikan nomor sudah ter-scan QR code

---

### 3. ❌ Nomor Siswa Format Salah

**Gejala:**

-   Pesan terkirim tapi mention tidak berfungsi
-   Beberapa siswa tidak ter-mention

**Format Yang Benar:**

```
❌ SALAH:
- 08123456789
- +62812345678
- 62 812 345 678

✅ BENAR:
- 628123456789 (tanpa spasi, tanpa +)
```

**Cara Perbaiki:**

1. Buka menu Siswa
2. Klik Edit pada siswa
3. Update nomor WhatsApp ke format: `628xxxxxxxxx`
4. Save

**Bulk Fix via MongoDB:**

```javascript
// Update semua nomor 08xxx ke 628xxx
db.students.find({ phoneNumber: /^08/ }).forEach((student) => {
    const newNumber = '62' + student.phoneNumber.substring(1);
    db.students.updateOne(
        { _id: student._id },
        { $set: { phoneNumber: newNumber } }
    );
});
```

---

### 4. ❌ Token Fonnte Expired/Invalid

**Gejala:**

-   Status: Failed
-   Error: Unauthorized atau Invalid token

**Solusi:**

1. Login ke https://console.fonnte.com
2. Salin API Token baru
3. Update file `.env`:
    ```
    FONNTE_API_TOKEN=token_baru_anda_disini
    ```
4. Restart server:
    ```bash
    cd server
    lsof -ti:5000 | xargs kill -9
    node server.js
    ```

**Cek Token:**

```bash
# Test via curl
curl -X POST https://api.fonnte.com/send \
  -H "Authorization: YOUR_TOKEN_HERE" \
  -d "target=628xxx" \
  -d "message=test"
```

---

### 5. ❌ Kuota Fonnte Habis

**Gejala:**

-   Status: Failed
-   Error: Insufficient credit atau Quota exceeded

**Solusi:**

1. Login ke https://console.fonnte.com
2. Cek sisa kuota/kredit
3. Top-up jika perlu
4. Coba kirim lagi

**Paket Fonnte:**

-   Gratis: 25 pesan/hari
-   Premium: Unlimited

---

### 6. ❌ Test Mode Masih Aktif

**Gejala:**

-   Terlihat sukses tapi tidak ada pesan masuk
-   Log terminal: "TEST MODE"

**Solusi:**

1. Buka file `server/.env`
2. Ubah:
    ```
    WA_TEST_MODE=false
    ```
3. Save
4. Restart server

**Untuk Testing:**

```
WA_TEST_MODE=true  → Simulasi, tidak kirim real
WA_TEST_MODE=false → Kirim real message
```

---

### 7. ❌ Server Error / Database Issue

**Gejala:**

-   Error 500
-   Notification tidak tersimpan

**Cek:**

1. **MongoDB Running?**

    ```bash
    # Cek status
    sudo systemctl status mongod

    # Start jika mati
    sudo systemctl start mongod
    ```

2. **Connection String Benar?**

    ```
    # Di .env
    MONGODB_URI=mongodb://localhost:27017/kas-kelas
    ```

3. **Server Logs:**
    ```bash
    # Lihat terminal server untuk error
    cd server
    node server.js
    # Watch for errors
    ```

---

## 🔧 Debug Mode

### Aktifkan Logging Detail:

File sudah diupdate dengan logging. Sekarang saat kirim pesan, cek terminal server:

**Expected Logs:**

```
📱 Sending event reminder to group...
Event: Study Tour Bali
To Group: 628xxx-xxx@g.us
Message: ...full message...
Mentions: 5 siswa
Fonnte API Response: { status: true, id: "xxx", ... }
```

**Error Logs:**

```
Error sending event reminder to group: <error message>
Full error: { reason: "...", detail: "..." }
```

---

## 📋 Checklist Before Sending

Sebelum kirim reminder event, pastikan:

-   [ ] Group ID benar (format: 628xxx-xxx@g.us)
-   [ ] Bot sudah di grup
-   [ ] Siswa punya nomor WA (format: 628xxx)
-   [ ] Token Fonnte valid
-   [ ] Kuota Fonnte cukup
-   [ ] Test mode = false (untuk production)
-   [ ] MongoDB running
-   [ ] Server running tanpa error

---

## 🧪 Test Step by Step

### Test 1: Cek API Token

```bash
curl -X POST https://api.fonnte.com/validate \
  -H "Authorization: YOUR_TOKEN"
```

**Expected:** `{ valid: true }`

### Test 2: Test Mode

1. Set `WA_TEST_MODE=true`
2. Restart server
3. Kirim reminder
4. Cek terminal: harus ada log "TEST MODE"
5. Tidak ada pesan WA terkirim (normal)

### Test 3: Kirim Real (ke Nomor Sendiri)

1. Buat grup test dengan nomor sendiri
2. Tambahkan bot ke grup
3. Dapatkan Group ID
4. Set `WA_TEST_MODE=false`
5. Restart server
6. Kirim reminder dengan Group ID test
7. Cek WA: harus terima pesan

### Test 4: Kirim ke Grup Real

1. Pastikan semua checklist ✓
2. Preview pesan dulu
3. Kirim
4. Cek WA grup

---

## 📞 Contact Support

Jika masih gagal setelah semua dicoba:

1. **Fonnte Support:**

    - Website: https://fonnte.com
    - WhatsApp: Check website
    - Email: support@fonnte.com

2. **Check Logs:**

    - Server logs (terminal backend)
    - Browser console (F12)
    - MongoDB logs

3. **Database Check:**

    ```javascript
    // Via mongosh
    use kas-kelas

    // Lihat notification gagal
    db.notifications.find({ status: "failed" }).limit(5)

    // Lihat siswa tanpa WA
    db.students.find({
        $or: [
            { phoneNumber: null },
            { phoneNumber: "" },
            { phoneNumber: /^08/ }
        ]
    })
    ```

---

## 💡 Tips

### Performance:

-   Jangan kirim terlalu sering (cooldown 3 hari untuk anti-spam)
-   Gunakan preview sebelum kirim
-   Test di grup kecil dulu

### Best Practices:

-   Backup Group ID di note
-   Validasi nomor siswa sebelum kirim bulk
-   Monitor Fonnte dashboard untuk delivery status
-   Set reminder otomatis via scheduler

### Security:

-   Jangan share API Token
-   Gunakan .env untuk credentials
-   Jangan commit .env ke git

---

**Updated:** 26 Oktober 2025
