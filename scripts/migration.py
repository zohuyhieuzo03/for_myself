#!/usr/bin/env python3
"""
Alembic Migration Helper Script
This script provides a convenient interface for managing Alembic migrations
"""

import argparse
import subprocess
import sys
import os
from pathlib import Path


class MigrationHelper:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.backend_path = self.project_root / "backend"
        
    def run_command(self, command, check=True):
        """Run a command and return the result"""
        try:
            result = subprocess.run(
                command, 
                shell=True, 
                check=check, 
                capture_output=True, 
                text=True,
                cwd=self.project_root
            )
            return result
        except subprocess.CalledProcessError as e:
            print(f"Error running command: {command}")
            print(f"Error: {e.stderr}")
            return None
    
    def check_docker_running(self):
        """Check if Docker containers are running"""
        result = self.run_command("docker compose ps", check=False)
        if result and "backend" in result.stdout and "Up" in result.stdout:
            return True
        print("❌ Backend container is not running. Please start it first:")
        print("   docker compose up -d")
        return False
    
    def create_migration(self, message, autogenerate=False):
        """Create a new migration"""
        if not self.check_docker_running():
            return False
            
        print(f"📝 Creating migration: {message}")
        
        if autogenerate:
            cmd = f'docker compose exec backend bash -c "cd /app && alembic revision --autogenerate -m \'{message}\'"'
        else:
            cmd = f'docker compose exec backend bash -c "cd /app && alembic revision -m \'{message}\'"'
        
        result = self.run_command(cmd)
        if result and result.returncode == 0:
            print("✅ Migration created successfully")
            self.copy_migrations()
            return True
        else:
            print("❌ Failed to create migration")
            return False
    
    def copy_migrations(self):
        """Copy migration files from container to host"""
        print("📋 Copying migration files from container to host...")
        
        # Get list of migration files in container
        cmd = 'docker compose exec backend bash -c "ls /app/app/alembic/versions/*.py" 2>/dev/null | grep -v __pycache__ || true'
        result = self.run_command(cmd, check=False)
        
        if not result or not result.stdout.strip():
            print("⚠️  No migration files found in container")
            return
        
        # Copy each migration file
        files = result.stdout.strip().split('\n')
        for file_path in files:
            if file_path.strip():
                filename = os.path.basename(file_path.strip())
                print(f"   Copying {filename}...")
                
                copy_cmd = f'docker compose cp "backend:{file_path.strip()}" "backend/app/alembic/versions/"'
                copy_result = self.run_command(copy_cmd)
                
                if copy_result and copy_result.returncode == 0:
                    print(f"   ✅ Copied {filename}")
                else:
                    print(f"   ❌ Failed to copy {filename}")
    
    def run_migrations(self):
        """Run pending migrations"""
        if not self.check_docker_running():
            return False
            
        print("🚀 Running migrations...")
        cmd = 'docker compose exec backend bash -c "cd /app && alembic upgrade head"'
        
        result = self.run_command(cmd)
        if result and result.returncode == 0:
            print("✅ Migrations applied successfully")
            return True
        else:
            print("❌ Failed to apply migrations")
            return False
    
    def show_status(self):
        """Show current migration status"""
        if not self.check_docker_running():
            return
            
        print("📊 Current migration status:")
        cmd = 'docker compose exec backend bash -c "cd /app && alembic current"'
        result = self.run_command(cmd)
        if result:
            print(f"   {result.stdout.strip()}")
        
        print("\n📜 Migration history:")
        cmd = 'docker compose exec backend bash -c "cd /app && alembic history"'
        result = self.run_command(cmd)
        if result:
            print(result.stdout.strip())
    
    def rollback_migration(self):
        """Rollback the last migration"""
        if not self.check_docker_running():
            return False
            
        print("⏪ Rolling back last migration...")
        cmd = 'docker compose exec backend bash -c "cd /app && alembic downgrade -1"'
        
        result = self.run_command(cmd)
        if result and result.returncode == 0:
            print("✅ Migration rolled back successfully")
            return True
        else:
            print("❌ Failed to rollback migration")
            return False


def main():
    parser = argparse.ArgumentParser(description="Alembic Migration Helper")
    parser.add_argument("-m", "--message", help="Migration message")
    parser.add_argument("-a", "--autogenerate", action="store_true", help="Use autogenerate mode")
    parser.add_argument("-r", "--run", action="store_true", help="Run migrations after creating")
    parser.add_argument("-c", "--copy", action="store_true", help="Only copy migrations from container")
    parser.add_argument("-s", "--status", action="store_true", help="Show migration status")
    parser.add_argument("--rollback", action="store_true", help="Rollback last migration")
    
    args = parser.parse_args()
    
    helper = MigrationHelper()
    
    if args.status:
        helper.show_status()
    elif args.rollback:
        helper.rollback_migration()
    elif args.copy:
        helper.copy_migrations()
    elif args.message:
        success = helper.create_migration(args.message, args.autogenerate)
        if success and args.run:
            helper.run_migrations()
        elif success:
            print("\n💡 To apply the migration, run:")
            print("   python scripts/migration.py -r")
            print("   or")
            print("   docker compose exec backend bash -c 'cd /app && alembic upgrade head'")
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
