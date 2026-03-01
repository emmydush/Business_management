# Multi-stage build: First stage - build the React frontend
FROM node:18-alpine AS frontend-builder

# Set working directory for frontend
WORKDIR /frontend

# Disable source maps to avoid noisy library source-map parse warnings
ENV GENERATE_SOURCEMAP=false
ENV NODE_OPTIONS=--max-old-space-size=2048

# Copy frontend package files
COPY ./frontend/package.json ./frontend/package-lock.json ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source code
COPY ./frontend/ ./

# Build the frontend
RUN npm run build


# Second stage - build the Flask backend
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_APP=run.py \
    FLASK_ENV=production \
    PORT=5000

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
        gcc \
        g++ \
        curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy requirements first to leverage Docker cache
COPY ./backend/requirements.txt /app/requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt \
    && pip cache purge

# Copy backend application code
COPY ./backend /app/

# Copy built frontend files from the first stage
COPY --from=frontend-builder /frontend/build /app/frontend/build

# Create uploads directory
RUN mkdir -p /app/static/uploads

# Expose port
EXPOSE 5000

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Create entrypoint script with better error handling and health check endpoint
RUN <<'SCRIPT'
cat > /app/entrypoint.sh << 'EOF'
#!/bin/sh
set -e

echo "Starting Business Management System..."
echo "Environment: Production"
echo "Port: ${PORT:-5000}"
echo "Workers: ${WEB_CONCURRENCY:-2}"

echo "Waiting for database connection..."
sleep 5

echo "Initializing database..."
PYTHONPATH=/app python - << 'PY'
import os
import sys
sys.path.append('/app')
try:
    from app import create_app, db
    app = create_app()
    with app.app_context():
        db.create_all()
    print("✓ Database tables initialized successfully")
except Exception as e:
    print(f"⚠ Database initialization warning: {e}")
    print("Continuing startup...")
PY

echo "Starting Gunicorn server..."
export WORKERS=${WEB_CONCURRENCY:-2}
echo "Using $WORKERS workers on port ${PORT:-5000}"

# Start gunicorn with proper configuration
exec gunicorn \
    --bind 0.0.0.0:${PORT:-5000} \
    --workers ${WORKERS} \
    --worker-class sync \
    --timeout 120 \
    --keep-alive 2 \
    --max-requests 1000 \
    --max-requests-jitter 50 \
    --preload \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    run:app
EOF

chmod +x /app/entrypoint.sh
SCRIPT

# Run the entrypoint script
CMD ["/app/entrypoint.sh"]
