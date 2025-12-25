#!/bin/bash

# 🔐 Setup GitHub Authentication untuk VPS Deploy
# Pilih metode: Personal Access Token atau SSH Key

set -e

echo "=================================="
echo "🔐 GitHub Auth Setup untuk VPS"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}Pilih metode authentication:${NC}"
echo "1) Personal Access Token (PAT) - Cepat & mudah"
echo "2) SSH Key - Lebih aman & permanent"
echo ""
read -p "Pilihan (1/2): " AUTH_METHOD

case $AUTH_METHOD in
    1)
        # ========================================
        # Method 1: Personal Access Token
        # ========================================
        echo ""
        echo -e "${YELLOW}📋 Langkah untuk mendapatkan GitHub PAT:${NC}"
        echo "1. Buka: https://github.com/settings/tokens"
        echo "2. Click 'Generate new token (classic)'"
        echo "3. Pilih scope: 'repo' (Full control)"
        echo "4. Generate dan copy token"
        echo ""
        read -p "Paste GitHub Personal Access Token: " GITHUB_TOKEN
        
        if [ -z "$GITHUB_TOKEN" ]; then
            echo -e "${RED}❌ Token tidak boleh kosong!${NC}"
            exit 1
        fi

        # Setup git credential helper
        git config --global credential.helper store

        # Set remote URL with token
        REPO_URL="https://${GITHUB_TOKEN}@github.com/FahmiYoshikage/Class-Ledger.git"
        
        echo ""
        echo -e "${GREEN}✓ Token configured${NC}"
        echo -e "${BLUE}Testing git connection...${NC}"
        
        # Test clone or pull
        if [ -d "/opt/telkom-cup/.git" ]; then
            cd /opt/telkom-cup
            git remote set-url origin $REPO_URL
            git pull
            echo -e "${GREEN}✓ Git pull successful!${NC}"
        else
            git clone $REPO_URL /opt/telkom-cup
            echo -e "${GREEN}✓ Repository cloned to /opt/telkom-cup${NC}"
        fi
        ;;
        
    2)
        # ========================================
        # Method 2: SSH Key
        # ========================================
        echo ""
        echo -e "${BLUE}🔑 Generating SSH key...${NC}"
        
        SSH_KEY_PATH="$HOME/.ssh/kas_kelas_deploy"
        
        if [ -f "$SSH_KEY_PATH" ]; then
            echo -e "${YELLOW}⚠️  SSH key already exists at $SSH_KEY_PATH${NC}"
            read -p "Overwrite? (y/n): " OVERWRITE
            if [ "$OVERWRITE" != "y" ]; then
                echo "Using existing key..."
            else
                ssh-keygen -t ed25519 -C "kas-kelas-vps-deploy" -f $SSH_KEY_PATH -N ""
            fi
        else
            ssh-keygen -t ed25519 -C "kas-kelas-vps-deploy" -f $SSH_KEY_PATH -N ""
        fi

        echo ""
        echo -e "${GREEN}✓ SSH key generated${NC}"
        echo ""
        echo -e "${YELLOW}📋 Copy SSH public key dan tambahkan ke GitHub:${NC}"
        echo -e "${BLUE}================================================================${NC}"
        cat ${SSH_KEY_PATH}.pub
        echo -e "${BLUE}================================================================${NC}"
        echo ""
        echo "Langkah:"
        echo "1. Copy public key di atas"
        echo "2. Buka: https://github.com/settings/keys"
        echo "3. Click 'New SSH key'"
        echo "4. Paste public key"
        echo "5. Click 'Add SSH key'"
        echo ""
        read -p "Tekan Enter setelah menambahkan key ke GitHub..."

        # Setup SSH config
        SSH_CONFIG="$HOME/.ssh/config"
        
        if ! grep -q "Host github-kas-kelas" $SSH_CONFIG 2>/dev/null; then
            echo "" >> $SSH_CONFIG
            echo "# Kas Kelas Deploy Key" >> $SSH_CONFIG
            echo "Host github-kas-kelas" >> $SSH_CONFIG
            echo "    HostName github.com" >> $SSH_CONFIG
            echo "    User git" >> $SSH_CONFIG
            echo "    IdentityFile $SSH_KEY_PATH" >> $SSH_CONFIG
            echo "    IdentitiesOnly yes" >> $SSH_CONFIG
            echo -e "${GREEN}✓ SSH config updated${NC}"
        fi

        # Test SSH connection
        echo ""
        echo -e "${BLUE}Testing SSH connection...${NC}"
        ssh -T git@github.com -o StrictHostKeyChecking=no || true

        # Clone or update repo
        REPO_URL="git@github-kas-kelas:FahmiYoshikage/Class-Ledger.git"
        
        if [ -d "/opt/telkom-cup/.git" ]; then
            cd /opt/telkom-cup
            git remote set-url origin $REPO_URL
            git pull
            echo -e "${GREEN}✓ Git pull successful!${NC}"
        else
            git clone $REPO_URL /opt/telkom-cup
            echo -e "${GREEN}✓ Repository cloned to /opt/telkom-cup${NC}"
        fi
        ;;
        
    *)
        echo -e "${RED}❌ Pilihan tidak valid!${NC}"
        exit 1
        ;;
esac

echo ""
echo "=================================="
echo -e "${GREEN}✓ GitHub Authentication Setup Complete!${NC}"
echo "=================================="
echo ""
echo "📁 Repository location: /opt/telkom-cup"
echo ""
echo "🚀 Next steps:"
echo "  1. cd /opt/telkom-cup"
echo "  2. Setup .env.production files"
echo "  3. docker-compose up -d --build"
echo ""
echo "📝 Update workflow:"
echo "  git pull"
echo "  docker-compose up -d --build"
echo ""
