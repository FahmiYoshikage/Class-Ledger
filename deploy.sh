#!/bin/bash
# ============================================================
# deploy.sh — Deploy script untuk VPS 1GB RAM / 2 vCPU
# ============================================================
# 1. Buat swap file (kalau belum ada) supaya build tidak OOM
# 2. Build sequential: api dulu, baru frontend
# 3. Frontend Vite butuh ~512MB heap tapi cuma ~5 detik
# ============================================================
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
SWAP_FILE="/swapfile"
SWAP_SIZE="1G"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()   { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ── Step 0: Setup swap (kalau VPS belum punya) ──
setup_swap() {
    # Cek apakah swap sudah aktif
    if swapon --show | grep -q "$SWAP_FILE"; then
        log "Swap sudah aktif ($(swapon --show --bytes | awk 'NR>1{printf "%.0fMB", $3/1024/1024}'))"
        return 0
    fi

    # Cek apakah kita root
    if [ "$(id -u)" -ne 0 ]; then
        warn "Tidak bisa buat swap (bukan root). Build mungkin OOM."
        warn "Jalankan: sudo ./deploy.sh"
        return 0
    fi

    # Buat swap file
    if [ ! -f "$SWAP_FILE" ]; then
        log "Membuat swap file ${SWAP_SIZE}..."
        fallocate -l "$SWAP_SIZE" "$SWAP_FILE" || dd if=/dev/zero of="$SWAP_FILE" bs=1M count=1024 status=progress
        chmod 600 "$SWAP_FILE"
        mkswap "$SWAP_FILE"
    fi

    # Aktifkan swap
    swapon "$SWAP_FILE"
    log "Swap ${SWAP_SIZE} aktif! Total memory sekarang: $(free -h | awk '/Mem:/{print $2}') RAM + $(free -h | awk '/Swap:/{print $2}') Swap"

    # Pastikan swap persist setelah reboot
    if ! grep -q "$SWAP_FILE" /etc/fstab 2>/dev/null; then
        echo "$SWAP_FILE none swap sw 0 0" >> /etc/fstab
        log "Swap ditambahkan ke /etc/fstab (persist setelah reboot)"
    fi
}

# ── Step 1: Setup swap ──
setup_swap

# ── Step 2: Pastikan network ada ──
if ! docker network inspect omnigrid-net >/dev/null 2>&1; then
    warn "Network omnigrid-net belum ada, membuat..."
    docker network create omnigrid-net
    log "Network omnigrid-net dibuat"
fi

# ── Step 3: Build API dulu (butuh ~256MB, cepat kalau cached) ──
log "Building API image..."
docker compose -f "$PROJECT_DIR/docker-compose.yml" build api
log "API image selesai!"

# ── Step 4: Build Frontend (butuh ~512MB heap untuk Vite, ~5 detik) ──
# Dijalankan SETELAH API selesai supaya tidak rebutan memory
log "Building Frontend image (Vite build, butuh ~512MB heap)..."
docker compose -f "$PROJECT_DIR/docker-compose.yml" build frontend
log "Frontend image selesai!"

# ── Step 5: Pastikan direktori uploads & reports ada dengan permission 777 ──
mkdir -p "$PROJECT_DIR/server/public/reports"
mkdir -p "$PROJECT_DIR/server/uploads/payment-proofs"
mkdir -p "$PROJECT_DIR/server/uploads/qr-codes"
chmod -R 777 "$PROJECT_DIR/server/public/reports" "$PROJECT_DIR/server/uploads" 2>/dev/null || true

# ── Step 6: Start containers ──
log "Starting containers..."
docker compose -f "$PROJECT_DIR/docker-compose.yml" up -d

# ── Step 6: Verifikasi E2E Safety Net ──
log "Menjalankan E2E Safety Net test..."
sleep 3
if node "$PROJECT_DIR/scripts/test-e2e.js"; then
    log "Semua test E2E lulus! Sistem berfungsi normal."
else
    warn "Beberapa test E2E gagal, periksa log di atas."
fi

# ── Done ──
echo ""
log "═══════════════════════════════════════════"
log "  Deployment selesai & terverifikasi!"
log "  API:      http://localhost:5001"
log "  Frontend: http://localhost:8767"
log "═══════════════════════════════════════════"
echo ""

# Show container status & memory
docker compose -f "$PROJECT_DIR/docker-compose.yml" ps
echo ""
free -h
