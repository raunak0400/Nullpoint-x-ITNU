import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from flask import current_app
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class WeatherService:
    """Service for fetching weather data for air quality modeling."""
    
    def __init__(self):
        self.base_url = "https://api.openweathermap.org/data/2.5"  # OpenWeatherMap API
        self.onecall_url = "https://api.openweathermap.org/data/3.0/onecall"
        self.timeout = 30
        self.session = requests.Session()
    
    def _get_api_key(self) -> str:
        """Get Weather API key from configuration."""
        api_key = current_app.config.get('WEATHER_API_KEY')
        if not api_key:
            raise ValueError("WEATHER_API_KEY not configured")
        return api_key
    
    def _make_request(self, url: str, params: Dict = None) -> Dict[str, Any]:
        """Make HTTP request to Weather API with error handling."""
        try:
            params = params or {}
            params['appid'] = self._get_api_key()
            params['units'] = 'metric'  # Use metric units
            
            logger.info(f"Making request to Weather API: {url}")
            
            response = self.session.get(
                url,
                params=params,
                timeout=self.timeout
            )
            
            response.raise_for_status()
            data = response.json()
            
            logger.info(f"Successfully fetched weather data from: {url}")
            return data
            
        except requests.exceptions.Timeout:
            logger.error("Weather API request timed out")
            raise Exception("Weather API request timed out")
        except requests.exceptions.HTTPError as e:
            logger.error(f"Weather API HTTP error: {e.response.status_code} - {e.response.text}")
            raise Exception(f"Weather API error: {e.response.status_code}")
        except requests.exceptions.RequestException as e:
            logger.error(f"Weather API request failed: {str(e)}")
            raise Exception(f"Weather API request failed: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error in Weather API request: {str(e)}")
            raise Exception(f"Failed to fetch weather data: {str(e)}")
    
    def get_current_weather(self, lat: float, lon: float) -> Dict[str, Any]:
        """
        Get current weather conditions.
        
        Args:
            lat: Latitude coordinate
            lon: Longitude coordinate
            
        Returns:
            Dict containing current weather data
        """
        try:
            params = {
                'lat': lat,
                'lon': lon
            }
            
            url = f"{self.base_url}/weather"
            data = self._make_request(url, params)
            processed_data = self._process_current_weather(data)
            
            return {
                'status': 'success',
                'timestamp': datetime.utcnow().isoformat(),
                'source': 'OpenWeatherMap',
                'coordinates': {'lat': lat, 'lon': lon},
                'data': processed_data,
                'metadata': {
                    'data_type': 'current_weather',
                    'units': 'metric'
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get current weather: {str(e)}")
            return {
                'status': 'error',
                'message': str(e),
                'timestamp': datetime.utcnow().isoformat(),
                'source': 'OpenWeatherMap'
            }
    
    def get_weather_forecast(self, lat: float, lon: float, days: int = 7) -> Dict[str, Any]:
        """
        Get weather forecast for air quality modeling.
        
        Args:
            lat: Latitude coordinate
            lon: Longitude coordinate
            days: Number of forecast days (max 8)
            
        Returns:
            Dict containing weather forecast data
        """
        try:
            params = {
                'lat': lat,
                'lon': lon,
                'exclude': 'minutely,alerts'  # Exclude unnecessary data
            }
            
            data = self._make_request(self.onecall_url, params)
            processed_data = self._process_forecast_data(data, days)
            
            return {
                'status': 'success',
                'timestamp': datetime.utcnow().isoformat(),
                'source': 'OpenWeatherMap',
                'coordinates': {'lat': lat, 'lon': lon},
                'forecast_days': days,
                'data': processed_data,
                'metadata': {
                    'data_type': 'weather_forecast',
                    'units': 'metric',
                    'timezone': data.get('timezone', 'UTC')
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get weather forecast: {str(e)}")
            return {
                'status': 'error',
                'message': str(e),
                'timestamp': datetime.utcnow().isoformat(),
                'source': 'OpenWeatherMap'
            }
    
    def get_historical_weather(self, lat: float, lon: float, start_date: str, end_date: str) -> Dict[str, Any]:
        """
        Get historical weather data.
        
        Args:
            lat: Latitude coordinate
            lon: Longitude coordinate
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            
        Returns:
            Dict containing historical weather data
        """
        try:
            # Convert dates to timestamps
            start_dt = datetime.strptime(start_date, '%Y-%m-%d')
            end_dt = datetime.strptime(end_date, '%Y-%m-%d')
            
            # OpenWeatherMap historical API requires timestamp
            start_timestamp = int(start_dt.timestamp())
            end_timestamp = int(end_dt.timestamp())
            
            params = {
                'lat': lat,
                'lon': lon,
                'dt': start_timestamp,
                'type': 'hour'
            }
            
            url = f"{self.onecall_url}/timemachine"
            
            # For simplicity, get data for start date only
            # In production, you'd loop through the date range
            data = self._make_request(url, params)
            processed_data = self._process_historical_data(data)
            
            return {
                'status': 'success',
                'timestamp': datetime.utcnow().isoformat(),
                'source': 'OpenWeatherMap',
                'coordinates': {'lat': lat, 'lon': lon},
                'date_range': {'start': start_date, 'end': end_date},
                'data': processed_data,
                'metadata': {
                    'data_type': 'historical_weather',
                    'units': 'metric'
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get historical weather: {str(e)}")
            return {
                'status': 'error',
                'message': str(e),
                'timestamp': datetime.utcnow().isoformat(),
                'source': 'OpenWeatherMap'
            }
    
    def _process_current_weather(self, raw_data: Dict) -> Dict:
        """Process current weather data into standardized format."""
        try:
            main = raw_data.get('main', {})
            wind = raw_data.get('wind', {})
            weather = raw_data.get('weather', [{}])[0]
            
            return {
                'timestamp': datetime.fromtimestamp(raw_data.get('dt', 0)).isoformat(),
                'location': {
                    'name': raw_data.get('name', ''),
                    'country': raw_data.get('sys', {}).get('country', ''),
                    'latitude': raw_data.get('coord', {}).get('lat', 0.0),
                    'longitude': raw_data.get('coord', {}).get('lon', 0.0)
                },
                'temperature': {
                    'current': main.get('temp', 0.0),
                    'feels_like': main.get('feels_like', 0.0),
                    'min': main.get('temp_min', 0.0),
                    'max': main.get('temp_max', 0.0)
                },
                'humidity': main.get('humidity', 0),
                'pressure': main.get('pressure', 0),
                'visibility': raw_data.get('visibility', 0) / 1000,  # Convert to km
                'wind': {
                    'speed': wind.get('speed', 0.0),
                    'direction': wind.get('deg', 0),
                    'gust': wind.get('gust', 0.0)
                },
                'weather': {
                    'main': weather.get('main', ''),
                    'description': weather.get('description', ''),
                    'icon': weather.get('icon', '')
                },
                'clouds': raw_data.get('clouds', {}).get('all', 0),
                'uv_index': raw_data.get('uvi', 0.0)
            }
            
        except Exception as e:
            logger.error(f"Error processing current weather data: {str(e)}")
            return {}
    
    def _process_forecast_data(self, raw_data: Dict, days: int) -> Dict:
        """Process forecast data into standardized format."""
        try:
            current = raw_data.get('current', {})
            hourly = raw_data.get('hourly', [])[:24 * days]  # Limit to requested days
            daily = raw_data.get('daily', [])[:days]
            
            return {
                'current': self._process_current_weather_onecall(current),
                'hourly': [self._process_hourly_weather(hour) for hour in hourly],
                'daily': [self._process_daily_weather(day) for day in daily],
                'timezone': raw_data.get('timezone', 'UTC'),
                'timezone_offset': raw_data.get('timezone_offset', 0)
            }
            
        except Exception as e:
            logger.error(f"Error processing forecast data: {str(e)}")
            return {}
    
    def _process_current_weather_onecall(self, current_data: Dict) -> Dict:
        """Process current weather from OneCall API."""
        try:
            wind = current_data.get('wind', {})
            weather = current_data.get('weather', [{}])[0]
            
            return {
                'timestamp': datetime.fromtimestamp(current_data.get('dt', 0)).isoformat(),
                'temperature': current_data.get('temp', 0.0),
                'feels_like': current_data.get('feels_like', 0.0),
                'humidity': current_data.get('humidity', 0),
                'pressure': current_data.get('pressure', 0),
                'visibility': current_data.get('visibility', 0) / 1000,
                'uv_index': current_data.get('uvi', 0.0),
                'wind': {
                    'speed': current_data.get('wind_speed', 0.0),
                    'direction': current_data.get('wind_deg', 0),
                    'gust': current_data.get('wind_gust', 0.0)
                },
                'weather': {
                    'main': weather.get('main', ''),
                    'description': weather.get('description', '')
                },
                'clouds': current_data.get('clouds', 0)
            }
            
        except Exception as e:
            logger.error(f"Error processing current weather (OneCall): {str(e)}")
            return {}
    
    def _process_hourly_weather(self, hour_data: Dict) -> Dict:
        """Process hourly weather data."""
        try:
            weather = hour_data.get('weather', [{}])[0]
            
            return {
                'timestamp': datetime.fromtimestamp(hour_data.get('dt', 0)).isoformat(),
                'temperature': hour_data.get('temp', 0.0),
                'feels_like': hour_data.get('feels_like', 0.0),
                'humidity': hour_data.get('humidity', 0),
                'pressure': hour_data.get('pressure', 0),
                'wind_speed': hour_data.get('wind_speed', 0.0),
                'wind_direction': hour_data.get('wind_deg', 0),
                'weather_main': weather.get('main', ''),
                'clouds': hour_data.get('clouds', 0),
                'pop': hour_data.get('pop', 0.0),  # Probability of precipitation
                'rain': hour_data.get('rain', {}).get('1h', 0.0),
                'uv_index': hour_data.get('uvi', 0.0)
            }
            
        except Exception as e:
            logger.error(f"Error processing hourly weather: {str(e)}")
            return {}
    
    def _process_daily_weather(self, day_data: Dict) -> Dict:
        """Process daily weather data."""
        try:
            temp = day_data.get('temp', {})
            weather = day_data.get('weather', [{}])[0]
            
            return {
                'date': datetime.fromtimestamp(day_data.get('dt', 0)).strftime('%Y-%m-%d'),
                'temperature': {
                    'min': temp.get('min', 0.0),
                    'max': temp.get('max', 0.0),
                    'day': temp.get('day', 0.0),
                    'night': temp.get('night', 0.0)
                },
                'humidity': day_data.get('humidity', 0),
                'pressure': day_data.get('pressure', 0),
                'wind_speed': day_data.get('wind_speed', 0.0),
                'wind_direction': day_data.get('wind_deg', 0),
                'weather_main': weather.get('main', ''),
                'weather_description': weather.get('description', ''),
                'clouds': day_data.get('clouds', 0),
                'pop': day_data.get('pop', 0.0),
                'rain': day_data.get('rain', 0.0),
                'uv_index': day_data.get('uvi', 0.0)
            }
            
        except Exception as e:
            logger.error(f"Error processing daily weather: {str(e)}")
            return {}
    
    def _process_historical_data(self, raw_data: Dict) -> List[Dict]:
        """Process historical weather data."""
        try:
            hourly = raw_data.get('hourly', [])
            return [self._process_hourly_weather(hour) for hour in hourly]
            
        except Exception as e:
            logger.error(f"Error processing historical weather: {str(e)}")
            return []


# Global service instance
weather_service = WeatherService()
