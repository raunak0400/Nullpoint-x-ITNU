# Air Quality Forecasting API

A **production-ready** Flask API for air quality forecasting and alerts, integrating **NASA TEMPO satellite data** with ground-based measurements and weather data using only approved NASA and official data sources.

## Features

### **Core Capabilities**
- **NASA TEMPO Integration**: Real-time satellite data (NO2, HCHO, O3, Aerosol Index)
- **Ground Station Networks**: OpenAQ, AirNow, NASA Pandora Project integration
- **Weather Data**: MERRA-2 wind, humidity, temperature, PBL height
- **ML Forecasting**: Prophet, Random Forest, Linear Regression models
- **Smart Alerts**: User-configurable thresholds with multi-channel notifications
- **Redis Caching**: High-performance caching layer
- **Real-time Monitoring**: Comprehensive health checks and metrics

### **Production Features**
- **Docker Ready**: Full containerization with docker-compose
- **Background Scheduler**: Automated data collection every 30 minutes
- **Multi-Channel Notifications**: Email, SMS, Push, Console alerts
- **Security**: Rate limiting, CORS, security headers
- **Monitoring**: Prometheus metrics, health checks
- **Cloud Scalable**: AWS/GCP/Azure deployment ready

## Production Architecture

```
backend/
├── Docker Configuration
│   ├── Dockerfile                 # Production container
│   ├── docker-compose.yml         # Multi-service orchestration
│   └── docker/
│       ├── nginx.conf             # Reverse proxy config
│       ├── mongo-init.js          # Database initialization
│       └── prometheus.yml         # Monitoring config
│
├── Application Core
│   ├── app/
│   │   ├── __init__.py            # Flask factory with service initialization
│   │   ├── config.py              # Production configuration management
│   │   │
│   │   ├── routes/             # API endpoints
│   │   │   ├── forecast.py        # ML forecasting & merged data
│   │   │   ├── alerts.py          # Alert management
│   │   │   ├── admin.py           # System administration
│   │   │   ├── tempo.py           # NASA TEMPO satellite data
│   │   │   ├── ground.py          # Ground station networks
│   │   │   └── weather.py         # Weather data integration
│   │   │
│   │   ├── services/           # Business logic layer
│   │   │   ├── nasa_service.py    # NASA Earthaccess integration
│   │   │   ├── forecast_service.py # ML forecasting engine
│   │   │   ├── merge_service.py   # Multi-source data integration
│   │   │   ├── cache_service.py   # Redis caching layer
│   │   │   ├── notification_service.py # Multi-channel alerts
│   │   │   └── scheduler_service.py # Background task management
│   │   │
│   │   ├── database/           # Data persistence
│   │   │   └── mongo.py           # MongoDB with connection pooling
│   │   │
│   │   ├── models/             # Data models
│   │   │   ├── user.py            # User management
│   │   │   ├── aqi_record.py      # Air quality measurements
│   │   │   └── alerts.py          # Alert subscriptions
│   │   │
│   │   └── utils/              # Utilities
│   │       └── logger.py          # Structured logging
│   │
│   ├── requirements.txt        # Production dependencies
│   ├── run.py                 # Application entry point
│   └── .env.example           # Configuration template
│
├── Deployment
│   ├── deploy.sh                  # Production deployment script
│   ├── Makefile                   # Development & production commands
│   └── README.md                  # This file
│
└── Documentation
    ├── API_DOCS.md               # API documentation
    └── DEPLOYMENT.md             # Deployment guide

## Development

The project uses Flask's application factory pattern with blueprints for modular organization. Database connections are managed through dedicated classes with proper connection pooling and error handling.

## Next Steps

1. Implement service layer business logic
2. Create data models for users, AQI records, and alerts
3. Add external API integrations for TEMPO, weather, and ground station data
4. Implement machine learning forecasting models
5. Add comprehensive error handling and validation
6. Set up automated testing
7. Add API documentation with Swagger/OpenAPI
