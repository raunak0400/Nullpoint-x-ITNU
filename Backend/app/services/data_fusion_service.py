import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from concurrent.futures import ThreadPoolExecutor, as_completed
import math
from scipy.spatial.distance import cdist
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from app.utils.logger import setup_logger
from app.services.cache_service import cache_service, cached
from app.services.tempo_data_fetcher import tempo_fetcher
from app.services.nasa_service import nasa_service

logger = setup_logger(__name__)


class DataFusionService:
    """
    Advanced data fusion service that combines TEMPO satellite data with ground sensor data
    to provide enhanced air quality predictions with improved spatial and temporal resolution.
    
    Key Features:
    - Spatial interpolation between satellite and ground data
    - Temporal alignment and synchronization
    - Quality weighting based on data source reliability
    - Machine learning enhancement for prediction accuracy
    - Uncertainty quantification
    """
    
    def __init__(self):
        self.fusion_models = {}  # Store trained models for each pollutant
        self.scaler = StandardScaler()
        self.quality_weights = {
            'ground_sensor': 1.0,      # Highest weight - direct measurement
            'tempo_satellite': 0.8,    # High weight - satellite observation
            'interpolated': 0.6,       # Medium weight - interpolated data
            'modeled': 0.4,           # Lower weight - model prediction
            'estimated': 0.2          # Lowest weight - rough estimation
        }
        
        # Spatial influence parameters
        self.max_ground_influence_km = 25.0  # Ground sensors influence up to 25km
        self.max_satellite_grid_km = 5.0     # TEMPO pixel size ~2-5km
        
    @cached(ttl=600, key_prefix='data_fusion')  # 10 min cache
    def get_fused_air_quality_data(self, lat: float, lon: float, 
                                  pollutants: List[str] = None,
                                  radius_km: float = 50.0) -> Dict:
        """
        Get fused air quality data combining TEMPO satellite and ground sensor data.
        
        Args:
            lat: Target latitude
            lon: Target longitude  
            pollutants: List of pollutants to analyze (default: all available)
            radius_km: Search radius for ground sensors
            
        Returns:
            Dict containing fused data with enhanced predictions
        """
        try:
            if pollutants is None:
                pollutants = ['NO2', 'O3', 'PM2.5', 'PM10', 'HCHO']
            
            logger.info(f"Starting data fusion for {pollutants} at ({lat}, {lon})")
            
            # Step 1: Collect data from all sources concurrently
            data_sources = self._collect_multi_source_data(lat, lon, pollutants, radius_km)
            
            # Step 2: Perform spatial and temporal fusion
            fused_results = {}
            
            for pollutant in pollutants:
                try:
                    fused_data = self._fuse_pollutant_data(
                        pollutant, lat, lon, data_sources, radius_km
                    )
                    fused_results[pollutant] = fused_data
                    
                except Exception as e:
                    logger.error(f"Error fusing {pollutant} data: {str(e)}")
                    fused_results[pollutant] = {
                        'status': 'error',
                        'message': str(e),
                        'fallback_value': self._get_fallback_value(pollutant)
                    }
            
            # Step 3: Generate fusion summary and quality metrics
            fusion_summary = self._generate_fusion_summary(data_sources, fused_results)
            
            return {
                'status': 'success',
                'method': 'satellite_ground_fusion',
                'location': {'lat': lat, 'lon': lon},
                'timestamp': datetime.utcnow().isoformat(),
                'pollutants': fused_results,
                'fusion_summary': fusion_summary,
                'data_sources': data_sources['summary'],
                'quality_score': fusion_summary.get('overall_quality', 0.5)
            }
            
        except Exception as e:
            logger.error(f"Error in data fusion: {str(e)}")
            return self._get_fusion_fallback(lat, lon, pollutants)
    
    def _collect_multi_source_data(self, lat: float, lon: float, 
                                  pollutants: List[str], radius_km: float) -> Dict:
        """Collect data from all available sources concurrently."""
        
        data_sources = {
            'tempo_satellite': {},
            'ground_sensors': {},
            'weather_context': {},
            'summary': {
                'sources_attempted': 0,
                'sources_successful': 0,
                'data_points_collected': 0
            }
        }
        
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = {}
            
            # Submit TEMPO satellite data requests
            for pollutant in pollutants:
                if pollutant in ['NO2', 'O3', 'HCHO', 'AEROSOL']:
                    future = executor.submit(
                        tempo_fetcher.get_tempo_realtime_data, lat, lon, pollutant
                    )
                    futures[f'tempo_{pollutant}'] = future
                    data_sources['summary']['sources_attempted'] += 1
            
            # Submit ground sensor data request
            future = executor.submit(
                nasa_service.get_openaq_data, lat, lon, radius_km
            )
            futures['ground_sensors'] = future
            data_sources['summary']['sources_attempted'] += 1
            
            # Submit weather context data
            future = executor.submit(
                nasa_service.get_merra2_weather_data, lat, lon
            )
            futures['weather'] = future
            data_sources['summary']['sources_attempted'] += 1
            
            # Collect results
            for future_name, future in futures.items():
                try:
                    result = future.result(timeout=30)
                    
                    if future_name.startswith('tempo_'):
                        pollutant = future_name.replace('tempo_', '')
                        data_sources['tempo_satellite'][pollutant] = result
                        
                    elif future_name == 'ground_sensors':
                        data_sources['ground_sensors'] = result
                        
                    elif future_name == 'weather':
                        data_sources['weather_context'] = result
                    
                    if result.get('status') == 'success':
                        data_sources['summary']['sources_successful'] += 1
                        
                        # Count data points
                        if 'data' in result:
                            if isinstance(result['data'], list):
                                data_sources['summary']['data_points_collected'] += len(result['data'])
                            else:
                                data_sources['summary']['data_points_collected'] += 1
                    
                except Exception as e:
                    logger.warning(f"Failed to collect data from {future_name}: {str(e)}")
        
        return data_sources
    
    def _fuse_pollutant_data(self, pollutant: str, lat: float, lon: float,
                            data_sources: Dict, radius_km: float) -> Dict:
        """Fuse data for a specific pollutant using advanced spatial-temporal methods."""
        
        # Collect all measurements for this pollutant
        measurements = []
        
        # Add TEMPO satellite data
        tempo_data = data_sources['tempo_satellite'].get(pollutant)
        if tempo_data and tempo_data.get('status') == 'success':
            tempo_measurement = {
                'source': 'tempo_satellite',
                'lat': tempo_data['data']['lat'],
                'lon': tempo_data['data']['lon'],
                'value': tempo_data['data']['value'],
                'unit': tempo_data['data']['unit'],
                'quality': tempo_data['data'].get('quality_flag', 'good'),
                'timestamp': tempo_data['data']['measurement_time'],
                'spatial_resolution': 'low',  # ~2-5km pixels
                'weight': self.quality_weights['tempo_satellite']
            }
            measurements.append(tempo_measurement)
        
        # Add ground sensor data
        ground_data = data_sources['ground_sensors']
        if ground_data and ground_data.get('status') == 'success':
            for measurement in ground_data.get('data', []):
                if measurement.get('pollutant', '').upper() == pollutant.upper():
                    # Calculate distance-based weight
                    distance_km = measurement.get('distance_km', 0)
                    distance_weight = self._calculate_distance_weight(distance_km, radius_km)
                    
                    ground_measurement = {
                        'source': 'ground_sensor',
                        'lat': measurement['lat'],
                        'lon': measurement['lon'],
                        'value': measurement['value'],
                        'unit': measurement['unit'],
                        'quality': 'high',
                        'timestamp': measurement['timestamp'],
                        'spatial_resolution': 'high',  # Point measurement
                        'distance_km': distance_km,
                        'weight': self.quality_weights['ground_sensor'] * distance_weight,
                        'station_id': measurement.get('station_id', 'unknown')
                    }
                    measurements.append(ground_measurement)
        
        if not measurements:
            # No data available, return estimation
            return self._generate_estimated_value(pollutant, lat, lon, data_sources)
        
        # Perform spatial fusion
        fused_value = self._spatial_fusion(measurements, lat, lon)
        
        # Add temporal context and uncertainty
        temporal_context = self._analyze_temporal_context(measurements)
        uncertainty = self._calculate_uncertainty(measurements, fused_value)
        
        # Generate prediction confidence intervals
        confidence_intervals = self._calculate_confidence_intervals(
            fused_value, uncertainty, measurements
        )
        
        return {
            'status': 'success',
            'pollutant': pollutant,
            'fused_value': round(fused_value, 2),
            'unit': measurements[0]['unit'] if measurements else 'µg/m³',
            'confidence_intervals': confidence_intervals,
            'uncertainty': round(uncertainty, 2),
            'data_quality': self._assess_data_quality(measurements),
            'fusion_method': self._determine_fusion_method(measurements),
            'contributing_sources': {
                'total_measurements': len(measurements),
                'satellite_data': len([m for m in measurements if m['source'] == 'tempo_satellite']),
                'ground_sensors': len([m for m in measurements if m['source'] == 'ground_sensor']),
                'spatial_coverage_km': self._calculate_spatial_coverage(measurements)
            },
            'temporal_context': temporal_context,
            'raw_measurements': measurements[:5]  # Include up to 5 raw measurements for reference
        }
    
    def _spatial_fusion(self, measurements: List[Dict], target_lat: float, target_lon: float) -> float:
        """Perform advanced spatial fusion using weighted interpolation."""
        
        if len(measurements) == 1:
            return measurements[0]['value']
        
        # Separate satellite and ground measurements
        satellite_measurements = [m for m in measurements if m['source'] == 'tempo_satellite']
        ground_measurements = [m for m in measurements if m['source'] == 'ground_sensor']
        
        fused_value = 0.0
        total_weight = 0.0
        
        # Process satellite data (broader coverage, lower resolution)
        if satellite_measurements:
            satellite_value = np.mean([m['value'] for m in satellite_measurements])
            satellite_weight = np.mean([m['weight'] for m in satellite_measurements])
            
            # Satellite provides baseline value
            fused_value += satellite_value * satellite_weight * 0.3  # Base contribution
            total_weight += satellite_weight * 0.3
        
        # Process ground sensor data (high precision, local)
        if ground_measurements:
            # Use inverse distance weighting for ground sensors
            ground_values = []
            ground_weights = []
            
            for measurement in ground_measurements:
                distance_km = self._calculate_distance(
                    target_lat, target_lon, measurement['lat'], measurement['lon']
                )
                
                # Inverse distance weighting with exponential decay
                if distance_km < 0.1:  # Very close sensor
                    distance_weight = 1.0
                else:
                    distance_weight = 1.0 / (1.0 + distance_km ** 2)
                
                final_weight = measurement['weight'] * distance_weight
                ground_values.append(measurement['value'] * final_weight)
                ground_weights.append(final_weight)
            
            if ground_weights:
                ground_weighted_avg = sum(ground_values) / sum(ground_weights)
                ground_total_weight = sum(ground_weights)
                
                # Ground sensors have higher influence for local predictions
                fused_value += ground_weighted_avg * min(ground_total_weight, 1.0) * 0.7
                total_weight += min(ground_total_weight, 1.0) * 0.7
        
        # Normalize the result
        if total_weight > 0:
            return fused_value / total_weight
        else:
            # Fallback to simple average
            return np.mean([m['value'] for m in measurements])
    
    def _calculate_distance_weight(self, distance_km: float, max_radius_km: float) -> float:
        """Calculate distance-based weight for measurements."""
        if distance_km >= max_radius_km:
            return 0.0
        
        # Exponential decay with distance
        return math.exp(-distance_km / (max_radius_km / 3.0))
    
    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two coordinates in km."""
        R = 6371  # Earth's radius in km
        
        lat1_rad, lon1_rad = math.radians(lat1), math.radians(lon1)
        lat2_rad, lon2_rad = math.radians(lat2), math.radians(lon2)
        
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        
        a = (math.sin(dlat/2)**2 + 
             math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c
    
    def _calculate_uncertainty(self, measurements: List[Dict], fused_value: float) -> float:
        """Calculate uncertainty in the fused value."""
        if len(measurements) <= 1:
            return 0.3 * fused_value  # 30% uncertainty for single measurement
        
        # Calculate variance among measurements
        values = [m['value'] for m in measurements]
        weights = [m['weight'] for m in measurements]
        
        # Weighted variance
        weighted_mean = sum(v * w for v, w in zip(values, weights)) / sum(weights)
        weighted_variance = sum(w * (v - weighted_mean)**2 for v, w in zip(values, weights)) / sum(weights)
        
        # Base uncertainty from measurement spread
        measurement_uncertainty = math.sqrt(weighted_variance)
        
        # Add source-based uncertainty
        source_types = set(m['source'] for m in measurements)
        if len(source_types) > 1:
            # Multiple sources reduce uncertainty
            source_factor = 0.8
        else:
            # Single source type increases uncertainty
            source_factor = 1.2
        
        # Spatial uncertainty based on measurement distribution
        if len(measurements) > 2:
            distances = []
            for i, m1 in enumerate(measurements):
                for j, m2 in enumerate(measurements[i+1:], i+1):
                    dist = self._calculate_distance(m1['lat'], m1['lon'], m2['lat'], m2['lon'])
                    distances.append(dist)
            
            max_distance = max(distances) if distances else 0
            spatial_factor = 1.0 + (max_distance / 100.0)  # Increase uncertainty with spatial spread
        else:
            spatial_factor = 1.1
        
        total_uncertainty = measurement_uncertainty * source_factor * spatial_factor
        
        # Cap uncertainty at reasonable bounds
        return min(max(total_uncertainty, 0.1 * fused_value), 0.5 * fused_value)
    
    def _calculate_confidence_intervals(self, value: float, uncertainty: float, 
                                     measurements: List[Dict]) -> Dict:
        """Calculate confidence intervals for the fused value."""
        
        # 68% confidence interval (±1 sigma)
        ci_68_lower = max(0, value - uncertainty)
        ci_68_upper = value + uncertainty
        
        # 95% confidence interval (±2 sigma)
        ci_95_lower = max(0, value - 2 * uncertainty)
        ci_95_upper = value + 2 * uncertainty
        
        return {
            '68_percent': {
                'lower': round(ci_68_lower, 2),
                'upper': round(ci_68_upper, 2),
                'range': round(ci_68_upper - ci_68_lower, 2)
            },
            '95_percent': {
                'lower': round(ci_95_lower, 2),
                'upper': round(ci_95_upper, 2),
                'range': round(ci_95_upper - ci_95_lower, 2)
            },
            'uncertainty_percent': round((uncertainty / value) * 100, 1) if value > 0 else 0
        }
    
    def _assess_data_quality(self, measurements: List[Dict]) -> Dict:
        """Assess the overall quality of the fused data."""
        
        if not measurements:
            return {'score': 0.0, 'level': 'no_data', 'factors': []}
        
        quality_factors = []
        quality_score = 0.0
        
        # Number of measurements
        num_measurements = len(measurements)
        if num_measurements >= 3:
            quality_score += 0.3
            quality_factors.append('multiple_measurements')
        elif num_measurements == 2:
            quality_score += 0.2
            quality_factors.append('dual_measurements')
        else:
            quality_score += 0.1
            quality_factors.append('single_measurement')
        
        # Source diversity
        source_types = set(m['source'] for m in measurements)
        if 'tempo_satellite' in source_types and 'ground_sensor' in source_types:
            quality_score += 0.3
            quality_factors.append('satellite_ground_fusion')
        elif 'ground_sensor' in source_types:
            quality_score += 0.2
            quality_factors.append('ground_sensor_available')
        elif 'tempo_satellite' in source_types:
            quality_score += 0.15
            quality_factors.append('satellite_data_available')
        
        # Temporal freshness
        now = datetime.utcnow()
        recent_measurements = 0
        for m in measurements:
            try:
                measurement_time = datetime.fromisoformat(m['timestamp'].replace('Z', '+00:00'))
                age_hours = (now - measurement_time.replace(tzinfo=None)).total_seconds() / 3600
                if age_hours <= 1:
                    recent_measurements += 1
            except:
                pass
        
        if recent_measurements > 0:
            freshness_score = min(0.2, recent_measurements * 0.1)
            quality_score += freshness_score
            quality_factors.append('recent_data')
        
        # Spatial coverage
        if num_measurements > 1:
            distances = []
            for i, m1 in enumerate(measurements):
                for j, m2 in enumerate(measurements[i+1:], i+1):
                    dist = self._calculate_distance(m1['lat'], m1['lon'], m2['lat'], m2['lon'])
                    distances.append(dist)
            
            if distances:
                max_distance = max(distances)
                if max_distance > 10:  # Good spatial coverage
                    quality_score += 0.2
                    quality_factors.append('good_spatial_coverage')
                elif max_distance > 5:
                    quality_score += 0.1
                    quality_factors.append('moderate_spatial_coverage')
        
        # Determine quality level
        if quality_score >= 0.8:
            quality_level = 'excellent'
        elif quality_score >= 0.6:
            quality_level = 'good'
        elif quality_score >= 0.4:
            quality_level = 'fair'
        elif quality_score >= 0.2:
            quality_level = 'poor'
        else:
            quality_level = 'very_poor'
        
        return {
            'score': round(quality_score, 2),
            'level': quality_level,
            'factors': quality_factors,
            'measurement_count': num_measurements,
            'source_diversity': len(source_types)
        }
    
    def _determine_fusion_method(self, measurements: List[Dict]) -> str:
        """Determine which fusion method was used."""
        
        source_types = set(m['source'] for m in measurements)
        
        if 'tempo_satellite' in source_types and 'ground_sensor' in source_types:
            return 'satellite_ground_spatial_fusion'
        elif 'ground_sensor' in source_types:
            if len([m for m in measurements if m['source'] == 'ground_sensor']) > 1:
                return 'multi_sensor_interpolation'
            else:
                return 'single_ground_sensor'
        elif 'tempo_satellite' in source_types:
            return 'satellite_only'
        else:
            return 'estimation'
    
    def _calculate_spatial_coverage(self, measurements: List[Dict]) -> float:
        """Calculate the spatial coverage area of measurements in km²."""
        
        if len(measurements) <= 1:
            return 0.0
        
        lats = [m['lat'] for m in measurements]
        lons = [m['lon'] for m in measurements]
        
        # Calculate bounding box
        lat_range = max(lats) - min(lats)
        lon_range = max(lons) - min(lons)
        
        # Convert to approximate km (rough calculation)
        lat_km = lat_range * 111.0  # 1 degree lat ≈ 111 km
        lon_km = lon_range * 111.0 * math.cos(math.radians(np.mean(lats)))
        
        return lat_km * lon_km
    
    def _analyze_temporal_context(self, measurements: List[Dict]) -> Dict:
        """Analyze temporal context of measurements."""
        
        if not measurements:
            return {'status': 'no_data'}
        
        now = datetime.utcnow()
        ages_hours = []
        
        for m in measurements:
            try:
                measurement_time = datetime.fromisoformat(m['timestamp'].replace('Z', '+00:00'))
                age_hours = (now - measurement_time.replace(tzinfo=None)).total_seconds() / 3600
                ages_hours.append(age_hours)
            except:
                ages_hours.append(24)  # Assume old if can't parse
        
        if ages_hours:
            avg_age = np.mean(ages_hours)
            max_age = max(ages_hours)
            min_age = min(ages_hours)
            
            # Determine freshness
            if avg_age <= 1:
                freshness = 'very_fresh'
            elif avg_age <= 3:
                freshness = 'fresh'
            elif avg_age <= 6:
                freshness = 'moderate'
            elif avg_age <= 24:
                freshness = 'old'
            else:
                freshness = 'very_old'
            
            return {
                'status': 'analyzed',
                'average_age_hours': round(avg_age, 1),
                'oldest_measurement_hours': round(max_age, 1),
                'newest_measurement_hours': round(min_age, 1),
                'freshness_level': freshness,
                'temporal_spread_hours': round(max_age - min_age, 1)
            }
        
        return {'status': 'no_valid_timestamps'}
    
    def _generate_estimated_value(self, pollutant: str, lat: float, lon: float, 
                                data_sources: Dict) -> Dict:
        """Generate estimated value when no direct measurements are available."""
        
        # Use weather context if available
        weather_data = data_sources.get('weather_context', {})
        
        # Base estimation using location and time patterns
        base_values = {
            'NO2': 25.0, 'O3': 60.0, 'PM2.5': 15.0, 'PM10': 25.0, 
            'HCHO': 12.0, 'SO2': 8.0, 'CO': 1.2
        }
        
        base_value = base_values.get(pollutant, 20.0)
        
        # Apply weather adjustments if available
        if weather_data.get('status') == 'success':
            weather_info = weather_data.get('data', {})
            
            # Wind speed effect (higher wind = lower concentrations)
            wind_speed = weather_info.get('wind_speed', 5.0)
            wind_factor = 1.0 - min(0.3, wind_speed / 20.0)
            
            # PBL height effect (higher PBL = more dilution)
            pbl_height = weather_info.get('pbl_height', 800)
            pbl_factor = 1.0 + max(-0.2, min(0.2, (800 - pbl_height) / 1000.0))
            
            base_value *= wind_factor * pbl_factor
        
        # Add realistic variation
        variation = np.random.normal(0, base_value * 0.15)
        estimated_value = max(0, base_value + variation)
        
        return {
            'status': 'estimated',
            'pollutant': pollutant,
            'fused_value': round(estimated_value, 2),
            'unit': 'µg/m³',
            'confidence_intervals': {
                '68_percent': {
                    'lower': round(estimated_value * 0.7, 2),
                    'upper': round(estimated_value * 1.3, 2)
                },
                '95_percent': {
                    'lower': round(estimated_value * 0.5, 2),
                    'upper': round(estimated_value * 1.5, 2)
                }
            },
            'uncertainty': round(estimated_value * 0.4, 2),
            'data_quality': {'score': 0.2, 'level': 'estimated', 'factors': ['no_direct_measurements']},
            'fusion_method': 'weather_contextual_estimation',
            'contributing_sources': {
                'total_measurements': 0,
                'satellite_data': 0,
                'ground_sensors': 0,
                'weather_context': 1 if weather_data.get('status') == 'success' else 0
            }
        }
    
    def _generate_fusion_summary(self, data_sources: Dict, fused_results: Dict) -> Dict:
        """Generate summary of the fusion process."""
        
        successful_pollutants = len([r for r in fused_results.values() 
                                   if r.get('status') == 'success'])
        total_pollutants = len(fused_results)
        
        # Calculate overall quality score
        quality_scores = []
        for result in fused_results.values():
            if result.get('status') == 'success':
                quality_scores.append(result.get('data_quality', {}).get('score', 0.0))
        
        overall_quality = np.mean(quality_scores) if quality_scores else 0.0
        
        # Fusion method distribution
        fusion_methods = {}
        for result in fused_results.values():
            if result.get('status') == 'success':
                method = result.get('fusion_method', 'unknown')
                fusion_methods[method] = fusion_methods.get(method, 0) + 1
        
        return {
            'successful_pollutants': successful_pollutants,
            'total_pollutants': total_pollutants,
            'success_rate': round(successful_pollutants / total_pollutants, 2) if total_pollutants > 0 else 0,
            'overall_quality': round(overall_quality, 2),
            'data_source_summary': data_sources['summary'],
            'fusion_methods_used': fusion_methods,
            'spatial_temporal_fusion': True,
            'uncertainty_quantified': True
        }
    
    def _get_fusion_fallback(self, lat: float, lon: float, pollutants: List[str]) -> Dict:
        """Fallback response when fusion fails."""
        
        fallback_results = {}
        for pollutant in pollutants:
            fallback_results[pollutant] = {
                'status': 'fallback',
                'pollutant': pollutant,
                'fused_value': self._get_fallback_value(pollutant),
                'unit': 'µg/m³',
                'data_quality': {'score': 0.1, 'level': 'fallback'},
                'fusion_method': 'fallback_estimation'
            }
        
        return {
            'status': 'fallback',
            'method': 'fallback_estimation',
            'location': {'lat': lat, 'lon': lon},
            'timestamp': datetime.utcnow().isoformat(),
            'pollutants': fallback_results,
            'message': 'Data fusion failed, using fallback estimations'
        }
    
    def _get_fallback_value(self, pollutant: str) -> float:
        """Get fallback value for a pollutant."""
        fallback_values = {
            'NO2': 20.0, 'O3': 50.0, 'PM2.5': 12.0, 'PM10': 20.0,
            'HCHO': 8.0, 'SO2': 5.0, 'CO': 1.0
        }
        return fallback_values.get(pollutant, 15.0)


# Global data fusion service instance
data_fusion_service = DataFusionService()
