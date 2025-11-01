# 📋 Quick Reference - Deployment Kas Kelas

## 🚀 Deployment Timeline

```
┌─────────────────────────────────────────────────┐
│ 1. VPS Setup (20 min)                           │
├─────────────────────────────────────────────────┤
│ 2. Clone & Configure (10 min)                   │
├─────────────────────────────────────────────────┤
│ 3. Backend Setup (5 min)                        │
├─────────────────────────────────────────────────┤
│ 4. Frontend Build (5 min)                       │
├─────────────────────────────────────────────────┤
│ 5. Cloudflare Tunnel (10 min)                   │
├─────────────────────────────────────────────────┤
│ 6. Testing (5 min)                              │
└─────────────────────────────────────────────────┘
Total: ~55 minutes
```

---

## 🎯 One-Command Deployment

### Option A: Automated (Recommended)

```bash
# 1. Initial Setup (run once)
wget https://raw.githubusercontent.com/YOUR_REPO/master/scripts/vps-setup.sh
sudo bash vps-setup.sh

# 2. Clone repo
cd /var/www/kas-kelas
git clone YOUR_REPO_URL .

# 3. Configure environment
cd server && nano .env
cd ../client && nano .env.production

# 4. Deploy
cd /var/www/kas-kelas/scripts
./deploy.sh

# 5. Setup Cloudflare
./cloudflare-setup.sh
```

### Option B: Manual

See `DEPLOYMENT_GUIDE.md` for detailed steps.

---

## 📝 Essential Commands

### Check Everything

```bash
# Services status
pm2 list
sudo systemctl status nginx
sudo systemctl status cloudflared

# Logs
pm2 logs kas-kelas-api
sudo tail -f /var/log/nginx/kas-kelas-error.log
sudo journalctl -u cloudflared -f
```

### Restart Everything

```bash
pm2 restart kas-kelas-api
sudo systemctl restart nginx
sudo systemctl restart cloudflared
```

### Update App

```bash
cd /var/www/kas-kelas/scripts
./deploy.sh
```

---

## 🌐 Access Points

| Service      | Local                            | Public                                      |
| ------------ | -------------------------------- | ------------------------------------------- |
| Frontend     | http://localhost:8012            | https://kas-kelas.yourdomain.com            |
| Backend      | http://localhost:5000/api        | https://kas-kelas.yourdomain.com/api        |
| Health Check | http://localhost:8012/api/health | https://kas-kelas.yourdomain.com/api/health |

---

## 🔧 Configuration Files

```
/var/www/kas-kelas/
├── server/
│   └── .env                          # Backend config
├── client/
│   └── .env.production               # Frontend config
/etc/
├── nginx/
│   └── sites-available/kas-kelas     # Nginx config
└── cloudflared/
    └── config.yml                    # Tunnel config
```

---

## 🆘 Quick Fixes

### App not loading?

```bash
sudo systemctl restart nginx
pm2 restart kas-kelas-api
```

### API not responding?

```bash
pm2 logs kas-kelas-api
cd /var/www/kas-kelas/server
cat .env  # Check MongoDB URI
```

### Cloudflare Tunnel down?

```bash
sudo systemctl restart cloudflared
cloudflared tunnel list
```

### Need to rebuild frontend?

```bash
cd /var/www/kas-kelas/client
npm run build
sudo cp -r dist/* /var/www/html/kas-kelas/
```

---

## 📊 Monitoring

### System Resources

```bash
htop            # CPU/Memory
df -h           # Disk space
free -m         # Memory
```

### Application Performance

```bash
pm2 monit       # Real-time monitoring
pm2 logs --lines 100
```

### Network

```bash
sudo netstat -tlnp | grep -E '5000|8012'
curl -I http://localhost:8012
```

---

## 🔐 Security Checklist

-   [ ] `.env` files have restricted permissions (600)
-   [ ] Firewall enabled (UFW)
-   [ ] SSH key-based authentication
-   [ ] MongoDB IP whitelist configured
-   [ ] Regular backups enabled
-   [ ] SSL/TLS via Cloudflare
-   [ ] Strong passwords used

---

## 📞 Emergency Contacts

### Logs Location

-   PM2: `~/.pm2/logs/`
-   Nginx: `/var/log/nginx/`
-   Cloudflared: `journalctl -u cloudflared`

### Service Files

-   PM2: `pm2 save` → `~/.pm2/dump.pm2`
-   Cloudflared: `/etc/systemd/system/cloudflared.service`

### Backup Commands

```bash
# Backup MongoDB
mongodump --uri="$MONGODB_URI" --out=/backup/$(date +%Y%m%d)

# Backup config files
tar -czf /backup/configs.tar.gz /var/www/kas-kelas/server/.env /etc/nginx/sites-available/kas-kelas /etc/cloudflared/config.yml
```

---

## 🎓 Learn More

-   [Full Deployment Guide](./DEPLOYMENT_GUIDE.md)
-   [Scripts Documentation](./scripts/README.md)
-   [Troubleshooting Guide](./DEPLOYMENT_GUIDE.md#troubleshooting)

---

**Last Updated:** 2025-10-30
