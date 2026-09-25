#!/bin/bash
# ============================================================
# scripts/backup-vps.sh — Otomatisasi Backup Harian Class-Ledger
# ============================================================
# Pasang di crontab host VPS:
#   crontab -e
#   0 2 * * * /opt/Class-Ledger/scripts/backup-vps.sh >> /opt/Class-Ledger/backup.log 2>&1
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$PROJECT_DIR/server/backups"
RETENTION_DAYS=7

echo "============================================================"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Memulai Backup Harian Class-Ledger"
echo "Project Directory: $PROJECT_DIR"
echo "Backup Directory : $BACKUP_DIR"
echo "============================================================"

mkdir -p "$BACKUP_DIR"

# Cek apakah berjalan via Docker container kas-kelas-api
if docker ps --format '{{.Names}}' | grep -q "^kas-kelas-api$"; then
    echo "⚙️ Menjalankan backup di dalam container kas-kelas-api..."
    docker exec kas-kelas-api node scripts/backup-cli.js
elif [ -f "$PROJECT_DIR/server/scripts/backup-cli.js" ]; then
    echo "⚙️ Menjalankan backup langsung via Node host..."
    node "$PROJECT_DIR/server/scripts/backup-cli.js"
else
    echo "❌ Script backup-cli.js tidak ditemukan!"
    exit 1
fi

# Rotasi backup: Hapus file backup yang berumur lebih dari RETENTION_DAYS
echo "🧹 Memeriksa dan membersihkan backup lama (> $RETENTION_DAYS hari)..."
find "$BACKUP_DIR" -type f -name "ClassLedger_Backup_*.zip" -mtime +"$RETENTION_DAYS" -exec rm -v {} \;

echo "✅ Backup harian selesai pada [$(date '+%Y-%m-%d %H:%M:%S')]"
echo "Daftar file backup saat ini:"
ls -lh "$BACKUP_DIR"/*.zip 2>/dev/null || echo "Tidak ada file backup."
echo "============================================================"
