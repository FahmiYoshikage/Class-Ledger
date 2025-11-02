# Fonnte WhatsApp API Token Setup

## Masalah yang Terjadi

Saat deployment production, notifikasi gagal dengan error:

```
📥 Fonnte response: { reason: 'invalid token', status: false }
```

**Root Cause:**

-   `WA_TEST_MODE=false` di production
-   Token Fonnte `sYy6sBj9ST6FovVw2i1k4RibjAuJjT4gUS212YN7bSB` tidak valid untuk production
-   Token mungkin expired atau development-only token

## Solusi Sementara: Test Mode

File: `server/.env.production`

```bash
WA_TEST_MODE=true
AUTO_REMINDER_ENABLED=false
```

**Dengan Test Mode:**

-   ✅ Notifikasi akan sukses tanpa kirim WA real
-   ✅ Log akan menunjukkan pesan yang akan dikirim
-   ✅ Database tetap mencatat history notifikasi
-   ✅ Frontend akan menampilkan "Berhasil dikirim (TEST MODE)"

## Cara Mendapatkan Token Production Valid

### 1. Login ke Fonnte Dashboard

-   Kunjungi: https://fonnte.com/
-   Login dengan akun Anda

### 2. Generate New Token

-   Masuk ke menu **API/Integration**
-   Klik **Generate New Token** atau **Create Token**
-   Copy token yang baru

### 3. Cek Device Status

-   Pastikan device WhatsApp sudah tersambung
-   Status harus **Connected** (hijau)
-   Jika disconnect, scan QR code lagi

### 4. Test Token di VPS

```bash
# Test dengan curl
curl -X POST https://api.fonnte.com/send \
  -H "Authorization: YOUR_NEW_TOKEN_HERE" \
  -d "target=6287860407003" \
  -d "message=Test message" \
  -d "countryCode=62"
```

Response sukses:

```json
{
    "status": true,
    "id": "message_id_here",
    "detail": "Message sent successfully"
}
```

Response error:

```json
{
    "status": false,
    "reason": "invalid token"
}
```

### 5. Update Token di Production

**DI VPS** (bukan di local):

```bash
cd /opt/Class-Ledger/server
nano .env.production
```

Ubah baris:

```bash
FONNTE_API_TOKEN=YOUR_NEW_VALID_TOKEN_HERE
WA_TEST_MODE=false
AUTO_REMINDER_ENABLED=true
```

Save (Ctrl+O, Enter, Ctrl+X)

### 6. Restart Container

```bash
docker-compose restart kas-kelas-api
```

### 7. Verify

```bash
# Check logs
docker logs kas-kelas-api --tail 20

# Should show:
# 🔧 WA_TEST_MODE: false
# 📡 Calling Fonnte API...
# 📥 Fonnte response: { status: true, id: "..." }
```

## Testing Flow

### Test Mode (Current - Aman)

```
WA_TEST_MODE=true
→ Tidak ada request ke Fonnte API
→ success: true, testMode: true
→ Log: "📱 TEST MODE - Pesan tidak dikirim"
```

### Production Mode (Setelah token valid)

```
WA_TEST_MODE=false
→ Request ke Fonnte API
→ success: true/false (tergantung API response)
→ Log: "📡 Calling Fonnte API..." + response
```

## Deployment Steps

```bash
# 1. Di VPS - Pull perubahan
cd /opt/Class-Ledger
git pull

# 2. Restart container
docker-compose down
docker-compose up -d

# 3. Test notifikasi dari browser
# Log: docker logs kas-kelas-api -f

# 4. Verify Test Mode aktif
# Expected log: "📱 TEST MODE - Pesan tidak dikirim"
```

## Catatan Penting

⚠️ **JANGAN commit token production ke Git!**

-   Token production hanya ada di VPS
-   Edit `.env.production` langsung di VPS
-   Jangan push ke GitHub

📝 **Untuk development (localhost):**

-   File: `server/.env`
-   `WA_TEST_MODE=true` (recommended)
-   Token apapun bisa dipakai (tidak akan digunakan)

🚀 **Untuk production (VPS):**

-   File: `server/.env.production`
-   `WA_TEST_MODE=true` untuk testing
-   `WA_TEST_MODE=false` setelah token valid

## Troubleshooting

### Token masih invalid setelah diganti

```bash
# 1. Cek token terbaca
docker exec kas-kelas-api env | grep FONNTE_API_TOKEN

# 2. Pastikan restart setelah edit .env
docker-compose restart kas-kelas-api

# 3. Clear cache (jika perlu)
docker-compose down
docker-compose up -d --force-recreate
```

### Device WhatsApp disconnect

-   Login ke Fonnte dashboard
-   Reconnect device dengan scan QR code
-   Wait 1-2 menit untuk sync
-   Test kirim lagi

### Limit exceeded

```json
{ "status": false, "reason": "limit exceeded" }
```

-   Cek quota di Fonnte dashboard
-   Upgrade plan jika perlu
-   Atau gunakan `WA_TEST_MODE=true` untuk development

## Status Saat Ini

✅ **Test Mode aktif di production**

-   Notifikasi akan "sukses" tanpa kirim WA real
-   Cocok untuk testing deployment
-   Tidak ada biaya/quota terpakai

⏳ **Next Step:**

1. Dapatkan token Fonnte yang valid
2. Test token dengan curl di VPS
3. Update `.env.production` di VPS
4. Set `WA_TEST_MODE=false`
5. Restart container
6. Test kirim notifikasi real
