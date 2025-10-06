from flask import Blueprint, request, jsonify
from datetime import datetime
import traceback
from concurrent.futures import ThreadPoolExecutor, as_completed

from app.services.tempo_data_fetcher import tempo_fetcher
from app.services.nasa_service import nasa_service
from app.services.data_fusion_service import data_fusion_service
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

# Create blueprint for three data types display
three_data_types_bp = Blueprint('three_data_types', __name__)


@three_data_types_bp.route('/all-data-types', methods=['GET'])
def get_all_three_data_types():
    """
    Get all three types of air quality data for frontend display:
    1. Satellite Data (TEMPO)
    2. Ground Sensor Data 
    3. Fused Data (Satellite + Ground combined)
    
    Query Parameters:
        lat (float): Latitude (-90 to 90)
        lon (float): Longitude (-180 to 180)
        pollutants (str): Comma-separated pollutants (optional, default: NO2,O3,PM2.5)
        radius_km (float): Search radius for ground sensors (default: 50km)
        
    Returns:
        JSON response with all three data types clearly separated
    """
    try:
        # Get and validate parameters
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)
        pollutants_param = request.args.get('pollutants', 'NO2,O3,PM2.5')
        radius_km = request.args.get('radius_km', 50.0, type=float)
        
        # Validation
        if lat is None or lon is None:
            return jsonify({
                'error': 'Missing required parameters',
                'message': 'Both lat and lon parameters are required',
                'example': '/api/three-data-types/all-data-types?lat=40.7128&lon=-74.0060&pollutants=NO2,O3,PM2.5'
            }), 400
        
        if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
            return jsonify({
                'error': 'Invalid coordinates',
                'message': 'Latitude must be between -90 and 90, longitude between -180 and 180'
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
        
        logger.info(f"Fetching all three data types for {pollutants} at ({lat}, {lon})")
        
        # Fetch all three data types concurrently
        with ThreadPoolExecutor(max_workers=3) as executor:
            # Submit all three data collection tasks
            satellite_future = executor.submit(
                collect_satellite_data, lat, lon, pollutants
            )
            ground_future = executor.submit(
                collect_ground_data, lat, lon, pollutants, radius_km
            )
            fused_future = executor.submit(
                collect_fused_data, lat, lon, pollutants, radius_km
            )
            
            # Collect results
            satellite_data = satellite_future.result(timeout=60)
            ground_data = ground_future.result(timeout=60)
            fused_data = fused_future.result(timeout=60)
        
        # Prepare comprehensive response
        response = {
            'status': 'success',
            'location': {'lat': lat, 'lon': lon},
            'timestamp': datetime.utcnow().isoformat(),
            'requested_pollutants': pollutants,
            'radius_km': radius_km,
            
            # Type 1: Satellite Data (TEMPO)
            'satellite_data': {
                'type': 'satellite',
                'source': 'NASA TEMPO Satellite',
                'description': 'Wide coverage satellite observations from geostationary orbit',
                'characteristics': {
                    'coverage': 'Regional (North America)',
                    'spatial_resolution': '2-5 km pixels',
                    'temporal_resolution': 'Hourly during daylight',
                    'strengths': ['Wide coverage', 'Consistent sampling', 'No ground infrastructure needed'],
                    'limitations': ['Lower spatial resolution', 'Daylight hours only', 'Weather dependent']
                },
                'data': satellite_data
            },
            
            # Type 2: Ground Sensor Data
            'ground_sensor_data': {
                'type': 'ground_sensors',
                'source': 'Ground Monitoring Networks (OpenAQ, AirNow)',
                'description': 'High-precision point measurements from ground-based monitoring stations',
                'characteristics': {
                    'coverage': f'Point measurements within {radius_km}km radius',
                    'spatial_resolution': 'Exact location (GPS coordinates)',
                    'temporal_resolution': 'Continuous (typically hourly reports)',
                    'strengths': ['High precision', 'Continuous monitoring', 'Local accuracy', 'All weather conditions'],
                    'limitations': ['Limited spatial coverage', 'Infrastructure dependent', 'Maintenance required']
                },
                'data': ground_data
            },
            
            # Type 3: Fused Data (Combined)
            'fused_data': {
                'type': 'data_fusion',
                'source': 'Intelligent Fusion of Satellite + Ground Data',
                'description': 'Optimally combined satellite and ground measurements using spatial-temporal algorithms',
                'characteristics': {
                    'coverage': 'Best of both: Wide satellite coverage enhanced by ground precision',
                    'spatial_resolution': 'Variable (high near sensors, moderate elsewhere)',
                    'temporal_resolution': 'Optimized based on available data sources',
                    'strengths': ['Combines advantages of both', 'Uncertainty quantification', 'Quality assessment', 'Gap filling'],
                    'limitations': ['Computational complexity', 'Dependent on source availability']
                },
                'data': fused_data
            },
            
            # Summary comparison
            'data_comparison': generate_data_comparison(satellite_data, ground_data, fused_data, pollutants),
            
            # API metadata
            'api_info': {
                'endpoint': '/api/three-data-types/all-data-types',
                'version': '1.0',
                'description': 'Complete air quality data from all three sources for comprehensive frontend display',
                'update_frequency': 'Real-time with caching',
                'data_types': 3
            }
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Error in three data types endpoint: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        return jsonify({
            'error': 'Internal server error',
            'message': 'An error occurred while fetching the three data types',
            'timestamp': datetime.utcnow().isoformat()
        }), 500


@three_data_types_bp.route('/satellite-only', methods=['GET'])
def get_satellite_data_only():
    """Get only satellite (TEMPO) data for frontend display."""
    try:
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)
        pollutants_param = request.args.get('pollutants', 'NO2,O3,PM2.5')
        
        if lat is None or lon is None:
            return jsonify({'error': 'Missing lat/lon parameters'}), 400
        
        pollutants = [p.strip().upper() for p in pollutants_param.split(',')]
        satellite_data = collect_satellite_data(lat, lon, pollutants)
        
        return jsonify({
            'status': 'success',
            'type': 'satellite_only',
            'location': {'lat': lat, 'lon': lon},
            'timestamp': datetime.utcnow().isoformat(),
            'data': satellite_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error in satellite-only endpoint: {str(e)}")
        return jsonify({'error': 'Failed to fetch satellite data'}), 500


@three_data_types_bp.route('/ground-only', methods=['GET'])
def get_ground_data_only():
    """Get only ground sensor data for frontend display."""
    try:
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)
        pollutants_param = request.args.get('pollutants', 'NO2,O3,PM2.5')
        radius_km = request.args.get('radius_km', 50.0, type=float)
        
        if lat is None or lon is None:
            return jsonify({'error': 'Missing lat/lon parameters'}), 400
        
        pollutants = [p.strip().upper() for p in pollutants_param.split(',')]
        ground_data = collect_ground_data(lat, lon, pollutants, radius_km)
        
        return jsonify({
            'status': 'success',
            'type': 'ground_only',
            'location': {'lat': lat, 'lon': lon},
            'timestamp': datetime.utcnow().isoformat(),
            'radius_km': radius_km,
            'data': ground_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error in ground-only endpoint: {str(e)}")
        return jsonify({'error': 'Failed to fetch ground sensor data'}), 500


@three_data_types_bp.route('/fused-only', methods=['GET'])
def get_fused_data_only():
    """Get only fused data for frontend display."""
    try:
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)
        pollutants_param = request.args.get('pollutants', 'NO2,O3,PM2.5')
        radius_km = request.args.get('radius_km', 50.0, type=float)
        
        if lat is None or lon is None:
            return jsonify({'error': 'Missing lat/lon parameters'}), 400
        
        pollutants = [p.strip().upper() for p in pollutants_param.split(',')]
        fused_data = collect_fused_data(lat, lon, pollutants, radius_km)
        
        return jsonify({
            'status': 'success',
            'type': 'fused_only',
            'location': {'lat': lat, 'lon': lon},
            'timestamp': datetime.utcnow().isoformat(),
            'radius_km': radius_km,
            'data': fused_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error in fused-only endpoint: {str(e)}")
        return jsonify({'error': 'Failed to fetch fused data'}), 500


def collect_satellite_data(lat: float, lon: float, pollutants: list) -> dict:
    """Collect satellite data from TEMPO."""
    try:
        satellite_results = {}
        
        for pollutant in pollutants:
            if pollutant in ['NO2', 'O3', 'HCHO', 'AEROSOL']:
                try:
                    result = tempo_fetcher.get_tempo_realtime_data(lat, lon, pollutant)
                    if result.get('status') == 'success':
                        satellite_results[pollutant] = {
                            'value': result['data']['value'],
                            'unit': result['data']['unit'],
                            'quality': result['data'].get('quality_flag', 'good'),
                            'measurement_time': result['data']['measurement_time'],
                            'source': result.get('source', 'NASA_TEMPO'),
                            'coordinates': {
                                'lat': result['data']['lat'],
                                'lon': result['data']['lon']
                            }
                        }
                    else:
                        satellite_results[pollutant] = {
                            'status': 'unavailable',
                            'message': 'TEMPO data not available for this pollutant'
                        }
                except Exception as e:
                    satellite_results[pollutant] = {
                        'status': 'error',
                        'message': str(e)
                    }
            else:
                satellite_results[pollutant] = {
                    'status': 'not_supported',
                    'message': f'{pollutant} not available from TEMPO satellite'
                }
        
        return {
            'status': 'success',
            'pollutants': satellite_results,
            'summary': {
                'total_requested': len(pollutants),
                'successful': len([p for p in satellite_results.values() if p.get('value') is not None]),
                'data_source': 'NASA TEMPO Satellite'
            }
        }
        
    except Exception as e:
        logger.error(f"Error collecting satellite data: {str(e)}")
        return {
            'status': 'error',
            'message': str(e),
            'pollutants': {}
        }


def collect_ground_data(lat: float, lon: float, pollutants: list, radius_km: float) -> dict:
    """Collect ground sensor data."""
    try:
        # Get ground sensor data from OpenAQ and other networks
        ground_result = nasa_service.get_openaq_data(lat, lon, radius_km)
        
        if ground_result.get('status') != 'success':
            return {
                'status': 'no_data',
                'message': 'No ground sensor data available in the specified radius',
                'pollutants': {}
            }
        
        # Process ground measurements by pollutant
        ground_measurements = ground_result.get('data', [])
        ground_results = {}
        
        for pollutant in pollutants:
            pollutant_measurements = [
                m for m in ground_measurements 
                if m.get('pollutant', '').upper() == pollutant.upper()
            ]
            
            if pollutant_measurements:
                # Sort by distance to get closest measurements
                pollutant_measurements.sort(key=lambda x: x.get('distance_km', float('inf')))
                
                ground_results[pollutant] = {
                    'measurements': pollutant_measurements[:5],  # Top 5 closest
                    'closest_station': {
                        'value': pollutant_measurements[0]['value'],
                        'unit': pollutant_measurements[0]['unit'],
                        'station_name': pollutant_measurements[0].get('station_name', 'Unknown'),
                        'distance_km': pollutant_measurements[0].get('distance_km', 0),
                        'coordinates': {
                            'lat': pollutant_measurements[0]['lat'],
                            'lon': pollutant_measurements[0]['lon']
                        },
                        'timestamp': pollutant_measurements[0]['timestamp']
                    },
                    'station_count': len(pollutant_measurements),
                    'average_value': sum(m['value'] for m in pollutant_measurements) / len(pollutant_measurements),
                    'value_range': {
                        'min': min(m['value'] for m in pollutant_measurements),
                        'max': max(m['value'] for m in pollutant_measurements)
                    }
                }
            else:
                ground_results[pollutant] = {
                    'status': 'unavailable',
                    'message': f'No ground sensor data for {pollutant} within {radius_km}km'
                }
        
        return {
            'status': 'success',
            'pollutants': ground_results,
            'summary': {
                'total_requested': len(pollutants),
                'successful': len([p for p in ground_results.values() if 'measurements' in p]),
                'total_stations': len(set(m.get('station_id') for m in ground_measurements)),
                'search_radius_km': radius_km,
                'data_source': 'Ground Monitoring Networks'
            }
        }
        
    except Exception as e:
        logger.error(f"Error collecting ground data: {str(e)}")
        return {
            'status': 'error',
            'message': str(e),
            'pollutants': {}
        }


def collect_fused_data(lat: float, lon: float, pollutants: list, radius_km: float) -> dict:
    """Collect fused satellite + ground data."""
    try:
        # Get fused data using the data fusion service
        fused_result = data_fusion_service.get_fused_air_quality_data(
            lat, lon, pollutants, radius_km
        )
        
        if fused_result.get('status') != 'success':
            return {
                'status': 'error',
                'message': 'Data fusion failed',
                'pollutants': {}
            }
        
        # Extract and format fused data for frontend
        fused_pollutants = {}
        
        for pollutant, data in fused_result.get('pollutants', {}).items():
            if data.get('status') == 'success':
                fused_pollutants[pollutant] = {
                    'fused_value': data['fused_value'],
                    'unit': data['unit'],
                    'uncertainty': data.get('uncertainty', 0),
                    'confidence_intervals': data.get('confidence_intervals', {}),
                    'quality_score': data.get('data_quality', {}).get('score', 0),
                    'quality_level': data.get('data_quality', {}).get('level', 'unknown'),
                    'fusion_method': data.get('fusion_method', 'unknown'),
                    'contributing_sources': data.get('contributing_sources', {}),
                    'data_sources_used': {
                        'satellite': data.get('contributing_sources', {}).get('satellite_data', 0) > 0,
                        'ground_sensors': data.get('contributing_sources', {}).get('ground_sensors', 0) > 0
                    }
                }
            else:
                fused_pollutants[pollutant] = {
                    'status': 'failed',
                    'message': data.get('message', 'Fusion failed for this pollutant')
                }
        
        return {
            'status': 'success',
            'pollutants': fused_pollutants,
            'summary': {
                'total_requested': len(pollutants),
                'successful': len([p for p in fused_pollutants.values() if 'fused_value' in p]),
                'overall_quality': fused_result.get('quality_score', 0),
                'fusion_summary': fused_result.get('fusion_summary', {}),
                'data_source': 'Satellite + Ground Fusion'
            }
        }
        
    except Exception as e:
        logger.error(f"Error collecting fused data: {str(e)}")
        return {
            'status': 'error',
            'message': str(e),
            'pollutants': {}
        }


def generate_data_comparison(satellite_data: dict, ground_data: dict, fused_data: dict, pollutants: list) -> dict:
    """Generate comparison between the three data types."""
    try:
        comparison = {
            'pollutant_comparison': {},
            'source_availability': {
                'satellite': satellite_data.get('status') == 'success',
                'ground_sensors': ground_data.get('status') == 'success',
                'fused': fused_data.get('status') == 'success'
            },
            'data_quality_ranking': [],
            'recommendations': []
        }
        
        # Compare each pollutant across all three sources
        for pollutant in pollutants:
            sat_data = satellite_data.get('pollutants', {}).get(pollutant, {})
            ground_data_poll = ground_data.get('pollutants', {}).get(pollutant, {})
            fused_data_poll = fused_data.get('pollutants', {}).get(pollutant, {})
            
            comparison['pollutant_comparison'][pollutant] = {
                'satellite': {
                    'available': 'value' in sat_data,
                    'value': sat_data.get('value', 'N/A'),
                    'quality': sat_data.get('quality', 'unknown')
                },
                'ground_sensors': {
                    'available': 'closest_station' in ground_data_poll,
                    'value': ground_data_poll.get('closest_station', {}).get('value', 'N/A'),
                    'station_count': ground_data_poll.get('station_count', 0)
                },
                'fused': {
                    'available': 'fused_value' in fused_data_poll,
                    'value': fused_data_poll.get('fused_value', 'N/A'),
                    'uncertainty': fused_data_poll.get('uncertainty', 'N/A'),
                    'quality_score': fused_data_poll.get('quality_score', 0)
                }
            }
        
        # Generate recommendations
        if fused_data.get('status') == 'success':
            comparison['recommendations'].append('Use fused data for best accuracy and coverage')
        elif ground_data.get('status') == 'success':
            comparison['recommendations'].append('Use ground sensor data for high local precision')
        elif satellite_data.get('status') == 'success':
            comparison['recommendations'].append('Use satellite data for regional coverage')
        else:
            comparison['recommendations'].append('Limited data available - use with caution')
        
        return comparison
        
    except Exception as e:
        logger.error(f"Error generating data comparison: {str(e)}")
        return {'status': 'error', 'message': str(e)}


@three_data_types_bp.route('/health', methods=['GET'])
def three_data_types_health():
    """Health check for three data types service."""
    return jsonify({
        'status': 'healthy',
        'service': 'Three Data Types Service',
        'timestamp': datetime.utcnow().isoformat(),
        'data_types': ['satellite', 'ground_sensors', 'fused'],
        'endpoints': [
            '/all-data-types',
            '/satellite-only', 
            '/ground-only',
            '/fused-only'
        ]
    }), 200
