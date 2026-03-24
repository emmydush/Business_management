# Docker Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Business Management System using Docker.

## Architecture

The Docker deployment consists of three main services:

1. **PostgreSQL Database** (`db`) - Data persistence layer
2. **Flask Backend** (`backend`) - REST API server
3. **React Frontend** (`frontend`) - Web application (served via Nginx)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Frontend   │────▶│   Backend    │────▶│  Database   │
│   (Nginx)   │     │   (Flask)    │     │ (PostgreSQL)│
│  Port 3000  │     │  Port 5000   │     │  Port 5432  │
└─────────────┘     └──────────────┘     └─────────────┘
```

## Prerequisites

- **Docker Desktop** (Windows/Mac) or **Docker Engine** + **Docker Compose** (Linux)
- Minimum 4GB RAM allocated to Docker
- At least 2GB free disk space

## Quick Start

### 1. Clone and Setup

```bash
# Clone repository
git clone <repository-url>
cd "New folder"

# Create environment file
copy .env.docker .env
```

### 2. Configure Environment Variables

Edit the `.env` file and update these critical values:

```bash
# Security Keys (REQUIRED - change in production!)
SECRET_KEY=generate-a-new-random-key-here
JWT_SECRET_KEY=generate-another-random-key-here

# Database (optional - defaults are fine for development)
DB_USER=postgres
DB_PASSWORD=your-secure-password
DB_NAME=all_inone

# Email (optional - for email notifications)
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

### 3. Build and Run

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode (background)
docker-compose up -d --build
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432

**Default Login:**
- Username: `superadmin`
- Password: `admin123`

⚠️ **Important**: Change the default password immediately!

## Common Operations

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Stopping Services

```bash
# Stop without removing data
docker-compose down

# Stop and remove volumes (DELETES ALL DATA!)
docker-compose down -v
```

### Restarting Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Rebuilding Services

```bash
# After code changes
docker-compose build --no-cache backend
docker-compose up -d backend

# Rebuild everything
docker-compose build --no-cache
docker-compose up -d
```

### Accessing Containers

```bash
# Backend shell
docker-compose exec backend bash

# Database shell
docker-compose exec db psql -U postgres -d all_inone

# Frontend shell (for debugging)
docker-compose exec frontend sh
```

### Running Migrations

```bash
# Automatic (happens on startup)
# Manual if needed:
docker-compose exec backend python run_all_migrations.py
```

### Database Backup

```bash
# Export database
docker-compose exec db pg_dump -U postgres all_inone > backup.sql

# Import database
docker-compose exec -T db psql -U postgres all_inone < backup.sql
```

### Health Checks

```bash
# Check service status
docker-compose ps

# Check backend health
curl http://localhost:5000/api/health

# Check frontend
curl http://localhost:3000
```

## Troubleshooting

### Backend Won't Start

**Issue**: Database connection timeout

```bash
# Check if database is running
docker-compose ps db

# View database logs
docker-compose logs db

# Wait for database to be ready
docker-compose logs -f db | grep "ready to accept connections"
```

**Solution**: Ensure database starts first:
```bash
docker-compose up -d db
sleep 10
docker-compose up -d backend
```

### Port Already in Use

**Issue**: Port 3000 or 5000 already in use

**Solution**: Edit `docker-compose.yml` and change port mappings:
```yaml
ports:
  - "8080:3000"  # Frontend on port 8080
```

### Out of Disk Space

**Issue**: Docker runs out of disk space

**Solutions**:
```bash
# Clean up unused containers
docker system prune

# Remove dangling images
docker image prune

# Remove all unused data (use with caution!)
docker system prune -a --volumes
```

### Database Initialization Fails

**Issue**: Tables not created on first run

**Solution**:
```bash
# Stop all services
docker-compose down

# Remove volumes (WARNING: deletes data!)
docker-compose down -v

# Rebuild and start
docker-compose up --build
```

### CORS Errors

**Issue**: Frontend can't connect to backend

**Solution**: Check `CORS_ORIGINS` in `.env`:
```bash
CORS_ORIGINS=http://localhost:3000,http://localhost:5000
```

## Production Deployment

### Security Checklist

- [ ] Change all default passwords
- [ ] Generate new `SECRET_KEY` and `JWT_SECRET_KEY`
- [ ] Use strong database password
- [ ] Enable HTTPS/TLS
- [ ] Disable `FLASK_DEBUG`
- [ ] Restrict CORS origins
- [ ] Set up firewall rules
- [ ] Configure proper logging
- [ ] Set up monitoring
- [ ] Regular security updates

### Environment Variables for Production

```bash
# .env.production
FLASK_ENV=production
FLASK_DEBUG=0
SECRET_KEY=<64-character-random-string>
JWT_SECRET_KEY=<64-character-random-string>
DB_PASSWORD=<strong-password>
CORS_ORIGINS=https://yourdomain.com
MAIL_USE_TLS=true
```

### Deploy to Production Server

```bash
# Copy files to server
scp -r . user@server:/opt/business-app

# SSH to server
ssh user@server

# Navigate to directory
cd /opt/business-app

# Create production env
cp .env.docker .env
# Edit .env with production values

# Build and deploy
docker-compose up -d --build

# Verify
docker-compose ps
docker-compose logs -f
```

### Using Docker Swarm (Optional)

For high availability:

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml business_app

# Check status
docker stack ps business_app
```

## Performance Tuning

### Backend Optimization

In `.env`:
```bash
WEB_CONCURRENCY=4  # Increase workers based on CPU cores
```

### Database Optimization

Add to `docker-compose.yml`:
```yaml
db:
  command: postgres -c shared_buffers=256MB -c max_connections=100
```

### Frontend Optimization

The frontend is already optimized with:
- Multi-stage builds
- Nginx serving static files
- Gzip compression (configure in nginx.conf)

## Monitoring and Maintenance

### Resource Usage

```bash
# Check container stats
docker stats

# Check disk usage
docker system df
```

### Log Rotation

Configure in `docker-compose.yml`:
```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Automated Backups

Create a cron job:
```bash
# Daily backup at 2 AM
0 2 * * * docker-compose exec -T db pg_dump -U postgres all_inone > /backups/db_$(date +\%Y\%m\%d).sql
```

## Updating the Application

### Update from Git Repository

```bash
# Pull latest changes
git pull origin main

# Rebuild affected services
docker-compose build --no-cache backend frontend

# Restart services
docker-compose up -d
```

### Database Migrations After Update

```bash
# Usually automatic on startup
# If manual migration needed:
docker-compose exec backend python run_all_migrations.py
```

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Review documentation: `/docs` folder
- Contact: support team
