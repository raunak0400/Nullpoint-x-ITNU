import time
import threading
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger
from apscheduler.events import EVENT_JOB_EXECUTED, EVENT_JOB_ERROR

from app.services.merge_service import merge_service
from app.services.forecast_service import forecast_service
from app.models.aqi_record import AQIRecord
from app.models.alerts import Alert
from app.models.user import User
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class SchedulerService:
    """Background scheduler service for automated tasks."""
    
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.is_running = False
        self.job_stats = {
            'data_fetch_count': 0,
            'alert_check_count': 0,
            'cleanup_count': 0,
            'last_data_fetch': None,
            'last_alert_check': None,
            'last_cleanup': None,
            'errors': []
        }
        
        # Default locations for data fetching (can be configured)
        self.monitoring_locations = [
            {'lat': 40.7128, 'lon': -74.0060, 'name': 'New York'},
            {'lat': 34.0522, 'lon': -118.2437, 'name': 'Los Angeles'},
            {'lat': 41.8781, 'lon': -87.6298, 'name': 'Chicago'},
            {'lat': 29.7604, 'lon': -95.3698, 'name': 'Houston'},
            {'lat': 33.4484, 'lon': -112.0740, 'name': 'Phoenix'}
        ]
        
        # Configure scheduler event listeners
        self.scheduler.add_listener(self._job_executed, EVENT_JOB_EXECUTED)
        self.scheduler.add_listener(self._job_error, EVENT_JOB_ERROR)
    
    def start(self):
        """Start the background scheduler."""
        try:
            if self.is_running:
                logger.warning("Scheduler is already running")
                return
            
            logger.info("Starting background scheduler...")
            
            # Add scheduled jobs
            self._add_data_fetch_job()
            self._add_alert_check_job()
            self._add_cleanup_job()
            self._add_model_training_job()
            
            # Start the scheduler
            self.scheduler.start()
            self.is_running = True
            
            logger.info("Background scheduler started successfully")
            
        except Exception as e:
            logger.error(f"Error starting scheduler: {str(e)}")
            raise
    
    def stop(self):
        """Stop the background scheduler."""
        try:
            if not self.is_running:
                logger.warning("Scheduler is not running")
                return
            
            logger.info("Stopping background scheduler...")
            self.scheduler.shutdown(wait=True)
            self.is_running = False
            
            logger.info("Background scheduler stopped")
            
        except Exception as e:
            logger.error(f"Error stopping scheduler: {str(e)}")
    
    def _add_data_fetch_job(self):
        """Add job to fetch data from all sources every 30 minutes."""
        self.scheduler.add_job(
            func=self._fetch_data_task,
            trigger=IntervalTrigger(minutes=30),
            id='data_fetch_job',
            name='Fetch Air Quality Data',
            max_instances=1,
            coalesce=True,
            replace_existing=True
        )
        logger.info("Added data fetch job (every 30 minutes)")
    
    def _add_alert_check_job(self):
        """Add job to check alerts every 15 minutes."""
        self.scheduler.add_job(
            func=self._check_alerts_task,
            trigger=IntervalTrigger(minutes=15),
            id='alert_check_job',
            name='Check Air Quality Alerts',
            max_instances=1,
            coalesce=True,
            replace_existing=True
        )
        logger.info("Added alert check job (every 15 minutes)")
    
    def _add_cleanup_job(self):
        """Add job to cleanup old data daily at 2 AM."""
        self.scheduler.add_job(
            func=self._cleanup_task,
            trigger=CronTrigger(hour=2, minute=0),
            id='cleanup_job',
            name='Cleanup Old Data',
            max_instances=1,
            coalesce=True,
            replace_existing=True
        )
        logger.info("Added cleanup job (daily at 2 AM)")
    
    def _add_model_training_job(self):
        """Add job to retrain models weekly."""
        self.scheduler.add_job(
            func=self._model_training_task,
            trigger=CronTrigger(day_of_week=0, hour=3, minute=0),  # Sunday at 3 AM
            id='model_training_job',
            name='Retrain ML Models',
            max_instances=1,
            coalesce=True,
            replace_existing=True
        )
        logger.info("Added model training job (weekly on Sunday at 3 AM)")
    
    def _fetch_data_task(self):
        """Task to fetch data from all sources for monitoring locations."""
        try:
            logger.info("Starting scheduled data fetch task")
            
            total_saved = 0
            successful_locations = 0
            
            for location in self.monitoring_locations:
                try:
                    lat = location['lat']
                    lon = location['lon']
                    name = location['name']
                    
                    logger.info(f"Fetching data for {name} ({lat}, {lon})")
                    
                    # Fetch and merge data from all sources
                    merged_data = merge_service.fetch_and_merge_data(
                        lat=lat, lon=lon, sources=['tempo', 'ground', 'weather']
                    )
                    
                    # Save merged data to MongoDB
                    if merged_data.get('normalized_data'):
                        saved_count = merge_service.save_merged_data(merged_data)
                        total_saved += saved_count
                        successful_locations += 1
                        
                        logger.info(f"Saved {saved_count} records for {name}")
                    else:
                        logger.warning(f"No data to save for {name}")
                
                except Exception as e:
                    logger.error(f"Error fetching data for {location['name']}: {str(e)}")
                    continue
            
            # Update statistics
            self.job_stats['data_fetch_count'] += 1
            self.job_stats['last_data_fetch'] = datetime.utcnow().isoformat()
            
            logger.info(f"Data fetch task completed: {total_saved} records saved for {successful_locations}/{len(self.monitoring_locations)} locations")
            
        except Exception as e:
            logger.error(f"Error in data fetch task: {str(e)}")
            self._record_error('data_fetch', str(e))
    
    def _check_alerts_task(self):
        """Task to check all active alerts and trigger notifications."""
        try:
            logger.info("Starting scheduled alert check task")
            
            # Get all active alerts
            active_alerts = Alert.get_active_alerts()
            
            if not active_alerts:
                logger.info("No active alerts to check")
                return
            
            logger.info(f"Checking {len(active_alerts)} active alerts")
            
            triggered_count = 0
            
            for alert in active_alerts:
                try:
                    # Get recent AQI data for the alert location
                    if alert.location and 'lat' in alert.location and 'lon' in alert.location:
                        lat = alert.location['lat']
                        lon = alert.location['lon']
                        radius_km = alert.location.get('radius_km', 10)
                        
                        # Get latest records for this pollutant and location
                        recent_records = AQIRecord.get_latest_by_location(
                            lat=lat, lon=lon, radius_km=radius_km,
                            pollutant=alert.pollutant, source=None
                        )
                        
                        # Check if any recent values exceed the threshold
                        for record in recent_records:
                            if record.value >= alert.threshold:
                                # Check if alert was triggered recently (avoid spam)
                                if alert.last_triggered:
                                    time_since_last = datetime.utcnow() - alert.last_triggered
                                    if time_since_last < timedelta(hours=1):
                                        continue  # Skip if triggered within last hour
                                
                                # Trigger the alert
                                if alert.trigger(record.value, {'record_id': str(record._id)}):
                                    triggered_count += 1
                                    
                                    # Send notification (placeholder)
                                    self._send_alert_notification(alert, record)
                                
                                break  # Only trigger once per alert per check
                    
                except Exception as e:
                    logger.error(f"Error checking alert {alert._id}: {str(e)}")
                    continue
            
            # Update statistics
            self.job_stats['alert_check_count'] += 1
            self.job_stats['last_alert_check'] = datetime.utcnow().isoformat()
            
            logger.info(f"Alert check task completed: {triggered_count} alerts triggered")
            
        except Exception as e:
            logger.error(f"Error in alert check task: {str(e)}")
            self._record_error('alert_check', str(e))
    
    def _cleanup_task(self):
        """Task to cleanup old data and maintain database performance."""
        try:
            logger.info("Starting scheduled cleanup task")
            
            cleanup_results = {}
            
            # Cleanup old AQI records (keep 90 days)
            deleted_records = AQIRecord.delete_old_records(days_to_keep=90)
            cleanup_results['aqi_records_deleted'] = deleted_records
            
            # Cleanup old inactive alerts (keep 1 year)
            deleted_alerts = Alert.cleanup_old_alerts(days_to_keep=365)
            cleanup_results['alerts_deleted'] = deleted_alerts
            
            # Update statistics
            self.job_stats['cleanup_count'] += 1
            self.job_stats['last_cleanup'] = datetime.utcnow().isoformat()
            
            logger.info(f"Cleanup task completed: {cleanup_results}")
            
        except Exception as e:
            logger.error(f"Error in cleanup task: {str(e)}")
            self._record_error('cleanup', str(e))
    
    def _model_training_task(self):
        """Task to retrain ML models with new data."""
        try:
            logger.info("Starting scheduled model training task")
            
            # This is a placeholder for model retraining
            # In a production system, you would:
            # 1. Collect recent data
            # 2. Evaluate current model performance
            # 3. Retrain models if performance has degraded
            # 4. Update model artifacts
            
            training_results = {
                'status': 'completed',
                'timestamp': datetime.utcnow().isoformat(),
                'note': 'Model training placeholder - implement based on ML pipeline needs'
            }
            
            logger.info(f"Model training task completed: {training_results}")
            
        except Exception as e:
            logger.error(f"Error in model training task: {str(e)}")
            self._record_error('model_training', str(e))
    
    def _send_alert_notification(self, alert: Alert, record):
        """Send notification for triggered alert."""
        try:
            # Get user information
            user = User.find_by_id(str(alert.user_id))
            if not user:
                logger.error(f"User not found for alert {alert._id}")
                return
            
            # Prepare notification message
            message = f"""
            Air Quality Alert Triggered!
            
            Location: ({alert.location.get('lat', 'N/A')}, {alert.location.get('lon', 'N/A')})
            Pollutant: {alert.pollutant}
            Current Value: {record.value}
            Threshold: {alert.threshold}
            Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}
            
            Please take appropriate precautions.
            """
            
            # Log notification (in production, send email/SMS/push notification)
            logger.info(f"ALERT NOTIFICATION for {user.email}: {alert.pollutant} = {record.value} (threshold: {alert.threshold})")
            
            # Here you would integrate with email service, SMS service, or push notifications
            # For now, just log to console
            print(f"\n{'='*50}")
            print(f"ALERT NOTIFICATION")
            print(f"User: {user.email}")
            print(f"Pollutant: {alert.pollutant}")
            print(f"Value: {record.value} (Threshold: {alert.threshold})")
            print(f"Location: ({alert.location.get('lat', 'N/A')}, {alert.location.get('lon', 'N/A')})")
            print(f"Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")
            print(f"{'='*50}\n")
            
        except Exception as e:
            logger.error(f"Error sending alert notification: {str(e)}")
    
    def _job_executed(self, event):
        """Handle job execution events."""
        logger.debug(f"Job {event.job_id} executed successfully")
    
    def _job_error(self, event):
        """Handle job error events."""
        logger.error(f"Job {event.job_id} failed: {event.exception}")
        self._record_error(event.job_id, str(event.exception))
    
    def _record_error(self, job_type: str, error_message: str):
        """Record error in job statistics."""
        error_record = {
            'job_type': job_type,
            'error': error_message,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        self.job_stats['errors'].append(error_record)
        
        # Keep only last 50 errors
        if len(self.job_stats['errors']) > 50:
            self.job_stats['errors'] = self.job_stats['errors'][-50:]
    
    def get_status(self) -> Dict:
        """Get scheduler status and statistics."""
        return {
            'is_running': self.is_running,
            'jobs': [
                {
                    'id': job.id,
                    'name': job.name,
                    'next_run': job.next_run_time.isoformat() if job.next_run_time else None,
                    'trigger': str(job.trigger)
                }
                for job in self.scheduler.get_jobs()
            ],
            'statistics': self.job_stats,
            'monitoring_locations': len(self.monitoring_locations)
        }
    
    def add_monitoring_location(self, lat: float, lon: float, name: str):
        """Add a new location to monitor."""
        location = {'lat': lat, 'lon': lon, 'name': name}
        if location not in self.monitoring_locations:
            self.monitoring_locations.append(location)
            logger.info(f"Added monitoring location: {name} ({lat}, {lon})")
    
    def remove_monitoring_location(self, name: str):
        """Remove a monitoring location."""
        self.monitoring_locations = [
            loc for loc in self.monitoring_locations if loc['name'] != name
        ]
        logger.info(f"Removed monitoring location: {name}")
    
    def trigger_job_now(self, job_id: str):
        """Manually trigger a job."""
        try:
            job = self.scheduler.get_job(job_id)
            if job:
                job.modify(next_run_time=datetime.utcnow())
                logger.info(f"Manually triggered job: {job_id}")
                return True
            else:
                logger.warning(f"Job not found: {job_id}")
                return False
        except Exception as e:
            logger.error(f"Error triggering job {job_id}: {str(e)}")
            return False


# Global scheduler service instance
scheduler_service = SchedulerService()
