# 🚀 Panduan Deployment Kas Kelas ke VPS dengan Cloudflare Tunnel

## 📋 Arsitektur Deployment

```
Internet
    ↓
Cloudflare Tunnel (https://kas-kelas.yourdomain.com)
    ↓
VPS (tanpa IP publik)
    ↓
Nginx Reverse Proxy (Port 8012)
    ├── /api → Backend API (Node.js Port 5000)
    └── /    → Frontend (Static Files)
```

---

## 🛠️ Prerequisites

### Di Local Machine:

-   [x] Project Kas Kelas sudah lengkap
-   [x] MongoDB connection string (MongoDB Atlas atau local)
-   [x] Domain terdaftar di Cloudflare

### Di VPS:

-   Ubuntu 20.04/22.04 atau Debian 11/12
-   RAM minimal 1GB
-   Storage minimal 10GB
-   Tidak perlu IP publik

---

## 📦 Step 1: Persiapan Project untuk Production

### 1.1 Update Environment Variables

**Server (.env)**

```bash
cd /home/fahmi/Documents/Project/kas-kelas/server
nano .env
```

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/kas-kelas
FONNTE_API_TOKEN=nfbJg3AToThMuurynxg8
WA_TEST_MODE=false
AUTO_REMINDER_ENABLED=true
START_DATE=2025-10-27
```

**Client (.env.production)**

```bash
cd /home/fahmi/Documents/Project/kas-kelas/client
nano .env.production
```

```env
VITE_API_URL=/api
```

### 1.2 Build Frontend untuk Production

```bash
cd /home/fahmi/Documents/Project/kas-kelas/client
npm run build
```

Ini akan generate folder `dist/` yang berisi static files.

---

## 🖥️ Step 2: Setup VPS

### 2.1 Login ke VPS

```bash
ssh root@your-vps-ip
# atau jika sudah setup user:
ssh username@your-vps-ip
```

### 2.2 Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.3 Install Node.js 20.x

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Verifikasi
npm --version
```

### 2.4 Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### 2.5 Install Nginx

```bash
sudo apt install -y nginx
```

### 2.6 Install Git (untuk clone project)

```bash
sudo apt install -y git
```

---

## 📁 Step 3: Upload Project ke VPS

### Opsi A: Menggunakan Git (Recommended)

```bash
# Di VPS, buat folder untuk aplikasi
cd /home
sudo mkdir -p /var/www/kas-kelas
sudo chown -R $USER:$USER /var/www/kas-kelas

# Clone dari GitHub
cd /var/www/kas-kelas
git clone https://github.com/FahmiYoshikage/Class-Ledger.git .

# Atau jika repo private, gunakan SSH key atau personal access token
```

### Opsi B: Menggunakan SCP/RSYNC (dari Local)

```bash
# Di local machine
cd /home/fahmi/Documents/Project
rsync -avz --exclude 'node_modules' --exclude '.git' \
  kas-kelas/ username@your-vps-ip:/var/www/kas-kelas/
```

---

## ⚙️ Step 4: Setup Backend (Server)

### 4.1 Install Dependencies

```bash
cd /var/www/kas-kelas/server
npm install --production
```

### 4.2 Create Environment File

```bash
nano .env
```

Paste environment variables dari Step 1.1

### 4.3 Test Backend

```bash
node server.js
# Ctrl+C untuk stop
```

### 4.4 Setup PM2

```bash
cd /var/www/kas-kelas/server
pm2 start server.js --name kas-kelas-api
pm2 save
pm2 startup  # Follow instructions
```

Verifikasi:

```bash
pm2 list
pm2 logs kas-kelas-api
```

---

## 🌐 Step 5: Setup Frontend (Client)

### 5.1 Build Frontend di VPS (jika belum build di local)

```bash
cd /var/www/kas-kelas/client
npm install
npm run build
```

### 5.2 Pindahkan dist ke folder Nginx

```bash
sudo mkdir -p /var/www/html/kas-kelas
sudo cp -r dist/* /var/www/html/kas-kelas/
sudo chown -R www-data:www-data /var/www/html/kas-kelas
```

---

## 🔧 Step 6: Configure Nginx (Port 8012)

### 6.1 Create Nginx Config

```bash
sudo nano /etc/nginx/sites-available/kas-kelas
```

**Paste konfigurasi ini:**

```nginx
server {
    listen 8012;
    listen [::]:8012;

    server_name localhost;

    # Root directory untuk frontend
    root /var/www/html/kas-kelas;
    index index.html;

    # Logging
    access_log /var/log/nginx/kas-kelas-access.log;
    error_log /var/log/nginx/kas-kelas-error.log;

    # Frontend - serve static files
    location / {
        try_files $uri $uri/ /index.html;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 6.2 Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/kas-kelas /etc/nginx/sites-enabled/
sudo nginx -t  # Test config
sudo systemctl restart nginx
```

### 6.3 Test Nginx

```bash
curl http://localhost:8012
curl http://localhost:8012/api/health
```

---

## ☁️ Step 7: Setup Cloudflare Tunnel

### 7.1 Install cloudflared

```bash
# Download cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
cloudflared --version
```

### 7.2 Login ke Cloudflare

```bash
cloudflared tunnel login
```

Browser akan terbuka, pilih domain Anda dan authorize.

### 7.3 Create Tunnel

```bash
cloudflared tunnel create kas-kelas
```

Output akan memberikan Tunnel ID. Simpan ID ini!

### 7.4 Create Config File

```bash
sudo mkdir -p /etc/cloudflared
sudo nano /etc/cloudflared/config.yml
```

**Paste konfigurasi:**

```yaml
tunnel: <TUNNEL_ID_DARI_STEP_7.3>
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

ingress:
    - hostname: kas-kelas.yourdomain.com
      service: http://localhost:8012
    - service: http_status:404
```

**Ganti:**

-   `<TUNNEL_ID>` dengan ID dari step 7.3
-   `kas-kelas.yourdomain.com` dengan subdomain Anda

### 7.5 Create DNS Record di Cloudflare

```bash
cloudflared tunnel route dns kas-kelas kas-kelas.yourdomain.com
```

Atau manual di Cloudflare Dashboard:

-   Type: `CNAME`
-   Name: `kas-kelas`
-   Target: `<TUNNEL_ID>.cfargotunnel.com`
-   Proxy status: Proxied (orange cloud)

### 7.6 Test Tunnel

```bash
cloudflared tunnel run kas-kelas
```

Jika berhasil, akses `https://kas-kelas.yourdomain.com` di browser.

### 7.7 Setup Tunnel as Service

```bash
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
sudo systemctl status cloudflared
```

---

## 🔒 Step 8: Security & Optimization

### 8.1 Setup Firewall (UFW)

```bash
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 8012/tcp  # Nginx (hanya untuk localhost)
sudo ufw enable
sudo ufw status
```

### 8.2 Setup MongoDB Atlas (jika belum)

1. Buka https://cloud.mongodb.com
2. Create cluster (Free tier M0)
3. Add Database User
4. Whitelist IP: `0.0.0.0/0` (allow from anywhere)
5. Get connection string
6. Update `.env` di server

### 8.3 Setup PM2 Monitoring

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 8.4 Enable Nginx Gzip Compression

```bash
sudo nano /etc/nginx/nginx.conf
```

Uncomment atau tambahkan:

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
```

```bash
sudo systemctl restart nginx
```

---

## 🧪 Step 9: Testing

### 9.1 Test Backend API

```bash
curl https://kas-kelas.yourdomain.com/api/health
```

Expected response:

```json
{ "status": "OK", "message": "Server is running" }
```

### 9.2 Test Frontend

Buka browser: `https://kas-kelas.yourdomain.com`

### 9.3 Test Login

Login dengan user admin yang sudah dibuat.

---

## 📊 Step 10: Monitoring & Maintenance

### 10.1 Check PM2 Status

```bash
pm2 list
pm2 logs kas-kelas-api
pm2 monit
```

### 10.2 Check Nginx Logs

```bash
sudo tail -f /var/log/nginx/kas-kelas-access.log
sudo tail -f /var/log/nginx/kas-kelas-error.log
```

### 10.3 Check Cloudflare Tunnel

```bash
sudo systemctl status cloudflared
sudo journalctl -u cloudflared -f
```

### 10.4 Restart Services

```bash
# Restart Backend
pm2 restart kas-kelas-api

# Restart Nginx
sudo systemctl restart nginx

# Restart Cloudflare Tunnel
sudo systemctl restart cloudflared
```

---

## 🔄 Step 11: Update Deployment (untuk update code di masa depan)

### 11.1 Pull Latest Code

```bash
cd /var/www/kas-kelas
git pull origin master
```

### 11.2 Update Backend

```bash
cd server
npm install --production
pm2 restart kas-kelas-api
```

### 11.3 Update Frontend

```bash
cd ../client
npm install
npm run build
sudo cp -r dist/* /var/www/html/kas-kelas/
```

---

## 🆘 Troubleshooting

### Problem: Frontend tidak load

```bash
# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# Check permissions
ls -la /var/www/html/kas-kelas
```

### Problem: API tidak response

```bash
# Check PM2
pm2 logs kas-kelas-api
pm2 restart kas-kelas-api

# Check port
sudo netstat -tlnp | grep 5000
```

### Problem: Cloudflare Tunnel error

```bash
# Check service
sudo systemctl status cloudflared
sudo journalctl -u cloudflared -n 50

# Restart tunnel
sudo systemctl restart cloudflared
```

### Problem: MongoDB connection failed

-   Check connection string di `.env`
-   Check MongoDB Atlas whitelist IP (set to 0.0.0.0/0)
-   Check network access di MongoDB Atlas

---

## 📝 Checklist Deployment

-   [ ] VPS sudah setup (Node.js, PM2, Nginx, cloudflared)
-   [ ] MongoDB Atlas sudah dikonfigurasi
-   [ ] Project sudah di upload ke VPS
-   [ ] Backend dependencies installed
-   [ ] Frontend sudah di-build
-   [ ] Nginx config sudah dibuat (port 8012)
-   [ ] PM2 sudah running backend
-   [ ] Cloudflare Tunnel sudah dibuat
-   [ ] DNS record sudah ditambahkan
-   [ ] HTTPS berfungsi via Cloudflare
-   [ ] Testing login berhasil
-   [ ] PM2 startup enabled
-   [ ] Cloudflared service enabled

---

## 🎯 Final Architecture

```
User Browser
    ↓ HTTPS
Cloudflare CDN + SSL
    ↓ Cloudflare Tunnel
VPS (no public IP)
    ↓ Port 8012
Nginx
    ├─→ /api → Backend (localhost:5000) → MongoDB Atlas
    └─→ /    → Frontend (static files)
```

---

## 📞 Useful Commands

```bash
# PM2
pm2 list
pm2 logs kas-kelas-api
pm2 restart kas-kelas-api
pm2 stop kas-kelas-api
pm2 delete kas-kelas-api

# Nginx
sudo systemctl status nginx
sudo systemctl restart nginx
sudo nginx -t

# Cloudflare Tunnel
sudo systemctl status cloudflared
sudo systemctl restart cloudflared
cloudflared tunnel list

# Monitoring
htop
df -h
free -m
```

---

## 🔐 Security Best Practices

1. **Gunakan SSH Key** (bukan password) untuk login VPS
2. **Disable root login** di SSH config
3. **Setup fail2ban** untuk protect SSH
4. **Regular backup** database MongoDB
5. **Keep system updated**: `sudo apt update && sudo apt upgrade`
6. **Monitor logs** secara berkala
7. **Setup Cloudflare WAF rules** untuk extra protection

---

## 📖 Resources

-   Cloudflare Tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
-   PM2 Documentation: https://pm2.keymetrics.io/
-   Nginx Documentation: https://nginx.org/en/docs/
-   MongoDB Atlas: https://www.mongodb.com/docs/atlas/

---

**Selamat! Aplikasi Kas Kelas Anda sudah live di production! 🎉**

Akses di: `https://kas-kelas.yourdomain.com`
