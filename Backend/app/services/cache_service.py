import json
import pickle
import hashlib
from datetime import datetime, timedelta
from typing import Any, Optional, Dict, List
from functools import wraps
import redis
from flask import current_app

from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class CacheService:
    """Redis-based caching service for production performance."""
    
    def __init__(self):
        self.redis_client = None
        self.default_ttl = 3600  # 1 hour default TTL
        self.is_connected = False
    
    def init_app(self, app):
        """Initialize Redis connection with Flask app."""
        try:
            redis_host = app.config.get('REDIS_HOST', 'localhost')
            redis_port = app.config.get('REDIS_PORT', 6379)
            redis_db = app.config.get('REDIS_DB', 0)
            redis_password = app.config.get('REDIS_PASSWORD', None)
            
            self.redis_client = redis.Redis(
                host=redis_host,
                port=redis_port,
                db=redis_db,
                password=redis_password,
                decode_responses=True,
                socket_timeout=5,
                socket_connect_timeout=5,
                retry_on_timeout=True,
                health_check_interval=30
            )
            
            # Test connection
            self.redis_client.ping()
            self.is_connected = True
            
            logger.info(f"Redis cache connected: {redis_host}:{redis_port}")
            
        except Exception as e:
            logger.warning(f"Redis cache not available: {str(e)}")
            self.is_connected = False
    
    def _generate_key(self, prefix: str, *args, **kwargs) -> str:
        """Generate cache key from prefix and parameters."""
        key_data = f"{prefix}:{':'.join(map(str, args))}"
        if kwargs:
            sorted_kwargs = sorted(kwargs.items())
            key_data += f":{':'.join(f'{k}={v}' for k, v in sorted_kwargs)}"
        
        # Hash long keys to avoid Redis key length limits
        if len(key_data) > 200:
            key_hash = hashlib.md5(key_data.encode()).hexdigest()
            return f"{prefix}:hash:{key_hash}"
        
        return key_data
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        if not self.is_connected:
            return None
        
        try:
            value = self.redis_client.get(key)
            if value is None:
                return None
            
            # Try to deserialize as JSON first, then pickle
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return pickle.loads(value.encode('latin1'))
                
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {str(e)}")
            return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache with TTL."""
        if not self.is_connected:
            return False
        
        try:
            ttl = ttl or self.default_ttl
            
            # Try to serialize as JSON first, then pickle
            try:
                serialized_value = json.dumps(value, default=str)
            except (TypeError, ValueError):
                serialized_value = pickle.dumps(value).decode('latin1')
            
            return self.redis_client.setex(key, ttl, serialized_value)
            
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {str(e)}")
            return False
    
    def delete(self, key: str) -> bool:
        """Delete key from cache."""
        if not self.is_connected:
            return False
        
        try:
            return bool(self.redis_client.delete(key))
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {str(e)}")
            return False
    
    def exists(self, key: str) -> bool:
        """Check if key exists in cache."""
        if not self.is_connected:
            return False
        
        try:
            return bool(self.redis_client.exists(key))
        except Exception as e:
            logger.error(f"Cache exists error for key {key}: {str(e)}")
            return False
    
    def flush_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern."""
        if not self.is_connected:
            return 0
        
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                return self.redis_client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Cache flush pattern error for {pattern}: {str(e)}")
            return 0
    
    def get_stats(self) -> Dict:
        """Get cache statistics."""
        if not self.is_connected:
            return {'status': 'disconnected'}
        
        try:
            info = self.redis_client.info()
            return {
                'status': 'connected',
                'used_memory': info.get('used_memory_human', 'N/A'),
                'connected_clients': info.get('connected_clients', 0),
                'total_commands_processed': info.get('total_commands_processed', 0),
                'keyspace_hits': info.get('keyspace_hits', 0),
                'keyspace_misses': info.get('keyspace_misses', 0),
                'hit_rate': self._calculate_hit_rate(info)
            }
        except Exception as e:
            logger.error(f"Cache stats error: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    def _calculate_hit_rate(self, info: Dict) -> float:
        """Calculate cache hit rate percentage."""
        hits = info.get('keyspace_hits', 0)
        misses = info.get('keyspace_misses', 0)
        total = hits + misses
        
        if total == 0:
            return 0.0
        
        return round((hits / total) * 100, 2)
    
    # Specialized cache methods for air quality data
    def cache_forecast(self, lat: float, lon: float, pollutant: str, 
                      days: int, forecast_data: Dict, ttl: int = 1800) -> bool:
        """Cache forecast data (30 min TTL)."""
        key = self._generate_key('forecast', lat, lon, pollutant, days)
        return self.set(key, forecast_data, ttl)
    
    def get_cached_forecast(self, lat: float, lon: float, pollutant: str, 
                           days: int) -> Optional[Dict]:
        """Get cached forecast data."""
        key = self._generate_key('forecast', lat, lon, pollutant, days)
        return self.get(key)
    
    def cache_aqi_data(self, lat: float, lon: float, source: str, 
                       aqi_data: Dict, ttl: int = 900) -> bool:
        """Cache AQI data (15 min TTL)."""
        key = self._generate_key('aqi', lat, lon, source)
        return self.set(key, aqi_data, ttl)
    
    def get_cached_aqi_data(self, lat: float, lon: float, source: str) -> Optional[Dict]:
        """Get cached AQI data."""
        key = self._generate_key('aqi', lat, lon, source)
        return self.get(key)
    
    def cache_weather_data(self, lat: float, lon: float, weather_data: Dict, 
                          ttl: int = 3600) -> bool:
        """Cache weather data (1 hour TTL)."""
        key = self._generate_key('weather', lat, lon)
        return self.set(key, weather_data, ttl)
    
    def get_cached_weather_data(self, lat: float, lon: float) -> Optional[Dict]:
        """Get cached weather data."""
        key = self._generate_key('weather', lat, lon)
        return self.get(key)
    
    def invalidate_location_cache(self, lat: float, lon: float):
        """Invalidate all cache entries for a location."""
        patterns = [
            f'forecast:{lat}:{lon}:*',
            f'aqi:{lat}:{lon}:*',
            f'weather:{lat}:{lon}:*'
        ]
        
        total_deleted = 0
        for pattern in patterns:
            total_deleted += self.flush_pattern(pattern)
        
        logger.info(f"Invalidated {total_deleted} cache entries for location ({lat}, {lon})")
        return total_deleted


# Decorator for caching function results
def cached(ttl: int = 3600, key_prefix: str = 'func'):
    """Decorator to cache function results."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not cache_service.is_connected:
                return func(*args, **kwargs)
            
            # Generate cache key
            cache_key = cache_service._generate_key(
                f"{key_prefix}:{func.__name__}", *args, **kwargs
            )
            
            # Try to get from cache
            cached_result = cache_service.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit for {func.__name__}")
                return cached_result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            cache_service.set(cache_key, result, ttl)
            logger.debug(f"Cache miss for {func.__name__}, result cached")
            
            return result
        return wrapper
    return decorator


# Global cache service instance
cache_service = CacheService()
