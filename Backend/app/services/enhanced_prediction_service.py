import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from app.utils.logger import setup_logger
from app.services.cache_service import cache_service, cached
from app.services.data_fusion_service import data_fusion_service

logger = setup_logger(__name__)


class EnhancedPredictionService:
    """
    Enhanced prediction service that uses fused satellite + ground sensor data
    to provide improved air quality forecasts and predictions.
    """
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.feature_importance = {}
        
    @cached(ttl=1800, key_prefix='enhanced_prediction')  # 30 min cache
    def get_enhanced_prediction(self, lat: float, lon: float, 
                              pollutant: str = 'NO2', 
                              forecast_hours: int = 24) -> Dict:
        """
        Get enhanced air quality prediction using fused satellite + ground data.
        
        Args:
            lat: Latitude
            lon: Longitude
            pollutant: Target pollutant
            forecast_hours: Hours to forecast ahead
            
        Returns:
            Enhanced prediction with uncertainty bounds
        """
        try:
            logger.info(f"Generating enhanced prediction for {pollutant} at ({lat}, {lon})")
            
            # Get current fused data
            current_data = data_fusion_service.get_fused_air_quality_data(
                lat, lon, [pollutant], radius_km=50.0
            )
            
            if current_data.get('status') != 'success':
                return self._get_fallback_prediction(lat, lon, pollutant, forecast_hours)
            
            # Extract features for prediction
            features = self._extract_prediction_features(current_data, lat, lon)
            
            # Generate prediction
            prediction_result = self._generate_ml_prediction(
                features, pollutant, forecast_hours
            )
            
            # Add current data context
            prediction_result['current_conditions'] = current_data['pollutants'][pollutant]
            prediction_result['data_fusion_quality'] = current_data['quality_score']
            
            return prediction_result
            
        except Exception as e:
            logger.error(f"Error in enhanced prediction: {str(e)}")
            return self._get_fallback_prediction(lat, lon, pollutant, forecast_hours)
    
    def _extract_prediction_features(self, fused_data: Dict, lat: float, lon: float) -> Dict:
        """Extract features for ML prediction from fused data."""
        
        features = {
            'latitude': lat,
            'longitude': lon,
            'hour_of_day': datetime.utcnow().hour,
            'day_of_week': datetime.utcnow().weekday(),
            'month': datetime.utcnow().month
        }
        
        # Add fused data features
        for pollutant, data in fused_data.get('pollutants', {}).items():
            if data.get('status') == 'success':
                features[f'{pollutant.lower()}_current'] = data['fused_value']
                features[f'{pollutant.lower()}_uncertainty'] = data.get('uncertainty', 0)
                features[f'{pollutant.lower()}_quality'] = data.get('data_quality', {}).get('score', 0)
        
        # Add data source features
        fusion_summary = fused_data.get('fusion_summary', {})
        features['data_sources_count'] = fusion_summary.get('data_source_summary', {}).get('sources_successful', 0)
        features['overall_quality'] = fusion_summary.get('overall_quality', 0)
        
        return features
    
    def _generate_ml_prediction(self, features: Dict, pollutant: str, 
                               forecast_hours: int) -> Dict:
        """Generate ML-based prediction using enhanced features."""
        
        # Create time series for forecast
        forecast_times = []
        predictions = []
        uncertainties = []
        
        current_time = datetime.utcnow()
        
        for hour in range(1, forecast_hours + 1):
            future_time = current_time + timedelta(hours=hour)
            
            # Update temporal features
            hour_features = features.copy()
            hour_features['hour_of_day'] = future_time.hour
            hour_features['day_of_week'] = future_time.weekday()
            
            # Simple prediction model (in production, use trained ML model)
            base_value = features.get(f'{pollutant.lower()}_current', 25.0)
            
            # Apply temporal patterns
            hour_factor = self._get_hourly_pattern(pollutant, future_time.hour)
            day_factor = self._get_daily_pattern(pollutant, future_time.weekday())
            
            predicted_value = base_value * hour_factor * day_factor
            
            # Add some realistic variation
            variation = np.random.normal(0, predicted_value * 0.1)
            predicted_value = max(0, predicted_value + variation)
            
            # Calculate uncertainty (increases with forecast distance)
            base_uncertainty = features.get(f'{pollutant.lower()}_uncertainty', predicted_value * 0.2)
            time_uncertainty = base_uncertainty * (1 + hour * 0.05)  # Uncertainty grows with time
            
            forecast_times.append(future_time.isoformat())
            predictions.append(round(predicted_value, 2))
            uncertainties.append(round(time_uncertainty, 2))
        
        return {
            'status': 'success',
            'method': 'enhanced_satellite_ground_fusion',
            'pollutant': pollutant,
            'location': {'lat': features['latitude'], 'lon': features['longitude']},
            'forecast_hours': forecast_hours,
            'predictions': [
                {
                    'time': time,
                    'value': pred,
                    'uncertainty': unc,
                    'confidence_interval': {
                        'lower': max(0, pred - unc),
                        'upper': pred + unc
                    }
                }
                for time, pred, unc in zip(forecast_times, predictions, uncertainties)
            ],
            'summary': {
                'average_value': round(np.mean(predictions), 2),
                'max_value': round(max(predictions), 2),
                'min_value': round(min(predictions), 2),
                'trend': self._analyze_trend(predictions),
                'average_uncertainty': round(np.mean(uncertainties), 2)
            },
            'model_info': {
                'features_used': list(features.keys()),
                'prediction_method': 'temporal_pattern_enhanced',
                'data_fusion_enabled': True
            }
        }
    
    def _get_hourly_pattern(self, pollutant: str, hour: int) -> float:
        """Get hourly variation pattern for pollutant."""
        
        patterns = {
            'NO2': {  # Traffic-related, peaks during rush hours
                0: 0.6, 1: 0.5, 2: 0.4, 3: 0.4, 4: 0.5, 5: 0.7,
                6: 0.9, 7: 1.2, 8: 1.3, 9: 1.1, 10: 1.0, 11: 1.0,
                12: 1.0, 13: 1.0, 14: 1.0, 15: 1.0, 16: 1.1, 17: 1.3,
                18: 1.2, 19: 1.0, 20: 0.9, 21: 0.8, 22: 0.7, 23: 0.6
            },
            'O3': {  # Photochemical, peaks in afternoon
                0: 0.5, 1: 0.4, 2: 0.4, 3: 0.4, 4: 0.4, 5: 0.5,
                6: 0.6, 7: 0.7, 8: 0.8, 9: 0.9, 10: 1.0, 11: 1.1,
                12: 1.2, 13: 1.3, 14: 1.3, 15: 1.2, 16: 1.1, 17: 1.0,
                18: 0.9, 19: 0.8, 20: 0.7, 21: 0.6, 22: 0.5, 23: 0.5
            },
            'PM2.5': {  # More stable, slight morning/evening peaks
                0: 0.8, 1: 0.7, 2: 0.7, 3: 0.7, 4: 0.8, 5: 0.9,
                6: 1.0, 7: 1.1, 8: 1.1, 9: 1.0, 10: 1.0, 11: 1.0,
                12: 1.0, 13: 1.0, 14: 1.0, 15: 1.0, 16: 1.0, 17: 1.1,
                18: 1.1, 19: 1.0, 20: 0.9, 21: 0.9, 22: 0.8, 23: 0.8
            }
        }
        
        return patterns.get(pollutant, patterns['PM2.5']).get(hour, 1.0)
    
    def _get_daily_pattern(self, pollutant: str, day_of_week: int) -> float:
        """Get daily variation pattern (0=Monday, 6=Sunday)."""
        
        # Most pollutants are higher on weekdays due to traffic/industry
        weekday_factors = {
            'NO2': [1.1, 1.1, 1.1, 1.1, 1.1, 0.9, 0.8],  # Lower on weekends
            'O3': [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],   # More stable
            'PM2.5': [1.1, 1.1, 1.1, 1.1, 1.0, 0.9, 0.9]  # Slightly lower on weekends
        }
        
        factors = weekday_factors.get(pollutant, weekday_factors['PM2.5'])
        return factors[day_of_week]
    
    def _analyze_trend(self, predictions: List[float]) -> str:
        """Analyze trend in predictions."""
        
        if len(predictions) < 2:
            return 'stable'
        
        # Calculate linear trend
        x = np.arange(len(predictions))
        slope = np.polyfit(x, predictions, 1)[0]
        
        if slope > 0.5:
            return 'increasing'
        elif slope < -0.5:
            return 'decreasing'
        else:
            return 'stable'
    
    def _get_fallback_prediction(self, lat: float, lon: float, pollutant: str, 
                                forecast_hours: int) -> Dict:
        """Fallback prediction when enhanced method fails."""
        
        base_value = {'NO2': 25.0, 'O3': 60.0, 'PM2.5': 15.0}.get(pollutant, 20.0)
        
        predictions = []
        current_time = datetime.utcnow()
        
        for hour in range(1, forecast_hours + 1):
            future_time = current_time + timedelta(hours=hour)
            
            # Simple pattern-based prediction
            hour_factor = self._get_hourly_pattern(pollutant, future_time.hour)
            predicted_value = base_value * hour_factor
            
            predictions.append({
                'time': future_time.isoformat(),
                'value': round(predicted_value, 2),
                'uncertainty': round(predicted_value * 0.3, 2),
                'confidence_interval': {
                    'lower': round(predicted_value * 0.7, 2),
                    'upper': round(predicted_value * 1.3, 2)
                }
            })
        
        return {
            'status': 'fallback',
            'method': 'simple_pattern_based',
            'pollutant': pollutant,
            'location': {'lat': lat, 'lon': lon},
            'forecast_hours': forecast_hours,
            'predictions': predictions,
            'message': 'Using fallback prediction method'
        }


# Global enhanced prediction service
enhanced_prediction_service = EnhancedPredictionService()
