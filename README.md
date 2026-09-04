# 🤖 Automation Scripts untuk Deployment

Scripts untuk memudahkan deployment Kas Kelas ke VPS dengan Cloudflare Tunnel.

## 📜 Available Scripts

### 1. `vps-setup.sh` - Initial VPS Setup

Setup awal VPS dengan install semua dependencies yang diperlukan.

**What it does:**

-   Install Node.js 20.x
-   Install PM2
-   Install Nginx
-   Install Git
-   Install cloudflared
-   Configure Nginx (port 8012)
-   Setup firewall (UFW)
-   Setup PM2 log rotation

**Usage:**

```bash
# Di VPS sebagai root
wget https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/master/scripts/vps-setup.sh
chmod +x vps-setup.sh
sudo ./vps-setup.sh
```

### 2. `cloudflare-setup.sh` - Cloudflare Tunnel Setup

Setup Cloudflare Tunnel untuk expose aplikasi ke internet.

**What it does:**

-   Login ke Cloudflare
-   Create tunnel
-   Generate config file
-   Create DNS record
-   Install tunnel sebagai system service

**Usage:**

```bash
# Di VPS
cd /var/www/kas-kelas/scripts
chmod +x cloudflare-setup.sh
sudo ./cloudflare-setup.sh
```

Kemudian ikuti prompt:

-   Enter tunnel name (default: kas-kelas)
-   Enter domain (e.g., kas-kelas.yourdomain.com)

### 3. `deploy.sh` - Deploy/Update Application

Deploy atau update aplikasi (pull code, build, restart services).

**What it does:**

-   Pull latest code dari Git
-   Install backend dependencies
-   Install frontend dependencies
-   Build frontend
-   Copy frontend files ke Nginx directory
-   Restart PM2 dan Nginx

**Usage:**

```bash
# Di VPS
cd /var/www/kas-kelas/scripts
chmod +x deploy.sh
./deploy.sh
```

---

## 🚀 Quick Start Guide

### Step 1: Setup VPS

```bash
# Di VPS sebagai root
wget https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/master/scripts/vps-setup.sh
chmod +x vps-setup.sh
sudo ./vps-setup.sh
```

### Step 2: Clone Repository

```bash
cd /var/www/kas-kelas
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .
```

### Step 3: Setup Backend

```bash
cd /var/www/kas-kelas/server
npm install --production

# Create .env file
nano .env
```

Paste environment variables:

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/kas-kelas
FONNTE_API_TOKEN=nfbJg3AToThMuurynxg8
WA_TEST_MODE=false
AUTO_REMINDER_ENABLED=true
START_DATE=2025-10-27
```

Start backend:

```bash
pm2 start server.js --name kas-kelas-api
pm2 save
pm2 startup  # Follow instructions
```

### Step 4: Setup Frontend

```bash
cd /var/www/kas-kelas/client

# Create .env.production
nano .env.production
```

Paste:

```env
VITE_API_URL=/api
```

Build and deploy:

```bash
npm install
npm run build
sudo cp -r dist/* /var/www/html/kas-kelas/
sudo chown -R www-data:www-data /var/www/html/kas-kelas
```

### Step 5: Setup Cloudflare Tunnel

```bash
cd /var/www/kas-kelas/scripts
chmod +x cloudflare-setup.sh
sudo ./cloudflare-setup.sh
```

### Step 6: Test Application

```bash
# Local test
curl http://localhost:8012
curl http://localhost:8012/api/health

# Check services
pm2 list
sudo systemctl status nginx
sudo systemctl status cloudflared
```

Open browser: `https://kas-kelas.yourdomain.com`

---

## 🔄 Update Workflow

Setiap kali ada update code:

```bash
cd /var/www/kas-kelas/scripts
./deploy.sh
```

---

## 📝 Manual Commands

### PM2 Commands

```bash
pm2 list                      # List all processes
pm2 logs kas-kelas-api       # View logs
pm2 restart kas-kelas-api    # Restart backend
pm2 stop kas-kelas-api       # Stop backend
pm2 delete kas-kelas-api     # Delete process
pm2 monit                     # Monitor CPU/Memory
```

### Nginx Commands

```bash
sudo systemctl status nginx
sudo systemctl restart nginx
sudo nginx -t                # Test config
sudo tail -f /var/log/nginx/kas-kelas-access.log
sudo tail -f /var/log/nginx/kas-kelas-error.log
```

### Cloudflare Tunnel Commands

```bash
sudo systemctl status cloudflared
sudo systemctl restart cloudflared
sudo journalctl -u cloudflared -f
cloudflared tunnel list
```

---

## 🐛 Troubleshooting

### Backend tidak start

```bash
pm2 logs kas-kelas-api
cd /var/www/kas-kelas/server
node server.js  # Test manually
```

### Frontend tidak load

```bash
sudo nginx -t
sudo systemctl status nginx
ls -la /var/www/html/kas-kelas
```

### Cloudflare Tunnel error

```bash
sudo systemctl status cloudflared
sudo journalctl -u cloudflared -n 50
cat /etc/cloudflared/config.yml
```

### MongoDB connection error

-   Check `.env` file
-   Check MongoDB Atlas whitelist (set to 0.0.0.0/0)
-   Test connection: `mongo "mongodb+srv://..."`

---

## 🔒 Security Notes

1. **Protect `.env` files:**

    ```bash
    chmod 600 /var/www/kas-kelas/server/.env
    ```

2. **Regular updates:**

    ```bash
    sudo apt update && sudo apt upgrade -y
    ```

3. **Monitor logs:**

    ```bash
    pm2 logs kas-kelas-api
    sudo tail -f /var/log/nginx/kas-kelas-error.log
    ```

4. **Backup MongoDB:**
    - Use MongoDB Atlas automated backups
    - Or manual: `mongodump --uri="mongodb+srv://..."`

---

## 📞 Support

Jika ada masalah:

1. Check logs (PM2, Nginx, Cloudflared)
2. Verify services running: `pm2 list`, `systemctl status nginx cloudflared`
3. Test locally: `curl http://localhost:8012`
4. Check DNS propagation: `nslookup kas-kelas.yourdomain.com`

---

## 🛠️ Tools (Automation Scripts)

Setiap kali ada update atau perlu operasi operational, gunakan script di bawah ini:

### 1. `vps-setup.sh` - Initial VPS Setup
Setup awal VPS dengan install semua dependencies yang diperlukan.
- Install Node.js 20.x, PM2, Nginx, Git, cloudflared
- Configure Nginx (port 8012), firewall (UFW), PM2 log rotation
```bash
# Di VPS sebagai root
wget https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/master/scripts/vps-setup.sh
chmod +x vps-setup.sh
sudo ./vps-setup.sh
```

### 2. `cloudflare-setup.sh` - Cloudflare Tunnel Setup
Setup Cloudflare Tunnel untuk expose aplikasi ke internet.
- Login ke Cloudflare, create tunnel, generate config file
- Create DNS record, install tunnel sebagai system service
```bash
# Di VPS
cd /var/www/kas-kelas/scripts
chmod +x cloudflare-setup.sh
sudo ./cloudflare-setup.sh
```
Ikuti prompt: Enter tunnel name (default: kas-kelas), Enter domain

### 3. `deploy.sh` - Deploy/Update Application
Deploy atau update aplikasi (pull code, build, restart services).
- Pull latest code dari Git, install dependencies, build frontend
- Copy frontend files ke Nginx directory, restart PM2 dan Nginx
```bash
# Di VPS
cd /var/www/kas-kelas/scripts
chmod +x deploy.sh
./deploy.sh
```

### 4. `vps-deploy.sh` - VPS Deploy Script
Script deploy alternatif untuk VPS dengan fitur clean redeploy.
```bash
cd /var/www/kas-kelas/scripts
./vps-deploy.sh
```

### 5. `vps-clean-redeploy.sh` - Clean Redeploy
Membersihkan dan redeploy aplikasi ke VPS.
```bash
cd /var/www/kas-kelas/scripts
sudo ./vps-clean-redeploy.sh
```

### 6. `vps-setup.sh` - VPS Setup (Lain)
Setup awal VPS dengan konfigurasi khusus.
```bash
cd /var/www/kas-kelas/scripts
sudo ./vps-setup.sh
```

### 7. `migrate-to-atlas.sh` - MongoDB Atlas Migration
Migrasi database ke MongoDB Atlas.
```bash
cd /var/www/kas-kelas/scripts
sudo ./migrate-to-atlas.sh
```

### 8. `fix-permissions.sh` - Permission Fix
Memperbaiki permission file dan direktori.
```bash
cd /var/www/kas-kelas/scripts
sudo ./fix-permissions.sh
```

### 9. `fix-localhost-settings.sh` - Localhost Settings Fix
Mengatur settingan localhost untuk development.
```bash
cd /var/www/kas-kelas/scripts
sudo ./fix-localhost-settings.sh
```

### 10. `vps-precheck.sh` - Pre-deploy Check
Check persiapan sebelum deploy ke VPS.
```bash
cd /var/www/kas-kelas/scripts
./vps-precheck.sh
```

### 11. `vps-github-auth.sh` - GitHub Auth Setup
Setup authentikasi GitHub untuk VPS.
```bash
cd /var/www/kas-kelas/scripts
sudo ./vps-github-auth.sh
```

### 12. `vps-verify-deployment.sh` - Deployment Verification
Verifikasi deployment ke VPS.
```bash
cd /var/www/kas-kelas/scripts
./vps-verify-deployment.sh
```

### 13. `test-sessions.sh` - Test Sessions
Menguji fitur pause/sessions aplikasi.
```bash
cd /var/www/kas-kelas/scripts
./test-sessions.sh
```

### 14. `verify-pause.sh` - Pause Feature Verification
Verifikasi fitur pause dalam aplikasi.
```bash
cd /var/www/kas-kelas/scripts
./verify-pause.sh
```

### 15. `restyle-app.py` - App Restyling
Script restyle/renovasi tampilan aplikasi.
```bash
cd /var/www/kas-kelas/scripts
python3 restyle-app.py
```
