#!/usr/bin/env python3
"""
Script để check log của Gmail sync jobs
Usage: python scripts/check-job-logs.py [status|logs|monitor|sync]
"""

import argparse
import json
import os
import sys
import time
import requests
from datetime import datetime
from typing import Dict, Any, Optional

# Colors for output
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    PURPLE = '\033[0;35m'
    CYAN = '\033[0;36m'
    WHITE = '\033[1;37m'
    NC = '\033[0m'  # No Color

def print_colored(message: str, color: str = Colors.NC) -> None:
    """Print colored message"""
    print(f"{color}{message}{Colors.NC}")

def print_info(message: str) -> None:
    print_colored(f"[INFO] {message}", Colors.BLUE)

def print_success(message: str) -> None:
    print_colored(f"[SUCCESS] {message}", Colors.GREEN)

def print_warning(message: str) -> None:
    print_colored(f"[WARNING] {message}", Colors.YELLOW)

def print_error(message: str) -> None:
    print_colored(f"[ERROR] {message}", Colors.RED)

class GmailJobChecker:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api/v1"
        self.auth_token = os.getenv("AUTH_TOKEN")
        
        if not self.auth_token:
            print_warning("AUTH_TOKEN environment variable not set")
            print_info("Please set your auth token:")
            print_info("  export AUTH_TOKEN='your_jwt_token_here'")
            print_info("Or login first and get token from browser dev tools")
            sys.exit(1)
    
    def check_backend(self) -> bool:
        """Check if backend is running"""
        try:
            response = requests.get(f"{self.base_url}/docs", timeout=5)
            return response.status_code == 200
        except requests.exceptions.RequestException:
            return False
    
    def make_request(self, method: str, endpoint: str, **kwargs) -> Optional[Dict[Any, Any]]:
        """Make authenticated API request"""
        headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }
        headers.update(kwargs.get("headers", {}))
        kwargs["headers"] = headers
        
        try:
            url = f"{self.api_base}{endpoint}"
            response = requests.request(method, url, **kwargs)
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 403:
                print_error("Access denied. Make sure you're logged in as superuser.")
                return None
            else:
                print_error(f"API request failed: {response.status_code} - {response.text}")
                return None
                
        except requests.exceptions.RequestException as e:
            print_error(f"Request failed: {e}")
            return None
    
    def check_status(self) -> None:
        """Check scheduler status"""
        print_info("Checking Gmail sync scheduler status...")
        
        data = self.make_request("GET", "/gmail/scheduler/status")
        if data:
            print_colored("\n=== Scheduler Status ===", Colors.CYAN)
            print(json.dumps(data, indent=2, default=str))
            
            if data.get("status") == "running":
                jobs = data.get("jobs", [])
                print_colored(f"\nActive Jobs: {len(jobs)}", Colors.GREEN)
                
                for job in jobs:
                    print_colored(f"\n📋 {job.get('name', 'Unknown')}", Colors.WHITE)
                    print(f"   ID: {job.get('id', 'N/A')}")
                    print(f"   Next Run: {job.get('next_run', 'N/A')}")
                    print(f"   Trigger: {job.get('trigger', 'N/A')}")
            else:
                print_colored("Scheduler is not running", Colors.RED)
    
    def check_logs(self) -> None:
        """Check recent logs (simulated)"""
        print_info("Checking recent Gmail sync logs...")
        print_warning("Note: This is a simulated log check.")
        print_info("For real logs, check your terminal where backend is running or Docker logs.")
        
        # Simulate log messages that would appear
        log_messages = [
            "INFO:app.services.scheduler_service:Gmail sync scheduler started successfully",
            "INFO:app.services.scheduler_service:Starting periodic Gmail sync (last 2 hours)",
            "INFO:app.services.scheduler_service:Periodic sync completed. Synced 5 emails across 2 connections",
            "INFO:app.services.scheduler_service:Starting daily full Gmail sync (last 7 days)",
            "INFO:app.services.scheduler_service:Daily full sync completed. Synced 12 emails across 2 connections"
        ]
        
        print_colored("\n=== Recent Log Messages (Simulated) ===", Colors.CYAN)
        for msg in log_messages:
            print(f"  {msg}")
    
    def monitor_status(self) -> None:
        """Monitor status in real-time"""
        print_info("Monitoring Gmail sync scheduler status (press Ctrl+C to stop)...")
        
        try:
            while True:
                # Clear screen (works on most terminals)
                os.system('clear' if os.name == 'posix' else 'cls')
                
                print_colored("=== Gmail Sync Scheduler Monitor ===", Colors.CYAN)
                print_colored(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", Colors.WHITE)
                print()
                
                data = self.make_request("GET", "/gmail/scheduler/status")
                if data:
                    print(json.dumps(data, indent=2, default=str))
                else:
                    print_error("Failed to get scheduler status")
                
                print()
                print_info("Refreshing in 30 seconds... (Ctrl+C to stop)")
                time.sleep(30)
                
        except KeyboardInterrupt:
            print_colored("\nMonitoring stopped by user", Colors.YELLOW)
    
    def trigger_sync(self) -> None:
        """Trigger manual sync"""
        print_info("Triggering manual Gmail sync...")
        
        data = self.make_request("POST", "/gmail/scheduler/sync-all?days=1")
        if data:
            print_success("Manual sync triggered successfully")
            print(json.dumps(data, indent=2, default=str))
        else:
            print_error("Failed to trigger manual sync")
    
    def show_help(self) -> None:
        """Show help message"""
        help_text = """
Gmail Sync Job Log Checker

Usage: python scripts/check-job-logs.py [COMMAND]

Commands:
  status     - Check scheduler status and job info
  logs       - Show recent logs (simulated)
  monitor    - Monitor status in real-time
  sync       - Trigger manual sync
  help       - Show this help message

Environment Variables:
  AUTH_TOKEN - JWT token for API authentication

Examples:
  export AUTH_TOKEN='your_token_here'
  python scripts/check-job-logs.py status
  python scripts/check-job-logs.py monitor
        """
        print(help_text)

def main():
    parser = argparse.ArgumentParser(description="Gmail Sync Job Log Checker")
    parser.add_argument("command", nargs="?", default="help", 
                       choices=["status", "logs", "monitor", "sync", "help"],
                       help="Command to execute")
    parser.add_argument("--url", default="http://localhost:8000",
                       help="Backend URL (default: http://localhost:8000)")
    
    args = parser.parse_args()
    
    checker = GmailJobChecker(args.url)
    
    # Check if backend is running
    if not checker.check_backend():
        print_error(f"Backend server is not running at {args.url}")
        print_info("Please start the backend server first:")
        print_info("  cd backend && source .venv/bin/activate && uvicorn app.main:app --reload")
        sys.exit(1)
    
    # Execute command
    if args.command == "status":
        checker.check_status()
    elif args.command == "logs":
        checker.check_logs()
    elif args.command == "monitor":
        checker.monitor_status()
    elif args.command == "sync":
        checker.trigger_sync()
    else:
        checker.show_help()

if __name__ == "__main__":
    main()
