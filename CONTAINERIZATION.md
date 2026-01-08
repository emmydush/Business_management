# Containerization Guide

This project is containerized using Docker and Docker Compose. Follow the instructions below to build and run the application in containers.

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose (usually included with Docker Desktop)

## Quick Start

### Production Mode

To run the application in production mode:

```bash
# Navigate to the project directory
cd "e:/New folder"

# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up --build -d
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Development Mode

To run the application in development mode (with live reloading):

```bash
# Navigate to the project directory
cd "e:/New folder"

# Build and start all services in development mode
docker-compose -f docker-compose.dev.yml up --build

# Or run in detached mode
docker-compose -f docker-compose.dev.yml up --build -d
```

## Services

The application consists of three services:

1. **Database** (`db`)
   - PostgreSQL 15
   - Port: 5432
   - Data persisted in `postgres_data` volume

2. **Backend** (`backend`)
   - Flask application with Gunicorn
   - Port: 5000
   - Uses production or development settings based on compose file

3. **Frontend** (`frontend`)
   - React application served by Nginx
   - Port: 3000
   - Proxies API requests to backend

## Environment Variables

The following environment variables can be customized:

### Backend
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: Flask secret key
- `JWT_SECRET_KEY`: JWT signing key
- `MAIL_*`: Email configuration variables

### Frontend
The frontend is configured to proxy API requests to the backend service.

## Building Images

To build the images individually:

```bash
# Build backend image
docker build -t business-management-backend .

# Build frontend image
cd frontend
docker build -t business-management-frontend .
```

## Managing Containers

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (removes database data)
docker-compose down -v

# View logs
docker-compose logs -f

# Execute commands in running containers
docker-compose exec backend bash
docker-compose exec db psql -U postgres
```

## Development Notes

- In development mode, code changes are reflected immediately due to volume mounting
- The database data persists between container restarts
- Make sure to stop containers when not in use to free up resources

## Troubleshooting

1. **Port already in use**: Make sure ports 3000 and 5000 are available
2. **Database connection errors**: Wait for the database to fully start before the backend
3. **Building issues**: Check that all required files are present in the build context