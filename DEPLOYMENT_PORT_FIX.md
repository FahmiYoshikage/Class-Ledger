# 🚀 VPS Deployment Fix Summary

## 🔴 Masalah yang Ditemukan

Berdasarkan `netstat -tulpn` output dari VPS Anda:

### 1. **Port Conflict - Backend (5000)**
```
tcp6  0  0  :::5000  :::*  LISTEN  1749/node /root/pro
```
- ❌ Sudah ada Node.js running di port 5000 (PID 1749)
- ❌ Docker container backend juga mau pakai port 5000
- **BENTROK!** Docker container tidak akan bisa start

### 2. **Nginx Configuration**
```
tcp  0  0  0.0.0.0:8766  *:*  LISTEN  19951/nginx
tcp  0  0  0.0.0.0:80    *:*  LISTEN  19951/nginx
```
- ✅ Nginx sudah listen di port 8766
- ⚠️ Perlu update config untuk proxy ke container ports yang baru

### 3. **Cloudflare Tunnel**
```
tcp  0  0  127.0.0.1:20241  *:*  LISTEN  16439/cloudflared
```
- ✅ Sudah running dengan benar
- ✅ Hanya listen di localhost (aman)

---

## ✅ Solusi yang Sudah Diterapkan

### 1. **Update docker-compose.yml**

**SEBELUM** (❌ Conflict):
```yaml
api:
  ports:
    - '5000:5000'  # ❌ Bentrok dengan process existing

frontend:
  ports:
    - '8766:80'    # ❌ Bentrok dengan Nginx host
```

**SESUDAH** (✅ Fixed):
```yaml
api:
  ports:
    - '5001:5000'  # ✅ Container internal 5000, host expose di 5001

frontend:
  ports:
    - '8767:80'    # ✅ Container internal 80, host expose di 8767
```

### 2. **Nginx Config Baru** (`nginx-vps-host.conf`)

```nginx
upstream backend_api {
    server localhost:5001;  # → Docker backend container
}

upstream frontend_static {
    server localhost:8767;  # → Docker frontend container
}

server {
    listen 8766;  # Cloudflare Tunnel point here
    
    location /api/ {
        proxy_pass http://backend_api/api/;
    }
    
    location / {
        proxy_pass http://frontend_static/;
    }
}
```

---

## 📋 Action Plan untuk Deploy ke VPS

### Step 1: Stop Process Lama (Port 5000)

SSH ke VPS dan jalankan:

```bash
# Cek process
sudo netstat -tulpn | grep :5000

# Stop process (ganti PID dengan yang aktual)
sudo kill 1749

# Atau jika pakai PM2:
pm2 list
pm2 stop all
pm2 delete all
```

### Step 2: Update Nginx Configuration

```bash
# Backup config lama
sudo cp /etc/nginx/sites-available/kas-kelas /etc/nginx/sites-available/kas-kelas.backup

# Copy config baru dari nginx-vps-host.conf
sudo nano /etc/nginx/sites-available/kas-kelas
# (Paste isi dari nginx-vps-host.conf)

# Test config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Step 3: Deploy Docker Containers

```bash
cd /opt/telkom-cup

# Stop container lama (jika ada)
docker-compose down

# Build dan start containers baru
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 4: Verify Deployment

```bash
# Test backend container
curl http://localhost:5001/api/health

# Test frontend container
curl http://localhost:8767/

# Test through Nginx
curl http://localhost:8766/api/health

# Test public URL (Cloudflare Tunnel)
curl https://triforce.fahmi.app/api/health
```

---

## 🎯 Final Architecture

```
┌──────────────────────────────────────────────┐
│  Internet Users                              │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────┐
│  Cloudflare Network (CDN + DDoS + SSL)       │
└────────────────┬─────────────────────────────┘
                 │
                 ▼ Encrypted Tunnel
┌──────────────────────────────────────────────┐
│  VPS (Behind NAT - No Public IP)             │
│  ┌────────────────────────────────────────┐  │
│  │ Cloudflare Tunnel (port 20241)         │  │
│  │ └→ Points to: localhost:8766           │  │
│  └────────────────┬───────────────────────┘  │
│                   │                           │
│                   ▼                           │
│  ┌────────────────────────────────────────┐  │
│  │ Nginx (port 8766)                      │  │
│  │ - Serve as reverse proxy               │  │
│  │ - Route /api/* → localhost:5001        │  │
│  │ - Route /* → localhost:8767            │  │
│  └──┬─────────────────────────────────┬───┘  │
│     │                                 │      │
│     ▼                                 ▼      │
│  ┌─────────────────┐      ┌────────────────┐│
│  │ Docker Backend  │      │ Docker Frontend││
│  │ (port 5001)     │      │ (port 8767)    ││
│  │ Internal: 5000  │      │ Internal: 80   ││
│  └────────┬────────┘      └────────────────┘│
│           │                                  │
└───────────┼──────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────┐
│  MongoDB Atlas (Cloud)                       │
│  mongodb+srv://...@material-dashboard...     │
└──────────────────────────────────────────────┘
```

---

## 🔧 Port Mapping Summary

| Service | Host Port | Container Port | Access |
|---------|-----------|----------------|--------|
| Cloudflare Tunnel | 20241 | - | localhost only |
| Nginx | 8766 | - | CF Tunnel points here |
| Backend (Docker) | 5001 | 5000 | Via Nginx proxy |
| Frontend (Docker) | 8767 | 80 | Via Nginx proxy |
| MongoDB | - | - | Atlas (cloud) |

**Tidak Ada Port Conflict!** ✅

---

## ⚡ Quick Deploy Commands

```bash
# 1. Stop old process
pm2 stop all && pm2 delete all

# 2. Update nginx
sudo cp nginx-vps-host.conf /etc/nginx/sites-available/kas-kelas
sudo nginx -t && sudo systemctl reload nginx

# 3. Deploy Docker
cd /opt/telkom-cup
docker-compose up -d --build

# 4. Verify
docker-compose ps
curl https://triforce.fahmi.app/api/health
```

---

## 📊 Files Updated

1. ✅ `docker-compose.yml` - Fixed port mappings
2. ✅ `nginx-vps-host.conf` - New Nginx config for VPS
3. ✅ `scripts/vps-precheck.sh` - Pre-deployment checker
4. ✅ `DEPLOYMENT_PORT_FIX.md` - This documentation

---

## 🆘 Troubleshooting

### Problem: Docker container won't start
```bash
# Check if ports are in use
sudo netstat -tulpn | grep -E ':(5001|8767)'

# Check Docker logs
docker-compose logs api
docker-compose logs frontend
```

### Problem: 502 Bad Gateway
```bash
# Check if containers are running
docker-compose ps

# Check if Nginx can reach containers
curl http://localhost:5001/api/health
curl http://localhost:8767/
```

### Problem: Can't access via domain
```bash
# Check Cloudflare Tunnel
sudo systemctl status cloudflared
curl http://localhost:8766/api/health

# Check Nginx
sudo nginx -t
sudo systemctl status nginx
```
