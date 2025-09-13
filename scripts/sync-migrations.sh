#!/bin/bash

# Auto-sync migrations script
# This script ensures migrations are synced between container and host
# Usage: ./scripts/sync-migrations.sh

set -e

echo "🔄 Syncing migrations between container and host..."

# Check if backend container is running
if ! docker compose ps | grep -q "backend.*Up"; then
    echo "❌ Backend container is not running. Please start it first:"
    echo "   docker compose up -d"
    exit 1
fi

# Function to copy migrations from container to host
copy_from_container() {
    echo "📋 Copying migrations from container to host..."
    
    # Get list of migration files in container
    MIGRATION_FILES=$(docker compose exec backend bash -c "ls /app/app/alembic/versions/*.py" 2>/dev/null | grep -v __pycache__ || true)
    
    if [ -z "$MIGRATION_FILES" ]; then
        echo "⚠️  No migration files found in container"
        return 0
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
}

# Function to copy migrations from host to container
copy_to_container() {
    echo "📋 Copying migrations from host to container..."
    
    # Get list of migration files on host
    MIGRATION_FILES=$(ls backend/app/alembic/versions/*.py 2>/dev/null | grep -v __pycache__ || true)
    
    if [ -z "$MIGRATION_FILES" ]; then
        echo "⚠️  No migration files found on host"
        return 0
    fi
    
    # Copy each migration file
    for file in $MIGRATION_FILES; do
        filename=$(basename "$file")
        echo "   Copying $filename..."
        
        # Copy file from host to container
        docker compose cp "$file" "backend:/app/app/alembic/versions/"
        
        if [ $? -eq 0 ]; then
            echo "   ✅ Copied $filename"
        else
            echo "   ❌ Failed to copy $filename"
        fi
    done
}

# Main sync logic
echo "🔍 Checking migration status..."

# Get container migrations
CONTAINER_MIGRATIONS=$(docker compose exec backend bash -c "ls /app/app/alembic/versions/*.py" 2>/dev/null | grep -v __pycache__ | wc -l || echo "0")
HOST_MIGRATIONS=$(ls backend/app/alembic/versions/*.py 2>/dev/null | grep -v __pycache__ | wc -l || echo "0")

echo "   Container migrations: $CONTAINER_MIGRATIONS"
echo "   Host migrations: $HOST_MIGRATIONS"

if [ "$CONTAINER_MIGRATIONS" -gt "$HOST_MIGRATIONS" ]; then
    echo "📥 Container has more migrations, copying to host..."
    copy_from_container
elif [ "$HOST_MIGRATIONS" -gt "$CONTAINER_MIGRATIONS" ]; then
    echo "📤 Host has more migrations, copying to container..."
    copy_to_container
else
    echo "✅ Migrations are already in sync"
fi

echo "✅ Migration sync completed!"

# Show current status
echo ""
echo "📊 Current migration status:"
docker compose exec backend bash -c "cd /app && alembic current" 2>/dev/null || echo "   Unable to get current status"
