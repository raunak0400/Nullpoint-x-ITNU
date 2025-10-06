from flask import Blueprint, jsonify, request
from app.utils.logger import setup_logger
from app.services.scheduler_service import scheduler_service
from app.models.aqi_record import AQIRecord
from app.models.alerts import Alert
from app.models.user import User
from datetime import datetime, timedelta

admin_bp = Blueprint('admin', __name__)
logger = setup_logger(__name__)


@admin_bp.route('/scheduler/status', methods=['GET'])
def get_scheduler_status():
    """Get background scheduler status and statistics."""
    try:
        status = scheduler_service.get_status()
        return jsonify({
            'status': 'success',
            'scheduler': status,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting scheduler status: {str(e)}")
        return jsonify({
            'error': 'Internal server error while getting scheduler status',
            'message': str(e),
            'status': 'error'
        }), 500


@admin_bp.route('/scheduler/start', methods=['POST'])
def start_scheduler():
    """Start the background scheduler."""
    try:
        scheduler_service.start()
        return jsonify({
            'status': 'success',
            'message': 'Scheduler started successfully',
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error starting scheduler: {str(e)}")
        return jsonify({
            'error': 'Internal server error while starting scheduler',
            'message': str(e),
            'status': 'error'
        }), 500


@admin_bp.route('/scheduler/stop', methods=['POST'])
def stop_scheduler():
    """Stop the background scheduler."""
    try:
        scheduler_service.stop()
        return jsonify({
            'status': 'success',
            'message': 'Scheduler stopped successfully',
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error stopping scheduler: {str(e)}")
        return jsonify({
            'error': 'Internal server error while stopping scheduler',
            'message': str(e),
            'status': 'error'
        }), 500


@admin_bp.route('/scheduler/trigger/<job_id>', methods=['POST'])
def trigger_job(job_id):
    """Manually trigger a scheduled job."""
    try:
        success = scheduler_service.trigger_job_now(job_id)
        
        if success:
            return jsonify({
                'status': 'success',
                'message': f'Job {job_id} triggered successfully',
                'timestamp': datetime.utcnow().isoformat()
            }), 200
        else:
            return jsonify({
                'status': 'error',
                'message': f'Job {job_id} not found or could not be triggered'
            }), 404
        
    except Exception as e:
        logger.error(f"Error triggering job {job_id}: {str(e)}")
        return jsonify({
            'error': 'Internal server error while triggering job',
            'message': str(e),
            'status': 'error'
        }), 500


@admin_bp.route('/scheduler/locations', methods=['GET'])
def get_monitoring_locations():
    """Get list of monitoring locations."""
    try:
        status = scheduler_service.get_status()
        return jsonify({
            'status': 'success',
            'monitoring_locations': scheduler_service.monitoring_locations,
            'count': len(scheduler_service.monitoring_locations),
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting monitoring locations: {str(e)}")
        return jsonify({
            'error': 'Internal server error while getting monitoring locations',
            'message': str(e),
            'status': 'error'
        }), 500


@admin_bp.route('/scheduler/locations', methods=['POST'])
def add_monitoring_location():
    """Add a new monitoring location."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'JSON data required',
                'status': 'error'
            }), 400
        
        lat = data.get('lat')
        lon = data.get('lon')
        name = data.get('name')
        
        if lat is None or lon is None or not name:
            return jsonify({
                'error': 'lat, lon, and name are required',
                'status': 'error'
            }), 400
        
        scheduler_service.add_monitoring_location(lat, lon, name)
        
        return jsonify({
            'status': 'success',
            'message': f'Monitoring location {name} added successfully',
            'location': {'lat': lat, 'lon': lon, 'name': name},
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error adding monitoring location: {str(e)}")
        return jsonify({
            'error': 'Internal server error while adding monitoring location',
            'message': str(e),
            'status': 'error'
        }), 500


@admin_bp.route('/scheduler/locations/<name>', methods=['DELETE'])
def remove_monitoring_location(name):
    """Remove a monitoring location."""
    try:
        scheduler_service.remove_monitoring_location(name)
        
        return jsonify({
            'status': 'success',
            'message': f'Monitoring location {name} removed successfully',
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error removing monitoring location: {str(e)}")
        return jsonify({
            'error': 'Internal server error while removing monitoring location',
            'message': str(e),
            'status': 'error'
        }), 500


@admin_bp.route('/stats', methods=['GET'])
def get_system_stats():
    """Get system statistics and health metrics."""
    try:
        # Get database statistics
        total_users = User.count()
        
        # Get AQI records statistics
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=30)
        
        recent_records = AQIRecord.find_by_time_range(
            start_date=start_date,
            end_date=end_date,
            limit=10000
        )
        
        # Get alerts statistics
        alert_stats = Alert.get_statistics()
        
        # Get scheduler status
        scheduler_status = scheduler_service.get_status()
        
        stats = {
            'status': 'success',
            'timestamp': datetime.utcnow().isoformat(),
            'database': {
                'total_users': total_users,
                'recent_aqi_records': len(recent_records),
                'alert_statistics': alert_stats
            },
            'scheduler': {
                'is_running': scheduler_status['is_running'],
                'job_count': len(scheduler_status['jobs']),
                'statistics': scheduler_status['statistics']
            },
            'system': {
                'uptime_info': 'Available via system monitoring',
                'memory_usage': 'Available via system monitoring',
                'disk_usage': 'Available via system monitoring'
            }
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        logger.error(f"Error getting system stats: {str(e)}")
        return jsonify({
            'error': 'Internal server error while getting system stats',
            'message': str(e),
            'status': 'error'
        }), 500


@admin_bp.route('/cleanup', methods=['POST'])
def manual_cleanup():
    """Manually trigger database cleanup."""
    try:
        data = request.get_json() or {}
        days_to_keep = data.get('days_to_keep', 90)
        
        # Cleanup old AQI records
        deleted_records = AQIRecord.delete_old_records(days_to_keep=days_to_keep)
        
        # Cleanup old alerts
        deleted_alerts = Alert.cleanup_old_alerts(days_to_keep=365)
        
        return jsonify({
            'status': 'success',
            'message': 'Manual cleanup completed',
            'results': {
                'aqi_records_deleted': deleted_records,
                'alerts_deleted': deleted_alerts,
                'days_to_keep': days_to_keep
            },
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error in manual cleanup: {str(e)}")
        return jsonify({
            'error': 'Internal server error during cleanup',
            'message': str(e),
            'status': 'error'
        }), 500


@admin_bp.route('/health', methods=['GET'])
def health_check():
    """Comprehensive health check endpoint."""
    try:
        from app.database.mongo import check_connection
        
        # Check MongoDB connection
        mongo_healthy = check_connection()
        
        # Check scheduler status
        scheduler_status = scheduler_service.get_status()
        scheduler_healthy = scheduler_status['is_running']
        
        # Overall health assessment
        overall_healthy = mongo_healthy and scheduler_healthy
        
        health_status = {
            'status': 'healthy' if overall_healthy else 'degraded',
            'timestamp': datetime.utcnow().isoformat(),
            'components': {
                'database': {
                    'mongodb': 'connected' if mongo_healthy else 'disconnected',
                    'status': 'healthy' if mongo_healthy else 'unhealthy'
                },
                'scheduler': {
                    'running': scheduler_healthy,
                    'status': 'healthy' if scheduler_healthy else 'unhealthy',
                    'job_count': len(scheduler_status.get('jobs', []))
                }
            },
            'service': 'air-quality-forecast-api'
        }
        
        status_code = 200 if overall_healthy else 503
        return jsonify(health_status), status_code
        
    except Exception as e:
        logger.error(f"Error in health check: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat(),
            'service': 'air-quality-forecast-api'
        }), 503
