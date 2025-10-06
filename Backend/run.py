#!/usr/bin/env python3
"""
Air Quality Forecasting Web App
Entry point for the Flask application.
"""

import os
import atexit
import signal
import sys
from app import create_app
from app.utils.logger import setup_logger
from app.services.scheduler_service import scheduler_service

# Setup logging
logger = setup_logger(__name__)

# Create Flask application
app = create_app()

def start_scheduler():
    """Start the background scheduler."""
    try:
        scheduler_service.start()
        logger.info("Background scheduler started successfully")
    except Exception as e:
        logger.error(f"Failed to start scheduler: {str(e)}")

def stop_scheduler():
    """Stop the background scheduler."""
    try:
        scheduler_service.stop()
        logger.info("Background scheduler stopped")
    except Exception as e:
        logger.error(f"Error stopping scheduler: {str(e)}")

def signal_handler(signum, frame):
    """Handle shutdown signals."""
    logger.info(f"Received signal {signum}, shutting down gracefully...")
    stop_scheduler()
    sys.exit(0)

if __name__ == '__main__':
    # Get configuration from environment
    host = os.environ.get('HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    enable_scheduler = os.environ.get('ENABLE_SCHEDULER', 'True').lower() == 'true'
    
    logger.info(f"Starting Air Quality Forecasting API on {host}:{port}")
    logger.info(f"Debug mode: {debug}")
    logger.info(f"Background scheduler: {'enabled' if enable_scheduler else 'disabled'}")
    
    # Start background scheduler if enabled
    if enable_scheduler:
        start_scheduler()
        
        # Register cleanup handlers
        atexit.register(stop_scheduler)
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        # Run the application
        app.run(
            host=host,
            port=port,
            debug=debug,
            threaded=True,
            use_reloader=False  # Disable reloader to prevent scheduler conflicts
        )
    except KeyboardInterrupt:
        logger.info("Application interrupted by user")
    except Exception as e:
        logger.error(f"Application error: {str(e)}")
    finally:
        if enable_scheduler:
            stop_scheduler()
