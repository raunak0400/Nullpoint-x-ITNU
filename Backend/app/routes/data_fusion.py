from flask import Blueprint, request, jsonify
from datetime import datetime
import traceback

from app.services.data_fusion_service import data_fusion_service
from app.services.enhanced_prediction_service import enhanced_prediction_service
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

# Create blueprint for data fusion endpoints
data_fusion_bp = Blueprint('data_fusion', __name__)


@data_fusion_bp.route('/fused-data', methods=['GET'])
def get_fused_air_quality_data():
    """
    Get fused air quality data combining TEMPO satellite and ground sensor data.
    
    Query Parameters:
        lat (float): Latitude (-90 to 90)
        lon (float): Longitude (-180 to 180)
        pollutants (str): Comma-separated pollutants (optional, default: all)
        radius_km (float): Search radius for ground sensors (default: 50km)
        
    Returns:
        JSON response with fused data from satellite and ground sources
    """
    try:
        # Get and validate parameters
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)
        pollutants_param = request.args.get('pollutants', 'NO2,O3,PM2.5,PM10,HCHO')
        radius_km = request.args.get('radius_km', 50.0, type=float)
        
        # Validation
        if lat is None or lon is None:
            return jsonify({
                'error': 'Missing required parameters',
                'message': 'Both lat and lon parameters are required',
                'example': '/api/data-fusion/fused-data?lat=40.7128&lon=-74.0060&pollutants=NO2,O3'
            }), 400
        
        if not (-90 <= lat <= 90):
            return jsonify({
                'error': 'Invalid latitude',
                'message': 'Latitude must be between -90 and 90'
            }), 400
        
        if not (-180 <= lon <= 180):
            return jsonify({
                'error': 'Invalid longitude',
                'message': 'Longitude must be between -180 and 180'
            }), 400
        
        if not (1 <= radius_km <= 200):
            return jsonify({
                'error': 'Invalid radius',
                'message': 'Radius must be between 1 and 200 km'
            }), 400
        
        # Parse pollutants
        pollutants = [p.strip().upper() for p in pollutants_param.split(',')]
        valid_pollutants = ['NO2', 'O3', 'PM2.5', 'PM10', 'HCHO', 'SO2', 'CO']
        pollutants = [p for p in pollutants if p in valid_pollutants]
        
        if not pollutants:
            return jsonify({
                'error': 'No valid pollutants specified',
                'message': f'Valid pollutants are: {", ".join(valid_pollutants)}'
            }), 400
        
        logger.info(f"Getting fused data for {pollutants} at ({lat}, {lon}) within {radius_km}km")
        
        # Get fused data
        fused_data = data_fusion_service.get_fused_air_quality_data(
            lat, lon, pollutants, radius_km
        )
        
        # Add API metadata
        fused_data['api_info'] = {
            'endpoint': '/api/data-fusion/fused-data',
            'version': '1.0',
            'description': 'Fused satellite and ground sensor air quality data',
            'data_sources': ['NASA TEMPO Satellite', 'Ground Sensor Networks'],
            'fusion_method': 'Spatial-temporal weighted interpolation',
            'update_frequency': '10 minutes'
        }
        
        return jsonify(fused_data), 200
        
    except Exception as e:
        logger.error(f"Error in fused data endpoint: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        return jsonify({
            'error': 'Internal server error',
            'message': 'An error occurred while generating fused air quality data',
            'timestamp': datetime.utcnow().isoformat()
        }), 500


@data_fusion_bp.route('/enhanced-prediction', methods=['GET'])
def get_enhanced_prediction():
    """
    Get enhanced air quality prediction using fused satellite + ground sensor data.
    
    Query Parameters:
        lat (float): Latitude (-90 to 90)
        lon (float): Longitude (-180 to 180)
        pollutant (str): Target pollutant (default: NO2)
        forecast_hours (int): Hours to forecast (1-72, default: 24)
        
    Returns:
        JSON response with enhanced prediction using fused data
    """
    try:
        # Get and validate parameters
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)
        pollutant = request.args.get('pollutant', 'NO2').upper()
        forecast_hours = request.args.get('forecast_hours', 24, type=int)
        
        # Validation
        if lat is None or lon is None:
            return jsonify({
                'error': 'Missing required parameters',
                'message': 'Both lat and lon parameters are required',
                'example': '/api/data-fusion/enhanced-prediction?lat=40.7128&lon=-74.0060&pollutant=NO2&forecast_hours=24'
            }), 400
        
        if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
            return jsonify({
                'error': 'Invalid coordinates',
                'message': 'Latitude must be between -90 and 90, longitude between -180 and 180'
            }), 400
        
        if pollutant not in ['NO2', 'O3', 'PM2.5', 'PM10', 'HCHO', 'SO2', 'CO']:
            return jsonify({
                'error': 'Invalid pollutant',
                'message': 'Pollutant must be one of: NO2, O3, PM2.5, PM10, HCHO, SO2, CO'
            }), 400
        
        if not (1 <= forecast_hours <= 72):
            return jsonify({
                'error': 'Invalid forecast hours',
                'message': 'Forecast hours must be between 1 and 72'
            }), 400
        
        logger.info(f"Generating enhanced prediction for {pollutant} at ({lat}, {lon}) for {forecast_hours} hours")
        
        # Get enhanced prediction
        prediction = enhanced_prediction_service.get_enhanced_prediction(
            lat, lon, pollutant, forecast_hours
        )
        
        # Add API metadata
        prediction['api_info'] = {
            'endpoint': '/api/data-fusion/enhanced-prediction',
            'version': '1.0',
            'description': 'Enhanced air quality prediction using fused satellite and ground data',
            'prediction_method': 'Machine learning with spatial-temporal fusion',
            'data_sources': ['NASA TEMPO Satellite', 'Ground Sensor Networks', 'Weather Data'],
            'update_frequency': '30 minutes'
        }
        
        return jsonify(prediction), 200
        
    except Exception as e:
        logger.error(f"Error in enhanced prediction endpoint: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        return jsonify({
            'error': 'Internal server error',
            'message': 'An error occurred while generating enhanced prediction',
            'timestamp': datetime.utcnow().isoformat()
        }), 500


@data_fusion_bp.route('/comparison', methods=['GET'])
def get_data_source_comparison():
    """
    Compare air quality data from different sources (satellite vs ground sensors).
    
    Query Parameters:
        lat (float): Latitude (-90 to 90)
        lon (float): Longitude (-180 to 180)
        pollutant (str): Pollutant to compare (default: NO2)
        radius_km (float): Search radius for ground sensors (default: 25km)
        
    Returns:
        JSON response comparing satellite and ground sensor data
    """
    try:
        # Get and validate parameters
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)
        pollutant = request.args.get('pollutant', 'NO2').upper()
        radius_km = request.args.get('radius_km', 25.0, type=float)
        
        # Validation
        if lat is None or lon is None:
            return jsonify({
                'error': 'Missing required parameters',
                'message': 'Both lat and lon parameters are required'
            }), 400
        
        if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
            return jsonify({
                'error': 'Invalid coordinates',
                'message': 'Invalid latitude or longitude'
            }), 400
        
        logger.info(f"Comparing data sources for {pollutant} at ({lat}, {lon})")
        
        # Get fused data which includes source breakdown
        fused_data = data_fusion_service.get_fused_air_quality_data(
            lat, lon, [pollutant], radius_km
        )
        
        if fused_data.get('status') != 'success':
            return jsonify({
                'error': 'Data comparison failed',
                'message': 'Unable to retrieve data for comparison'
            }), 503
        
        pollutant_data = fused_data['pollutants'].get(pollutant, {})
        
        if pollutant_data.get('status') != 'success':
            return jsonify({
                'error': 'Pollutant data unavailable',
                'message': f'No data available for {pollutant}'
            }), 404
        
        # Extract source comparison
        raw_measurements = pollutant_data.get('raw_measurements', [])
        
        satellite_data = [m for m in raw_measurements if m['source'] == 'tempo_satellite']
        ground_data = [m for m in raw_measurements if m['source'] == 'ground_sensor']
        
        comparison_result = {
            'status': 'success',
            'pollutant': pollutant,
            'location': {'lat': lat, 'lon': lon},
            'timestamp': datetime.utcnow().isoformat(),
            'fused_result': {
                'value': pollutant_data['fused_value'],
                'unit': pollutant_data['unit'],
                'uncertainty': pollutant_data.get('uncertainty', 0),
                'quality_score': pollutant_data.get('data_quality', {}).get('score', 0)
            },
            'satellite_data': {
                'available': len(satellite_data) > 0,
                'count': len(satellite_data),
                'measurements': satellite_data,
                'coverage': 'Regional (2-5km resolution)',
                'strengths': ['Wide coverage', 'Consistent temporal sampling', 'No ground infrastructure needed'],
                'limitations': ['Lower spatial resolution', 'Weather dependent', 'Daylight hours only']
            },
            'ground_sensor_data': {
                'available': len(ground_data) > 0,
                'count': len(ground_data),
                'measurements': ground_data,
                'coverage': f'Point measurements within {radius_km}km',
                'strengths': ['High precision', 'Continuous monitoring', 'Local accuracy'],
                'limitations': ['Limited spatial coverage', 'Infrastructure dependent', 'Maintenance required']
            },
            'fusion_benefits': {
                'spatial_enhancement': 'Combines satellite coverage with ground precision',
                'temporal_enhancement': 'Fills gaps in measurement timing',
                'quality_improvement': 'Cross-validation between sources',
                'uncertainty_quantification': 'Provides confidence intervals'
            },
            'recommendation': self._generate_data_recommendation(satellite_data, ground_data)
        }
        
        return jsonify(comparison_result), 200
        
    except Exception as e:
        logger.error(f"Error in data comparison endpoint: {str(e)}")
        
        return jsonify({
            'error': 'Internal server error',
            'message': 'An error occurred during data source comparison',
            'timestamp': datetime.utcnow().isoformat()
        }), 500


@data_fusion_bp.route('/quality-assessment', methods=['GET'])
def get_quality_assessment():
    """
    Get detailed quality assessment of fused air quality data.
    
    Query Parameters:
        lat (float): Latitude
        lon (float): Longitude
        pollutants (str): Comma-separated pollutants (optional)
        
    Returns:
        JSON response with detailed quality metrics
    """
    try:
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)
        pollutants_param = request.args.get('pollutants', 'NO2,O3,PM2.5')
        
        if lat is None or lon is None:
            return jsonify({'error': 'Missing lat/lon parameters'}), 400
        
        pollutants = [p.strip().upper() for p in pollutants_param.split(',')]
        
        # Get fused data
        fused_data = data_fusion_service.get_fused_air_quality_data(lat, lon, pollutants)
        
        if fused_data.get('status') != 'success':
            return jsonify({'error': 'Quality assessment failed'}), 503
        
        # Generate quality assessment
        quality_assessment = {
            'status': 'success',
            'location': {'lat': lat, 'lon': lon},
            'timestamp': datetime.utcnow().isoformat(),
            'overall_quality': fused_data.get('quality_score', 0),
            'pollutant_quality': {},
            'data_source_assessment': fused_data.get('fusion_summary', {}),
            'recommendations': []
        }
        
        # Assess each pollutant
        for pollutant, data in fused_data.get('pollutants', {}).items():
            if data.get('status') == 'success':
                quality_info = data.get('data_quality', {})
                
                quality_assessment['pollutant_quality'][pollutant] = {
                    'quality_score': quality_info.get('score', 0),
                    'quality_level': quality_info.get('level', 'unknown'),
                    'contributing_factors': quality_info.get('factors', []),
                    'measurement_count': quality_info.get('measurement_count', 0),
                    'source_diversity': quality_info.get('source_diversity', 0),
                    'uncertainty_percent': data.get('confidence_intervals', {}).get('uncertainty_percent', 0),
                    'fusion_method': data.get('fusion_method', 'unknown')
                }
        
        # Generate recommendations
        overall_quality = quality_assessment['overall_quality']
        if overall_quality >= 0.8:
            quality_assessment['recommendations'].append('Excellent data quality - suitable for all applications')
        elif overall_quality >= 0.6:
            quality_assessment['recommendations'].append('Good data quality - suitable for most applications')
        elif overall_quality >= 0.4:
            quality_assessment['recommendations'].append('Fair data quality - consider uncertainty in analysis')
        else:
            quality_assessment['recommendations'].append('Poor data quality - use with caution')
        
        return jsonify(quality_assessment), 200
        
    except Exception as e:
        logger.error(f"Error in quality assessment: {str(e)}")
        return jsonify({'error': 'Quality assessment failed'}), 500


def _generate_data_recommendation(satellite_data: list, ground_data: list) -> str:
    """Generate recommendation based on available data sources."""
    
    if satellite_data and ground_data:
        return "Optimal: Both satellite and ground sensor data available for high-quality fusion"
    elif ground_data:
        return "Good: Ground sensor data provides high local accuracy"
    elif satellite_data:
        return "Fair: Satellite data provides regional coverage but lower spatial resolution"
    else:
        return "Limited: No direct measurements available, using estimation methods"


@data_fusion_bp.route('/health', methods=['GET'])
def fusion_health_check():
    """Health check for data fusion service."""
    try:
        # Quick test of fusion service
        test_result = data_fusion_service.get_fused_air_quality_data(40.7128, -74.0060, ['NO2'])
        
        return jsonify({
            'status': 'healthy',
            'service': 'Data Fusion Service',
            'timestamp': datetime.utcnow().isoformat(),
            'test_fusion': 'success' if test_result.get('status') == 'success' else 'fallback',
            'capabilities': [
                'Satellite-Ground Data Fusion',
                'Enhanced Predictions',
                'Quality Assessment',
                'Source Comparison'
            ]
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'service': 'Data Fusion Service',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 503
