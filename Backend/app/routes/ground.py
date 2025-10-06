from flask import Blueprint, jsonify, request
from app.utils.logger import setup_logger
from app.services.ground_service import ground_service
import requests

ground_bp = Blueprint('ground', __name__)
logger = setup_logger(__name__)


def get_coordinates_from_city(city: str):
    """Get lat/lon coordinates from city name using a geocoding service."""
    try:
        # Simple geocoding - in production, use a proper geocoding service
        # This is a mock implementation
        city_coords = {
            'new york': (40.7128, -74.0060),
            'los angeles': (34.0522, -118.2437),
            'chicago': (41.8781, -87.6298),
            'houston': (29.7604, -95.3698),
            'phoenix': (33.4484, -112.0740),
            'philadelphia': (39.9526, -75.1652),
            'san antonio': (29.4241, -98.4936),
            'san diego': (32.7157, -117.1611),
            'dallas': (32.7767, -96.7970),
            'san jose': (37.3382, -121.8863)
        }
        
        city_lower = city.lower().strip()
        if city_lower in city_coords:
            return city_coords[city_lower]
        
        # If city not found, return None
        return None
        
    except Exception as e:
        logger.error(f"Error geocoding city {city}: {str(e)}")
        return None


@ground_bp.route('/', methods=['GET'])
def get_ground_data():
    """Get ground station air quality data by city or coordinates."""
    try:
        # Get query parameters
        city = request.args.get('city')
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)
        distance = request.args.get('distance', default=25, type=int)
        
        logger.info(f"Fetching ground station data for city={city}, lat={lat}, lon={lon}")
        
        # Handle city parameter
        if city:
            coords = get_coordinates_from_city(city)
            if not coords:
                return jsonify({
                    'error': f'City "{city}" not found. Please provide lat/lon coordinates instead.',
                    'status': 'error'
                }), 400
            lat, lon = coords
        
        # Validate coordinates
        if lat is None or lon is None:
            return jsonify({
                'error': 'Either city parameter or both lat and lon parameters are required',
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
        
        # Get ground station data
        data = ground_service.get_current_observations(lat=lat, lon=lon, distance=distance)
        
        if data['status'] == 'error':
            return jsonify(data), 500
            
        return jsonify(data), 200
        
    except Exception as e:
        logger.error(f"Error in get_ground_data: {str(e)}")
        return jsonify({
            'error': 'Internal server error while fetching ground station data',
            'message': str(e),
            'status': 'error'
        }), 500


@ground_bp.route('/stations', methods=['GET'])
def get_stations():
    """Get list of available ground stations."""
    try:
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)
        distance = request.args.get('distance', default=50, type=int)
        
        logger.info(f"Fetching ground stations list for lat={lat}, lon={lon}")
        
        data = ground_service.get_stations_list(lat=lat, lon=lon, distance=distance)
        
        if data['status'] == 'error':
            return jsonify(data), 500
            
        return jsonify(data), 200
        
    except Exception as e:
        logger.error(f"Error in get_stations: {str(e)}")
        return jsonify({
            'error': 'Internal server error while fetching stations list',
            'message': str(e),
            'status': 'error'
        }), 500


@ground_bp.route('/historical', methods=['GET'])
def get_historical_ground():
    """Get historical ground station data."""
    try:
        # Get query parameters
        city = request.args.get('city')
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        distance = request.args.get('distance', default=25, type=int)
        
        logger.info(f"Fetching historical ground data: {start_date} to {end_date}")
        
        # Handle city parameter
        if city:
            coords = get_coordinates_from_city(city)
            if not coords:
                return jsonify({
                    'error': f'City "{city}" not found. Please provide lat/lon coordinates instead.',
                    'status': 'error'
                }), 400
            lat, lon = coords
        
        # Validate required parameters
        if lat is None or lon is None:
            return jsonify({
                'error': 'Either city parameter or both lat and lon parameters are required',
                'status': 'error'
            }), 400
            
        if not start_date or not end_date:
            return jsonify({
                'error': 'start_date and end_date parameters are required',
                'status': 'error'
            }), 400
        
        data = ground_service.get_historical_observations(
            lat=lat,
            lon=lon,
            start_date=start_date,
            end_date=end_date,
            distance=distance
        )
        
        if data['status'] == 'error':
            return jsonify(data), 500
            
        return jsonify(data), 200
        
    except Exception as e:
        logger.error(f"Error in get_historical_ground: {str(e)}")
        return jsonify({
            'error': 'Internal server error while fetching historical ground data',
            'message': str(e),
            'status': 'error'
        }), 500


@ground_bp.route('/forecast', methods=['GET'])
def get_ground_forecast():
    """Get AQI forecast from ground station network."""
    try:
        city = request.args.get('city')
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)
        date = request.args.get('date')
        
        logger.info(f"Fetching ground station forecast for city={city}, lat={lat}, lon={lon}")
        
        # Handle city parameter
        if city:
            coords = get_coordinates_from_city(city)
            if not coords:
                return jsonify({
                    'error': f'City "{city}" not found. Please provide lat/lon coordinates instead.',
                    'status': 'error'
                }), 400
            lat, lon = coords
        
        # Validate coordinates
        if lat is None or lon is None:
            return jsonify({
                'error': 'Either city parameter or both lat and lon parameters are required',
                'status': 'error'
            }), 400
        
        data = ground_service.get_aqi_forecast(lat=lat, lon=lon, date=date)
        
        if data['status'] == 'error':
            return jsonify(data), 500
            
        return jsonify(data), 200
        
    except Exception as e:
        logger.error(f"Error in get_ground_forecast: {str(e)}")
        return jsonify({
            'error': 'Internal server error while fetching ground forecast',
            'message': str(e),
            'status': 'error'
        }), 500
