#!/bin/bash

# 🚀 Kas Kelas - VPS Setup Script
# Jalankan di VPS sebagai root atau dengan sudo

set -e  # Exit on error

echo "=================================="
echo "🚀 Kas Kelas VPS Setup Script"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo -e "${RED}Please run as root or with sudo${NC}"
   exit 1
fi

echo -e "${GREEN}✓ Running as root${NC}"

# Update system
echo ""
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 20.x
echo ""
echo "📦 Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo -e "${GREEN}✓ Node.js version: $(node --version)${NC}"
echo -e "${GREEN}✓ NPM version: $(npm --version)${NC}"

# Install PM2
echo ""
echo "📦 Installing PM2..."
npm install -g pm2

# Install Nginx
echo ""
echo "📦 Installing Nginx..."
apt install -y nginx

# Install Git
echo ""
echo "📦 Installing Git..."
apt install -y git

# Install other utilities
echo ""
echo "📦 Installing utilities..."
apt install -y curl wget nano htop ufw

# Create application directory
echo ""
echo "📁 Creating application directory..."
mkdir -p /var/www/kas-kelas
mkdir -p /var/www/html/kas-kelas

# Setup firewall
echo ""
echo "🔒 Setting up firewall..."
ufw allow 22/tcp
ufw allow 8012/tcp
echo "y" | ufw enable

echo -e "${GREEN}✓ Firewall enabled${NC}"

# Install cloudflared
echo ""
echo "☁️  Installing Cloudflare Tunnel (cloudflared)..."
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
dpkg -i cloudflared-linux-amd64.deb
rm cloudflared-linux-amd64.deb

echo -e "${GREEN}✓ cloudflared version: $(cloudflared --version)${NC}"

# Create nginx config
echo ""
echo "🔧 Creating Nginx configuration..."

cat > /etc/nginx/sites-available/kas-kelas << 'EOF'
server {
    listen 8012;
    listen [::]:8012;
    
    server_name localhost;
    
    root /var/www/html/kas-kelas;
    index index.html;
    
    access_log /var/log/nginx/kas-kelas-access.log;
    error_log /var/log/nginx/kas-kelas-error.log;
    
    location / {
        try_files $uri $uri/ /index.html;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }
    
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
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable nginx site
ln -sf /etc/nginx/sites-available/kas-kelas /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

echo -e "${GREEN}✓ Nginx configured and restarted${NC}"

# Enable gzip compression
echo ""
echo "🗜️  Enabling Nginx gzip compression..."
sed -i 's/# gzip_/gzip_/g' /etc/nginx/nginx.conf
systemctl restart nginx

# PM2 logrotate
echo ""
echo "📝 Setting up PM2 log rotation..."
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

echo ""
echo "=================================="
echo -e "${GREEN}✓ VPS Setup Complete!${NC}"
echo "=================================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Clone your repository:"
echo "   cd /var/www/kas-kelas"
echo "   git clone <your-repo-url> ."
echo ""
echo "2. Setup backend:"
echo "   cd /var/www/kas-kelas/server"
echo "   npm install --production"
echo "   nano .env  # Add your environment variables"
echo "   pm2 start server.js --name kas-kelas-api"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "3. Setup frontend:"
echo "   cd /var/www/kas-kelas/client"
echo "   npm install"
echo "   npm run build"
echo "   cp -r dist/* /var/www/html/kas-kelas/"
echo ""
echo "4. Setup Cloudflare Tunnel:"
echo "   cloudflared tunnel login"
echo "   cloudflared tunnel create kas-kelas"
echo "   nano /etc/cloudflared/config.yml  # Add tunnel config"
echo "   cloudflared service install"
echo "   systemctl start cloudflared"
echo "   systemctl enable cloudflared"
echo ""
echo "5. Test your application:"
echo "   curl http://localhost:8012"
echo "   curl http://localhost:8012/api/health"
echo ""
echo -e "${YELLOW}⚠️  Don't forget to update DNS records in Cloudflare!${NC}"
echo ""
