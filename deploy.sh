#!/bin/bash
# ============================================================
# deploy.sh — Deploy script untuk VPS 1GB RAM / 2 vCPU
# ============================================================
# Build SEQUENTIAL: api dulu, baru frontend.
# Ini mencegah OOM karena kedua build tidak rebutan memory.
# Frontend Vite butuh ~512MB heap, tapi hanya ~5 detik.
# ============================================================
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()   { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ── Step 0: Pastikan network ada ──
if ! docker network inspect omnigrid-net >/dev/null 2>&1; then
    warn "Network omnigrid-net belum ada, membuat..."
    docker network create omnigrid-net
    log "Network omnigrid-net dibuat"
fi

# ── Step 1: Build API dulu (butuh ~256MB, cepat kalau cached) ──
log "Building API image..."
docker compose -f "$PROJECT_DIR/docker-compose.yml" build api
log "API image selesai!"

# ── Step 2: Build Frontend (butuh ~512MB heap untuk Vite) ──
# Dijalankan SETELAH API selesai supaya tidak rebutan memory
log "Building Frontend image (Vite build, butuh ~512MB heap)..."
docker compose -f "$PROJECT_DIR/docker-compose.yml" build frontend
log "Frontend image selesai!"

# ── Step 3: Start containers ──
log "Starting containers..."
docker compose -f "$PROJECT_DIR/docker-compose.yml" up -d

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
