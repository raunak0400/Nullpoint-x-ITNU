from flask import Blueprint, jsonify, request
from app.utils.logger import setup_logger
from app.services.weather_service import weather_service

weather_bp = Blueprint('weather', __name__)
logger = setup_logger(__name__)


@weather_bp.route('/', methods=['GET'])
def get_weather_data():
    """Get current weather data for air quality modeling."""
    try:
        # Get query parameters
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)
        
        logger.info(f"Fetching weather data for coordinates: lat={lat}, lon={lon}")
        
        # Validate required parameters
        if lat is None or lon is None:
            return jsonify({
                'error': 'Both lat and lon parameters are required',
                'status': 'error'
            }), 400
        
        if lat < -90 or lat > 90:
            return jsonify({
                'error': 'Latitude must be between -90 and 90',
                'status': 'error'
            }), 400
            
        if lon < -180 or lon > 180:
            return jsonify({
                'error': 'Longitude must be between -180 and 180',
                'status': 'error'
            }), 400
        
        # Get current weather data
        data = weather_service.get_current_weather(lat=lat, lon=lon)
        
        if data['status'] == 'error':
            return jsonify(data), 500
            
        return jsonify(data), 200
        
    except Exception as e:
        logger.error(f"Error in get_weather_data: {str(e)}")
        return jsonify({
            'error': 'Internal server error while fetching weather data',
            'message': str(e),
            'status': 'error'
        }), 500


@weather_bp.route('/forecast', methods=['GET'])
def get_weather_forecast():
    """Get weather forecast data."""
    try:
        # Get query parameters
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)
        days = request.args.get('days', default=7, type=int)
        
        logger.info(f"Fetching weather forecast for lat={lat}, lon={lon}, days={days}")
        
        # Validate required parameters
        if lat is None or lon is None:
            return jsonify({
                'error': 'Both lat and lon parameters are required',
                'status': 'error'
            }), 400
        
        if lat < -90 or lat > 90:
            return jsonify({
                'error': 'Latitude must be between -90 and 90',
                'status': 'error'
            }), 400
            
        if lon < -180 or lon > 180:
            return jsonify({
                'error': 'Longitude must be between -180 and 180',
                'status': 'error'
            }), 400
        
        if days < 1 or days > 8:
            return jsonify({
                'error': 'Days parameter must be between 1 and 8',
                'status': 'error'
            }), 400
        
        # Get weather forecast
        data = weather_service.get_weather_forecast(lat=lat, lon=lon, days=days)
        
        if data['status'] == 'error':
            return jsonify(data), 500
            
        return jsonify(data), 200
        
    except Exception as e:
        logger.error(f"Error in get_weather_forecast: {str(e)}")
        return jsonify({
            'error': 'Internal server error while fetching weather forecast',
            'message': str(e),
            'status': 'error'
        }), 500


@weather_bp.route('/historical', methods=['GET'])
def get_historical_weather():
    """Get historical weather data."""
    try:
        # Get query parameters
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        logger.info(f"Fetching historical weather data: {start_date} to {end_date}")
        
        # Validate required parameters
        if lat is None or lon is None:
            return jsonify({
                'error': 'Both lat and lon parameters are required',
                'status': 'error'
            }), 400
            
        if not start_date or not end_date:
            return jsonify({
                'error': 'start_date and end_date parameters are required',
                'status': 'error'
            }), 400
        
        if lat < -90 or lat > 90:
            return jsonify({
                'error': 'Latitude must be between -90 and 90',
                'status': 'error'
            }), 400
            
        if lon < -180 or lon > 180:
            return jsonify({
                'error': 'Longitude must be between -180 and 180',
                'status': 'error'
            }), 400
        
        # Get historical weather data
        data = weather_service.get_historical_weather(
            lat=lat,
            lon=lon,
            start_date=start_date,
            end_date=end_date
        )
        
        if data['status'] == 'error':
            return jsonify(data), 500
            
        return jsonify(data), 200
        
    except Exception as e:
        logger.error(f"Error in get_historical_weather: {str(e)}")
        return jsonify({
            'error': 'Internal server error while fetching historical weather data',
            'message': str(e),
            'status': 'error'
        }), 500


@weather_bp.route('/current', methods=['GET'])
def get_current_weather():
    """Get current weather conditions (alias for main endpoint)."""
    return get_weather_data()


@weather_bp.route('/conditions', methods=['GET'])
def get_weather_conditions():
    """Get detailed weather conditions for air quality analysis."""
    try:
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)
        
        logger.info(f"Fetching detailed weather conditions for lat={lat}, lon={lon}")
        
        # Validate required parameters
        if lat is None or lon is None:
            return jsonify({
                'error': 'Both lat and lon parameters are required',
                'status': 'error'
            }), 400
        
        # Get both current weather and short-term forecast
        current_data = weather_service.get_current_weather(lat=lat, lon=lon)
        forecast_data = weather_service.get_weather_forecast(lat=lat, lon=lon, days=1)
        
        if current_data['status'] == 'error':
            return jsonify(current_data), 500
            
        if forecast_data['status'] == 'error':
            return jsonify(forecast_data), 500
        
        # Combine data for comprehensive conditions
        combined_data = {
            'status': 'success',
            'timestamp': current_data['timestamp'],
            'source': 'OpenWeatherMap',
            'coordinates': current_data['coordinates'],
            'current_conditions': current_data['data'],
            'hourly_forecast': forecast_data['data'].get('hourly', [])[:12],  # Next 12 hours
            'metadata': {
                'data_type': 'comprehensive_weather_conditions',
                'includes': ['current', 'hourly_forecast'],
                'units': 'metric'
            }
        }
        
        return jsonify(combined_data), 200
        
    except Exception as e:
        logger.error(f"Error in get_weather_conditions: {str(e)}")
        return jsonify({
            'error': 'Internal server error while fetching weather conditions',
            'message': str(e),
            'status': 'error'
        }), 500
