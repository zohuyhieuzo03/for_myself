#!/usr/bin/env bash
set -euo pipefail
cd /Users/huyhieu/full-stack-fastapi-template
mkdir -p backups
# Timestamp
TS=$(date +%F_%H%M%S)
# Dump inside container with env expansion there; use custom timeout
docker compose exec -T db sh -lc 'PGCONNECT_TIMEOUT=10 PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > backups/db_${TS}.dump
# Keep 7 days of dumps
find backups -type f -name 'db_*.dump' -mtime +7 -delete
