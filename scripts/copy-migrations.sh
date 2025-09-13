#!/bin/bash

# Simple script to copy migrations from container to host
# Usage: ./scripts/copy-migrations.sh

echo "📋 Copying migration files from container to host..."

# Get list of migration files in container
MIGRATION_FILES=$(docker compose exec backend bash -c "ls /app/app/alembic/versions/*.py" 2>/dev/null | grep -v __pycache__ || true)

if [ -z "$MIGRATION_FILES" ]; then
    echo "⚠️  No migration files found in container"
    exit 0
fi

# Copy each migration file
for file in $MIGRATION_FILES; do
    filename=$(basename "$file")
    echo "   Copying $filename..."
    
    # Copy file from container to host
    docker compose cp "backend:$file" "backend/app/alembic/versions/"
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Copied $filename"
    else
        echo "   ❌ Failed to copy $filename"
    fi
done

echo "✅ Migration copy completed!"
