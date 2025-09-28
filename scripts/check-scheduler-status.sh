#!/bin/bash

echo "=== BACKUP & SCHEDULER STATUS CHECK ==="
echo ""

echo "📅 CRON JOB STATUS:"
echo "Cron jobs configured:"
crontab -l | grep -v "^#"
echo ""

echo "💾 BACKUP FILES:"
echo "Latest backup files:"
ls -la /Users/huyhieu/full-stack-fastapi-template/backups/db_*.dump | tail -3
echo ""

echo "📋 CRON LOG:"
if [ -f "/Users/huyhieu/full-stack-fastapi-template/backups/cron.log" ]; then
    echo "Cron log content:"
    cat /Users/huyhieu/full-stack-fastapi-template/backups/cron.log
else
    echo "No cron log found (cron job hasn't run yet)"
fi
echo ""

echo "🚀 DOCKER CONTAINERS:"
docker compose ps
echo ""

echo "📊 GMAIL SCHEDULER STATUS:"
echo "Checking backend logs for scheduler status..."
docker compose logs backend --tail=10 | grep -i scheduler
echo ""

echo "✅ STATUS SUMMARY:"
echo "- Cron job: $(if crontab -l | grep -q backup; then echo "✅ Configured"; else echo "❌ Not configured"; fi)"
echo "- Backup script: $(if [ -f "/Users/huyhieu/full-stack-fastapi-template/backup.sh" ] && [ -x "/Users/huyhieu/full-stack-fastapi-template/backup.sh" ]; then echo "✅ Executable"; else echo "❌ Missing or not executable"; fi)"
echo "- Docker containers: $(if docker compose ps | grep -q "Up"; then echo "✅ Running"; else echo "❌ Not running"; fi)"
echo "- Gmail scheduler: $(if docker compose logs backend 2>/dev/null | grep -q "Gmail sync scheduler started successfully"; then echo "✅ Running"; else echo "❌ Not running"; fi)"
