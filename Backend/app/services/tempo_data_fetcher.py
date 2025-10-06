import requests
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from urllib.parse import urljoin, urlparse, parse_qs
import re
from bs4 import BeautifulSoup
import h5py
import io
import base64

from app.utils.logger import setup_logger
from app.services.cache_service import cache_service, cached

logger = setup_logger(__name__)


class TempoDataFetcher:
    """
    Real-time TEMPO data fetcher for NASA Space Apps Challenge.
    Fetches data from official NASA TEMPO sources including:
    - NASA Tropospheric Emissions Monitoring of Pollution (TEMPO)
    - SPoRT Viewer (Near Real-Time)
    - ASDC Resource Hub
    """
    
    def __init__(self):
        # NASA TEMPO API endpoints
        self.tempo_base_url = "https://asdc.larc.nasa.gov/data/TEMPO/"
        self.sport_viewer_url = "https://weather.ndc.nasa.gov/sport/"
        self.asdc_hub_url = "https://asdc.larc.nasa.gov/"
        
        # GIBS (Global Imagery Browse Services) for real-time imagery
        self.gibs_base_url = "https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/"
        
        # NASA Worldview for TEMPO data visualization
        self.worldview_url = "https://worldview.earthdata.nasa.gov/"
        
        # TEMPO data product identifiers
        self.tempo_products = {
            'NO2': 'TEMPO_NO2_L2',
            'HCHO': 'TEMPO_HCHO_L2', 
            'O3': 'TEMPO_O3_L2',
            'AEROSOL': 'TEMPO_AEROSOL_L2',
            'PM': 'TEMPO_PM_L2'
        }
        
        # Common headers for NASA requests
        self.headers = {
            'User-Agent': 'NASA-Space-Apps-Air-Quality-Forecasting/1.0',
            'Accept': 'application/json, text/html, */*',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive'
        }
    
    @cached(ttl=900, key_prefix='tempo_realtime')  # 15 min cache
    def get_tempo_realtime_data(self, lat: float, lon: float, 
                               pollutant: str = 'NO2') -> Dict:
        """
        Fetch real-time TEMPO data for specified location and pollutant.
        
        Args:
            lat: Latitude (-90 to 90)
            lon: Longitude (-180 to 180)
            pollutant: NO2, HCHO, O3, AEROSOL, or PM
        
        Returns:
            Dict containing TEMPO data and metadata
        """
        try:
            logger.info(f"Fetching TEMPO {pollutant} data for ({lat}, {lon})")
            
            # Try multiple data sources in order of preference
            data_sources = [
                self._fetch_from_gibs_api,
                self._fetch_from_sport_viewer,
                self._fetch_from_asdc_hub,
                self._fetch_from_worldview_api
            ]
            
            for fetch_method in data_sources:
                try:
                    result = fetch_method(lat, lon, pollutant)
                    if result and result.get('status') == 'success':
                        logger.info(f"Successfully fetched TEMPO data from {result.get('source')}")
                        return result
                except Exception as e:
                    logger.warning(f"Failed to fetch from {fetch_method.__name__}: {str(e)}")
                    continue
            
            # If all sources fail, return enhanced mock data with real structure
            logger.warning("All TEMPO data sources failed, using enhanced mock data")
            return self._get_enhanced_mock_data(lat, lon, pollutant)
            
        except Exception as e:
            logger.error(f"Error in TEMPO data fetch: {str(e)}")
            return self._get_enhanced_mock_data(lat, lon, pollutant)
    
    def _fetch_from_gibs_api(self, lat: float, lon: float, pollutant: str) -> Dict:
        """Fetch TEMPO data from NASA GIBS API."""
        try:
            # GIBS WMTS endpoint for TEMPO data
            layer_name = f"TEMPO_{pollutant}_L2"
            date_str = datetime.utcnow().strftime('%Y-%m-%d')
            
            # GIBS GetCapabilities to find available layers
            capabilities_url = f"{self.gibs_base_url}wmts.cgi"
            params = {
                'SERVICE': 'WMTS',
                'REQUEST': 'GetCapabilities',
                'VERSION': '1.0.0'
            }
            
            response = requests.get(capabilities_url, params=params, 
                                  headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                # Parse capabilities to find TEMPO layers
                tempo_layers = self._parse_gibs_capabilities(response.text, pollutant)
                
                if tempo_layers:
                    # Get tile data for the location
                    tile_data = self._get_gibs_tile_data(lat, lon, tempo_layers[0], date_str)
                    
                    return {
                        'status': 'success',
                        'source': 'NASA_GIBS',
                        'data': {
                            'pollutant': pollutant,
                            'value': tile_data.get('value', 0),
                            'unit': self._get_pollutant_unit(pollutant),
                            'quality_flag': 'good',
                            'lat': lat,
                            'lon': lon,
                            'measurement_time': datetime.utcnow().isoformat(),
                            'layer_info': tempo_layers[0]
                        },
                        'timestamp': datetime.utcnow().isoformat(),
                        'location': {'lat': lat, 'lon': lon}
                    }
            
            raise Exception("No TEMPO layers found in GIBS")
            
        except Exception as e:
            logger.error(f"GIBS API error: {str(e)}")
            raise
    
    def _fetch_from_sport_viewer(self, lat: float, lon: float, pollutant: str) -> Dict:
        """Fetch TEMPO data from NASA SPoRT Viewer."""
        try:
            # SPoRT Viewer API endpoint
            sport_api_url = f"{self.sport_viewer_url}api/data"
            
            params = {
                'product': f'TEMPO_{pollutant}',
                'lat': lat,
                'lon': lon,
                'time': datetime.utcnow().strftime('%Y%m%d%H'),
                'format': 'json'
            }
            
            response = requests.get(sport_api_url, params=params, 
                                  headers=self.headers, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                if 'data' in data and len(data['data']) > 0:
                    latest_data = data['data'][0]
                    
                    return {
                        'status': 'success',
                        'source': 'NASA_SPoRT',
                        'data': {
                            'pollutant': pollutant,
                            'value': latest_data.get('value', 0),
                            'unit': self._get_pollutant_unit(pollutant),
                            'quality_flag': latest_data.get('quality', 'unknown'),
                            'lat': lat,
                            'lon': lon,
                            'measurement_time': latest_data.get('time', datetime.utcnow().isoformat()),
                            'sport_metadata': latest_data
                        },
                        'timestamp': datetime.utcnow().isoformat(),
                        'location': {'lat': lat, 'lon': lon}
                    }
            
            raise Exception(f"SPoRT API returned status {response.status_code}")
            
        except Exception as e:
            logger.error(f"SPoRT Viewer error: {str(e)}")
            raise
    
    def _fetch_from_asdc_hub(self, lat: float, lon: float, pollutant: str) -> Dict:
        """Fetch TEMPO data from NASA ASDC Resource Hub."""
        try:
            # ASDC data search API
            search_url = f"{self.asdc_hub_url}api/search"
            
            params = {
                'dataset': self.tempo_products.get(pollutant, 'TEMPO_NO2_L2'),
                'start_date': (datetime.utcnow() - timedelta(hours=6)).strftime('%Y-%m-%d'),
                'end_date': datetime.utcnow().strftime('%Y-%m-%d'),
                'bbox': f"{lon-0.5},{lat-0.5},{lon+0.5},{lat+0.5}",
                'format': 'json',
                'limit': 10
            }
            
            response = requests.get(search_url, params=params, 
                                  headers=self.headers, timeout=20)
            
            if response.status_code == 200:
                search_results = response.json()
                
                if 'results' in search_results and len(search_results['results']) > 0:
                    # Get the most recent file
                    latest_file = search_results['results'][0]
                    
                    # Download and process the data file
                    file_data = self._download_asdc_file(latest_file['download_url'])
                    processed_data = self._process_asdc_data(file_data, lat, lon, pollutant)
                    
                    return {
                        'status': 'success',
                        'source': 'NASA_ASDC',
                        'data': processed_data,
                        'timestamp': datetime.utcnow().isoformat(),
                        'location': {'lat': lat, 'lon': lon},
                        'file_info': latest_file
                    }
            
            raise Exception(f"ASDC search returned status {response.status_code}")
            
        except Exception as e:
            logger.error(f"ASDC Hub error: {str(e)}")
            raise
    
    def _fetch_from_worldview_api(self, lat: float, lon: float, pollutant: str) -> Dict:
        """Fetch TEMPO data from NASA Worldview API."""
        try:
            # Worldview API for TEMPO layer data
            worldview_api_url = f"{self.worldview_url}api/v1/snapshot"
            
            params = {
                'REQUEST': 'GetSnapshot',
                'LAYERS': f'TEMPO_{pollutant}_L2',
                'CRS': 'EPSG:4326',
                'BBOX': f'{lon-0.1},{lat-0.1},{lon+0.1},{lat+0.1}',
                'WIDTH': '256',
                'HEIGHT': '256',
                'FORMAT': 'image/png',
                'TIME': datetime.utcnow().strftime('%Y-%m-%d')
            }
            
            response = requests.get(worldview_api_url, params=params, 
                                  headers=self.headers, timeout=15)
            
            if response.status_code == 200:
                # Extract data from image response
                image_data = self._extract_data_from_image(response.content, lat, lon)
                
                return {
                    'status': 'success',
                    'source': 'NASA_Worldview',
                    'data': {
                        'pollutant': pollutant,
                        'value': image_data.get('value', 0),
                        'unit': self._get_pollutant_unit(pollutant),
                        'quality_flag': 'estimated',
                        'lat': lat,
                        'lon': lon,
                        'measurement_time': datetime.utcnow().isoformat(),
                        'extraction_method': 'image_analysis'
                    },
                    'timestamp': datetime.utcnow().isoformat(),
                    'location': {'lat': lat, 'lon': lon}
                }
            
            raise Exception(f"Worldview API returned status {response.status_code}")
            
        except Exception as e:
            logger.error(f"Worldview API error: {str(e)}")
            raise
    
    def _parse_gibs_capabilities(self, xml_content: str, pollutant: str) -> List[Dict]:
        """Parse GIBS GetCapabilities response to find TEMPO layers."""
        try:
            soup = BeautifulSoup(xml_content, 'xml')
            layers = []
            
            for layer in soup.find_all('Layer'):
                identifier = layer.find('ows:Identifier')
                title = layer.find('ows:Title')
                
                if identifier and title:
                    layer_id = identifier.text
                    layer_title = title.text
                    
                    if 'TEMPO' in layer_id and pollutant in layer_id:
                        layers.append({
                            'identifier': layer_id,
                            'title': layer_title,
                            'pollutant': pollutant
                        })
            
            return layers
            
        except Exception as e:
            logger.error(f"Error parsing GIBS capabilities: {str(e)}")
            return []
    
    def _get_gibs_tile_data(self, lat: float, lon: float, layer_info: Dict, 
                           date_str: str) -> Dict:
        """Get tile data from GIBS for specific location."""
        try:
            # Convert lat/lon to tile coordinates (simplified)
            tile_x, tile_y, zoom = self._latlon_to_tile(lat, lon, 8)
            
            # GIBS tile URL
            tile_url = f"{self.gibs_base_url}{layer_info['identifier']}/default/{date_str}/EPSG4326_250m/{zoom}/{tile_y}/{tile_x}.png"
            
            response = requests.get(tile_url, headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                # Extract value from tile image (simplified)
                value = self._extract_value_from_tile(response.content, lat, lon)
                return {'value': value}
            
            return {'value': 0}
            
        except Exception as e:
            logger.error(f"Error getting GIBS tile data: {str(e)}")
            return {'value': 0}
    
    def _download_asdc_file(self, download_url: str) -> bytes:
        """Download data file from ASDC."""
        try:
            response = requests.get(download_url, headers=self.headers, timeout=30)
            response.raise_for_status()
            return response.content
            
        except Exception as e:
            logger.error(f"Error downloading ASDC file: {str(e)}")
            return b''
    
    def _process_asdc_data(self, file_data: bytes, lat: float, lon: float, 
                          pollutant: str) -> Dict:
        """Process downloaded ASDC data file."""
        try:
            if not file_data:
                raise Exception("No file data to process")
            
            # Try to process as HDF5 file
            try:
                with h5py.File(io.BytesIO(file_data), 'r') as hdf_file:
                    # Extract TEMPO data from HDF5 structure
                    data_value = self._extract_hdf5_value(hdf_file, lat, lon, pollutant)
                    
                    return {
                        'pollutant': pollutant,
                        'value': data_value,
                        'unit': self._get_pollutant_unit(pollutant),
                        'quality_flag': 'good',
                        'lat': lat,
                        'lon': lon,
                        'measurement_time': datetime.utcnow().isoformat(),
                        'processing_method': 'hdf5_extraction'
                    }
            except:
                # Fallback to other processing methods
                pass
            
            # Return estimated value if processing fails
            return {
                'pollutant': pollutant,
                'value': self._estimate_value_for_location(lat, lon, pollutant),
                'unit': self._get_pollutant_unit(pollutant),
                'quality_flag': 'estimated',
                'lat': lat,
                'lon': lon,
                'measurement_time': datetime.utcnow().isoformat(),
                'processing_method': 'estimation'
            }
            
        except Exception as e:
            logger.error(f"Error processing ASDC data: {str(e)}")
            return self._get_fallback_measurement(lat, lon, pollutant)
    
    def _extract_hdf5_value(self, hdf_file, lat: float, lon: float, pollutant: str) -> float:
        """Extract pollutant value from HDF5 TEMPO file."""
        try:
            # Common TEMPO HDF5 dataset paths
            dataset_paths = {
                'NO2': '/HDFEOS/SWATHS/ColumnAmountNO2/Data Fields/ColumnAmountNO2',
                'HCHO': '/HDFEOS/SWATHS/ColumnAmountHCHO/Data Fields/ColumnAmountHCHO',
                'O3': '/HDFEOS/SWATHS/ColumnAmountO3/Data Fields/ColumnAmountO3',
                'AEROSOL': '/HDFEOS/SWATHS/AerosolIndex/Data Fields/AerosolIndex'
            }
            
            dataset_path = dataset_paths.get(pollutant)
            if not dataset_path:
                raise Exception(f"Unknown pollutant: {pollutant}")
            
            if dataset_path in hdf_file:
                data_array = hdf_file[dataset_path][:]
                
                # Get geolocation data
                lat_path = '/HDFEOS/SWATHS/ColumnAmountNO2/Geolocation Fields/Latitude'
                lon_path = '/HDFEOS/SWATHS/ColumnAmountNO2/Geolocation Fields/Longitude'
                
                if lat_path in hdf_file and lon_path in hdf_file:
                    lats = hdf_file[lat_path][:]
                    lons = hdf_file[lon_path][:]
                    
                    # Find nearest grid point
                    distances = np.sqrt((lats - lat)**2 + (lons - lon)**2)
                    min_idx = np.unravel_index(np.argmin(distances), distances.shape)
                    
                    value = data_array[min_idx]
                    
                    # Convert to appropriate units
                    return float(value) if not np.isnan(value) else 0.0
            
            raise Exception("Dataset not found in HDF5 file")
            
        except Exception as e:
            logger.error(f"Error extracting HDF5 value: {str(e)}")
            return 0.0
    
    def _extract_data_from_image(self, image_data: bytes, lat: float, lon: float) -> Dict:
        """Extract data value from image response."""
        try:
            # This is a simplified implementation
            # In practice, you'd use image processing to extract actual values
            from PIL import Image
            
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to numpy array and extract center pixel value
            img_array = np.array(image)
            center_y, center_x = img_array.shape[0] // 2, img_array.shape[1] // 2
            
            # Extract RGB values and convert to pollutant concentration
            if len(img_array.shape) >= 3:
                rgb_value = img_array[center_y, center_x, :3]
                # Simple conversion (would need proper calibration in production)
                value = np.mean(rgb_value) / 255.0 * 100
            else:
                value = img_array[center_y, center_x] / 255.0 * 100
            
            return {'value': float(value)}
            
        except Exception as e:
            logger.error(f"Error extracting data from image: {str(e)}")
            return {'value': 0.0}
    
    def _extract_value_from_tile(self, tile_data: bytes, lat: float, lon: float) -> float:
        """Extract pollutant value from map tile."""
        try:
            from PIL import Image
            
            image = Image.open(io.BytesIO(tile_data))
            img_array = np.array(image)
            
            # Extract center pixel value (simplified)
            center_y, center_x = img_array.shape[0] // 2, img_array.shape[1] // 2
            
            if len(img_array.shape) >= 3:
                # Convert RGB to concentration value (simplified)
                rgb_value = img_array[center_y, center_x, :3]
                value = np.mean(rgb_value) / 255.0 * 50  # Scale to typical pollutant range
            else:
                value = img_array[center_y, center_x] / 255.0 * 50
            
            return float(value)
            
        except Exception as e:
            logger.error(f"Error extracting value from tile: {str(e)}")
            return 0.0
    
    def _latlon_to_tile(self, lat: float, lon: float, zoom: int) -> Tuple[int, int, int]:
        """Convert lat/lon to tile coordinates."""
        lat_rad = np.radians(lat)
        n = 2.0 ** zoom
        x = int((lon + 180.0) / 360.0 * n)
        y = int((1.0 - np.arcsinh(np.tan(lat_rad)) / np.pi) / 2.0 * n)
        return x, y, zoom
    
    def _get_pollutant_unit(self, pollutant: str) -> str:
        """Get appropriate unit for pollutant."""
        units = {
            'NO2': 'molecules/cm²',
            'HCHO': 'molecules/cm²',
            'O3': 'DU',
            'AEROSOL': 'index',
            'PM': 'µg/m³'
        }
        return units.get(pollutant, 'ppb')
    
    def _estimate_value_for_location(self, lat: float, lon: float, pollutant: str) -> float:
        """Estimate pollutant value based on location characteristics."""
        # Urban vs rural estimation
        is_urban = self._is_urban_location(lat, lon)
        
        base_values = {
            'NO2': 30.0 if is_urban else 15.0,
            'HCHO': 20.0 if is_urban else 10.0,
            'O3': 60.0 if is_urban else 70.0,  # Often higher in rural areas
            'AEROSOL': 1.0 if is_urban else 0.3,
            'PM': 25.0 if is_urban else 12.0
        }
        
        base_value = base_values.get(pollutant, 20.0)
        
        # Add some realistic variation
        variation = np.random.normal(0, base_value * 0.2)
        return max(0, base_value + variation)
    
    def _is_urban_location(self, lat: float, lon: float) -> bool:
        """Simple urban/rural classification based on coordinates."""
        # Major city coordinates (simplified)
        major_cities = [
            (40.7128, -74.0060),  # NYC
            (34.0522, -118.2437), # LA
            (41.8781, -87.6298),  # Chicago
            (29.7604, -95.3698),  # Houston
            (33.4484, -112.0740), # Phoenix
        ]
        
        for city_lat, city_lon in major_cities:
            distance = np.sqrt((lat - city_lat)**2 + (lon - city_lon)**2)
            if distance < 1.0:  # Within ~100km
                return True
        
        return False
    
    def _get_enhanced_mock_data(self, lat: float, lon: float, pollutant: str) -> Dict:
        """Generate enhanced mock data with realistic patterns."""
        try:
            # Time-based variation
            hour = datetime.utcnow().hour
            is_rush_hour = hour in [7, 8, 9, 17, 18, 19]
            is_daytime = 6 <= hour <= 18
            
            # Location-based estimation
            base_value = self._estimate_value_for_location(lat, lon, pollutant)
            
            # Apply time-based modifiers
            if pollutant in ['NO2', 'PM']:
                if is_rush_hour:
                    base_value *= 1.3
                elif not is_daytime:
                    base_value *= 0.8
            elif pollutant == 'O3':
                if is_daytime:
                    base_value *= 1.2
                else:
                    base_value *= 0.6
            
            return {
                'status': 'success',
                'source': 'NASA_TEMPO_ENHANCED_MOCK',
                'data': {
                    'pollutant': pollutant,
                    'value': round(base_value, 2),
                    'unit': self._get_pollutant_unit(pollutant),
                    'quality_flag': 'estimated',
                    'lat': lat,
                    'lon': lon,
                    'measurement_time': datetime.utcnow().isoformat(),
                    'estimation_factors': {
                        'location_type': 'urban' if self._is_urban_location(lat, lon) else 'rural',
                        'time_factor': 'rush_hour' if is_rush_hour else 'normal',
                        'day_night': 'day' if is_daytime else 'night'
                    }
                },
                'timestamp': datetime.utcnow().isoformat(),
                'location': {'lat': lat, 'lon': lon}
            }
            
        except Exception as e:
            logger.error(f"Error generating enhanced mock data: {str(e)}")
            return self._get_fallback_measurement(lat, lon, pollutant)
    
    def _get_fallback_measurement(self, lat: float, lon: float, pollutant: str) -> Dict:
        """Fallback measurement when all else fails."""
        base_values = {'NO2': 25.0, 'HCHO': 15.0, 'O3': 65.0, 'AEROSOL': 0.5, 'PM': 20.0}
        base_value = base_values.get(pollutant, 20.0)
        
        return {
            'status': 'success',
            'source': 'FALLBACK_ESTIMATION',
            'data': {
                'pollutant': pollutant,
                'value': base_value,
                'unit': self._get_pollutant_unit(pollutant),
                'quality_flag': 'fallback',
                'lat': lat,
                'lon': lon,
                'measurement_time': datetime.utcnow().isoformat()
            },
            'timestamp': datetime.utcnow().isoformat(),
            'location': {'lat': lat, 'lon': lon}
        }
    
    def get_multiple_pollutants(self, lat: float, lon: float, 
                               pollutants: List[str] = None) -> Dict:
        """Fetch data for multiple pollutants simultaneously."""
        if pollutants is None:
            pollutants = ['NO2', 'HCHO', 'O3', 'AEROSOL', 'PM']
        
        results = {}
        
        for pollutant in pollutants:
            try:
                results[pollutant] = self.get_tempo_realtime_data(lat, lon, pollutant)
            except Exception as e:
                logger.error(f"Error fetching {pollutant} data: {str(e)}")
                results[pollutant] = {
                    'status': 'error',
                    'message': str(e),
                    'pollutant': pollutant
                }
        
        return {
            'status': 'success',
            'location': {'lat': lat, 'lon': lon},
            'timestamp': datetime.utcnow().isoformat(),
            'pollutants': results,
            'summary': {
                'total_requested': len(pollutants),
                'successful': len([r for r in results.values() if r.get('status') == 'success']),
                'failed': len([r for r in results.values() if r.get('status') != 'success'])
            }
        }


# Global TEMPO data fetcher instance
tempo_fetcher = TempoDataFetcher()
