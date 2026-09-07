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

## 🛠️ Tools (CLI Automation)

Kas Kelas menyediakan antarmuka CLI (Command Line Interface) untuk mengelola semua operasi deployment dan maintenance. Gunakan perintah `kas` dari root project:

### Install CLI
```bash
chmod +x kas
```

### Available Commands

| Command | Deskripsi | Contoh |
|---------|-----------|--------|
| `kas help` | Tampilkan bantuan lengkap | `kas help` |
| `kas vps-setup` | Initial VPS Setup | `kas vps-setup` |
| `kas cloudflare-setup` | Cloudflare Tunnel Setup | `kas cloudflare-setup` |
| `kas deploy` | Deploy/Update Application | `kas deploy` atau `kas deploy staging` |
| `kas vps-deploy` | Deploy to VPS (alternatif) | `kas vps-deploy` |
| `kas clean-redeploy` | Clean Redeploy | `kas clean-redeploy` |
| `kas migrate-atlas` | MongoDB Atlas Migration | `kas migrate-atlas` |
| `kas fix-permissions` | Fix Permissions | `kas fix-permissions` |
| `kas fix-localhost` | Fix Localhost Settings | `kas fix-localhost` |
| `kas precheck` | Pre-deployment Check | `kas precheck` |
| `kas github-auth` | GitHub Auth Setup | `kas github-auth` |
| `kas verify-deploy` | Verify Deployment | `kas verify-deploy` |
| `kas test-sessions` | Test Sessions | `kas test-sessions` |
| `kas verify-pause` | Verify Pause Feature | `kas verify-pause` |
| `kas restyle-app` | Restyle App | `kas restyle-app` |

### Usage Examples

```bash
# Deploy aplikasi
kas deploy
kas deploy staging

# Setup VPS dari nol
kas vps-setup

# Cloudflare Tunnel Setup
kas cloudflare-setup

# Migrasi database ke Atlas
kas migrate-atlas

# Cek persiapan sebelum deploy
kas precheck

# Lihat bantuan
kas help
```

## ⚓ Deployment Methods (Pilih yang Anda Sukini)

Kas Kelas mendukung dua metode deployment yang bisa Anda pilih sesuai kebutuhan:

### opsi 1: Docker Compose (Disarankan untuk VPS/Single Admin)

Cocok untuk: VPS tunggal, admin satu orang, pengsetup yang sederhana

```bash
# Jalankan dari root project
docker-compose up -d

# Lihat status container
docker-compose ps

# Lihat log
docker-compose logs -f api
docker-compose logs -f frontend

# Matikan
docker-compose down
```

**Komponen:**
- `api` container: Node.js Express (0.5 CPU / 256 MB limits)
- `frontend` container: Nginx (0.25 CPU / 128 MB limits)
- Communication: Same Docker network (`omnigrid-net`)
- Environment: Dibaca dari `./server/.env.production`

**Cocok untuk:** Pengguna VPS, pengembangan lokal, deployment yang cepat tanpa kompleksitas K8s.

---

### opsi 2: Kubernetes (Untuk AKS/Production)

Cocok untuk: Kluster multi-node, auto-scaling, production environment

```bash
# Apply manifests
kubectl apply -f k8s/

# Cek status
kubectl get pods -n kas-kelas
kubectl get ingress -n kas-kelas

# Lihat resource
kubectl describe deployment kas-kelas-api -n kas-kelas
kubectl get hpa -n kas-kelas
```

**Komponen:**
- `kas-kelas-api` Deployment: 2 replicas, 0.5 CPU / 256 MB limits
- `kas-kelas-frontend` Deployment: 2 replicas, 0.25 CPU / 128 MB limits
- `kas-kelas-ingress` dengan TLS dari Let's Encrypt
- `PersistentVolumeClaim` untuk uploads/reports
- Communication: ClusterIP services + Ingress
- Environment: ConfigMap + Kubernetes Secrets

**Cocok untuk:** Production deployment, Azure AKS, skala yang bisa di-expand, high availability.

---

### 📖 Langkah Dasar Setiap Metode

**Docker Compose:**
1. `docker-compose up -d`
2. Akses via `http://localhost:5001` (API) dan `http://localhost:8767` (Frontend)
3. Atau gunakan Cloudflare Tunnel untuk domain publik

**Kubernetes:**
1. `kubectl apply -f k8s/`
2. Tunggu pod ready: `kubectl get pods -n kas-kelas`
3. Akses via Ingress URL: `https://kas-kelas.yourdomain.com`
4. Atau gunakan `kubectl port-forward` untuk local testing

---

## 📞 Support

Jika ada masalah:

1. Check logs (PM2, Nginx, Cloudflared)
2. Verify services running: `pm2 list`, `systemctl status nginx cloudflared`
3. Test locally: `curl http://localhost:8012`
4. Check DNS propagation: `nslookup kas-kelas.yourdomain.com`

---


## 🛠️ Tools (CLI Automation)

Kas Kelas menyediakan antarmuka CLI (Command Line Interface) untuk mengelola semua operasi deployment dan maintenance. Gunakan perintah `kas` dari root project:

### Install CLI
```bash
chmod +x kas
```

### Available Commands

| Command | Deskripsi | Contoh |
|---------|-----------|--------|
| `kas help` | Tampilkan bantuan lengkap | `kas help` |
| `kas vps-setup` | Initial VPS Setup | `kas vps-setup` |
| `kas cloudflare-setup` | Cloudflare Tunnel Setup | `kas cloudflare-setup` |
| `kas deploy` | Deploy/Update Application | `kas deploy` atau `kas deploy staging` |
| `kas vps-deploy` | Deploy to VPS (alternatif) | `kas vps-deploy` |
| `kas clean-redeploy` | Clean Redeploy | `kas clean-redeploy` |
| `kas migrate-atlas` | MongoDB Atlas Migration | `kas migrate-atlas` |
| `kas fix-permissions` | Fix Permissions | `kas fix-permissions` |
| `kas fix-localhost` | Fix Localhost Settings | `kas fix-localhost` |
| `kas precheck` | Pre-deployment Check | `kas precheck` |
| `kas github-auth` | GitHub Auth Setup | `kas github-auth` |
| `kas verify-deploy` | Verify Deployment | `kas verify-deploy` |
| `kas test-sessions` | Test Sessions | `kas test-sessions` |
| `kas verify-pause` | Verify Pause Feature | `kas verify-pause` |
| `kas restyle-app` | Restyle App | `kas restyle-app` |

### Usage Examples

```bash
# Deploy aplikasi
kas deploy
kas deploy staging

# Setup VPS dari nol
kas vps-setup

# Cloudflare Tunnel Setup
kas cloudflare-setup

# Migrasi database ke Atlas
kas migrate-atlas

# Cek persiapan sebelum deploy
kas precheck

# Lihat bantuan
kas help
```

