import logging
from datetime import datetime, timezone

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.services.gmail_service import sync_all_active_connections

logger = logging.getLogger(__name__)


class GmailSyncScheduler:
    """Scheduler for periodic Gmail sync tasks."""
    
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.is_running = False
    
    def start(self):
        """Start the scheduler with periodic sync jobs."""
        if self.is_running:
            logger.warning("Scheduler is already running")
            return
        
        try:
            # Add periodic sync job (every 30 minutes)
            self.scheduler.add_job(
                func=self._periodic_sync_task,
                trigger=IntervalTrigger(minutes=30),
                id='gmail_periodic_sync',
                name='Gmail Periodic Sync',
                replace_existing=True,
                max_instances=1,
                misfire_grace_time=300  # 5 minutes grace time
            )
            
            # Add daily full sync job (every 24 hours)
            self.scheduler.add_job(
                func=self._daily_full_sync_task,
                trigger=IntervalTrigger(hours=24),
                id='gmail_daily_full_sync',
                name='Gmail Daily Full Sync',
                replace_existing=True,
                max_instances=1,
                misfire_grace_time=1800  # 30 minutes grace time
            )
            
            self.scheduler.start()
            self.is_running = True
            
            logger.info("Gmail sync scheduler started successfully")
            
        except Exception as e:
            logger.error(f"Failed to start Gmail sync scheduler: {e}")
            raise
    
    def stop(self):
        """Stop the scheduler."""
        if not self.is_running:
            logger.warning("Scheduler is not running")
            return
        
        try:
            self.scheduler.shutdown(wait=True)
            self.is_running = False
            logger.info("Gmail sync scheduler stopped successfully")
            
        except Exception as e:
            logger.error(f"Failed to stop Gmail sync scheduler: {e}")
            raise
    
    def _periodic_sync_task(self):
        """Periodic sync task - sync recent emails (last 2 hours)."""
        try:
            logger.info("Starting periodic Gmail sync (last 2 hours)")
            
            # Sync emails from the last 2 hours (more frequent, smaller scope)
            # The function will automatically use last_sync_at to avoid duplicates
            results = sync_all_active_connections(days=1)  # 1 day max, but will use last_sync_at
            
            total_synced = sum(results.values())
            logger.info(f"Periodic sync completed. Synced {total_synced} emails across {len(results)} connections")
            
        except Exception as e:
            logger.error(f"Error in periodic sync task: {e}")
    
    def _daily_full_sync_task(self):
        """Daily full sync task - sync emails from the last 7 days."""
        try:
            logger.info("Starting daily full Gmail sync (last 7 days)")
            
            # Sync emails from the last 7 days (daily, larger scope)
            results = sync_all_active_connections(days=7)
            
            total_synced = sum(results.values())
            logger.info(f"Daily full sync completed. Synced {total_synced} emails across {len(results)} connections")
            
        except Exception as e:
            logger.error(f"Error in daily full sync task: {e}")
    
    def get_job_status(self):
        """Get status of scheduled jobs."""
        if not self.is_running:
            return {"status": "stopped", "jobs": []}
        
        jobs = []
        for job in self.scheduler.get_jobs():
            jobs.append({
                "id": job.id,
                "name": job.name,
                "next_run": job.next_run_time.isoformat() if job.next_run_time else None,
                "trigger": str(job.trigger)
            })
        
        return {
            "status": "running",
            "jobs": jobs
        }


# Global scheduler instance
gmail_sync_scheduler = GmailSyncScheduler()


def start_gmail_sync_scheduler():
    """Start the Gmail sync scheduler."""
    gmail_sync_scheduler.start()


def stop_gmail_sync_scheduler():
    """Stop the Gmail sync scheduler."""
    gmail_sync_scheduler.stop()


def get_scheduler_status():
    """Get the scheduler status."""
    return gmail_sync_scheduler.get_job_status()
