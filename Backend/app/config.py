import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    """Base configuration class."""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    
    # MongoDB Database Configuration
    MONGO_HOST = os.environ.get('MONGO_HOST', 'localhost')
    MONGO_PORT = os.environ.get('MONGO_PORT', '27017')
    MONGO_DB = os.environ.get('MONGO_DB', 'airquality_mongo')
    MONGO_USER = os.environ.get('MONGO_USER', '')
    MONGO_PASSWORD = os.environ.get('MONGO_PASSWORD', '')
    MONGO_URI = os.environ.get('MONGO_URI', '')
    
    # API Keys for external services
    TEMPO_API_KEY = os.environ.get('TEMPO_API_KEY')
    WEATHER_API_KEY = os.environ.get('WEATHER_API_KEY')
    GROUND_STATION_API_KEY = os.environ.get('GROUND_STATION_API_KEY')
    
    # Redis Cache Configuration
    REDIS_HOST = os.environ.get('REDIS_HOST', 'localhost')
    REDIS_PORT = int(os.environ.get('REDIS_PORT', '6379'))
    REDIS_DB = int(os.environ.get('REDIS_DB', '0'))
    REDIS_PASSWORD = os.environ.get('REDIS_PASSWORD', None)
    
    # NASA Earthdata Configuration
    NASA_USERNAME = os.environ.get('NASA_USERNAME', '')
    NASA_PASSWORD = os.environ.get('NASA_PASSWORD', '')
    
    # Email Notification Configuration
    SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
    SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
    SMTP_USERNAME = os.environ.get('SMTP_USERNAME', '')
    SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
    FROM_EMAIL = os.environ.get('FROM_EMAIL', 'noreply@airquality.com')
    FROM_NAME = os.environ.get('FROM_NAME', 'Air Quality Alert System')
    
    # SMS Configuration (Twilio)
    SMS_PROVIDER = os.environ.get('SMS_PROVIDER', 'twilio')
    TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', '')
    TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '')
    TWILIO_FROM_NUMBER = os.environ.get('TWILIO_FROM_NUMBER', '')
    
    # AWS Configuration (for SNS, S3, etc.)
    AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID', '')
    AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY', '')
    AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')
    
    # Push Notification Configuration
    FCM_SERVER_KEY = os.environ.get('FCM_SERVER_KEY', '')
    APNS_KEY_ID = os.environ.get('APNS_KEY_ID', '')
    APNS_TEAM_ID = os.environ.get('APNS_TEAM_ID', '')
    APNS_BUNDLE_ID = os.environ.get('APNS_BUNDLE_ID', '')
    
    # Application settings
    DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'
    TESTING = False
    
    # CORS settings
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')
    
    # Forecast settings
    FORECAST_DAYS = int(os.environ.get('FORECAST_DAYS', '7'))
    UPDATE_INTERVAL_HOURS = int(os.environ.get('UPDATE_INTERVAL_HOURS', '6'))
    
    # Alert thresholds
    AQI_ALERT_THRESHOLD = int(os.environ.get('AQI_ALERT_THRESHOLD', '150'))
    
    # Monitoring and Logging
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    ENABLE_METRICS = os.environ.get('ENABLE_METRICS', 'True').lower() == 'true'
    
    @property
    def mongo_url(self):
        """Generate MongoDB connection URL."""
        # Use MONGO_URI if provided, otherwise build from components
        if self.MONGO_URI:
            return self.MONGO_URI
        
        if self.MONGO_USER and self.MONGO_PASSWORD:
            return f"mongodb://{self.MONGO_USER}:{self.MONGO_PASSWORD}@{self.MONGO_HOST}:{self.MONGO_PORT}/{self.MONGO_DB}"
        return f"mongodb://{self.MONGO_HOST}:{self.MONGO_PORT}/{self.MONGO_DB}"


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True


class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False


class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    MONGO_DB = 'airquality_test_mongo'


# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
