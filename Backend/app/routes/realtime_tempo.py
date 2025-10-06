from flask import Blueprint, request, jsonify
from datetime import datetime
import traceback

from app.services.tempo_data_fetcher import tempo_fetcher
from app.services.cache_service import cache_service
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

# Create blueprint for real-time TEMPO data
realtime_tempo_bp = Blueprint('realtime_tempo', __name__)


@realtime_tempo_bp.route('/', methods=['GET'])
def get_realtime_tempo_data():
    """
    Get real-time TEMPO satellite data for air quality monitoring.
    
    Query Parameters:
        lat (float): Latitude (-90 to 90)
        lon (float): Longitude (-180 to 180) 
        pollutant (str): Pollutant type (NO2, HCHO, O3, AEROSOL, PM)
        
    Returns:
        JSON response with TEMPO data
    """
    try:
        # Get and validate parameters
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)
        pollutant = request.args.get('pollutant', 'NO2').upper()
        
        # Validation
        if lat is None or lon is None:
            return jsonify({
                'error': 'Missing required parameters',
                'message': 'Both lat and lon parameters are required',
                'example': '/api/realtime-tempo/?lat=40.7128&lon=-74.0060&pollutant=NO2'
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
        
        if pollutant not in ['NO2', 'HCHO', 'O3', 'AEROSOL', 'PM']:
            return jsonify({
                'error': 'Invalid pollutant',
                'message': 'Pollutant must be one of: NO2, HCHO, O3, AEROSOL, PM'
            }), 400
        
        logger.info(f"Fetching real-time TEMPO {pollutant} data for ({lat}, {lon})")
        
        # Fetch TEMPO data
        tempo_data = tempo_fetcher.get_tempo_realtime_data(lat, lon, pollutant)
        
        if tempo_data.get('status') == 'success':
            logger.info(f"Successfully retrieved TEMPO data from {tempo_data.get('source')}")
            
            # Add API metadata
            tempo_data['api_info'] = {
                'endpoint': '/api/realtime-tempo/',
                'version': '1.0',
                'data_source': 'NASA TEMPO Satellite',
                'update_frequency': '15 minutes',
                'cache_duration': '15 minutes'
            }
            
            return jsonify(tempo_data), 200
        else:
            logger.warning(f"Failed to retrieve TEMPO data: {tempo_data}")
            return jsonify({
                'error': 'Data retrieval failed',
                'message': 'Unable to fetch TEMPO data from NASA sources',
                'fallback_data': tempo_data
            }), 503
        
    except Exception as e:
        logger.error(f"Error in realtime TEMPO endpoint: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        return jsonify({
            'error': 'Internal server error',
            'message': 'An error occurred while fetching TEMPO data',
            'timestamp': datetime.utcnow().isoformat()
        }), 500


@realtime_tempo_bp.route('/multiple', methods=['GET'])
def get_multiple_pollutants():
    """
    Get real-time TEMPO data for multiple pollutants simultaneously.
    
    Query Parameters:
        lat (float): Latitude (-90 to 90)
        lon (float): Longitude (-180 to 180)
        pollutants (str): Comma-separated list of pollutants (optional, defaults to all)
        
    Returns:
        JSON response with data for all requested pollutants
    """
    try:
        # Get and validate parameters
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)
        pollutants_param = request.args.get('pollutants', 'NO2,HCHO,O3,AEROSOL,PM')
        
        # Validation
        if lat is None or lon is None:
            return jsonify({
                'error': 'Missing required parameters',
                'message': 'Both lat and lon parameters are required',
                'example': '/api/realtime-tempo/multiple?lat=40.7128&lon=-74.0060&pollutants=NO2,O3'
            }), 400
        
        if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
            return jsonify({
                'error': 'Invalid coordinates',
                'message': 'Latitude must be between -90 and 90, longitude between -180 and 180'
            }), 400
        
        # Parse pollutants list
        requested_pollutants = [p.strip().upper() for p in pollutants_param.split(',')]
        valid_pollutants = ['NO2', 'HCHO', 'O3', 'AEROSOL', 'PM']
        
        # Filter to valid pollutants only
        pollutants_to_fetch = [p for p in requested_pollutants if p in valid_pollutants]
        
        if not pollutants_to_fetch:
            return jsonify({
                'error': 'No valid pollutants specified',
                'message': f'Valid pollutants are: {", ".join(valid_pollutants)}'
            }), 400
        
        logger.info(f"Fetching TEMPO data for pollutants {pollutants_to_fetch} at ({lat}, {lon})")
        
        # Fetch data for multiple pollutants
        result = tempo_fetcher.get_multiple_pollutants(lat, lon, pollutants_to_fetch)
        
        # Add API metadata
        result['api_info'] = {
            'endpoint': '/api/realtime-tempo/multiple',
            'version': '1.0',
            'data_source': 'NASA TEMPO Satellite',
            'requested_pollutants': pollutants_to_fetch,
            'update_frequency': '15 minutes'
        }
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error in multiple pollutants endpoint: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        return jsonify({
            'error': 'Internal server error',
            'message': 'An error occurred while fetching multiple pollutant data',
            'timestamp': datetime.utcnow().isoformat()
        }), 500


@realtime_tempo_bp.route('/status', methods=['GET'])
def get_tempo_status():
    """
    Get status of TEMPO data sources and availability.
    
    Returns:
        JSON response with status of all TEMPO data sources
    """
    try:
        # Test connectivity to different data sources
        test_lat, test_lon = 40.7128, -74.0060  # NYC coordinates for testing
        
        status_info = {
            'timestamp': datetime.utcnow().isoformat(),
            'service_status': 'operational',
            'data_sources': {},
            'cache_info': cache_service.get_stats() if cache_service.is_connected else {'status': 'unavailable'},
            'supported_pollutants': ['NO2', 'HCHO', 'O3', 'AEROSOL', 'PM'],
            'coverage': {
                'geographic': 'North America (TEMPO coverage area)',
                'temporal': 'Hourly during daylight hours',
                'spatial_resolution': '2.1 km x 4.4 km'
            }
        }
        
        # Test each data source quickly
        try:
            # Test GIBS API
            import requests
            gibs_url = "https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi"
            response = requests.get(gibs_url, params={'SERVICE': 'WMTS', 'REQUEST': 'GetCapabilities'}, timeout=5)
            status_info['data_sources']['GIBS'] = {
                'status': 'available' if response.status_code == 200 else 'unavailable',
                'response_time_ms': response.elapsed.total_seconds() * 1000 if response else None
            }
        except:
            status_info['data_sources']['GIBS'] = {'status': 'unavailable', 'error': 'Connection failed'}
        
        try:
            # Test SPoRT Viewer
            sport_url = "https://weather.ndc.nasa.gov/sport/"
            response = requests.get(sport_url, timeout=5)
            status_info['data_sources']['SPoRT'] = {
                'status': 'available' if response.status_code == 200 else 'unavailable',
                'response_time_ms': response.elapsed.total_seconds() * 1000 if response else None
            }
        except:
            status_info['data_sources']['SPoRT'] = {'status': 'unavailable', 'error': 'Connection failed'}
        
        try:
            # Test ASDC Hub
            asdc_url = "https://asdc.larc.nasa.gov/"
            response = requests.get(asdc_url, timeout=5)
            status_info['data_sources']['ASDC'] = {
                'status': 'available' if response.status_code == 200 else 'unavailable',
                'response_time_ms': response.elapsed.total_seconds() * 1000 if response else None
            }
        except:
            status_info['data_sources']['ASDC'] = {'status': 'unavailable', 'error': 'Connection failed'}
        
        # Determine overall service status
        available_sources = sum(1 for source in status_info['data_sources'].values() 
                              if source.get('status') == 'available')
        total_sources = len(status_info['data_sources'])
        
        if available_sources == 0:
            status_info['service_status'] = 'degraded'
            status_info['message'] = 'All external data sources unavailable, using fallback data'
        elif available_sources < total_sources:
            status_info['service_status'] = 'partial'
            status_info['message'] = f'{available_sources}/{total_sources} data sources available'
        else:
            status_info['service_status'] = 'operational'
            status_info['message'] = 'All data sources operational'
        
        return jsonify(status_info), 200
        
    except Exception as e:
        logger.error(f"Error in TEMPO status endpoint: {str(e)}")
        
        return jsonify({
            'error': 'Status check failed',
            'message': str(e),
            'timestamp': datetime.utcnow().isoformat(),
            'service_status': 'error'
        }), 500


@realtime_tempo_bp.route('/coverage', methods=['GET'])
def get_tempo_coverage():
    """
    Get information about TEMPO satellite coverage and capabilities.
    
    Returns:
        JSON response with TEMPO coverage information
    """
    try:
        coverage_info = {
            'timestamp': datetime.utcnow().isoformat(),
            'satellite_info': {
                'name': 'TEMPO (Tropospheric Emissions: Monitoring of Pollution)',
                'launch_date': '2023-04-07',
                'orbit': 'Geostationary (35,786 km altitude)',
                'position': '91.4°W longitude',
                'mission_duration': '20+ years (planned)'
            },
            'geographic_coverage': {
                'region': 'North America',
                'latitude_range': {'min': 18.0, 'max': 70.0},
                'longitude_range': {'min': -140.0, 'max': -40.0},
                'countries': ['United States', 'Canada', 'Mexico', 'Central America']
            },
            'temporal_coverage': {
                'observation_frequency': 'Hourly during daylight',
                'daily_observations': '8-12 per day (depending on season)',
                'observation_window': 'Sunrise to sunset',
                'data_latency': '2-4 hours (Near Real-Time)',
                'archive_availability': 'Since April 2023'
            },
            'spatial_resolution': {
                'nadir': '2.1 km x 4.4 km',
                'edge_of_domain': '5.7 km x 9.4 km',
                'pixel_size_note': 'Resolution varies with viewing angle'
            },
            'spectral_coverage': {
                'wavelength_range': '290-740 nm',
                'spectral_resolution': '0.6 nm',
                'bands': 'Ultraviolet and visible spectrum'
            },
            'data_products': {
                'NO2': {
                    'name': 'Nitrogen Dioxide',
                    'unit': 'molecules/cm²',
                    'accuracy': '±15%',
                    'sources': 'Vehicle emissions, power plants, industrial processes'
                },
                'HCHO': {
                    'name': 'Formaldehyde',
                    'unit': 'molecules/cm²', 
                    'accuracy': '±20%',
                    'sources': 'Vegetation, wildfires, industrial processes'
                },
                'O3': {
                    'name': 'Ozone',
                    'unit': 'Dobson Units (DU)',
                    'accuracy': '±10%',
                    'sources': 'Photochemical reactions, stratospheric intrusion'
                },
                'AEROSOL': {
                    'name': 'Aerosol Index',
                    'unit': 'Dimensionless index',
                    'accuracy': '±0.1',
                    'sources': 'Dust, smoke, pollution, sea salt'
                }
            },
            'data_access': {
                'real_time_sources': [
                    'NASA GIBS (Global Imagery Browse Services)',
                    'NASA SPoRT Viewer',
                    'NASA Worldview',
                    'ASDC (Atmospheric Science Data Center)'
                ],
                'api_endpoints': [
                    '/api/realtime-tempo/',
                    '/api/realtime-tempo/multiple',
                    '/api/realtime-tempo/status'
                ],
                'update_frequency': 'Every 15 minutes',
                'cache_duration': '15 minutes'
            }
        }
        
        return jsonify(coverage_info), 200
        
    except Exception as e:
        logger.error(f"Error in TEMPO coverage endpoint: {str(e)}")
        
        return jsonify({
            'error': 'Coverage information unavailable',
            'message': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500


@realtime_tempo_bp.route('/health', methods=['GET'])
def tempo_health_check():
    """Simple health check for TEMPO data service."""
    try:
        # Quick test of the TEMPO fetcher
        test_result = tempo_fetcher.get_tempo_realtime_data(40.7128, -74.0060, 'NO2')
        
        return jsonify({
            'status': 'healthy',
            'service': 'TEMPO Real-time Data Service',
            'timestamp': datetime.utcnow().isoformat(),
            'test_fetch': 'success' if test_result.get('status') == 'success' else 'fallback',
            'data_source': test_result.get('source', 'unknown')
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'service': 'TEMPO Real-time Data Service',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 503
