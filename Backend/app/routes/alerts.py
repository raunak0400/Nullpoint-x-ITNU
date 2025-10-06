from flask import Blueprint, jsonify, request
from app.utils.logger import setup_logger
from datetime import datetime, timedelta
from typing import Dict, List

alerts_bp = Blueprint('alerts', __name__)
logger = setup_logger(__name__)

# In-memory storage for demo purposes - in production, use database
alert_subscriptions = {}
active_alerts = []


@alerts_bp.route('/', methods=['GET', 'POST'])
def manage_alerts():
    """Handle both GET (retrieve alerts) and POST (create alert subscription)."""
    if request.method == 'GET':
        return get_alerts()
    elif request.method == 'POST':
        return subscribe_alerts()


def get_alerts():
    """Get air quality alerts for a user."""
    try:
        user_id = request.args.get('user_id')
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)
        severity = request.args.get('severity', 'all')
        
        logger.info(f"Fetching alerts for user_id={user_id}, lat={lat}, lon={lon}")
        
        # If user_id provided, get user-specific alerts
        if user_id:
            user_alerts = _get_user_alerts(user_id)
            return jsonify(user_alerts), 200
        
        # If coordinates provided, get location-based alerts
        if lat is not None and lon is not None:
            location_alerts = _get_location_alerts(lat, lon, severity)
            return jsonify(location_alerts), 200
        
        # Return all active alerts
        all_alerts = _get_all_active_alerts(severity)
        return jsonify(all_alerts), 200
        
    except Exception as e:
        logger.error(f"Error in get_alerts: {str(e)}")
        return jsonify({
            'error': 'Internal server error while fetching alerts',
            'message': str(e),
            'status': 'error'
        }), 500


def subscribe_alerts():
    """Subscribe to air quality alerts."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'JSON data required',
                'status': 'error'
            }), 400
        
        user_id = data.get('user')
        threshold = data.get('threshold')
        lat = data.get('lat')
        lon = data.get('lon')
        notification_methods = data.get('notification_methods', ['email'])
        
        logger.info(f"Creating alert subscription for user={user_id}, threshold={threshold}")
        
        # Validate required parameters
        if not user_id:
            return jsonify({
                'error': 'user parameter is required',
                'status': 'error'
            }), 400
        
        if threshold is None:
            return jsonify({
                'error': 'threshold parameter is required',
                'status': 'error'
            }), 400
        
        if not isinstance(threshold, (int, float)) or threshold < 0 or threshold > 500:
            return jsonify({
                'error': 'threshold must be a number between 0 and 500',
                'status': 'error'
            }), 400
        
        # Create alert subscription
        subscription = _create_alert_subscription(user_id, threshold, lat, lon, notification_methods)
        
        return jsonify(subscription), 201
        
    except Exception as e:
        logger.error(f"Error in subscribe_alerts: {str(e)}")
        return jsonify({
            'error': 'Internal server error while creating alert subscription',
            'message': str(e),
            'status': 'error'
        }), 500


@alerts_bp.route('/unsubscribe', methods=['DELETE'])
def unsubscribe_alerts():
    """Unsubscribe from air quality alerts."""
    try:
        user_id = request.args.get('user_id')
        alert_id = request.args.get('alert_id')
        
        logger.info(f"Unsubscribing user_id={user_id}, alert_id={alert_id}")
        
        if not user_id:
            return jsonify({
                'error': 'user_id parameter is required',
                'status': 'error'
            }), 400
        
        result = _remove_alert_subscription(user_id, alert_id)
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error in unsubscribe_alerts: {str(e)}")
        return jsonify({
            'error': 'Internal server error while unsubscribing from alerts',
            'message': str(e),
            'status': 'error'
        }), 500


@alerts_bp.route('/active', methods=['GET'])
def get_active_alerts():
    """Get currently active air quality alerts."""
    try:
        severity = request.args.get('severity', 'all')
        region = request.args.get('region')
        
        logger.info(f"Fetching active alerts for severity={severity}, region={region}")
        
        active_alerts_data = _get_active_alerts_by_criteria(severity, region)
        
        return jsonify(active_alerts_data), 200
        
    except Exception as e:
        logger.error(f"Error in get_active_alerts: {str(e)}")
        return jsonify({
            'error': 'Internal server error while fetching active alerts',
            'message': str(e),
            'status': 'error'
        }), 500


@alerts_bp.route('/history', methods=['GET'])
def get_alert_history():
    """Get alert history for a user or location."""
    try:
        user_id = request.args.get('user_id')
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)
        days = request.args.get('days', default=30, type=int)
        
        logger.info(f"Fetching alert history for user_id={user_id}, days={days}")
        
        if days < 1 or days > 365:
            return jsonify({
                'error': 'days parameter must be between 1 and 365',
                'status': 'error'
            }), 400
        
        history_data = _get_alert_history(user_id, lat, lon, days)
        
        return jsonify(history_data), 200
        
    except Exception as e:
        logger.error(f"Error in get_alert_history: {str(e)}")
        return jsonify({
            'error': 'Internal server error while fetching alert history',
            'message': str(e),
            'status': 'error'
        }), 500


def _get_user_alerts(user_id: str) -> Dict:
    """Get alerts for a specific user."""
    user_subscriptions = alert_subscriptions.get(user_id, [])
    
    # Mock active alerts for the user
    user_alerts = []
    for subscription in user_subscriptions:
        # Check if current conditions exceed threshold (mock data)
        current_aqi = 95  # Mock current AQI
        
        if current_aqi >= subscription['threshold']:
            alert = {
                'alert_id': f"alert_{user_id}_{len(user_alerts) + 1}",
                'user_id': user_id,
                'alert_type': 'threshold_exceeded',
                'current_aqi': current_aqi,
                'threshold': subscription['threshold'],
                'severity': _get_severity_level(current_aqi),
                'message': f"Air quality has exceeded your threshold of {subscription['threshold']}. Current AQI: {current_aqi}",
                'timestamp': datetime.utcnow().isoformat(),
                'location': subscription.get('location'),
                'active': True
            }
            user_alerts.append(alert)
    
    return {
        'status': 'success',
        'user_id': user_id,
        'alerts': user_alerts,
        'total_alerts': len(user_alerts),
        'subscriptions': user_subscriptions,
        'timestamp': datetime.utcnow().isoformat()
    }


def _get_location_alerts(lat: float, lon: float, severity: str) -> Dict:
    """Get alerts for a specific location."""
    # Mock location-based alerts
    location_alerts = [
        {
            'alert_id': 'loc_alert_1',
            'alert_type': 'air_quality_warning',
            'coordinates': {'lat': lat, 'lon': lon},
            'current_aqi': 125,
            'severity': 'moderate',
            'pollutant': 'PM2.5',
            'message': 'Moderate air quality detected in your area',
            'timestamp': datetime.utcnow().isoformat(),
            'expires_at': (datetime.utcnow() + timedelta(hours=6)).isoformat(),
            'active': True
        }
    ]
    
    # Filter by severity if specified
    if severity != 'all':
        location_alerts = [alert for alert in location_alerts if alert['severity'] == severity]
    
    return {
        'status': 'success',
        'coordinates': {'lat': lat, 'lon': lon},
        'alerts': location_alerts,
        'total_alerts': len(location_alerts),
        'timestamp': datetime.utcnow().isoformat()
    }


def _get_all_active_alerts(severity: str) -> Dict:
    """Get all active alerts."""
    # Mock active alerts
    all_alerts = [
        {
            'alert_id': 'global_alert_1',
            'alert_type': 'regional_warning',
            'region': 'Los Angeles Basin',
            'current_aqi': 155,
            'severity': 'unhealthy_sensitive',
            'pollutant': 'O3',
            'message': 'Ozone levels are unhealthy for sensitive groups',
            'timestamp': datetime.utcnow().isoformat(),
            'active': True
        },
        {
            'alert_id': 'global_alert_2',
            'alert_type': 'forecast_warning',
            'region': 'San Francisco Bay Area',
            'forecast_aqi': 110,
            'severity': 'moderate',
            'pollutant': 'PM2.5',
            'message': 'Moderate air quality expected tomorrow',
            'timestamp': datetime.utcnow().isoformat(),
            'active': True
        }
    ]
    
    # Filter by severity if specified
    if severity != 'all':
        all_alerts = [alert for alert in all_alerts if alert['severity'] == severity]
    
    return {
        'status': 'success',
        'alerts': all_alerts,
        'total_alerts': len(all_alerts),
        'timestamp': datetime.utcnow().isoformat()
    }


def _create_alert_subscription(user_id: str, threshold: float, lat: float, lon: float, notification_methods: List[str]) -> Dict:
    """Create a new alert subscription."""
    subscription_id = f"sub_{user_id}_{len(alert_subscriptions.get(user_id, []))}"
    
    subscription = {
        'subscription_id': subscription_id,
        'user_id': user_id,
        'threshold': threshold,
        'location': {'lat': lat, 'lon': lon} if lat and lon else None,
        'notification_methods': notification_methods,
        'created_at': datetime.utcnow().isoformat(),
        'active': True,
        'alert_frequency': 'immediate',  # Could be configurable
        'last_triggered': None
    }
    
    # Store subscription
    if user_id not in alert_subscriptions:
        alert_subscriptions[user_id] = []
    
    alert_subscriptions[user_id].append(subscription)
    
    return {
        'status': 'success',
        'message': 'Alert subscription created successfully',
        'subscription': subscription,
        'timestamp': datetime.utcnow().isoformat()
    }


def _remove_alert_subscription(user_id: str, alert_id: str = None) -> Dict:
    """Remove alert subscription(s)."""
    if user_id not in alert_subscriptions:
        return {
            'status': 'error',
            'message': 'No subscriptions found for user',
            'timestamp': datetime.utcnow().isoformat()
        }
    
    if alert_id:
        # Remove specific subscription
        user_subs = alert_subscriptions[user_id]
        alert_subscriptions[user_id] = [sub for sub in user_subs if sub['subscription_id'] != alert_id]
        removed_count = len(user_subs) - len(alert_subscriptions[user_id])
    else:
        # Remove all subscriptions for user
        removed_count = len(alert_subscriptions[user_id])
        alert_subscriptions[user_id] = []
    
    return {
        'status': 'success',
        'message': f'Removed {removed_count} subscription(s)',
        'removed_count': removed_count,
        'timestamp': datetime.utcnow().isoformat()
    }


def _get_active_alerts_by_criteria(severity: str, region: str) -> Dict:
    """Get active alerts by criteria."""
    # This would query the database in a real implementation
    return _get_all_active_alerts(severity)


def _get_alert_history(user_id: str, lat: float, lon: float, days: int) -> Dict:
    """Get alert history."""
    # Mock alert history
    history = []
    
    for i in range(min(days, 10)):  # Mock up to 10 historical alerts
        alert_date = datetime.utcnow() - timedelta(days=i)
        history.append({
            'alert_id': f'hist_alert_{i}',
            'date': alert_date.strftime('%Y-%m-%d'),
            'aqi': 85 + (i * 10),
            'severity': _get_severity_level(85 + (i * 10)),
            'pollutant': ['PM2.5', 'O3', 'NO2'][i % 3],
            'triggered': alert_date.isoformat()
        })
    
    return {
        'status': 'success',
        'user_id': user_id,
        'coordinates': {'lat': lat, 'lon': lon} if lat and lon else None,
        'history': history,
        'total_records': len(history),
        'period_days': days,
        'timestamp': datetime.utcnow().isoformat()
    }


def _get_severity_level(aqi: int) -> str:
    """Get severity level based on AQI value."""
    if aqi <= 50:
        return 'good'
    elif aqi <= 100:
        return 'moderate'
    elif aqi <= 150:
        return 'unhealthy_sensitive'
    elif aqi <= 200:
        return 'unhealthy'
    elif aqi <= 300:
        return 'very_unhealthy'
    else:
        return 'hazardous'
