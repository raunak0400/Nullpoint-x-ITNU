# Air Quality Forecasting API - Production Makefile

.PHONY: help install dev test build deploy clean logs status

# Default target
help:
	@echo "🌬️  Air Quality Forecasting API - Production Commands"
	@echo ""
	@echo "📦 Setup Commands:"
	@echo "  make install     - Install dependencies"
	@echo "  make setup       - Setup environment and database"
	@echo ""
	@echo "🚀 Development Commands:"
	@echo "  make dev         - Run development server"
	@echo "  make test        - Run tests"
	@echo "  make lint        - Run code linting"
	@echo ""
	@echo "🏗️  Production Commands:"
	@echo "  make build       - Build Docker images"
	@echo "  make deploy      - Deploy to production"
	@echo "  make deploy-dev  - Deploy to development"
	@echo ""
	@echo "🔧 Management Commands:"
	@echo "  make logs        - View application logs"
	@echo "  make status      - Check service status"
	@echo "  make clean       - Clean up containers and images"
	@echo "  make backup      - Backup database"
	@echo "  make restore     - Restore database"

# Setup and Installation
install:
	@echo "📦 Installing dependencies..."
	pip install -r requirements.txt

setup:
	@echo "🔧 Setting up environment..."
	@if [ ! -f .env ]; then cp .env.example .env; echo "📝 Created .env file from template"; fi
	@echo "✅ Environment setup complete"
	@echo "📝 Please edit .env file with your configuration"

# Development
dev:
	@echo "🚀 Starting development server..."
	python run.py

test:
	@echo "🧪 Running tests..."
	python -m pytest tests/ -v --cov=app --cov-report=html

lint:
	@echo "🔍 Running code linting..."
	flake8 app/ --max-line-length=100
	black app/ --check
	isort app/ --check-only

format:
	@echo "🎨 Formatting code..."
	black app/
	isort app/

# Production Deployment
build:
	@echo "🏗️  Building Docker images..."
	docker-compose build --no-cache

deploy:
	@echo "🚀 Deploying to production..."
	chmod +x deploy.sh
	./deploy.sh production

deploy-dev:
	@echo "🚀 Deploying to development..."
	chmod +x deploy.sh
	./deploy.sh development

# Management
logs:
	@echo "📋 Viewing application logs..."
	docker-compose logs -f app

logs-all:
	@echo "📋 Viewing all service logs..."
	docker-compose logs -f

status:
	@echo "📊 Checking service status..."
	docker-compose ps
	@echo ""
	@echo "🏥 Health checks:"
	@curl -s http://localhost:5000/health | jq . || echo "❌ API not responding"

clean:
	@echo "🧹 Cleaning up containers and images..."
	docker-compose down -v
	docker system prune -f
	docker volume prune -f

# Database Management
backup:
	@echo "💾 Creating database backup..."
	@mkdir -p backups
	docker-compose exec mongodb mongodump --db airquality_prod --out /tmp/backup
	docker cp $$(docker-compose ps -q mongodb):/tmp/backup ./backups/backup_$$(date +%Y%m%d_%H%M%S)
	@echo "✅ Backup created in backups/ directory"

restore:
	@echo "🔄 Restoring database..."
	@if [ -z "$(BACKUP_PATH)" ]; then echo "❌ Please specify BACKUP_PATH=path/to/backup"; exit 1; fi
	docker cp $(BACKUP_PATH) $$(docker-compose ps -q mongodb):/tmp/restore
	docker-compose exec mongodb mongorestore --db airquality_prod /tmp/restore
	@echo "✅ Database restored"

# Monitoring
monitor:
	@echo "📈 Opening monitoring dashboard..."
	@echo "Prometheus: http://localhost:9090"
	@echo "API Health: http://localhost:5000/health"
	@echo "Admin Panel: http://localhost:5000/api/admin/stats"

# Security
security-scan:
	@echo "🔒 Running security scan..."
	docker run --rm -v $(PWD):/app securecodewarrior/docker-security-scanner /app

# Performance Testing
load-test:
	@echo "⚡ Running load tests..."
	@if command -v ab > /dev/null; then \
		ab -n 1000 -c 10 http://localhost:5000/health; \
	else \
		echo "❌ Apache Bench (ab) not installed. Install with: apt-get install apache2-utils"; \
	fi

# API Documentation
docs:
	@echo "📚 Generating API documentation..."
	@echo "API endpoints available at:"
	@echo "  GET  /health                     - Health check"
	@echo "  GET  /api/forecast/              - ML-based forecasting"
	@echo "  GET  /api/forecast/merged        - Merged data from all sources"
	@echo "  GET  /api/forecast/performance   - Model performance metrics"
	@echo "  GET  /api/admin/scheduler/status - Scheduler status"
	@echo "  POST /api/admin/scheduler/start  - Start scheduler"
	@echo "  GET  /api/admin/stats            - System statistics"

# Environment Management
env-prod:
	@echo "🏭 Switching to production environment..."
	@cp .env.production .env 2>/dev/null || echo "❌ .env.production not found"

env-dev:
	@echo "🔧 Switching to development environment..."
	@cp .env.development .env 2>/dev/null || cp .env.example .env

# Quick Start
quick-start: setup install build deploy
	@echo "🎉 Quick start completed!"
	@echo "🌐 API available at: http://localhost:5000"
