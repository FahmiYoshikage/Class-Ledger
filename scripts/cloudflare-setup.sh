#!/bin/bash

# ☁️ Kas Kelas - Cloudflare Tunnel Setup Script
# Jalankan di VPS setelah vps-setup.sh

set -e

echo "=================================="
echo "☁️  Cloudflare Tunnel Setup"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get user input
echo -e "${BLUE}Enter your tunnel name (default: kas-kelas):${NC}"
read -p "> " TUNNEL_NAME
TUNNEL_NAME=${TUNNEL_NAME:-kas-kelas}

echo -e "${BLUE}Enter your domain (e.g., kas-kelas.yourdomain.com):${NC}"
read -p "> " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo "❌ Domain is required!"
    exit 1
fi

# Login to Cloudflare
echo ""
echo "🔐 Login to Cloudflare..."
echo "This will open a browser. Please authorize the connection."
cloudflared tunnel login

# Create tunnel
echo ""
echo "🚇 Creating tunnel: $TUNNEL_NAME..."
cloudflared tunnel create $TUNNEL_NAME

# Get tunnel ID
TUNNEL_ID=$(cloudflared tunnel list | grep $TUNNEL_NAME | awk '{print $1}')

if [ -z "$TUNNEL_ID" ]; then
    echo "❌ Failed to get tunnel ID"
    exit 1
fi

echo -e "${GREEN}✓ Tunnel created: $TUNNEL_ID${NC}"

# Create config directory
sudo mkdir -p /etc/cloudflared

# Find credentials file
CREDS_FILE=$(find ~/.cloudflared -name "$TUNNEL_ID.json" 2>/dev/null | head -n 1)

if [ -z "$CREDS_FILE" ]; then
    echo "❌ Credentials file not found"
    exit 1
fi

# Copy credentials to /etc/cloudflared
sudo cp $CREDS_FILE /etc/cloudflared/

# Create config file
echo ""
echo "📝 Creating tunnel configuration..."

sudo tee /etc/cloudflared/config.yml > /dev/null <<EOF
tunnel: $TUNNEL_ID
credentials-file: /etc/cloudflared/$TUNNEL_ID.json

ingress:
  - hostname: $DOMAIN
    service: http://localhost:8012
  - service: http_status:404
EOF

echo -e "${GREEN}✓ Config created at /etc/cloudflared/config.yml${NC}"

# Route DNS
echo ""
echo "🌐 Creating DNS record..."
cloudflared tunnel route dns $TUNNEL_NAME $DOMAIN

echo -e "${GREEN}✓ DNS record created${NC}"

# Test tunnel
echo ""
echo "🧪 Testing tunnel..."
timeout 10 cloudflared tunnel run $TUNNEL_NAME || true

# Install as service
echo ""
echo "🔧 Installing tunnel as system service..."
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared

# Check status
echo ""
echo "📊 Checking service status..."
sleep 3
sudo systemctl status cloudflared --no-pager

echo ""
echo "=================================="
echo -e "${GREEN}✓ Cloudflare Tunnel Setup Complete!${NC}"
echo "=================================="
echo ""
echo "📋 Tunnel Information:"
echo "  Tunnel Name: $TUNNEL_NAME"
echo "  Tunnel ID: $TUNNEL_ID"
echo "  Domain: $DOMAIN"
echo ""
echo "🌐 Your application is now accessible at:"
echo -e "  ${BLUE}https://$DOMAIN${NC}"
echo ""
echo "📝 Useful Commands:"
echo "  Check status: sudo systemctl status cloudflared"
echo "  View logs: sudo journalctl -u cloudflared -f"
echo "  Restart: sudo systemctl restart cloudflared"
echo "  List tunnels: cloudflared tunnel list"
echo ""
echo -e "${YELLOW}⚠️  Note: It may take a few minutes for DNS to propagate${NC}"
echo ""
