import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from flask import current_app
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class TempoService:
    """Service for fetching TEMPO satellite air quality data."""
    
    def __init__(self):
        self.base_url = "https://api.tempo.nasa.gov/v1"  # Mock URL
        self.timeout = 30
        self.session = requests.Session()
    
    def _get_api_key(self) -> str:
        """Get TEMPO API key from configuration."""
        api_key = current_app.config.get('TEMPO_API_KEY')
        if not api_key:
            raise ValueError("TEMPO_API_KEY not configured")
        return api_key
    
    def _make_request(self, endpoint: str, params: Dict = None) -> Dict[str, Any]:
        """Make HTTP request to TEMPO API with error handling."""
        try:
            headers = {
                'Authorization': f'Bearer {self._get_api_key()}',
                'Content-Type': 'application/json',
                'User-Agent': 'AirQuality-Forecast-App/1.0'
            }
            
            url = f"{self.base_url}/{endpoint.lstrip('/')}"
            logger.info(f"Making request to TEMPO API: {url}")
            
            response = self.session.get(
                url,
                headers=headers,
                params=params or {},
                timeout=self.timeout
            )
            
            response.raise_for_status()
            data = response.json()
            
            logger.info(f"Successfully fetched data from TEMPO API: {len(data.get('data', []))} records")
            return data
            
        except requests.exceptions.Timeout:
            logger.error("TEMPO API request timed out")
            raise Exception("TEMPO API request timed out")
        except requests.exceptions.HTTPError as e:
            logger.error(f"TEMPO API HTTP error: {e.response.status_code} - {e.response.text}")
            raise Exception(f"TEMPO API error: {e.response.status_code}")
        except requests.exceptions.RequestException as e:
            logger.error(f"TEMPO API request failed: {str(e)}")
            raise Exception(f"TEMPO API request failed: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error in TEMPO API request: {str(e)}")
            raise Exception(f"Failed to fetch TEMPO data: {str(e)}")
    
    def get_latest_data(self, lat: float = None, lon: float = None) -> Dict[str, Any]:
        """
        Get latest TEMPO satellite data for air quality.
        
        Args:
            lat: Latitude coordinate
            lon: Longitude coordinate
            
        Returns:
            Dict containing latest TEMPO data
        """
        try:
            params = {
                'product': 'NO2,O3,HCHO,SO2',
                'quality': 'high',
                'limit': 100
            }
            
            if lat is not None and lon is not None:
                params.update({
                    'lat': lat,
                    'lon': lon,
                    'radius': 50  # km
                })
            
            data = self._make_request('data/latest', params)
            
            # Process and format the data
            processed_data = self._process_tempo_data(data)
            
            return {
                'status': 'success',
                'timestamp': datetime.utcnow().isoformat(),
                'source': 'TEMPO',
                'data': processed_data,
                'metadata': {
                    'total_records': len(processed_data),
                    'coordinates': {'lat': lat, 'lon': lon} if lat and lon else None,
                    'products': ['NO2', 'O3', 'HCHO', 'SO2']
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get latest TEMPO data: {str(e)}")
            return {
                'status': 'error',
                'message': str(e),
                'timestamp': datetime.utcnow().isoformat(),
                'source': 'TEMPO'
            }
    
    def get_historical_data(self, start_date: str, end_date: str, 
                          lat: float = None, lon: float = None) -> Dict[str, Any]:
        """
        Get historical TEMPO data for a date range.
        
        Args:
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            lat: Latitude coordinate
            lon: Longitude coordinate
            
        Returns:
            Dict containing historical TEMPO data
        """
        try:
            params = {
                'start_date': start_date,
                'end_date': end_date,
                'product': 'NO2,O3,HCHO,SO2',
                'quality': 'high'
            }
            
            if lat is not None and lon is not None:
                params.update({
                    'lat': lat,
                    'lon': lon,
                    'radius': 50
                })
            
            data = self._make_request('data/historical', params)
            processed_data = self._process_tempo_data(data)
            
            return {
                'status': 'success',
                'timestamp': datetime.utcnow().isoformat(),
                'source': 'TEMPO',
                'date_range': {'start': start_date, 'end': end_date},
                'data': processed_data,
                'metadata': {
                    'total_records': len(processed_data),
                    'coordinates': {'lat': lat, 'lon': lon} if lat and lon else None
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get historical TEMPO data: {str(e)}")
            return {
                'status': 'error',
                'message': str(e),
                'timestamp': datetime.utcnow().isoformat(),
                'source': 'TEMPO'
            }
    
    def _process_tempo_data(self, raw_data: Dict) -> List[Dict]:
        """Process raw TEMPO API response into standardized format."""
        try:
            # Mock processing - in real implementation, parse actual TEMPO data format
            processed = []
            
            for record in raw_data.get('data', []):
                processed_record = {
                    'timestamp': record.get('timestamp', datetime.utcnow().isoformat()),
                    'latitude': record.get('lat', 0.0),
                    'longitude': record.get('lon', 0.0),
                    'pollutants': {
                        'NO2': {
                            'value': record.get('no2_column', 0.0),
                            'unit': 'molecules/cm²',
                            'quality_flag': record.get('no2_quality', 'good')
                        },
                        'O3': {
                            'value': record.get('o3_column', 0.0),
                            'unit': 'DU',
                            'quality_flag': record.get('o3_quality', 'good')
                        },
                        'HCHO': {
                            'value': record.get('hcho_column', 0.0),
                            'unit': 'molecules/cm²',
                            'quality_flag': record.get('hcho_quality', 'good')
                        },
                        'SO2': {
                            'value': record.get('so2_column', 0.0),
                            'unit': 'DU',
                            'quality_flag': record.get('so2_quality', 'good')
                        }
                    },
                    'cloud_fraction': record.get('cloud_fraction', 0.0),
                    'solar_zenith_angle': record.get('sza', 0.0)
                }
                processed.append(processed_record)
            
            return processed
            
        except Exception as e:
            logger.error(f"Error processing TEMPO data: {str(e)}")
            return []
    
    def get_data_availability(self) -> Dict[str, Any]:
        """Get information about TEMPO data availability."""
        try:
            data = self._make_request('status/availability')
            
            return {
                'status': 'success',
                'timestamp': datetime.utcnow().isoformat(),
                'source': 'TEMPO',
                'availability': data.get('availability', {}),
                'last_update': data.get('last_update'),
                'next_update': data.get('next_update')
            }
            
        except Exception as e:
            logger.error(f"Failed to get TEMPO availability: {str(e)}")
            return {
                'status': 'error',
                'message': str(e),
                'timestamp': datetime.utcnow().isoformat(),
                'source': 'TEMPO'
            }


# Global service instance
tempo_service = TempoService()
