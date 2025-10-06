import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
import asyncio

from app.services.tempo_service import tempo_service
from app.services.ground_service import ground_service
from app.services.weather_service import weather_service
from app.models.aqi_record import AQIRecord
from app.database.mongo import get_db
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class MergeService:
    """Service for merging and normalizing data from multiple sources."""
    
    def __init__(self):
        self.pollutant_mapping = {
            # Standardize pollutant names across sources
            'pm2.5': 'PM2.5',
            'pm25': 'PM2.5',
            'pm_2_5': 'PM2.5',
            'pm10': 'PM10',
            'pm_10': 'PM10',
            'no2': 'NO2',
            'nitrogen_dioxide': 'NO2',
            'o3': 'O3',
            'ozone': 'O3',
            'so2': 'SO2',
            'sulfur_dioxide': 'SO2',
            'co': 'CO',
            'carbon_monoxide': 'CO'
        }
        
        self.unit_conversions = {
            # Convert all units to µg/m³ where applicable
            'ppm': {'CO': 1150},  # CO: ppm to µg/m³
            'ppb': {'NO2': 1.88, 'O3': 1.96, 'SO2': 2.62},  # ppb to µg/m³
        }
    
    def fetch_and_merge_data(self, lat: float, lon: float, 
                           sources: List[str] = None) -> Dict:
        """
        Fetch data from multiple sources and merge into standardized format.
        
        Args:
            lat: Latitude
            lon: Longitude
            sources: List of sources to fetch from ['tempo', 'ground', 'weather']
                    If None, fetches from all available sources
        
        Returns:
            Dict containing merged and normalized data
        """
        try:
            if sources is None:
                sources = ['tempo', 'ground', 'weather']
            
            logger.info(f"Fetching data from sources: {sources} for location ({lat}, {lon})")
            
            # Fetch data from all sources concurrently
            merged_data = {
                'timestamp': datetime.utcnow().isoformat(),
                'location': {'lat': lat, 'lon': lon},
                'sources': {},
                'normalized_data': [],
                'summary': {},
                'data_quality': {}
            }
            
            # Use ThreadPoolExecutor for concurrent API calls
            with ThreadPoolExecutor(max_workers=3) as executor:
                future_to_source = {}
                
                if 'tempo' in sources:
                    future_to_source[executor.submit(self._fetch_tempo_data, lat, lon)] = 'tempo'
                
                if 'ground' in sources:
                    future_to_source[executor.submit(self._fetch_ground_data, lat, lon)] = 'ground'
                
                if 'weather' in sources:
                    future_to_source[executor.submit(self._fetch_weather_data, lat, lon)] = 'weather'
                
                # Collect results
                for future in as_completed(future_to_source):
                    source = future_to_source[future]
                    try:
                        data = future.result(timeout=30)  # 30 second timeout
                        merged_data['sources'][source] = data
                        logger.info(f"Successfully fetched data from {source}")
                    except Exception as e:
                        logger.error(f"Error fetching data from {source}: {str(e)}")
                        merged_data['sources'][source] = {
                            'status': 'error',
                            'message': str(e)
                        }
            
            # Normalize and merge the data
            merged_data['normalized_data'] = self._normalize_data(merged_data['sources'])
            merged_data['summary'] = self._generate_summary(merged_data['normalized_data'])
            merged_data['data_quality'] = self._assess_data_quality(merged_data['sources'])
            
            return merged_data
            
        except Exception as e:
            logger.error(f"Error in fetch_and_merge_data: {str(e)}")
            return {
                'status': 'error',
                'message': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }
    
    def _fetch_tempo_data(self, lat: float, lon: float) -> Dict:
        """Fetch data from TEMPO service."""
        try:
            return tempo_service.get_latest_data(lat=lat, lon=lon)
        except Exception as e:
            logger.error(f"Error fetching TEMPO data: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    def _fetch_ground_data(self, lat: float, lon: float) -> Dict:
        """Fetch data from ground stations."""
        try:
            return ground_service.get_current_observations(lat=lat, lon=lon, distance=25)
        except Exception as e:
            logger.error(f"Error fetching ground station data: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    def _fetch_weather_data(self, lat: float, lon: float) -> Dict:
        """Fetch weather data."""
        try:
            return weather_service.get_current_weather(lat=lat, lon=lon)
        except Exception as e:
            logger.error(f"Error fetching weather data: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    def _normalize_data(self, sources_data: Dict) -> List[Dict]:
        """Normalize data from all sources into standard format."""
        normalized_records = []
        
        for source_name, source_data in sources_data.items():
            if source_data.get('status') != 'success':
                continue
            
            try:
                if source_name == 'tempo':
                    normalized_records.extend(self._normalize_tempo_data(source_data))
                elif source_name == 'ground':
                    normalized_records.extend(self._normalize_ground_data(source_data))
                elif source_name == 'weather':
                    normalized_records.extend(self._normalize_weather_data(source_data))
                    
            except Exception as e:
                logger.error(f"Error normalizing {source_name} data: {str(e)}")
                continue
        
        return normalized_records
    
    def _normalize_tempo_data(self, tempo_data: Dict) -> List[Dict]:
        """Normalize TEMPO satellite data."""
        normalized = []
        
        try:
            data = tempo_data.get('data', {})
            measurements = data.get('measurements', [])
            
            for measurement in measurements:
                pollutant = measurement.get('pollutant', '').lower()
                standardized_pollutant = self.pollutant_mapping.get(pollutant, pollutant.upper())
                
                if not standardized_pollutant:
                    continue
                
                value = measurement.get('value')
                if value is None:
                    continue
                
                # Convert units if necessary
                unit = measurement.get('unit', '').lower()
                converted_value = self._convert_units(value, unit, standardized_pollutant)
                
                normalized_record = {
                    'source': 'tempo',
                    'pollutant': standardized_pollutant,
                    'value': converted_value,
                    'unit': 'µg/m³',
                    'timestamp': measurement.get('timestamp', datetime.utcnow().isoformat()),
                    'lat': measurement.get('lat', data.get('lat')),
                    'lon': measurement.get('lon', data.get('lon')),
                    'quality_flag': measurement.get('quality', 'unknown'),
                    'metadata': {
                        'satellite_pass': data.get('satellite_pass'),
                        'cloud_fraction': measurement.get('cloud_fraction'),
                        'original_unit': measurement.get('unit')
                    }
                }
                
                normalized.append(normalized_record)
                
        except Exception as e:
            logger.error(f"Error normalizing TEMPO data: {str(e)}")
        
        return normalized
    
    def _normalize_ground_data(self, ground_data: Dict) -> List[Dict]:
        """Normalize ground station data."""
        normalized = []
        
        try:
            data = ground_data.get('data', {})
            stations = data.get('stations', [])
            
            for station in stations:
                measurements = station.get('measurements', [])
                station_lat = station.get('lat')
                station_lon = station.get('lon')
                
                for measurement in measurements:
                    pollutant = measurement.get('parameter', '').lower()
                    standardized_pollutant = self.pollutant_mapping.get(pollutant, pollutant.upper())
                    
                    if not standardized_pollutant:
                        continue
                    
                    value = measurement.get('value')
                    if value is None:
                        continue
                    
                    # Convert units if necessary
                    unit = measurement.get('unit', '').lower()
                    converted_value = self._convert_units(value, unit, standardized_pollutant)
                    
                    normalized_record = {
                        'source': 'ground',
                        'pollutant': standardized_pollutant,
                        'value': converted_value,
                        'unit': 'µg/m³',
                        'timestamp': measurement.get('timestamp', datetime.utcnow().isoformat()),
                        'lat': station_lat,
                        'lon': station_lon,
                        'quality_flag': measurement.get('quality', 'good'),
                        'metadata': {
                            'station_id': station.get('id'),
                            'station_name': station.get('name'),
                            'distance_km': station.get('distance'),
                            'original_unit': measurement.get('unit')
                        }
                    }
                    
                    normalized.append(normalized_record)
                    
        except Exception as e:
            logger.error(f"Error normalizing ground station data: {str(e)}")
        
        return normalized
    
    def _normalize_weather_data(self, weather_data: Dict) -> List[Dict]:
        """Normalize weather data (extract air quality related parameters)."""
        normalized = []
        
        try:
            data = weather_data.get('data', {})
            
            # Extract air quality relevant weather parameters
            weather_params = {
                'visibility': data.get('visibility'),
                'uv_index': data.get('uv_index'),
                'air_pressure': data.get('pressure')
            }
            
            for param, value in weather_params.items():
                if value is not None:
                    normalized_record = {
                        'source': 'weather',
                        'pollutant': param.upper(),
                        'value': float(value),
                        'unit': self._get_weather_unit(param),
                        'timestamp': data.get('timestamp', datetime.utcnow().isoformat()),
                        'lat': data.get('lat'),
                        'lon': data.get('lon'),
                        'quality_flag': 'good',
                        'metadata': {
                            'temperature': data.get('temperature'),
                            'humidity': data.get('humidity'),
                            'wind_speed': data.get('wind_speed'),
                            'wind_direction': data.get('wind_direction')
                        }
                    }
                    
                    normalized.append(normalized_record)
                    
        except Exception as e:
            logger.error(f"Error normalizing weather data: {str(e)}")
        
        return normalized
    
    def _convert_units(self, value: float, unit: str, pollutant: str) -> float:
        """Convert units to standard µg/m³ where applicable."""
        try:
            unit = unit.lower().strip()
            
            if unit in ['µg/m³', 'ug/m3', 'µg/m3']:
                return value
            
            if unit == 'ppm' and pollutant in self.unit_conversions['ppm']:
                return value * self.unit_conversions['ppm'][pollutant]
            
            if unit == 'ppb' and pollutant in self.unit_conversions['ppb']:
                return value * self.unit_conversions['ppb'][pollutant]
            
            # If no conversion available, return original value
            return value
            
        except Exception as e:
            logger.warning(f"Error converting units for {pollutant}: {str(e)}")
            return value
    
    def _get_weather_unit(self, param: str) -> str:
        """Get standard unit for weather parameters."""
        units = {
            'visibility': 'km',
            'uv_index': 'index',
            'air_pressure': 'hPa'
        }
        return units.get(param, 'unknown')
    
    def _generate_summary(self, normalized_data: List[Dict]) -> Dict:
        """Generate summary statistics from normalized data."""
        try:
            if not normalized_data:
                return {'message': 'No data available for summary'}
            
            # Group by pollutant
            pollutant_data = {}
            source_counts = {}
            
            for record in normalized_data:
                pollutant = record['pollutant']
                source = record['source']
                value = record['value']
                
                if pollutant not in pollutant_data:
                    pollutant_data[pollutant] = []
                
                pollutant_data[pollutant].append(value)
                
                source_counts[source] = source_counts.get(source, 0) + 1
            
            # Calculate statistics for each pollutant
            summary = {
                'total_measurements': len(normalized_data),
                'sources_count': source_counts,
                'pollutants': {}
            }
            
            for pollutant, values in pollutant_data.items():
                if values:
                    summary['pollutants'][pollutant] = {
                        'count': len(values),
                        'mean': round(np.mean(values), 2),
                        'min': round(min(values), 2),
                        'max': round(max(values), 2),
                        'std': round(np.std(values), 2) if len(values) > 1 else 0
                    }
            
            return summary
            
        except Exception as e:
            logger.error(f"Error generating summary: {str(e)}")
            return {'error': str(e)}
    
    def _assess_data_quality(self, sources_data: Dict) -> Dict:
        """Assess the quality of data from different sources."""
        quality_assessment = {
            'overall_quality': 'good',
            'sources_status': {},
            'issues': [],
            'recommendations': []
        }
        
        successful_sources = 0
        total_sources = len(sources_data)
        
        for source, data in sources_data.items():
            if data.get('status') == 'success':
                successful_sources += 1
                quality_assessment['sources_status'][source] = 'operational'
            else:
                quality_assessment['sources_status'][source] = 'failed'
                quality_assessment['issues'].append(f"{source} data unavailable")
        
        # Determine overall quality
        success_rate = successful_sources / total_sources if total_sources > 0 else 0
        
        if success_rate >= 0.8:
            quality_assessment['overall_quality'] = 'excellent'
        elif success_rate >= 0.6:
            quality_assessment['overall_quality'] = 'good'
        elif success_rate >= 0.3:
            quality_assessment['overall_quality'] = 'fair'
        else:
            quality_assessment['overall_quality'] = 'poor'
            quality_assessment['recommendations'].append('Multiple data sources are unavailable')
        
        # Add specific recommendations
        if successful_sources == 0:
            quality_assessment['recommendations'].append('No data sources available - check API connections')
        elif successful_sources == 1:
            quality_assessment['recommendations'].append('Only one data source available - consider backup sources')
        
        return quality_assessment
    
    def save_merged_data(self, merged_data: Dict) -> int:
        """Save normalized data to MongoDB."""
        try:
            if not merged_data.get('normalized_data'):
                logger.warning("No normalized data to save")
                return 0
            
            # Prepare records for bulk insertion
            records_to_insert = []
            
            for record in merged_data['normalized_data']:
                # Convert timestamp string to datetime object
                timestamp_str = record.get('timestamp')
                if isinstance(timestamp_str, str):
                    try:
                        timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                    except:
                        timestamp = datetime.utcnow()
                else:
                    timestamp = timestamp_str or datetime.utcnow()
                
                record_data = {
                    'lat': record.get('lat'),
                    'lon': record.get('lon'),
                    'source': record.get('source'),
                    'pollutant': record.get('pollutant'),
                    'value': record.get('value'),
                    'timestamp': timestamp,
                    'metadata': {
                        'unit': record.get('unit'),
                        'quality_flag': record.get('quality_flag'),
                        **record.get('metadata', {})
                    }
                }
                
                records_to_insert.append(record_data)
            
            # Bulk insert to MongoDB
            inserted_count = AQIRecord.bulk_insert(records_to_insert)
            
            logger.info(f"Saved {inserted_count} merged records to MongoDB")
            return inserted_count
            
        except Exception as e:
            logger.error(f"Error saving merged data: {str(e)}")
            return 0
    
    def get_historical_merged_data(self, lat: float, lon: float, 
                                  days_back: int = 7, 
                                  pollutants: List[str] = None) -> Dict:
        """Get historical merged data from MongoDB."""
        try:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days_back)
            
            # Get all records for the location and time range
            all_records = AQIRecord.find_by_time_range(
                start_date=start_date,
                end_date=end_date,
                lat=lat,
                lon=lon,
                radius_km=25,
                limit=5000
            )
            
            # Filter by pollutants if specified
            if pollutants:
                filtered_records = [r for r in all_records if r.pollutant in pollutants]
            else:
                filtered_records = all_records
            
            # Group by source and pollutant
            grouped_data = {}
            for record in filtered_records:
                source = record.source
                pollutant = record.pollutant
                
                if source not in grouped_data:
                    grouped_data[source] = {}
                
                if pollutant not in grouped_data[source]:
                    grouped_data[source][pollutant] = []
                
                grouped_data[source][pollutant].append({
                    'timestamp': record.timestamp.isoformat(),
                    'value': record.value,
                    'lat': record.lat,
                    'lon': record.lon,
                    'metadata': record.metadata
                })
            
            return {
                'status': 'success',
                'location': {'lat': lat, 'lon': lon},
                'time_range': {
                    'start': start_date.isoformat(),
                    'end': end_date.isoformat(),
                    'days': days_back
                },
                'total_records': len(filtered_records),
                'data_by_source': grouped_data,
                'summary': self._generate_historical_summary(filtered_records)
            }
            
        except Exception as e:
            logger.error(f"Error getting historical merged data: {str(e)}")
            return {
                'status': 'error',
                'message': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }
    
    def _generate_historical_summary(self, records: List) -> Dict:
        """Generate summary for historical data."""
        try:
            if not records:
                return {'message': 'No historical data available'}
            
            # Group by pollutant and source
            summary = {
                'total_records': len(records),
                'date_range': {
                    'earliest': min(r.timestamp for r in records).isoformat(),
                    'latest': max(r.timestamp for r in records).isoformat()
                },
                'by_pollutant': {},
                'by_source': {}
            }
            
            # Analyze by pollutant
            pollutant_data = {}
            source_data = {}
            
            for record in records:
                pollutant = record.pollutant
                source = record.source
                value = record.value
                
                # Pollutant analysis
                if pollutant not in pollutant_data:
                    pollutant_data[pollutant] = []
                pollutant_data[pollutant].append(value)
                
                # Source analysis
                source_data[source] = source_data.get(source, 0) + 1
            
            # Calculate pollutant statistics
            for pollutant, values in pollutant_data.items():
                summary['by_pollutant'][pollutant] = {
                    'count': len(values),
                    'avg': round(np.mean(values), 2),
                    'min': round(min(values), 2),
                    'max': round(max(values), 2)
                }
            
            summary['by_source'] = source_data
            
            return summary
            
        except Exception as e:
            logger.error(f"Error generating historical summary: {str(e)}")
            return {'error': str(e)}


# Global service instance
merge_service = MergeService()
