# ☁️ Menambahkan Hostname Baru ke Cloudflare Tunnel Existing

## 📋 Situasi Saat Ini

Kamu sudah punya Cloudflare Tunnel aktif dengan config:

```yaml
tunnel: 59eee031-f3bf-4475-a76c-4f4a7a75e560
credentials-file: /root/.cloudflared/59eee031-f3bf-4475-a76c-4f4a7a75e560.json

ingress:
    - hostname: kagayakuverse.my.id
      service: http://localhost:80
    - hostname: netdata.kagayakuverse.my.id
      service: http://localhost:19999
    - service: http_status:404
```

**Tujuan**: Tambahkan `triforce.fahmi.app` untuk project kas-kelas

---

## ✅ Config Cloudflare Tunnel yang Benar

### 1. Edit `/etc/cloudflared/config.yml`

```bash
sudo nano /etc/cloudflared/config.yml
```

**Tambahkan hostname baru** (jangan hapus yang lama):

```yaml
tunnel: 59eee031-f3bf-4475-a76c-4f4a7a75e560
credentials-file: /root/.cloudflared/59eee031-f3bf-4475-a76c-4f4a7a75e560.json

ingress:
    - hostname: kagayakuverse.my.id
      service: http://localhost:80
    - hostname: netdata.kagayakuverse.my.id
      service: http://localhost:19999
    - hostname: triforce.fahmi.app # ← TAMBAH INI
      service: http://localhost:8766 # ← Port Nginx
    - service: http_status:404
```

**PENTING**:

-   Port **8766** adalah port Nginx (bukan 8767!)
-   Nginx yang akan route ke container Docker

---

## 🌐 Setup DNS di Cloudflare Dashboard

### Option 1: Via CLI (Recommended)

```bash
cloudflared tunnel route dns 59eee031-f3bf-4475-a76c-4f4a7a75e560 triforce.fahmi.app
```

### Option 2: Via Dashboard

1. Login ke Cloudflare Dashboard
2. Pilih domain `fahmi.app`
3. Go to **DNS** → **Records**
4. Add CNAME record:
    ```
    Type: CNAME
    Name: triforce
    Target: 59eee031-f3bf-4475-a76c-4f4a7a75e560.cfargotunnel.com
    Proxy status: Proxied (orange cloud)
    ```

---

## 🔄 Restart Cloudflare Tunnel

```bash
# Test config dulu
sudo cloudflared tunnel run --config /etc/cloudflared/config.yml

# Kalau OK, restart service
sudo systemctl restart cloudflared

# Check status
sudo systemctl status cloudflared

# Monitor logs
sudo journalctl -u cloudflared -f
```

---

## 📊 Arsitektur Lengkap

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ☁️ Cloudflare Edge
                             │
                   ┌─────────┴─────────┐
                   │ Cloudflare Tunnel │
                   │  (Port 20241)     │
                   └─────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
    kagayakuverse.my.id  netdata...    triforce.fahmi.app
         :80               :19999          :8766
                                            │
                                    ┌───────┴───────┐
                                    │  NGINX        │
                                    │  (Port 8766)  │
                                    └───────┬───────┘
                                            │
                                ┌───────────┴───────────┐
                                │                       │
                                ▼                       ▼
                          /api/* route            /* route
                                │                       │
                                ▼                       ▼
                         localhost:5001          localhost:8767
                                │                       │
                    ┌───────────┴───────┐    ┌─────────┴─────────┐
                    │ Docker Container  │    │ Docker Container  │
                    │   Backend API     │    │   Frontend Nginx  │
                    │  (Express:5000)   │    │    (Serve:80)     │
                    └───────────────────┘    └───────────────────┘
```

---

## 🔧 Nginx Config untuk Port 8766

File: `/etc/nginx/sites-available/kas-kelas`

```nginx
# Upstream to Docker containers
upstream backend_api {
    server localhost:5001;  # Docker backend container
}

upstream frontend_static {
    server localhost:8767;  # Docker frontend container
}

# Server block (Cloudflare Tunnel masuk sini)
server {
    listen 8766;
    server_name triforce.fahmi.app;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Backend API
    location /api/ {
        proxy_pass http://backend_api/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend static files
    location / {
        proxy_pass http://frontend_static/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
```

**Enable dan reload**:

```bash
sudo ln -sf /etc/nginx/sites-available/kas-kelas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 📝 Step-by-Step Deployment

### Step 1: Edit Cloudflare Config

```bash
sudo nano /etc/cloudflared/config.yml
```

Tambahkan:

```yaml
- hostname: triforce.fahmi.app
  service: http://localhost:8766
```

### Step 2: Route DNS

```bash
cloudflared tunnel route dns 59eee031-f3bf-4475-a76c-4f4a7a75e560 triforce.fahmi.app
```

### Step 3: Setup Nginx

```bash
# Stop Node.js lama di port 5000 (jika ada)
sudo kill 1749  # atau: pm2 stop all && pm2 delete all

# Buat Nginx config
sudo nano /etc/nginx/sites-available/kas-kelas
# (Paste config dari atas)

# Enable site
sudo ln -sf /etc/nginx/sites-available/kas-kelas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 4: Deploy Docker Containers

```bash
cd /opt/telkom-cup  # atau path project kamu

# Pull latest code
git pull

# Stop container lama
docker-compose down

# Build dan start
docker-compose up -d --build

# Check status
docker-compose ps
docker-compose logs -f
```

### Step 5: Restart Cloudflare Tunnel

```bash
sudo systemctl restart cloudflared
sudo systemctl status cloudflared
```

### Step 6: Test Deployment

```bash
# Test Nginx routing
curl http://localhost:8766/health

# Test backend container
curl http://localhost:5001/api/health

# Test frontend container
curl http://localhost:8767

# Test via domain (wait 1-2 minutes for DNS)
curl https://triforce.fahmi.app/api/health
```

---

## 🆘 Troubleshooting

### 1. Cloudflare Tunnel Error

```bash
# Check logs
sudo journalctl -u cloudflared -f

# Test config manually
sudo cloudflared tunnel run --config /etc/cloudflared/config.yml
```

### 2. Nginx 502 Bad Gateway

```bash
# Check upstream services
curl http://localhost:5001/api/health
curl http://localhost:8767

# Check Docker containers
docker-compose ps
docker-compose logs backend
docker-compose logs frontend
```

### 3. DNS Not Resolving

```bash
# Check DNS record
nslookup triforce.fahmi.app

# Check tunnel routes
cloudflared tunnel route dns list

# Wait a few minutes, DNS propagation takes time
```

### 4. Port Already in Use

```bash
# Check what's using the port
sudo netstat -tulpn | grep -E ':(5000|5001|8766|8767)'

# Kill conflicting process
sudo kill <PID>
```

---

## ✅ Verification Checklist

-   [ ] Cloudflare config has `triforce.fahmi.app` → `http://localhost:8766`
-   [ ] DNS CNAME record created (via CLI or dashboard)
-   [ ] Nginx listening on port 8766
-   [ ] Nginx upstream pointing to localhost:5001 (backend) and localhost:8767 (frontend)
-   [ ] Docker containers running on ports 5001 and 8767
-   [ ] Cloudflare Tunnel service restarted
-   [ ] `curl https://triforce.fahmi.app/api/health` returns OK

---

## 🎯 Summary

**Yang Perlu Diubah**:

1. ✅ `/etc/cloudflared/config.yml` → Tambah hostname baru dengan service `http://localhost:8766`
2. ✅ Setup DNS CNAME di Cloudflare
3. ✅ Nginx config di port 8766 dengan upstream ke container ports
4. ✅ Docker containers expose ports 5001 dan 8767
5. ✅ Restart Cloudflare Tunnel service

**Yang TIDAK Diubah**:

-   ❌ Hostname lama (`kagayakuverse.my.id`, `netdata...`) tetap jalan
-   ❌ Tunnel ID tetap sama
-   ❌ Credentials file tetap sama

Hostname baru dan lama bisa **koeksist** dalam 1 tunnel! 🎉
