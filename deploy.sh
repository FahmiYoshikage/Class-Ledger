#!/bin/bash
# ============================================================
# deploy.sh — Deploy script untuk VPS 1GB RAM / 2 vCPU
# ============================================================
# Solusi: Build frontend di container terpisah (tanpa memory limit),
# lalu docker compose build cuma copy dist/ ke nginx.
# Total RAM saat runtime: API ~50MB + Nginx ~15MB = ~65MB
# ============================================================
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILDER_IMAGE="kas-kelas-builder"
BUILDER_CONTAINER="kas-kelas-extract"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()   { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ── Step 0: Pastikan .env.production ada untuk client ──
if [ ! -f "$PROJECT_DIR/client/.env.production" ]; then
    warn "client/.env.production tidak ditemukan, membuat dari example..."
    if [ -f "$PROJECT_DIR/client/.env.production.example" ]; then
        cp "$PROJECT_DIR/client/.env.production.example" "$PROJECT_DIR/client/.env.production"
        log "client/.env.production dibuat dari example"
    else
        echo "VITE_API_URL=/api" > "$PROJECT_DIR/client/.env.production"
        log "client/.env.production dibuat dengan default VITE_API_URL=/api"
    fi
fi

# ── Step 1: Build frontend di container terpisah ──
log "Building frontend di container terpisah (tanpa memory limit)..."

# Hapus dist lama kalau ada
rm -rf "$PROJECT_DIR/client/dist"

# Build menggunakan inline Dockerfile — container terpisah dari compose
# Ini TIDAK terkena deploy.resources.limits dari docker-compose.yml
docker build \
    --no-cache \
    -t "$BUILDER_IMAGE" \
    -f - "$PROJECT_DIR/client" <<'DOCKERFILE'
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV NODE_OPTIONS="--max-old-space-size=512"
RUN npm run build
DOCKERFILE

log "Frontend build selesai!"

# ── Step 2: Extract dist/ dari container ──
log "Extracting dist/ dari builder container..."

# Cleanup container lama jika ada
docker rm -f "$BUILDER_CONTAINER" 2>/dev/null || true

docker create --name "$BUILDER_CONTAINER" "$BUILDER_IMAGE" true
docker cp "$BUILDER_CONTAINER:/app/dist" "$PROJECT_DIR/client/dist"
docker rm "$BUILDER_CONTAINER"
docker rmi "$BUILDER_IMAGE" 2>/dev/null || true

if [ ! -d "$PROJECT_DIR/client/dist" ]; then
    error "dist/ tidak ditemukan setelah build! Build gagal."
fi

log "dist/ berhasil di-extract ($(du -sh "$PROJECT_DIR/client/dist" | cut -f1))"

# ── Step 3: Build Docker images via compose ──
log "Building Docker images (compose)..."
docker compose -f "$PROJECT_DIR/docker-compose.yml" build

# ── Step 4: Start containers ──
log "Starting containers..."
docker compose -f "$PROJECT_DIR/docker-compose.yml" up -d

# ── Step 5: Cleanup ──
rm -rf "$PROJECT_DIR/client/dist"
log "Temporary dist/ dibersihkan"

# ── Done ──
echo ""
log "═══════════════════════════════════════════"
log "  Deployment selesai!"
log "  API:      http://localhost:5001"
log "  Frontend: http://localhost:8767"
log "═══════════════════════════════════════════"
echo ""

# Show container status
docker compose -f "$PROJECT_DIR/docker-compose.yml" ps
