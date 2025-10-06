import os
from flask import Flask
from flask_cors import CORS
from app.config import config


def create_app(config_name=None):
    """Application factory pattern for creating Flask app."""
    
    # Create Flask application instance
    app = Flask(__name__)
    
    # Load configuration
    config_name = config_name or os.environ.get('FLASK_ENV', 'default')
    app.config.from_object(config[config_name])
    
    # Initialize CORS
    CORS(app, origins=app.config['CORS_ORIGINS'])
    
    # Register blueprints
    register_blueprints(app)
    
    # Initialize database connections
    initialize_databases(app)
    
    # Register error handlers
    register_error_handlers(app)
    
    # Add health check endpoint
    @app.route('/health')
    def health_check():
        try:
            from app.database.mongo import check_connection
            
            mongo_healthy = check_connection()
            
            return {
                'status': 'healthy' if mongo_healthy else 'degraded',
                'service': 'air-quality-forecast-api',
                'database': {
                    'mongodb': 'connected' if mongo_healthy else 'disconnected'
                }
            }, 200 if mongo_healthy else 503
            
        except Exception as e:
            return {
                'status': 'unhealthy',
                'service': 'air-quality-forecast-api',
                'error': str(e)
            }, 503
    
    return app


def register_blueprints(app):
    """Register all application blueprints."""
    try:
        from app.routes.tempo import tempo_bp
        from app.routes.ground import ground_bp
        from app.routes.weather import weather_bp
        from app.routes.forecast import forecast_bp
        from app.routes.alerts import alerts_bp
        from app.routes.admin import admin_bp
        from app.routes.realtime_tempo import realtime_tempo_bp
        from app.routes.data_fusion import data_fusion_bp
        from app.routes.three_data_types import three_data_types_bp
        
        # Register blueprints
        app.register_blueprint(tempo_bp, url_prefix='/api/tempo')
        app.register_blueprint(ground_bp, url_prefix='/api/ground')
        app.register_blueprint(weather_bp, url_prefix='/api/weather')
        app.register_blueprint(forecast_bp, url_prefix='/api/forecast')
        app.register_blueprint(alerts_bp, url_prefix='/api/alerts')
        app.register_blueprint(admin_bp, url_prefix='/api/admin')
        app.register_blueprint(realtime_tempo_bp, url_prefix='/api/realtime-tempo')
        app.register_blueprint(data_fusion_bp, url_prefix='/api/data-fusion')
        app.register_blueprint(three_data_types_bp, url_prefix='/api/three-data-types')
        
    except ImportError as e:
        app.logger.warning(f"Could not import blueprint: {e}")


def initialize_databases(app):
    try:
        from app.database.mongo import init_mongo
        from app.services.cache_service import cache_service
        from app.services.notification_service import notification_service
        from app.services.nasa_service import nasa_service
        
        # Initialize MongoDB
        init_mongo(app)
        
        # Initialize Redis cache
        cache_service.init_app(app)
        
        # Initialize notification service
        notification_service.init_app(app)
        
        # Initialize NASA service authentication
        nasa_username = app.config.get('NASA_USERNAME')
        nasa_password = app.config.get('NASA_PASSWORD')
        if nasa_username and nasa_password:
            nasa_service.authenticate(nasa_username, nasa_password)
        
        app.logger.info("All services initialized successfully")
        
    except ImportError as e:
        app.logger.warning(f"Could not initialize service: {e}")
    except Exception as e:
        app.logger.error(f"Service initialization failed: {e}")
        raise


def register_error_handlers(app):
    """Register global error handlers."""
    
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Resource not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return {'error': 'Internal server error'}, 500
    
    @app.errorhandler(400)
    def bad_request(error):
        return {'error': 'Bad request'}, 400
