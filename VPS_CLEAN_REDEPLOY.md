# 🔄 VPS Clean Redeploy Guide

## 🎯 Situasi

- ✅ Sudah setup SSH key untuk GitHub
- ❌ Folder lama `/opt/telkom-cup` menggunakan PAT (Personal Access Token) - tidak bisa digunakan
- 🆕 Folder baru `/opt/Class-Ledger` dengan SSH key
- 🐛 Bug production: `trust proxy` error pada rate limiter

---

## 🐛 Bug Fix: Trust Proxy Error

### Problem:
```
ValidationError: The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false
```

**Root Cause**: 
- Cloudflare Tunnel → Nginx → Docker mengirim `X-Forwarded-For` header
- Express tidak trust proxy headers by default
- Rate limiter tidak bisa identify user dengan benar

### Solution:
Added to `server/server.js`:
```javascript
// Trust proxy - Required for Cloudflare/Nginx reverse proxy
app.set('trust proxy', true);
```

**Fixed!** ✅ Express sekarang trust headers dari Cloudflare/Nginx

---

## 🧹 Clean Redeploy Process

### Step 1: Push Code dengan Bug Fix ke GitHub

```bash
# Dari local machine
cd /home/fahmi/Documents/Project/kas-kelas

git add server/server.js
git commit -m "fix: trust proxy for Cloudflare/Nginx reverse proxy"
git push
```

### Step 2: SSH ke VPS

```bash
ssh root@your-vps
```

### Step 3: Clone Repository Baru dengan SSH

```bash
# Clone ke folder baru
git clone git@github.com:FahmiYoshikage/Class-Ledger.git /opt/Class-Ledger

# Masuk ke folder
cd /opt/Class-Ledger
```

### Step 4: Jalankan Clean Redeploy Script

```bash
# Copy script dari repo baru (jika sudah ada di repo)
chmod +x scripts/vps-clean-redeploy.sh
./scripts/vps-clean-redeploy.sh
```

Script akan:
1. ✅ Stop semua Docker containers di folder lama
2. ✅ Backup `.env.production` files ke `/root/backup-kas-kelas-YYYYMMDD-HHMMSS/`
3. ✅ Hapus folder lama `/opt/telkom-cup`
4. ✅ Restore `.env.production` ke folder baru
5. ✅ Siap untuk build Docker

### Step 5: Verify .env Files

```bash
cd /opt/Class-Ledger

# Check if .env files exist
ls -la server/.env.production
ls -la client/.env.production

# Verify content (pastikan FONNTE_API_TOKEN, MONGODB_URI, dll ada)
cat server/.env.production
```

**Expected content** `server/.env.production`:
```bash
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://SigmaboyKurangMewing:PasswordKuatNihBosWk_089@material-dashboard.whyz4.mongodb.net/kas-kelas
FONNTE_API_TOKEN=sYy6sBj9ST6FovVw2i1k4RibjAuJjT4gUS212YN7bSB
WA_TEST_MODE=false
AUTO_REMINDER_ENABLED=true
START_DATE=2025-11-03
JWT_SECRET=7065bfb93d0318b9a0b1180c1608c7c1a201f0135ab032e7c6b3662b90bbc68e
CORS_ORIGIN=https://triforce.fahmi.app
```

**Expected content** `client/.env.production`:
```bash
VITE_API_URL=https://triforce.fahmi.app/api
```

### Step 6: Build dan Start Docker

```bash
cd /opt/Class-Ledger

# Build dan start containers dengan bug fix
docker-compose up -d --build

# Monitor build process
docker-compose logs -f
```

### Step 7: Verify Deployment

```bash
# Check container status
docker-compose ps

# Check backend health
docker exec kas-kelas-api curl -s http://localhost:5000/api/health

# Check logs - pastikan tidak ada error trust proxy lagi
docker logs kas-kelas-api

# Test dari host
curl http://localhost:5001/api/health

# Test via Nginx
curl http://localhost:8766/api/health

# Test via domain (tunggu 1-2 menit jika DNS belum propagate)
curl https://triforce.fahmi.app/api/health
```

**Expected logs** (no more trust proxy error):
```
🚀 Server is running on port 5000
⏰ Notification Scheduler initialized!
✅ MongoDB Connected Successfully
```

### Step 8: Test WhatsApp Reminder

```bash
# Check students yang perlu reminder
curl http://localhost:5001/api/notifications/needs-reminder?minWeeks=1

# Test send reminder (manual)
curl -X POST http://localhost:5001/api/notifications/send-reminders \
  -H "Content-Type: application/json" \
  -d '{"studentIds":["STUDENT_ID_HERE"]}'
```

---

## 📋 Manual Alternative (Without Script)

Jika mau manual tanpa script:

### Step 1: Stop Docker

```bash
cd /opt/telkom-cup
docker-compose down -v
```

### Step 2: Backup .env files

```bash
mkdir -p /root/backup-kas-kelas
cp /opt/telkom-cup/server/.env.production /root/backup-kas-kelas/
cp /opt/telkom-cup/client/.env.production /root/backup-kas-kelas/
```

### Step 3: Remove old folder

```bash
rm -rf /opt/telkom-cup
```

### Step 4: Use new folder

```bash
cd /opt/Class-Ledger

# Restore .env files
cp /root/backup-kas-kelas/server/.env.production ./server/
cp /root/backup-kas-kelas/client/.env.production ./client/
```

### Step 5: Build Docker

```bash
docker-compose up -d --build
```

---

## 🔄 Update docker-compose.yml Path (Optional)

Jika ada hardcoded paths di `docker-compose.yml`, tidak perlu diubah karena menggunakan relative paths:

```yaml
services:
    api:
        build:
            context: ./server  # ✅ Relative path, works anywhere
            dockerfile: Dockerfile
```

---

## 🚀 Future Deployment Workflow

Setelah redeploy bersih, workflow update berikutnya:

### From Local Machine:
```bash
git add .
git commit -m "Update features"
git push
```

### On VPS:
```bash
ssh root@your-vps
cd /opt/Class-Ledger
git pull
docker-compose up -d --build
docker-compose logs -f
```

---

## 🆘 Troubleshooting

### Issue: Git pull error (SSH key)

**Problem**: `Permission denied (publickey)`

**Solution**:
```bash
# Test SSH connection
ssh -T git@github.com

# Check SSH keys
ls -la ~/.ssh/

# If no key, generate one
ssh-keygen -t ed25519 -C "vps-deploy"
cat ~/.ssh/id_ed25519.pub
# Add to GitHub: https://github.com/settings/keys
```

### Issue: .env.production not found after restore

**Problem**: Backup tidak ada atau script gagal copy

**Solution**: Buat manual
```bash
cd /opt/Class-Ledger/server
nano .env.production
# Paste content dari dokumentasi ENV_FILES_GUIDE.md

cd /opt/Class-Ledger/client
nano .env.production
# Paste: VITE_API_URL=https://triforce.fahmi.app/api
```

### Issue: Docker build gagal

**Problem**: Port conflict atau network issue

**Solution**:
```bash
# Check port usage
sudo netstat -tulpn | grep -E ':(5000|5001|8766|8767)'

# Kill conflicting processes
sudo kill <PID>

# Clean Docker
docker-compose down -v
docker system prune -af
docker-compose up -d --build
```

### Issue: Notification masih gagal setelah trust proxy fix

**Problem**: Fonnte API token invalid atau WA_TEST_MODE=true

**Solution**:
```bash
# Check environment
docker exec kas-kelas-api env | grep FONNTE
docker exec kas-kelas-api env | grep WA_TEST_MODE

# Test Fonnte API manually
curl -X POST https://api.fonnte.com/send \
  -H "Authorization: YOUR_TOKEN" \
  -d "target=6281234567890&message=Test&countryCode=62"
```

---

## ✅ Checklist

### Before Redeploy:
- [ ] Push bug fix (`trust proxy`) ke GitHub
- [ ] SSH ke VPS
- [ ] Clone repo baru dengan SSH key
- [ ] Backup .env files dari folder lama

### During Redeploy:
- [ ] Run clean redeploy script
- [ ] Verify .env files restored
- [ ] Build Docker containers
- [ ] Check logs (no trust proxy error)

### After Redeploy:
- [ ] Test API health endpoint
- [ ] Test via domain (https://triforce.fahmi.app)
- [ ] Test WhatsApp reminder (manual send)
- [ ] Monitor scheduled jobs (Monday 07:00, Friday 15:00, Daily 10:00)

---

## 📝 Summary

**What Changed**:
1. ✅ Fixed `trust proxy` error di `server/server.js`
2. ✅ Added production CORS origin ke config
3. ✅ Folder baru `/opt/Class-Ledger` dengan SSH key
4. ✅ Folder lama `/opt/telkom-cup` dihapus (setelah backup)

**What's Fixed**:
1. ✅ Express sekarang trust headers dari Cloudflare/Nginx
2. ✅ Rate limiter bisa identify users dengan benar
3. ✅ WhatsApp reminders should work sekarang (no more trust proxy error blocking requests)

**Next Steps**:
1. Test send reminder manual untuk verify Fonnte API works
2. Monitor scheduled jobs (next run Monday 07:00)
3. Check production logs untuk errors lainnya

---

## 🎯 Quick Commands Reference

```bash
# VPS - Clean Redeploy
cd /opt/Class-Ledger
./scripts/vps-clean-redeploy.sh
docker-compose up -d --build

# Check Status
docker-compose ps
docker logs kas-kelas-api --tail 50
docker logs kas-kelas-frontend --tail 50

# Test Endpoints
curl http://localhost:5001/api/health
curl https://triforce.fahmi.app/api/health
curl http://localhost:5001/api/notifications/needs-reminder?minWeeks=1

# Update Next Time
git pull
docker-compose up -d --build
```
