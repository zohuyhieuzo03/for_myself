#!/bin/bash

# Migration Helper Script
# This script helps create Alembic migrations and copy them to the host machine

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -m, --message MESSAGE    Migration message (required)"
    echo "  -a, --autogenerate       Use autogenerate mode"
    echo "  -c, --copy-only          Only copy existing migrations from container"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -m 'Add user profile fields' -a"
    echo "  $0 -m 'Add user profile fields'"
    echo "  $0 -c"
}

# Default values
MESSAGE=""
AUTOGENERATE=false
COPY_ONLY=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -m|--message)
            MESSAGE="$2"
            shift 2
            ;;
        -a|--autogenerate)
            AUTOGENERATE=true
            shift
            ;;
        -c|--copy-only)
            COPY_ONLY=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Check if Docker Compose is running
if ! docker compose ps | grep -q "backend.*running"; then
    print_error "Backend container is not running. Please start it first with:"
    echo "  docker compose up -d"
    exit 1
fi

# Function to copy migrations from container to host
copy_migrations() {
    print_info "Copying migration files from container to host..."
    
    # Get list of migration files in container
    MIGRATION_FILES=$(docker compose exec backend bash -c "ls /app/app/alembic/versions/*.py" 2>/dev/null | grep -v __pycache__ || true)
    
    if [ -z "$MIGRATION_FILES" ]; then
        print_warning "No migration files found in container"
        return 0
    fi
    
    # Copy each migration file
    for file in $MIGRATION_FILES; do
        filename=$(basename "$file")
        print_info "Copying $filename..."
        
        # Copy file from container to host
        docker compose cp "backend:$file" "backend/app/alembic/versions/"
        
        if [ $? -eq 0 ]; then
            print_success "Copied $filename successfully"
        else
            print_error "Failed to copy $filename"
        fi
    done
}

# Function to create new migration
create_migration() {
    if [ -z "$MESSAGE" ]; then
        print_error "Migration message is required. Use -m or --message option."
        show_usage
        exit 1
    fi
    
    print_info "Creating new migration with message: '$MESSAGE'"
    
    if [ "$AUTOGENERATE" = true ]; then
        print_info "Using autogenerate mode..."
        docker compose exec backend bash -c "cd /app && alembic revision --autogenerate -m '$MESSAGE'"
    else
        print_info "Creating empty migration..."
        docker compose exec backend bash -c "cd /app && alembic revision -m '$MESSAGE'"
    fi
    
    if [ $? -eq 0 ]; then
        print_success "Migration created successfully"
        
        # Copy the new migration file
        copy_migrations
    else
        print_error "Failed to create migration"
        exit 1
    fi
}

# Function to run migrations
run_migrations() {
    print_info "Running migrations..."
    docker compose exec backend bash -c "cd /app && alembic upgrade head"
    
    if [ $? -eq 0 ]; then
        print_success "Migrations applied successfully"
    else
        print_error "Failed to apply migrations"
        exit 1
    fi
}

# Function to show migration status
show_status() {
    print_info "Current migration status:"
    docker compose exec backend bash -c "cd /app && alembic current"
    
    print_info "Migration history:"
    docker compose exec backend bash -c "cd /app && alembic history"
}

# Main execution
main() {
    print_info "Starting migration process..."
    
    if [ "$COPY_ONLY" = true ]; then
        copy_migrations
    else
        create_migration
        
        # Ask if user wants to run migrations
        echo ""
        read -p "Do you want to apply the migration now? (y/N): " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            run_migrations
        else
            print_info "Migration created but not applied. Run 'alembic upgrade head' in the container to apply it."
        fi
    fi
    
    echo ""
    show_status
    
    print_success "Migration process completed!"
    print_info "Don't forget to commit the migration files to git:"
    echo "  git add backend/app/alembic/versions/"
    echo "  git commit -m 'Add migration: $MESSAGE'"
}

# Run main function
main
