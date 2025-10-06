import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error
import warnings
warnings.filterwarnings('ignore')

try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False

from app.database.mongo import get_db
from app.models.aqi_record import AQIRecord
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class ForecastService:
    """Service for generating air quality forecasts using machine learning."""
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.model_metadata = {}
    
    def generate_forecast(self, lat: float, lon: float, days: int = 7, 
                         pollutant: str = 'PM2.5', model_type: str = 'auto') -> Dict:
        """
        Generate air quality forecast for a location.
        
        Args:
            lat: Latitude
            lon: Longitude  
            days: Number of days to forecast
            pollutant: Pollutant type to forecast
            model_type: 'prophet', 'linear', 'random_forest', or 'auto'
            
        Returns:
            Dict containing forecast data and metadata
        """
        try:
            logger.info(f"Generating {days}-day forecast for {pollutant} at ({lat}, {lon})")
            
            # Load historical data
            historical_data = self._load_historical_data(lat, lon, pollutant)
            
            if len(historical_data) < 10:
                logger.warning(f"Insufficient historical data ({len(historical_data)} records)")
                return self._generate_fallback_forecast(lat, lon, days, pollutant)
            
            # Choose model based on data availability and model_type
            if model_type == 'auto':
                model_type = self._select_best_model(historical_data)
            
            # Generate forecast based on selected model
            if model_type == 'prophet' and PROPHET_AVAILABLE and len(historical_data) >= 30:
                forecast_data = self._prophet_forecast(historical_data, days)
            elif model_type == 'random_forest' and len(historical_data) >= 50:
                forecast_data = self._random_forest_forecast(historical_data, days)
            else:
                forecast_data = self._linear_regression_forecast(historical_data, days)
            
            # Format response
            return {
                'status': 'success',
                'timestamp': datetime.utcnow().isoformat(),
                'location': {'lat': lat, 'lon': lon},
                'pollutant': pollutant,
                'model_type': model_type,
                'forecast_days': days,
                'forecast': forecast_data['predictions'],
                'confidence_intervals': forecast_data.get('confidence_intervals', []),
                'model_metrics': forecast_data.get('metrics', {}),
                'data_quality': {
                    'historical_records': len(historical_data),
                    'data_completeness': self._calculate_data_completeness(historical_data),
                    'last_update': historical_data[-1]['timestamp'].isoformat() if historical_data else None
                }
            }
            
        except Exception as e:
            logger.error(f"Error generating forecast: {str(e)}")
            return {
                'status': 'error',
                'message': str(e),
                'timestamp': datetime.utcnow().isoformat(),
                'fallback_forecast': self._generate_fallback_forecast(lat, lon, days, pollutant)
            }
    
    def _load_historical_data(self, lat: float, lon: float, pollutant: str, 
                             days_back: int = 90) -> List[Dict]:
        """Load historical AQI data from MongoDB."""
        try:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days_back)
            
            # Get historical records from MongoDB
            records = AQIRecord.find_by_time_range(
                start_date=start_date,
                end_date=end_date,
                lat=lat,
                lon=lon,
                radius_km=25,  # 25km radius
                pollutant=pollutant,
                limit=2000
            )
            
            # Convert to list of dictionaries
            historical_data = []
            for record in records:
                historical_data.append({
                    'timestamp': record.timestamp,
                    'value': record.value,
                    'source': record.source,
                    'lat': record.lat,
                    'lon': record.lon
                })
            
            # Sort by timestamp
            historical_data.sort(key=lambda x: x['timestamp'])
            
            logger.info(f"Loaded {len(historical_data)} historical records for {pollutant}")
            return historical_data
            
        except Exception as e:
            logger.error(f"Error loading historical data: {str(e)}")
            return []
    
    def _prophet_forecast(self, historical_data: List[Dict], days: int) -> Dict:
        """Generate forecast using Facebook Prophet."""
        try:
            # Prepare data for Prophet
            df = pd.DataFrame(historical_data)
            df['ds'] = pd.to_datetime(df['timestamp'])
            df['y'] = df['value']
            
            # Resample to daily averages
            df_daily = df.set_index('ds').resample('D')['y'].mean().reset_index()
            df_daily = df_daily.dropna()
            
            # Initialize and fit Prophet model
            model = Prophet(
                daily_seasonality=True,
                weekly_seasonality=True,
                yearly_seasonality=False,
                changepoint_prior_scale=0.05,
                interval_width=0.8
            )
            
            model.fit(df_daily)
            
            # Create future dataframe
            future = model.make_future_dataframe(periods=days)
            forecast = model.predict(future)
            
            # Extract predictions for forecast period
            forecast_period = forecast.tail(days)
            
            predictions = []
            confidence_intervals = []
            
            for _, row in forecast_period.iterrows():
                predictions.append({
                    'date': row['ds'].strftime('%Y-%m-%d'),
                    'predicted_value': max(0, round(row['yhat'], 2)),
                    'trend': round(row['trend'], 2)
                })
                
                confidence_intervals.append({
                    'date': row['ds'].strftime('%Y-%m-%d'),
                    'lower_bound': max(0, round(row['yhat_lower'], 2)),
                    'upper_bound': round(row['yhat_upper'], 2)
                })
            
            # Calculate model metrics
            historical_pred = forecast[:-days]
            actual_values = df_daily['y'].values
            predicted_values = historical_pred['yhat'].values[:len(actual_values)]
            
            metrics = {
                'mae': round(mean_absolute_error(actual_values, predicted_values), 2),
                'rmse': round(np.sqrt(mean_squared_error(actual_values, predicted_values)), 2),
                'mape': round(np.mean(np.abs((actual_values - predicted_values) / actual_values)) * 100, 2)
            }
            
            return {
                'predictions': predictions,
                'confidence_intervals': confidence_intervals,
                'metrics': metrics
            }
            
        except Exception as e:
            logger.error(f"Error in Prophet forecast: {str(e)}")
            raise
    
    def _linear_regression_forecast(self, historical_data: List[Dict], days: int) -> Dict:
        """Generate forecast using Linear Regression with time features."""
        try:
            # Prepare data
            df = pd.DataFrame(historical_data)
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df = df.sort_values('timestamp')
            
            # Create time-based features
            df['hour'] = df['timestamp'].dt.hour
            df['day_of_week'] = df['timestamp'].dt.dayofweek
            df['day_of_year'] = df['timestamp'].dt.dayofyear
            df['timestamp_numeric'] = df['timestamp'].astype(np.int64) // 10**9
            
            # Prepare features and target
            features = ['timestamp_numeric', 'hour', 'day_of_week', 'day_of_year']
            X = df[features].values
            y = df['value'].values
            
            # Scale features
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)
            
            # Train model
            model = LinearRegression()
            model.fit(X_scaled, y)
            
            # Generate future dates
            last_timestamp = df['timestamp'].iloc[-1]
            future_dates = [last_timestamp + timedelta(days=i+1) for i in range(days)]
            
            # Prepare future features
            future_features = []
            for date in future_dates:
                future_features.append([
                    date.timestamp(),
                    date.hour,
                    date.weekday(),
                    date.timetuple().tm_yday
                ])
            
            future_X = np.array(future_features)
            future_X_scaled = scaler.transform(future_X)
            
            # Make predictions
            predictions = model.predict(future_X_scaled)
            
            # Format results
            forecast_results = []
            for i, (date, pred) in enumerate(zip(future_dates, predictions)):
                forecast_results.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'predicted_value': max(0, round(pred, 2)),
                    'trend': 'stable'  # Simple trend analysis
                })
            
            # Calculate metrics on training data
            train_pred = model.predict(X_scaled)
            metrics = {
                'mae': round(mean_absolute_error(y, train_pred), 2),
                'rmse': round(np.sqrt(mean_squared_error(y, train_pred)), 2),
                'r2_score': round(model.score(X_scaled, y), 3)
            }
            
            return {
                'predictions': forecast_results,
                'metrics': metrics
            }
            
        except Exception as e:
            logger.error(f"Error in linear regression forecast: {str(e)}")
            raise
    
    def _random_forest_forecast(self, historical_data: List[Dict], days: int) -> Dict:
        """Generate forecast using Random Forest with advanced features."""
        try:
            # Prepare data with more features
            df = pd.DataFrame(historical_data)
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df = df.sort_values('timestamp')
            
            # Create advanced time features
            df['hour'] = df['timestamp'].dt.hour
            df['day_of_week'] = df['timestamp'].dt.dayofweek
            df['month'] = df['timestamp'].dt.month
            df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
            
            # Create lag features
            for lag in [1, 2, 3, 7]:
                df[f'lag_{lag}'] = df['value'].shift(lag)
            
            # Create rolling averages
            for window in [3, 7, 14]:
                df[f'rolling_mean_{window}'] = df['value'].rolling(window=window).mean()
            
            # Drop rows with NaN values
            df = df.dropna()
            
            if len(df) < 20:
                raise Exception("Insufficient data after feature engineering")
            
            # Prepare features and target
            feature_cols = ['hour', 'day_of_week', 'month', 'is_weekend'] + \
                          [f'lag_{lag}' for lag in [1, 2, 3, 7]] + \
                          [f'rolling_mean_{window}' for window in [3, 7, 14]]
            
            X = df[feature_cols].values
            y = df['value'].values
            
            # Train Random Forest model
            model = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                n_jobs=-1
            )
            model.fit(X, y)
            
            # Generate predictions
            predictions = []
            last_values = df['value'].tail(14).values  # Keep last 14 values for lag features
            
            for i in range(days):
                future_date = df['timestamp'].iloc[-1] + timedelta(days=i+1)
                
                # Create features for future date
                hour = future_date.hour
                day_of_week = future_date.weekday()
                month = future_date.month
                is_weekend = 1 if day_of_week >= 5 else 0
                
                # Use recent values for lag features
                lag_1 = last_values[-1] if len(last_values) >= 1 else df['value'].mean()
                lag_2 = last_values[-2] if len(last_values) >= 2 else df['value'].mean()
                lag_3 = last_values[-3] if len(last_values) >= 3 else df['value'].mean()
                lag_7 = last_values[-7] if len(last_values) >= 7 else df['value'].mean()
                
                # Rolling averages
                rolling_3 = np.mean(last_values[-3:]) if len(last_values) >= 3 else df['value'].mean()
                rolling_7 = np.mean(last_values[-7:]) if len(last_values) >= 7 else df['value'].mean()
                rolling_14 = np.mean(last_values) if len(last_values) >= 14 else df['value'].mean()
                
                future_features = np.array([[
                    hour, day_of_week, month, is_weekend,
                    lag_1, lag_2, lag_3, lag_7,
                    rolling_3, rolling_7, rolling_14
                ]])
                
                pred = model.predict(future_features)[0]
                pred = max(0, pred)  # Ensure non-negative
                
                predictions.append({
                    'date': future_date.strftime('%Y-%m-%d'),
                    'predicted_value': round(pred, 2),
                    'trend': self._determine_trend(last_values, pred)
                })
                
                # Update last_values for next iteration
                last_values = np.append(last_values[1:], pred)
            
            # Calculate metrics
            train_pred = model.predict(X)
            metrics = {
                'mae': round(mean_absolute_error(y, train_pred), 2),
                'rmse': round(np.sqrt(mean_squared_error(y, train_pred)), 2),
                'r2_score': round(model.score(X, y), 3),
                'feature_importance': dict(zip(feature_cols, 
                                             [round(imp, 3) for imp in model.feature_importances_]))
            }
            
            return {
                'predictions': predictions,
                'metrics': metrics
            }
            
        except Exception as e:
            logger.error(f"Error in random forest forecast: {str(e)}")
            raise
    
    def _select_best_model(self, historical_data: List[Dict]) -> str:
        """Select the best model based on data characteristics."""
        data_length = len(historical_data)
        
        if PROPHET_AVAILABLE and data_length >= 60:
            return 'prophet'
        elif data_length >= 50:
            return 'random_forest'
        else:
            return 'linear'
    
    def _determine_trend(self, recent_values: np.ndarray, predicted_value: float) -> str:
        """Determine trend direction."""
        if len(recent_values) < 3:
            return 'stable'
        
        recent_avg = np.mean(recent_values[-3:])
        
        if predicted_value > recent_avg * 1.1:
            return 'increasing'
        elif predicted_value < recent_avg * 0.9:
            return 'decreasing'
        else:
            return 'stable'
    
    def _calculate_data_completeness(self, historical_data: List[Dict]) -> float:
        """Calculate data completeness percentage."""
        if not historical_data:
            return 0.0
        
        # Calculate expected vs actual data points
        start_date = historical_data[0]['timestamp']
        end_date = historical_data[-1]['timestamp']
        expected_days = (end_date - start_date).days + 1
        
        # Group by date and count
        dates = set()
        for record in historical_data:
            dates.add(record['timestamp'].date())
        
        actual_days = len(dates)
        completeness = (actual_days / expected_days) * 100 if expected_days > 0 else 0
        
        return round(min(completeness, 100.0), 1)
    
    def _generate_fallback_forecast(self, lat: float, lon: float, days: int, 
                                   pollutant: str) -> Dict:
        """Generate simple fallback forecast when ML models can't be used."""
        try:
            # Use simple seasonal patterns and typical values
            base_values = {
                'PM2.5': 25.0,
                'PM10': 45.0,
                'NO2': 30.0,
                'O3': 65.0,
                'SO2': 15.0,
                'CO': 1.5
            }
            
            base_value = base_values.get(pollutant, 50.0)
            
            predictions = []
            for i in range(days):
                future_date = datetime.utcnow() + timedelta(days=i+1)
                
                # Add some seasonal variation
                seasonal_factor = 1.0 + 0.1 * np.sin(2 * np.pi * future_date.timetuple().tm_yday / 365)
                daily_factor = 1.0 + 0.05 * np.sin(2 * np.pi * i / 7)  # Weekly pattern
                
                predicted_value = base_value * seasonal_factor * daily_factor
                predicted_value = max(0, predicted_value + np.random.normal(0, base_value * 0.1))
                
                predictions.append({
                    'date': future_date.strftime('%Y-%m-%d'),
                    'predicted_value': round(predicted_value, 2),
                    'trend': 'stable',
                    'confidence': 'low'
                })
            
            return {
                'status': 'success',
                'timestamp': datetime.utcnow().isoformat(),
                'location': {'lat': lat, 'lon': lon},
                'pollutant': pollutant,
                'model_type': 'fallback',
                'forecast_days': days,
                'forecast': predictions,
                'data_quality': {
                    'historical_records': 0,
                    'data_completeness': 0,
                    'note': 'Insufficient historical data - using fallback model'
                }
            }
            
        except Exception as e:
            logger.error(f"Error generating fallback forecast: {str(e)}")
            return {
                'status': 'error',
                'message': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }
    
    def get_model_performance(self, lat: float, lon: float, pollutant: str) -> Dict:
        """Get model performance metrics for a location and pollutant."""
        try:
            historical_data = self._load_historical_data(lat, lon, pollutant, days_back=30)
            
            if len(historical_data) < 10:
                return {
                    'status': 'insufficient_data',
                    'message': 'Not enough historical data for performance evaluation'
                }
            
            # Split data for validation
            split_point = int(len(historical_data) * 0.8)
            train_data = historical_data[:split_point]
            test_data = historical_data[split_point:]
            
            performance = {}
            
            # Test different models
            for model_type in ['linear', 'random_forest']:
                try:
                    if model_type == 'linear':
                        result = self._linear_regression_forecast(train_data, len(test_data))
                    else:
                        result = self._random_forest_forecast(train_data, len(test_data))
                    
                    # Compare predictions with actual values
                    actual_values = [record['value'] for record in test_data]
                    predicted_values = [pred['predicted_value'] for pred in result['predictions']]
                    
                    if len(actual_values) == len(predicted_values):
                        mae = mean_absolute_error(actual_values, predicted_values)
                        rmse = np.sqrt(mean_squared_error(actual_values, predicted_values))
                        
                        performance[model_type] = {
                            'mae': round(mae, 2),
                            'rmse': round(rmse, 2),
                            'accuracy': round(100 - (mae / np.mean(actual_values) * 100), 1)
                        }
                
                except Exception as e:
                    logger.warning(f"Could not evaluate {model_type} model: {str(e)}")
                    continue
            
            return {
                'status': 'success',
                'location': {'lat': lat, 'lon': lon},
                'pollutant': pollutant,
                'evaluation_period': f"{len(test_data)} days",
                'model_performance': performance,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error evaluating model performance: {str(e)}")
            return {
                'status': 'error',
                'message': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }


# Global service instance
forecast_service = ForecastService()
