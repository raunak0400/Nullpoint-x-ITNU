from flask import Blueprint, jsonify, request
from app.utils.logger import setup_logger
from app.services.forecast_service import forecast_service
from app.services.merge_service import merge_service
from app.models.aqi_record import AQIRecord
from datetime import datetime, timedelta

forecast_bp = Blueprint('forecast', __name__)
logger = setup_logger(__name__)


@forecast_bp.route('/', methods=['GET'])
def get_forecast():
    """Get comprehensive air quality forecast using ML models."""
    try:
        # Get query parameters
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)
        days = request.args.get('days', default=7, type=int)
        pollutant = request.args.get('pollutant', default='PM2.5')
        model_type = request.args.get('model_type', default='auto')
        
        logger.info(f"Fetching ML forecast for {pollutant} at lat={lat}, lon={lon}, days={days}")
        
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
        
        if days < 1 or days > 14:
            return jsonify({
                'error': 'Days parameter must be between 1 and 14',
                'status': 'error'
            }), 400
        
        # Generate ML-based forecast
        forecast_data = forecast_service.generate_forecast(
            lat=lat, lon=lon, days=days, 
            pollutant=pollutant, model_type=model_type
        )
        
        return jsonify(forecast_data), 200
        
    except Exception as e:
        logger.error(f"Error in get_forecast: {str(e)}")
        return jsonify({
            'error': 'Internal server error while generating forecast',
            'message': str(e),
            'status': 'error'
        }), 500


@forecast_bp.route('/generate', methods=['POST'])
def generate_forecast():
    """Generate new air quality forecast with custom parameters."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'JSON data required',
                'status': 'error'
            }), 400
        
        lat = data.get('lat')
        lon = data.get('lon')
        days = data.get('days', 7)
        pollutant = data.get('pollutant', 'PM2.5')
        model_type = data.get('model_type', 'auto')
        
        logger.info(f"Generating custom forecast for lat={lat}, lon={lon}")
        
        # Validate required parameters
        if lat is None or lon is None:
            return jsonify({
                'error': 'Both lat and lon are required in request body',
                'status': 'error'
            }), 400
        
        # Generate ML-based forecast
        forecast_data = forecast_service.generate_forecast(
            lat=lat, lon=lon, days=days,
            pollutant=pollutant, model_type=model_type
        )
        
        return jsonify(forecast_data), 200
        
    except Exception as e:
        logger.error(f"Error in generate_forecast: {str(e)}")
        return jsonify({
            'error': 'Internal server error while generating custom forecast',
            'message': str(e),
            'status': 'error'
        }), 500


@forecast_bp.route('/merged', methods=['GET'])
def get_merged_data():
    """Get merged data from all sources."""
    try:
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)
        sources = request.args.getlist('sources')  # Can specify specific sources
        
        logger.info(f"Fetching merged data for lat={lat}, lon={lon}")
        
        # Validate parameters
        if lat is None or lon is None:
            return jsonify({
                'error': 'Both lat and lon parameters are required',
                'status': 'error'
            }), 400
        
        # Fetch and merge data from all sources
        merged_data = merge_service.fetch_and_merge_data(
            lat=lat, lon=lon, sources=sources if sources else None
        )
        
        # Save merged data to MongoDB
        if merged_data.get('normalized_data'):
            saved_count = merge_service.save_merged_data(merged_data)
            merged_data['saved_records'] = saved_count
        
        return jsonify(merged_data), 200
        
    except Exception as e:
        logger.error(f"Error in get_merged_data: {str(e)}")
        return jsonify({
            'error': 'Internal server error while fetching merged data',
            'message': str(e),
            'status': 'error'
        }), 500


@forecast_bp.route('/pollutants', methods=['GET'])
def get_pollutant_forecast():
    """Get pollutant-specific forecast using ML models."""
    try:
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)
        pollutant = request.args.get('pollutant', 'PM2.5')
        days = request.args.get('days', default=7, type=int)
        model_type = request.args.get('model_type', 'auto')
        
        logger.info(f"Fetching ML forecast for pollutant {pollutant}")
        
        # Validate parameters
        if lat is None or lon is None:
            return jsonify({
                'error': 'Both lat and lon parameters are required',
                'status': 'error'
            }), 400
        
        valid_pollutants = ['NO2', 'O3', 'PM2.5', 'PM10', 'SO2', 'CO']
        if pollutant not in valid_pollutants:
            return jsonify({
                'error': f'Pollutant must be one of: {", ".join(valid_pollutants)}',
                'status': 'error'
            }), 400
        
        # Generate ML-based pollutant forecast
        forecast_data = forecast_service.generate_forecast(
            lat=lat, lon=lon, days=days,
            pollutant=pollutant, model_type=model_type
        )
        
        return jsonify(forecast_data), 200
        
    except Exception as e:
        logger.error(f"Error in get_pollutant_forecast: {str(e)}")
        return jsonify({
            'error': 'Internal server error while fetching pollutant forecast',
            'message': str(e),
            'status': 'error'
        }), 500


@forecast_bp.route('/performance', methods=['GET'])
def get_model_performance():
    """Get model performance metrics for a location."""
    try:
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)
        pollutant = request.args.get('pollutant', 'PM2.5')
        
        logger.info(f"Fetching model performance for {pollutant} at ({lat}, {lon})")
        
        # Validate parameters
        if lat is None or lon is None:
            return jsonify({
                'error': 'Both lat and lon parameters are required',
                'status': 'error'
            }), 400
        
        # Get model performance metrics
        performance_data = forecast_service.get_model_performance(lat, lon, pollutant)
        
        return jsonify(performance_data), 200
        
    except Exception as e:
        logger.error(f"Error in get_model_performance: {str(e)}")
        return jsonify({
            'error': 'Internal server error while fetching model performance',
            'message': str(e),
            'status': 'error'
        }), 500


@forecast_bp.route('/historical', methods=['GET'])
def get_historical_data():
    """Get historical merged data for analysis."""
    try:
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)
        days_back = request.args.get('days_back', default=30, type=int)
        pollutants = request.args.getlist('pollutants')
        
        logger.info(f"Fetching historical data for ({lat}, {lon}), {days_back} days back")
        
        # Validate parameters
        if lat is None or lon is None:
            return jsonify({
                'error': 'Both lat and lon parameters are required',
                'status': 'error'
            }), 400
        
        if days_back < 1 or days_back > 365:
            return jsonify({
                'error': 'days_back must be between 1 and 365',
                'status': 'error'
            }), 400
        
        # Get historical merged data
        historical_data = merge_service.get_historical_merged_data(
            lat=lat, lon=lon, days_back=days_back, 
            pollutants=pollutants if pollutants else None
        )
        
        return jsonify(historical_data), 200
        
    except Exception as e:
        logger.error(f"Error in get_historical_data: {str(e)}")
        return jsonify({
            'error': 'Internal server error while fetching historical data',
            'message': str(e),
            'status': 'error'
        }), 500


# All forecast functionality now handled by forecast_service and merge_service
