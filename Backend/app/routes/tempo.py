from flask import Blueprint, jsonify, request
from app.utils.logger import setup_logger
from app.services.tempo_service import tempo_service

tempo_bp = Blueprint('tempo', __name__)
logger = setup_logger(__name__)


@tempo_bp.route('/', methods=['GET'])
def get_tempo_data():
    """Get TEMPO satellite air quality data with optional coordinates."""
    try:
        # Get query parameters
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)
        
        logger.info(f"Fetching TEMPO data for coordinates: lat={lat}, lon={lon}")
        
        # Validate coordinates if provided
        if (lat is not None and lon is None) or (lat is None and lon is not None):
            return jsonify({
                'error': 'Both lat and lon parameters are required when specifying coordinates',
                'status': 'error'
            }), 400
        
        if lat is not None and (lat < -90 or lat > 90):
            return jsonify({
                'error': 'Latitude must be between -90 and 90',
                'status': 'error'
            }), 400
            
        if lon is not None and (lon < -180 or lon > 180):
            return jsonify({
                'error': 'Longitude must be between -180 and 180',
                'status': 'error'
            }), 400
        
        # Get TEMPO data
        data = tempo_service.get_latest_data(lat=lat, lon=lon)
        
        if data['status'] == 'error':
            return jsonify(data), 500
            
        return jsonify(data), 200
        
    except Exception as e:
        logger.error(f"Error in get_tempo_data: {str(e)}")
        return jsonify({
            'error': 'Internal server error while fetching TEMPO data',
            'message': str(e),
            'status': 'error'
        }), 500


@tempo_bp.route('/latest', methods=['GET'])
def get_latest_tempo():
    """Get latest TEMPO satellite data."""
    try:
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)
        
        logger.info(f"Fetching latest TEMPO data for coordinates: lat={lat}, lon={lon}")
        
        data = tempo_service.get_latest_data(lat=lat, lon=lon)
        
        if data['status'] == 'error':
            return jsonify(data), 500
            
        return jsonify(data), 200
        
    except Exception as e:
        logger.error(f"Error in get_latest_tempo: {str(e)}")
        return jsonify({
            'error': 'Internal server error while fetching latest TEMPO data',
            'message': str(e),
            'status': 'error'
        }), 500


@tempo_bp.route('/historical', methods=['GET'])
def get_historical_tempo():
    """Get historical TEMPO satellite data."""
    try:
        # Get query parameters
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        logger.info(f"Fetching historical TEMPO data: {start_date} to {end_date}")
        
        # Validate required parameters
        if not start_date or not end_date:
            return jsonify({
                'error': 'start_date and end_date parameters are required',
                'status': 'error'
            }), 400
        
        data = tempo_service.get_historical_data(
            start_date=start_date,
            end_date=end_date,
            lat=lat,
            lon=lon
        )
        
        if data['status'] == 'error':
            return jsonify(data), 500
            
        return jsonify(data), 200
        
    except Exception as e:
        logger.error(f"Error in get_historical_tempo: {str(e)}")
        return jsonify({
            'error': 'Internal server error while fetching historical TEMPO data',
            'message': str(e),
            'status': 'error'
        }), 500


@tempo_bp.route('/availability', methods=['GET'])
def get_tempo_availability():
    """Get TEMPO data availability status."""
    try:
        logger.info("Fetching TEMPO data availability")
        
        data = tempo_service.get_data_availability()
        
        if data['status'] == 'error':
            return jsonify(data), 500
            
        return jsonify(data), 200
        
    except Exception as e:
        logger.error(f"Error in get_tempo_availability: {str(e)}")
        return jsonify({
            'error': 'Internal server error while fetching TEMPO availability',
            'message': str(e),
            'status': 'error'
        }), 500
