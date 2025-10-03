#!/usr/bin/env bash
set -euo pipefail

# Script kiểm tra và backup nếu cần thiết
# Chạy khi máy wake up từ sleep

PROJECT_DIR="/Users/huyhieu/full-stack-fastapi-template"
BACKUP_DIR="$PROJECT_DIR/backups"
LOG_FILE="/tmp/daily-backup-check.log"

# Function để log
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

log "=== Backup check started ==="

# Chuyển đến project directory
cd "$PROJECT_DIR"

# Tạo backup directory nếu chưa có
mkdir -p "$BACKUP_DIR"

# Kiểm tra xem đã có backup hôm nay chưa
TODAY=$(date +%F)
TODAY_BACKUP_EXISTS=$(find "$BACKUP_DIR" -name "db_${TODAY}_*.dump" -type f | wc -l)

log "Today's date: $TODAY"
log "Existing backups for today: $TODAY_BACKUP_EXISTS"

if [ "$TODAY_BACKUP_EXISTS" -eq 0 ]; then
    log "No backup found for today, creating backup..."
    
    # Tạo timestamp
    TS=$(date +%F_%H%M%S)
    
    # Kiểm tra Docker containers có đang chạy không
    if ! /usr/local/bin/docker-compose ps db | grep -q "Up"; then
        log "ERROR: Database container is not running, cannot create backup"
        exit 1
    fi
    
    # Tạo backup
    if /usr/local/bin/docker-compose exec -T db sh -lc \
        'PGCONNECT_TIMEOUT=10 PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
        > "$BACKUP_DIR/db_${TS}.dump"; then
        
        log "Backup created successfully: db_${TS}.dump"
        
        # Cleanup old backups (keep 7 days)
        find "$BACKUP_DIR" -type f -name 'db_*.dump' -mtime +7 -delete
        log "Old backups cleaned up"
    else
        log "ERROR: Failed to create backup"
        exit 1
    fi
else
    log "Backup for today already exists, skipping"
fi

log "=== Backup check completed ==="
