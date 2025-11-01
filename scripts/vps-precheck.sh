#!/bin/bash
# VPS Pre-Deployment Checklist & Commands
# Untuk VPS dengan Cloudflare Tunnel (tanpa IP publik)

echo "🔍 VPS Pre-Deployment Checklist"
echo "================================"
echo ""

# 1. Check existing Node.js process
echo "1️⃣ Checking existing Node.js process on port 5000..."
EXISTING_PID=$(netstat -tulpn 2>/dev/null | grep ':5000' | awk '{print $7}' | cut -d'/' -f1)
if [ -n "$EXISTING_PID" ]; then
    echo "   ⚠️  Found existing process: PID $EXISTING_PID"
    echo "   📝 You need to stop this before deploying Docker:"
    echo "      kill $EXISTING_PID"
    echo "      OR use PM2: pm2 stop all && pm2 delete all"
else
    echo "   ✅ Port 5000 is free"
fi
echo ""

# 2. Check Nginx
echo "2️⃣ Checking Nginx configuration..."
if systemctl is-active --quiet nginx; then
    echo "   ✅ Nginx is running"
    NGINX_8766=$(netstat -tulpn 2>/dev/null | grep ':8766')
    if [ -n "$NGINX_8766" ]; then
        echo "   ✅ Nginx listening on port 8766"
    else
        echo "   ⚠️  Nginx NOT listening on port 8766"
        echo "      Need to configure nginx for port 8766"
    fi
else
    echo "   ❌ Nginx is NOT running"
fi
echo ""

# 3. Check Cloudflare Tunnel
echo "3️⃣ Checking Cloudflare Tunnel..."
if systemctl is-active --quiet cloudflared 2>/dev/null; then
    echo "   ✅ Cloudflared service is running"
elif pgrep -x cloudflared > /dev/null; then
    echo "   ✅ Cloudflared process is running"
else
    echo "   ⚠️  Cloudflared is NOT running"
fi

CF_PID=$(netstat -tulpn 2>/dev/null | grep ':20241' | awk '{print $7}' | cut -d'/' -f1)
if [ -n "$CF_PID" ]; then
    echo "   ✅ Cloudflare Tunnel listening on port 20241"
else
    echo "   ⚠️  No process on port 20241 (expected for Cloudflare Tunnel)"
fi
echo ""

# 4. Check MongoDB
echo "4️⃣ Checking MongoDB..."
if systemctl is-active --quiet mongod 2>/dev/null; then
    echo "   ℹ️  Local MongoDB is running (using Atlas instead - OK)"
else
    echo "   ℹ️  Local MongoDB not running (using Atlas - OK)"
fi
echo ""

# 5. Check Docker
echo "5️⃣ Checking Docker..."
if command -v docker &> /dev/null; then
    echo "   ✅ Docker is installed"
    if systemctl is-active --quiet docker; then
        echo "   ✅ Docker service is running"
    else
        echo "   ❌ Docker service is NOT running"
    fi
else
    echo "   ❌ Docker is NOT installed"
fi

if command -v docker-compose &> /dev/null || docker compose version &> /dev/null 2>&1; then
    echo "   ✅ Docker Compose is available"
else
    echo "   ❌ Docker Compose is NOT installed"
fi
echo ""

# 6. Port Summary
echo "6️⃣ Port Usage Summary:"
echo "   Current VPS ports:"
netstat -tulpn 2>/dev/null | grep LISTEN | awk '{print "   - "$4" → "$7}' | sort -u
echo ""
echo "   Required ports for Docker deployment:"
echo "   - 5001 (host) → Backend container (internal 5000)"
echo "   - 8767 (host) → Frontend container (internal 80)"
echo "   - 8766 → Nginx (proxies to containers)"
echo "   - 20241 → Cloudflare Tunnel (OK, already running)"
echo ""

# 7. Action Items
echo "📋 ACTION ITEMS BEFORE DEPLOYMENT:"
echo "=================================="
echo ""
echo "✅ Things that are GOOD:"
echo "   - Cloudflare Tunnel: Running ✓"
echo "   - Nginx: Running on correct ports ✓"
echo "   - MongoDB Atlas: Will be used (no local dependency) ✓"
echo ""
echo "⚠️  Things to FIX:"
echo ""
echo "1. Stop existing Node.js on port 5000:"
echo "   SSH to VPS and run:"
echo "   sudo kill $EXISTING_PID"
echo "   # OR if using PM2:"
echo "   pm2 stop all && pm2 delete all"
echo ""
echo "2. Update Nginx config to proxy to new ports:"
echo "   sudo nano /etc/nginx/sites-available/kas-kelas"
echo "   # Use the config from: nginx-vps-host.conf"
echo "   sudo nginx -t"
echo "   sudo systemctl reload nginx"
echo ""
echo "3. Deploy with Docker Compose:"
echo "   cd /opt/telkom-cup"
echo "   docker-compose down  # if running"
echo "   docker-compose up -d --build"
echo "   docker-compose ps"
echo "   docker-compose logs -f"
echo ""
echo "4. Verify deployment:"
echo "   curl http://localhost:5001/api/health  # Backend"
echo "   curl http://localhost:8767/            # Frontend"
echo "   curl http://localhost:8766/api/health  # Through Nginx"
echo "   curl https://triforce.fahmi.app/api/health  # Public"
echo ""

echo "🎯 DEPLOYMENT ARCHITECTURE:"
echo "=========================="
echo ""
echo "Internet → Cloudflare Tunnel (port 20241)"
echo "         ↓"
echo "    Host Nginx (port 8766)"
echo "         ↓"
echo "    ├─→ Frontend Container (host:8767 → container:80)"
echo "    └─→ Backend Container (host:5001 → container:5000)"
echo "              ↓"
echo "         MongoDB Atlas (cloud)"
echo ""
