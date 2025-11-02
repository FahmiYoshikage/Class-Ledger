#!/bin/bash

# 🧹 Clean Redeploy Script
# Menghentikan Docker, hapus folder lama, setup folder baru

set -e

echo "=================================="
echo "🧹 Clean Redeploy - Kas Kelas"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Variables
OLD_PATH="/opt/telkom-cup"
NEW_PATH="/opt/Class-Ledger"
BACKUP_PATH="/root/backup-kas-kelas-$(date +%Y%m%d-%H%M%S)"

echo -e "${YELLOW}⚠️  WARNING: This will:${NC}"
echo "  1. Stop all Docker containers"
echo "  2. Remove old project folder: $OLD_PATH"
echo "  3. Backup .env files to: $BACKUP_PATH"
echo "  4. Setup new folder: $NEW_PATH"
echo ""
read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

# Step 1: Stop Docker containers
echo ""
echo -e "${BLUE}🛑 Stopping Docker containers...${NC}"

if [ -d "$OLD_PATH" ]; then
    cd $OLD_PATH
    if [ -f "docker-compose.yml" ]; then
        docker-compose down -v
        echo -e "${GREEN}✓ Containers stopped and volumes removed${NC}"
    else
        echo -e "${YELLOW}⚠️  No docker-compose.yml found, skipping...${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Old path $OLD_PATH not found${NC}"
fi

# Step 2: Backup .env files
echo ""
echo -e "${BLUE}💾 Backing up .env files...${NC}"
mkdir -p $BACKUP_PATH

if [ -d "$OLD_PATH" ]; then
    if [ -f "$OLD_PATH/server/.env.production" ]; then
        cp $OLD_PATH/server/.env.production $BACKUP_PATH/
        echo -e "${GREEN}✓ Backed up server/.env.production${NC}"
    fi
    
    if [ -f "$OLD_PATH/client/.env.production" ]; then
        cp $OLD_PATH/client/.env.production $BACKUP_PATH/
        echo -e "${GREEN}✓ Backed up client/.env.production${NC}"
    fi
    
    if [ -f "$OLD_PATH/server/.env" ]; then
        cp $OLD_PATH/server/.env $BACKUP_PATH/
        echo -e "${GREEN}✓ Backed up server/.env${NC}"
    fi
    
    echo -e "${GREEN}✓ Backup saved to: $BACKUP_PATH${NC}"
else
    echo -e "${YELLOW}⚠️  Nothing to backup${NC}"
fi

# Step 3: Remove old folder
echo ""
echo -e "${BLUE}🗑️  Removing old folder...${NC}"

if [ -d "$OLD_PATH" ]; then
    rm -rf $OLD_PATH
    echo -e "${GREEN}✓ Removed $OLD_PATH${NC}"
else
    echo -e "${YELLOW}⚠️  Folder not found, skipping${NC}"
fi

# Step 4: Check if new folder exists
echo ""
echo -e "${BLUE}📁 Checking new folder...${NC}"

if [ -d "$NEW_PATH" ]; then
    echo -e "${GREEN}✓ New folder exists: $NEW_PATH${NC}"
    cd $NEW_PATH
    
    # Check if it's a git repo
    if [ -d ".git" ]; then
        echo -e "${GREEN}✓ Git repository detected${NC}"
        git status
    else
        echo -e "${RED}✗ Not a git repository!${NC}"
        echo "Please clone the repository first:"
        echo "  git clone git@github.com:FahmiYoshikage/Class-Ledger.git $NEW_PATH"
        exit 1
    fi
else
    echo -e "${RED}✗ New folder not found: $NEW_PATH${NC}"
    echo ""
    echo "Please clone the repository first:"
    echo "  git clone git@github.com:FahmiYoshikage/Class-Ledger.git $NEW_PATH"
    exit 1
fi

# Step 5: Restore .env files
echo ""
echo -e "${BLUE}📝 Setting up .env files...${NC}"

if [ -f "$BACKUP_PATH/server/.env.production" ]; then
    cp $BACKUP_PATH/server/.env.production $NEW_PATH/server/.env.production
    echo -e "${GREEN}✓ Restored server/.env.production${NC}"
else
    echo -e "${YELLOW}⚠️  No backup found, please create server/.env.production manually${NC}"
fi

if [ -f "$BACKUP_PATH/client/.env.production" ]; then
    cp $BACKUP_PATH/client/.env.production $NEW_PATH/client/.env.production
    echo -e "${GREEN}✓ Restored client/.env.production${NC}"
else
    echo -e "${YELLOW}⚠️  No backup found, please create client/.env.production manually${NC}"
fi

# Step 6: Check docker-compose.yml
echo ""
echo -e "${BLUE}🐳 Checking docker-compose.yml...${NC}"

if [ -f "$NEW_PATH/docker-compose.yml" ]; then
    echo -e "${GREEN}✓ docker-compose.yml found${NC}"
else
    echo -e "${RED}✗ docker-compose.yml not found!${NC}"
    exit 1
fi

# Step 7: Show next steps
echo ""
echo "=================================="
echo -e "${GREEN}✓ Cleanup Complete!${NC}"
echo "=================================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Verify .env files:"
echo "   cd $NEW_PATH"
echo "   ls -la server/.env.production"
echo "   ls -la client/.env.production"
echo ""
echo "2. Build and start Docker:"
echo "   docker-compose up -d --build"
echo ""
echo "3. Check status:"
echo "   docker-compose ps"
echo "   docker-compose logs -f"
echo ""
echo "4. Test deployment:"
echo "   curl http://localhost:5001/api/health"
echo "   curl https://triforce.fahmi.app/api/health"
echo ""
echo "📦 Backup location: $BACKUP_PATH"
echo ""
