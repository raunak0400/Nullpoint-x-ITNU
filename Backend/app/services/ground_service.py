import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from flask import current_app
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class GroundService:
    """Service for fetching ground station air quality data."""
    
    def __init__(self):
        self.base_url = "https://api.airnow.gov/aq"  # Mock URL - similar to AirNow API
        self.timeout = 30
        self.session = requests.Session()
    
    def _get_api_key(self) -> str:
        """Get Ground Station API key from configuration."""
        api_key = current_app.config.get('GROUND_STATION_API_KEY')
        if not api_key:
            raise ValueError("GROUND_STATION_API_KEY not configured")
        return api_key
    
    def _make_request(self, endpoint: str, params: Dict = None) -> Dict[str, Any]:
        """Make HTTP request to Ground Station API with error handling."""
        try:
            params = params or {}
            params['API_KEY'] = self._get_api_key()
            params['format'] = 'application/json'
            
            url = f"{self.base_url}/{endpoint.lstrip('/')}"
            logger.info(f"Making request to Ground Station API: {url}")
            
            response = self.session.get(
                url,
                params=params,
                timeout=self.timeout
            )
            
            response.raise_for_status()
            data = response.json()
            
            logger.info(f"Successfully fetched ground station data: {len(data) if isinstance(data, list) else 1} records")
            return data
            
        except requests.exceptions.Timeout:
            logger.error("Ground Station API request timed out")
            raise Exception("Ground Station API request timed out")
        except requests.exceptions.HTTPError as e:
            logger.error(f"Ground Station API HTTP error: {e.response.status_code} - {e.response.text}")
            raise Exception(f"Ground Station API error: {e.response.status_code}")
        except requests.exceptions.RequestException as e:
            logger.error(f"Ground Station API request failed: {str(e)}")
            raise Exception(f"Ground Station API request failed: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error in Ground Station API request: {str(e)}")
            raise Exception(f"Failed to fetch ground station data: {str(e)}")
    
    def get_current_observations(self, lat: float, lon: float, distance: int = 25) -> Dict[str, Any]:
        """
        Get current air quality observations from nearby ground stations.
        
        Args:
            lat: Latitude coordinate
            lon: Longitude coordinate
            distance: Search radius in miles
            
        Returns:
            Dict containing current observations
        """
        try:
            params = {
                'latitude': lat,
                'longitude': lon,
                'distance': distance,
                'verbose': 1
            }
            
            data = self._make_request('observation/latLong/current', params)
            processed_data = self._process_observation_data(data)
            
            return {
                'status': 'success',
                'timestamp': datetime.utcnow().isoformat(),
                'source': 'GroundStations',
                'coordinates': {'lat': lat, 'lon': lon},
                'search_radius_miles': distance,
                'data': processed_data,
                'metadata': {
                    'total_stations': len(processed_data),
                    'observation_time': datetime.utcnow().isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get current observations: {str(e)}")
            return {
                'status': 'error',
                'message': str(e),
                'timestamp': datetime.utcnow().isoformat(),
                'source': 'GroundStations'
            }
    
    def get_historical_observations(self, lat: float, lon: float, 
                                  start_date: str, end_date: str, distance: int = 25) -> Dict[str, Any]:
        """
        Get historical air quality observations from ground stations.
        
        Args:
            lat: Latitude coordinate
            lon: Longitude coordinate
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            distance: Search radius in miles
            
        Returns:
            Dict containing historical observations
        """
        try:
            params = {
                'latitude': lat,
                'longitude': lon,
                'startDate': start_date,
                'endDate': end_date,
                'distance': distance,
                'verbose': 1,
                'monitorType': 0  # 0 = permanent, 1 = mobile
            }
            
            data = self._make_request('observation/latLong/historical', params)
            processed_data = self._process_observation_data(data)
            
            return {
                'status': 'success',
                'timestamp': datetime.utcnow().isoformat(),
                'source': 'GroundStations',
                'coordinates': {'lat': lat, 'lon': lon},
                'date_range': {'start': start_date, 'end': end_date},
                'data': processed_data,
                'metadata': {
                    'total_observations': len(processed_data),
                    'search_radius_miles': distance
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get historical observations: {str(e)}")
            return {
                'status': 'error',
                'message': str(e),
                'timestamp': datetime.utcnow().isoformat(),
                'source': 'GroundStations'
            }
    
    def get_stations_list(self, lat: float = None, lon: float = None, 
                         distance: int = 50) -> Dict[str, Any]:
        """
        Get list of available monitoring stations.
        
        Args:
            lat: Latitude coordinate (optional)
            lon: Longitude coordinate (optional)
            distance: Search radius in miles
            
        Returns:
            Dict containing stations information
        """
        try:
            params = {}
            
            if lat is not None and lon is not None:
                params.update({
                    'latitude': lat,
                    'longitude': lon,
                    'distance': distance
                })
            
            data = self._make_request('monitoring/stations', params)
            processed_stations = self._process_stations_data(data)
            
            return {
                'status': 'success',
                'timestamp': datetime.utcnow().isoformat(),
                'source': 'GroundStations',
                'coordinates': {'lat': lat, 'lon': lon} if lat and lon else None,
                'stations': processed_stations,
                'metadata': {
                    'total_stations': len(processed_stations),
                    'search_radius_miles': distance if lat and lon else None
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get stations list: {str(e)}")
            return {
                'status': 'error',
                'message': str(e),
                'timestamp': datetime.utcnow().isoformat(),
                'source': 'GroundStations'
            }
    
    def _process_observation_data(self, raw_data: Any) -> List[Dict]:
        """Process raw observation data into standardized format."""
        try:
            if not isinstance(raw_data, list):
                raw_data = [raw_data] if raw_data else []
            
            processed = []
            
            for record in raw_data:
                processed_record = {
                    'station_id': record.get('SiteCode', ''),
                    'station_name': record.get('SiteName', ''),
                    'latitude': float(record.get('Latitude', 0.0)),
                    'longitude': float(record.get('Longitude', 0.0)),
                    'date_observed': record.get('DateObserved', ''),
                    'hour_observed': record.get('HourObserved', 0),
                    'local_time_zone': record.get('LocalTimeZone', ''),
                    'pollutant': record.get('ParameterName', ''),
                    'aqi': int(record.get('AQI', 0)),
                    'aqi_category': record.get('Category', {}).get('Name', ''),
                    'concentration': float(record.get('Value', 0.0)),
                    'unit': record.get('Unit', ''),
                    'raw_concentration': float(record.get('RawConcentration', 0.0)),
                    'agency': record.get('AgencyName', ''),
                    'full_aqs_code': record.get('FullAQSCode', '')
                }
                processed.append(processed_record)
            
            return processed
            
        except Exception as e:
            logger.error(f"Error processing observation data: {str(e)}")
            return []
    
    def _process_stations_data(self, raw_data: Any) -> List[Dict]:
        """Process raw stations data into standardized format."""
        try:
            if not isinstance(raw_data, list):
                raw_data = [raw_data] if raw_data else []
            
            processed = []
            
            for station in raw_data:
                processed_station = {
                    'station_id': station.get('SiteCode', ''),
                    'station_name': station.get('SiteName', ''),
                    'latitude': float(station.get('Latitude', 0.0)),
                    'longitude': float(station.get('Longitude', 0.0)),
                    'agency': station.get('AgencyName', ''),
                    'full_aqs_code': station.get('FullAQSCode', ''),
                    'status': station.get('Status', 'Active'),
                    'pollutants_measured': station.get('Parameters', []),
                    'established_date': station.get('EstablishedDate', ''),
                    'last_updated': station.get('LastUpdated', '')
                }
                processed.append(processed_station)
            
            return processed
            
        except Exception as e:
            logger.error(f"Error processing stations data: {str(e)}")
            return []
    
    def get_aqi_forecast(self, lat: float, lon: float, date: str = None) -> Dict[str, Any]:
        """
        Get AQI forecast from ground station network.
        
        Args:
            lat: Latitude coordinate
            lon: Longitude coordinate
            date: Forecast date in YYYY-MM-DD format (optional, defaults to today)
            
        Returns:
            Dict containing AQI forecast
        """
        try:
            if not date:
                date = datetime.utcnow().strftime('%Y-%m-%d')
            
            params = {
                'latitude': lat,
                'longitude': lon,
                'date': date,
                'distance': 25
            }
            
            data = self._make_request('forecast/latLong', params)
            
            return {
                'status': 'success',
                'timestamp': datetime.utcnow().isoformat(),
                'source': 'GroundStations',
                'forecast_date': date,
                'coordinates': {'lat': lat, 'lon': lon},
                'forecast': data,
                'metadata': {
                    'forecast_type': 'AQI',
                    'data_source': 'ground_stations'
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get AQI forecast: {str(e)}")
            return {
                'status': 'error',
                'message': str(e),
                'timestamp': datetime.utcnow().isoformat(),
                'source': 'GroundStations'
            }


# Global service instance
ground_service = GroundService()
