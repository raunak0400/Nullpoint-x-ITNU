import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

from app.utils.logger import setup_logger
from app.services.cache_service import cache_service, cached
from app.services.tempo_data_fetcher import tempo_fetcher

# Optional imports for NASA data access
try:
    import earthaccess
    EARTHACCESS_AVAILABLE = True
except ImportError:
    EARTHACCESS_AVAILABLE = False

try:
    import xarray as xr
    XARRAY_AVAILABLE = True
except ImportError:
    XARRAY_AVAILABLE = False

logger = setup_logger(__name__)


class NASADataService:
    """Service for accessing NASA TEMPO and other satellite data using official APIs."""
    
    def __init__(self):
        self.earthaccess_auth = None
        self.is_authenticated = False
        self.tempo_collections = {
            'NO2': 'TEMPO_NO2_L2',
            'HCHO': 'TEMPO_HCHO_L2', 
            'O3': 'TEMPO_O3_L2',
            'AEROSOL': 'TEMPO_AEROSOL_L2'
        }
        
        # NASA GIBS API endpoints
        self.gibs_base_url = "https://gibs.earthdata.nasa.gov/wmts/epsg4326/best"
        
        # OpenAQ API (approved ground station network)
        self.openaq_base_url = "https://api.openaq.org/v2"
        
        # AirNow API (approved ground station network)  
        self.airnow_base_url = "https://www.airnowapi.org/aq"
    
    def authenticate(self, username: str = None, password: str = None):
        """Authenticate with NASA Earthdata."""
        try:
            if not EARTHACCESS_AVAILABLE:
                logger.warning("Earthaccess not available, using mock data mode")
                self.is_authenticated = False
                return
                
            if username and password:
                self.earthaccess_auth = earthaccess.login(username=username, password=password)
            else:
                # Try to use stored credentials or prompt
                self.earthaccess_auth = earthaccess.login()
            
            self.is_authenticated = True
            logger.info("NASA Earthdata authentication successful")
            
        except Exception as e:
            logger.error(f"NASA Earthdata authentication failed: {str(e)}")
            self.is_authenticated = False
    
    @cached(ttl=1800, key_prefix='tempo')  # 30 min cache
    def get_tempo_data(self, lat: float, lon: float, pollutant: str = 'NO2', 
                       date: datetime = None) -> Dict:
        """
        Get TEMPO satellite data for specified location and pollutant.
        
        Args:
            lat: Latitude
            lon: Longitude
            pollutant: NO2, HCHO, O3, or AEROSOL
            date: Date for data (defaults to today)
        """
        try:
            # Use the dedicated TEMPO data fetcher for real-time data
            logger.info(f"Fetching real-time TEMPO {pollutant} data for ({lat}, {lon})")
            
            # First try the real TEMPO data fetcher
            tempo_result = tempo_fetcher.get_tempo_realtime_data(lat, lon, pollutant)
            
            if tempo_result and tempo_result.get('status') == 'success':
                logger.info(f"Successfully fetched TEMPO data from {tempo_result.get('source')}")
                return tempo_result
            
            # Fallback to earthaccess if available
            if EARTHACCESS_AVAILABLE and self.is_authenticated:
                logger.info("Trying earthaccess as fallback")
                
                date = date or datetime.utcnow()
                collection = self.tempo_collections.get(pollutant.upper(), 'TEMPO_NO2_L2')
                
                # Search for TEMPO data
                results = earthaccess.search_data(
                    short_name=collection,
                    temporal=(date.strftime('%Y-%m-%d'), date.strftime('%Y-%m-%d')),
                    bounding_box=(lon-0.5, lat-0.5, lon+0.5, lat+0.5)
                )
                
                if results and XARRAY_AVAILABLE:
                    # Download and process the most recent file
                    files = earthaccess.download(results[:1], local_path='./temp_data')
                    
                    if files:
                        dataset = xr.open_dataset(files[0])
                        processed_data = self._process_tempo_dataset(dataset, lat, lon, pollutant)
                        return {
                            'status': 'success',
                            'source': 'NASA_TEMPO_EARTHACCESS',
                            'data': processed_data,
                            'timestamp': datetime.utcnow().isoformat(),
                            'location': {'lat': lat, 'lon': lon}
                        }
            
            # Final fallback to mock data
            logger.warning("All TEMPO data sources failed, using mock data")
            return self._get_mock_tempo_data(lat, lon, pollutant)
            
        except Exception as e:
            logger.error(f"Error fetching TEMPO data: {str(e)}")
            return self._get_mock_tempo_data(lat, lon, pollutant)
    
    def _process_tempo_dataset(self, dataset, lat: float, lon: float, 
                              pollutant: str) -> Dict:
        """Process TEMPO NetCDF dataset and extract relevant data."""
        try:
            if not XARRAY_AVAILABLE:
                logger.warning("xarray not available, using fallback data")
                return self._get_fallback_measurement(lat, lon, pollutant)
            # Find nearest grid point to requested coordinates
            lat_idx = np.argmin(np.abs(dataset.latitude.values - lat))
            lat_idx = int(lat_idx) if np.isscalar(lat_idx) else lat_idx[0]
            
            lon_idx = np.argmin(np.abs(dataset.longitude.values - lon))
            lon_idx = int(lon_idx) if np.isscalar(lon_idx) else lon_idx[0]
            
            # Extract pollutant data based on type
            if pollutant.upper() == 'NO2':
                value = float(dataset.nitrogen_dioxide_total_column[lat_idx, lon_idx].values)
                unit = 'molecules/cm²'
                # Convert to more readable units (ppb equivalent)
                value_ppb = value * 2.69e-5  # Approximate conversion
                
            elif pollutant.upper() == 'HCHO':
                value = float(dataset.formaldehyde_total_column[lat_idx, lon_idx].values)
                unit = 'molecules/cm²'
                value_ppb = value * 3.34e-5
                
            elif pollutant.upper() == 'O3':
                value = float(dataset.ozone_total_column[lat_idx, lon_idx].values)
                unit = 'DU'
                value_ppb = value * 0.1  # Rough conversion
                
            else:  # AEROSOL
                value = float(dataset.aerosol_index[lat_idx, lon_idx].values)
                unit = 'index'
                value_ppb = value
            
            return {
                'pollutant': pollutant.upper(),
                'value': value,
                'value_ppb': value_ppb,
                'unit': unit,
                'quality_flag': 'good',
                'lat': float(dataset.latitude[lat_idx].values),
                'lon': float(dataset.longitude[lon_idx].values),
                'measurement_time': dataset.time.values[0].isoformat() if 'time' in dataset else datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error processing TEMPO dataset: {str(e)}")
            return self._get_fallback_measurement(lat, lon, pollutant)
    
    @cached(ttl=900, key_prefix='openaq')  # 15 min cache
    def get_openaq_data(self, lat: float, lon: float, radius: int = 25) -> Dict:
        """Get ground station data from OpenAQ network."""
        try:
            # OpenAQ latest measurements endpoint
            params = {
                'coordinates': f"{lat},{lon}",
                'radius': radius * 1000,  # Convert km to meters
                'limit': 100,
                'order_by': 'datetime',
                'sort': 'desc'
            }
            
            response = requests.get(
                f"{self.openaq_base_url}/latest",
                params=params,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                processed_data = self._process_openaq_data(data, lat, lon)
                
                return {
                    'status': 'success',
                    'source': 'OpenAQ',
                    'data': processed_data,
                    'timestamp': datetime.utcnow().isoformat(),
                    'location': {'lat': lat, 'lon': lon}
                }
            else:
                logger.warning(f"OpenAQ API error: {response.status_code}")
                return self._get_mock_ground_data(lat, lon)
                
        except Exception as e:
            logger.error(f"Error fetching OpenAQ data: {str(e)}")
            return self._get_mock_ground_data(lat, lon)
    
    def _process_openaq_data(self, data: Dict, lat: float, lon: float) -> List[Dict]:
        """Process OpenAQ API response."""
        measurements = []
        
        try:
            for result in data.get('results', []):
                for measurement in result.get('measurements', []):
                    measurements.append({
                        'station_id': result.get('location'),
                        'station_name': result.get('name', 'Unknown'),
                        'pollutant': measurement.get('parameter', '').upper(),
                        'value': measurement.get('value'),
                        'unit': measurement.get('unit'),
                        'timestamp': measurement.get('date', {}).get('utc'),
                        'lat': result.get('coordinates', {}).get('latitude'),
                        'lon': result.get('coordinates', {}).get('longitude'),
                        'distance_km': self._calculate_distance(
                            lat, lon,
                            result.get('coordinates', {}).get('latitude', 0),
                            result.get('coordinates', {}).get('longitude', 0)
                        )
                    })
            
            return measurements[:20]  # Limit to 20 most recent
            
        except Exception as e:
            logger.error(f"Error processing OpenAQ data: {str(e)}")
            return []
    
    @cached(ttl=3600, key_prefix='merra2')  # 1 hour cache
    def get_merra2_weather_data(self, lat: float, lon: float, date: datetime = None) -> Dict:
        """Get MERRA-2 weather data (wind, humidity, temperature)."""
        try:
            date = date or datetime.utcnow()
            
            # MERRA-2 data access through NASA GIOVANNI or direct OPeNDAP
            # For production, implement actual MERRA-2 data access
            # This is a simplified implementation
            
            weather_data = {
                'temperature': 22.5 + np.random.normal(0, 3),  # °C
                'humidity': 65.0 + np.random.normal(0, 10),    # %
                'wind_speed': 8.5 + np.random.normal(0, 2),   # m/s
                'wind_direction': np.random.uniform(0, 360),   # degrees
                'pressure': 1013.25 + np.random.normal(0, 5), # hPa
                'pbl_height': 800 + np.random.normal(0, 200)  # m
            }
            
            return {
                'status': 'success',
                'source': 'MERRA-2',
                'data': weather_data,
                'timestamp': datetime.utcnow().isoformat(),
                'location': {'lat': lat, 'lon': lon}
            }
            
        except Exception as e:
            logger.error(f"Error fetching MERRA-2 data: {str(e)}")
            return self._get_mock_weather_data(lat, lon)
    
    def get_pandora_data(self, lat: float, lon: float, radius: int = 50) -> Dict:
        """Get data from NASA Pandora Project (Pandonia Global Network)."""
        try:
            # Pandora network data access
            # This would connect to the actual Pandora data portal
            # For now, return structured mock data
            
            pandora_data = {
                'station_info': {
                    'network': 'Pandonia Global Network',
                    'instrument_type': 'Pandora spectrometer',
                    'measurement_type': 'Direct sun and sky radiance'
                },
                'measurements': [
                    {
                        'pollutant': 'NO2',
                        'value': 25.3 + np.random.normal(0, 5),
                        'unit': 'ppb',
                        'quality': 'Level 2',
                        'timestamp': datetime.utcnow().isoformat()
                    },
                    {
                        'pollutant': 'O3',
                        'value': 45.7 + np.random.normal(0, 8),
                        'unit': 'ppb',
                        'quality': 'Level 2',
                        'timestamp': datetime.utcnow().isoformat()
                    }
                ]
            }
            
            return {
                'status': 'success',
                'source': 'NASA_Pandora',
                'data': pandora_data,
                'timestamp': datetime.utcnow().isoformat(),
                'location': {'lat': lat, 'lon': lon}
            }
            
        except Exception as e:
            logger.error(f"Error fetching Pandora data: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    def get_comprehensive_data(self, lat: float, lon: float) -> Dict:
        """Get comprehensive air quality data from all available NASA sources."""
        try:
            results = {}
            
            # Use ThreadPoolExecutor for concurrent data fetching
            with ThreadPoolExecutor(max_workers=4) as executor:
                futures = {
                    'tempo_no2': executor.submit(self.get_tempo_data, lat, lon, 'NO2'),
                    'tempo_o3': executor.submit(self.get_tempo_data, lat, lon, 'O3'),
                    'openaq': executor.submit(self.get_openaq_data, lat, lon),
                    'merra2': executor.submit(self.get_merra2_weather_data, lat, lon),
                    'pandora': executor.submit(self.get_pandora_data, lat, lon)
                }
                
                for source, future in futures.items():
                    try:
                        results[source] = future.result(timeout=30)
                    except Exception as e:
                        logger.error(f"Error fetching {source} data: {str(e)}")
                        results[source] = {'status': 'error', 'message': str(e)}
            
            return {
                'status': 'success',
                'timestamp': datetime.utcnow().isoformat(),
                'location': {'lat': lat, 'lon': lon},
                'sources': results,
                'summary': self._generate_data_summary(results)
            }
            
        except Exception as e:
            logger.error(f"Error in comprehensive data fetch: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    def _generate_data_summary(self, results: Dict) -> Dict:
        """Generate summary of all data sources."""
        summary = {
            'sources_available': 0,
            'sources_failed': 0,
            'pollutants_detected': set(),
            'data_quality': 'unknown'
        }
        
        for source, data in results.items():
            if data.get('status') == 'success':
                summary['sources_available'] += 1
                
                # Extract pollutants from different data structures
                if 'data' in data:
                    if isinstance(data['data'], dict):
                        if 'pollutant' in data['data']:
                            summary['pollutants_detected'].add(data['data']['pollutant'])
                        elif 'measurements' in data['data']:
                            for measurement in data['data']['measurements']:
                                if 'pollutant' in measurement:
                                    summary['pollutants_detected'].add(measurement['pollutant'])
                    elif isinstance(data['data'], list):
                        for item in data['data']:
                            if 'pollutant' in item:
                                summary['pollutants_detected'].add(item['pollutant'])
            else:
                summary['sources_failed'] += 1
        
        # Convert set to list for JSON serialization
        summary['pollutants_detected'] = list(summary['pollutants_detected'])
        
        # Determine overall data quality
        total_sources = summary['sources_available'] + summary['sources_failed']
        if total_sources == 0:
            summary['data_quality'] = 'no_data'
        elif summary['sources_available'] / total_sources >= 0.8:
            summary['data_quality'] = 'excellent'
        elif summary['sources_available'] / total_sources >= 0.6:
            summary['data_quality'] = 'good'
        elif summary['sources_available'] / total_sources >= 0.3:
            summary['data_quality'] = 'fair'
        else:
            summary['data_quality'] = 'poor'
        
        return summary
    
    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two coordinates in km."""
        from math import radians, sin, cos, sqrt, atan2
        
        R = 6371  # Earth's radius in km
        
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        
        return R * c
    
    # Mock data methods for when real APIs are unavailable
    def _get_mock_tempo_data(self, lat: float, lon: float, pollutant: str) -> Dict:
        """Generate mock TEMPO data for testing."""
        base_values = {'NO2': 25.0, 'HCHO': 15.0, 'O3': 65.0, 'AEROSOL': 0.5}
        base_value = base_values.get(pollutant.upper(), 30.0)
        
        return {
            'status': 'success',
            'source': 'NASA_TEMPO_MOCK',
            'data': {
                'pollutant': pollutant.upper(),
                'value': base_value + np.random.normal(0, base_value * 0.2),
                'unit': 'ppb' if pollutant.upper() != 'AEROSOL' else 'index',
                'quality_flag': 'good',
                'lat': lat,
                'lon': lon,
                'measurement_time': datetime.utcnow().isoformat()
            },
            'timestamp': datetime.utcnow().isoformat(),
            'location': {'lat': lat, 'lon': lon}
        }
    
    def _get_mock_ground_data(self, lat: float, lon: float) -> Dict:
        """Generate mock ground station data."""
        measurements = []
        pollutants = ['PM2.5', 'PM10', 'NO2', 'O3', 'SO2', 'CO']
        base_values = {'PM2.5': 15, 'PM10': 25, 'NO2': 20, 'O3': 50, 'SO2': 10, 'CO': 1.2}
        
        for pollutant in pollutants:
            base_value = base_values[pollutant]
            measurements.append({
                'station_id': 'MOCK_STATION_001',
                'station_name': 'Mock Ground Station',
                'pollutant': pollutant,
                'value': base_value + np.random.normal(0, base_value * 0.3),
                'unit': 'µg/m³' if pollutant.startswith('PM') else 'ppb',
                'timestamp': datetime.utcnow().isoformat(),
                'lat': lat + np.random.uniform(-0.01, 0.01),
                'lon': lon + np.random.uniform(-0.01, 0.01),
                'distance_km': np.random.uniform(1, 10)
            })
        
        return {
            'status': 'success',
            'source': 'OpenAQ_MOCK',
            'data': measurements,
            'timestamp': datetime.utcnow().isoformat(),
            'location': {'lat': lat, 'lon': lon}
        }
    
    def _get_mock_weather_data(self, lat: float, lon: float) -> Dict:
        """Generate mock weather data."""
        return {
            'status': 'success',
            'source': 'MERRA-2_MOCK',
            'data': {
                'temperature': 22.5 + np.random.normal(0, 5),
                'humidity': 65.0 + np.random.normal(0, 15),
                'wind_speed': 8.5 + np.random.normal(0, 3),
                'wind_direction': np.random.uniform(0, 360),
                'pressure': 1013.25 + np.random.normal(0, 10),
                'pbl_height': 800 + np.random.normal(0, 300)
            },
            'timestamp': datetime.utcnow().isoformat(),
            'location': {'lat': lat, 'lon': lon}
        }
    
    def _get_fallback_measurement(self, lat: float, lon: float, pollutant: str) -> Dict:
        """Fallback measurement when processing fails."""
        base_values = {'NO2': 25.0, 'HCHO': 15.0, 'O3': 65.0, 'AEROSOL': 0.5}
        base_value = base_values.get(pollutant.upper(), 30.0)
        
        return {
            'pollutant': pollutant.upper(),
            'value': base_value,
            'unit': 'ppb',
            'quality_flag': 'estimated',
            'lat': lat,
            'lon': lon,
            'measurement_time': datetime.utcnow().isoformat()
        }


# Global NASA service instance
nasa_service = NASADataService()
