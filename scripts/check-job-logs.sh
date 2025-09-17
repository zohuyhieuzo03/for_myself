#!/bin/bash

# Script để check log của Gmail sync jobs
# Usage: ./scripts/check-job-logs.sh [status|logs|monitor]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:8000"
API_BASE="$BACKEND_URL/api/v1"

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

# Function to check if backend is running
check_backend() {
    if ! curl -s "$BACKEND_URL/docs" > /dev/null 2>&1; then
        print_error "Backend server is not running at $BACKEND_URL"
        print_info "Please start the backend server first:"
        print_info "  cd backend && source .venv/bin/activate && uvicorn app.main:app --reload"
        exit 1
    fi
}

# Function to get auth token (you need to set this)
get_auth_token() {
    if [ -z "$AUTH_TOKEN" ]; then
        print_warning "AUTH_TOKEN environment variable not set"
        print_info "Please set your auth token:"
        print_info "  export AUTH_TOKEN='your_jwt_token_here'"
        print_info "Or login first and get token from browser dev tools"
        exit 1
    fi
    echo "$AUTH_TOKEN"
}

# Function to check scheduler status
check_status() {
    print_info "Checking Gmail sync scheduler status..."
    
    local token=$(get_auth_token)
    local response=$(curl -s -H "Authorization: Bearer $token" \
        "$API_BASE/gmail/scheduler/status")
    
    if [ $? -eq 0 ]; then
        echo "$response" | jq '.'
    else
        print_error "Failed to get scheduler status"
        exit 1
    fi
}

# Function to check recent logs
check_logs() {
    print_info "Checking recent Gmail sync logs..."
    
    # If running with docker
    if command -v docker >/dev/null 2>&1 && docker ps | grep -q backend; then
        print_info "Found Docker containers, checking logs..."
        docker logs --tail 50 $(docker ps | grep backend | awk '{print $1}') | grep -i "gmail\|sync\|scheduler" || true
    else
        print_info "Docker not found or backend not running in Docker"
        print_info "Please check logs manually from your terminal where backend is running"
    fi
}

# Function to monitor status in real-time
monitor_status() {
    print_info "Monitoring Gmail sync scheduler status (press Ctrl+C to stop)..."
    
    local token=$(get_auth_token)
    
    while true; do
        clear
        echo "=== Gmail Sync Scheduler Monitor - $(date) ==="
        echo
        
        local response=$(curl -s -H "Authorization: Bearer $token" \
            "$API_BASE/gmail/scheduler/status")
        
        if [ $? -eq 0 ]; then
            echo "$response" | jq '.'
        else
            print_error "Failed to get scheduler status"
        fi
        
        echo
        print_info "Refreshing in 30 seconds... (Ctrl+C to stop)"
        sleep 30
    done
}

# Function to trigger manual sync
trigger_sync() {
    print_info "Triggering manual Gmail sync..."
    
    local token=$(get_auth_token)
    local response=$(curl -s -X POST -H "Authorization: Bearer $token" \
        "$API_BASE/gmail/scheduler/sync-all?days=1")
    
    if [ $? -eq 0 ]; then
        print_success "Manual sync triggered successfully"
        echo "$response" | jq '.'
    else
        print_error "Failed to trigger manual sync"
        exit 1
    fi
}

# Function to show help
show_help() {
    echo "Gmail Sync Job Log Checker"
    echo
    echo "Usage: $0 [COMMAND]"
    echo
    echo "Commands:"
    echo "  status     - Check scheduler status and job info"
    echo "  logs       - Show recent logs (Docker only)"
    echo "  monitor    - Monitor status in real-time"
    echo "  sync       - Trigger manual sync"
    echo "  help       - Show this help message"
    echo
    echo "Environment Variables:"
    echo "  AUTH_TOKEN - JWT token for API authentication"
    echo
    echo "Examples:"
    echo "  export AUTH_TOKEN='your_token_here'"
    echo "  $0 status"
    echo "  $0 monitor"
}

# Main script logic
main() {
    check_backend
    
    case "${1:-help}" in
        "status")
            check_status
            ;;
        "logs")
            check_logs
            ;;
        "monitor")
            monitor_status
            ;;
        "sync")
            trigger_sync
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Run main function
main "$@"
