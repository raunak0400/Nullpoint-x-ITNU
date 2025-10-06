#!/bin/bash

# Production deployment script for Air Quality Forecasting API
set -e

echo "🚀 Starting Air Quality API Deployment..."

# Configuration
ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.yml"

if [ "$ENVIRONMENT" = "development" ]; then
    COMPOSE_FILE="docker-compose.dev.yml"
fi

echo "📋 Environment: $ENVIRONMENT"
echo "📋 Compose file: $COMPOSE_FILE"

# Pre-deployment checks
echo "🔍 Running pre-deployment checks..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if required environment file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please copy .env.example to .env and configure it."
    exit 1
fi

# Validate environment variables
echo "🔧 Validating environment configuration..."
source .env

required_vars=("SECRET_KEY" "MONGO_DB")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required environment variable $var is not set."
        exit 1
    fi
done

# Build and deploy
echo "🏗️  Building application..."
docker-compose -f $COMPOSE_FILE build --no-cache

echo "🗄️  Starting services..."
docker-compose -f $COMPOSE_FILE up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Health checks
echo "🏥 Running health checks..."

# Check MongoDB
if docker-compose -f $COMPOSE_FILE exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "✅ MongoDB is healthy"
else
    echo "❌ MongoDB health check failed"
    exit 1
fi

# Check Redis
if docker-compose -f $COMPOSE_FILE exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is healthy"
else
    echo "❌ Redis health check failed"
    exit 1
fi

# Check API
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ API is healthy"
else
    echo "❌ API health check failed"
    exit 1
fi

# Display service status
echo "📊 Service Status:"
docker-compose -f $COMPOSE_FILE ps

echo "🎉 Deployment completed successfully!"
echo ""
echo "📡 API Endpoints:"
echo "   Health Check: http://localhost:5000/health"
echo "   API Docs: http://localhost:5000/api/"
echo "   Admin Panel: http://localhost:5000/api/admin/"
echo ""
echo "🔧 Management Commands:"
echo "   View logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "   Stop services: docker-compose -f $COMPOSE_FILE down"
echo "   Restart: docker-compose -f $COMPOSE_FILE restart"
echo ""
echo "📈 Monitoring (if enabled):"
echo "   Prometheus: http://localhost:9090"
echo ""
