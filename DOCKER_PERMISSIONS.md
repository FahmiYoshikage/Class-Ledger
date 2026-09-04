# 🐳 Docker Permission Fix Guide

## Problem

```
Error: EACCES: permission denied, open '/app/public/reports/Laporan-Kas-2025-11-23.pdf'
```

Container nodejs user (UID 1001) cannot write to volume-mounted directories owned by host user.

## Root Cause

-   Docker volume mounts preserve host filesystem permissions
-   Host directory owned by `fahmi` (UID 1000)
-   Container runs as `nodejs` user (UID 1001)
-   UID mismatch causes permission denied

## ✅ Solutions

### Option 1: Fix Host Permissions (RECOMMENDED)

```bash
# On production server
cd /opt/Class-Ledger

# Run the fix script
./fix-permissions.sh

# OR manually:
sudo chown -R 1001:1001 server/public/reports
sudo chown -R 1001:1001 server/uploads

# Restart container
docker-compose restart api
```

### Option 2: Run Container as Root (NOT RECOMMENDED - Security Risk)

```dockerfile
# Remove this line in Dockerfile:
# USER nodejs
```

### Option 3: Use /tmp Fallback (AUTOMATIC)

The code automatically falls back to `/tmp/reports` if permission denied.

**Trade-off**: PDFs won't persist across container restarts.

## 🚀 Production Deployment Checklist

### 1. After Git Pull

```bash
cd /opt/Class-Ledger
git pull
./fix-permissions.sh
docker-compose build api
docker-compose up -d api
```

### 2. Fresh Install

```bash
cd /opt/Class-Ledger

# Create directories
mkdir -p server/public/reports server/uploads

# Fix ownership (UID 1001 = nodejs user in container)
sudo chown -R 1001:1001 server/public/reports server/uploads

# Build and start
docker-compose up -d --build
```

### 3. Verify

```bash
# Check logs
docker logs -f kas-kelas-api

# Should see:
# ✅ Reports directory writable: /app/public/reports

# Test broadcast
curl -X POST https://triforce.fahmi.app/api/notifications/send-group-broadcast
```

## 🔍 Troubleshooting

### Check Directory Ownership

```bash
# On host
ls -lan server/public/reports/
# Should show: UID 1001

# Inside container
docker exec kas-kelas-api ls -la /app/public/reports/
# Should show: nodejs user
```

### Check Container User

```bash
docker exec kas-kelas-api whoami
# Should output: nodejs

docker exec kas-kelas-api id
# Should output: uid=1001(nodejs) gid=1001(nodejs)
```

### Manual Fix Inside Container (Temporary)

```bash
# Run as root
docker exec -u root kas-kelas-api chown -R nodejs:nodejs /app/public/reports

# Restart
docker-compose restart api
```

## 📁 File Structure

```
server/
├── public/
│   └── reports/          # UID 1001:1001, chmod 755
│       └── Laporan-Kas-*.pdf
├── uploads/              # UID 1001:1001, chmod 755
└── services/
    └── pdfReportService.js  # Auto-fallback to /tmp
```

## 🛡️ Security Notes

-   **Why UID 1001?** Matches nodejs user created in Dockerfile
-   **Why not root?** Security best practice - containers should not run as root
-   **Volume mounts?** Allow PDF persistence across container restarts
-   **Fallback to /tmp?** Ensures service continues even if volume has permission issues

## 🔄 Automated Fix on Startup (FUTURE)

Add to docker-compose.yml:

```yaml
api:
    entrypoint: ['/bin/sh', '-c']
    command:
        - |
            mkdir -p /app/public/reports /app/uploads
            chown -R nodejs:nodejs /app/public /app/uploads 2>/dev/null || true
            node server.js
```

**Note**: Requires container to start as root temporarily.

## 📊 Current Implementation

### Dockerfile

-   Creates `/app/public/reports` and `/app/uploads`
-   Sets ownership to `nodejs:nodejs` (UID 1001)
-   Runs as non-root user

### docker-compose.yml

-   Mounts `./server/public/reports` to `/app/public/reports`
-   Mounts `./server/uploads` to `/app/uploads`

### pdfReportService.js

-   Tests write permission on startup
-   Automatic fallback to `/tmp/reports` if permission denied
-   Logs which directory is being used

## ✅ Verification Commands

```bash
# 1. Check service status
docker ps | grep kas-kelas-api

# 2. Check logs for permission errors
docker logs kas-kelas-api 2>&1 | grep -i "permission\|eacces"

# 3. Test PDF generation
curl -X POST http://localhost:5001/api/notifications/send-group-broadcast

# 4. Check generated PDFs
ls -la server/public/reports/

# 5. Verify from browser
# https://triforce.fahmi.app/reports/Laporan-Kas-2025-11-23.pdf
```

---

**Last Updated**: November 23, 2025  
**Status**: ✅ RESOLVED - Use `fix-permissions.sh` after git pull
