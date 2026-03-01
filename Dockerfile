# Multi-stage build: First stage - build the React frontend
FROM node:18-alpine AS frontend-builder

# Set working directory for frontend
WORKDIR /frontend

# Disable source maps to avoid noisy library source-map parse warnings
ENV GENERATE_SOURCEMAP=false

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
    FLASK_ENV=production

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    postgresql-client \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY ./backend/requirements.txt /app/requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY ./backend /app/

# Copy built frontend files from the first stage
COPY --from=frontend-builder /frontend/build /app/frontend/build

# Create uploads directory
RUN mkdir -p /app/static/uploads

# Expose port
EXPOSE 5000

# Create entrypoint script with longer init timeout and inline DB init
RUN cat > /app/entrypoint.sh << 'EOF'
#!/bin/bash
set -e
echo "Waiting for services to be ready..."
sleep 10
echo "Initializing database..."
PYTHONPATH=/app python - << 'PY'
try:
    from app import create_app, db
    app = create_app()
    with app.app_context():
        db.create_all()
    print("Database tables ensured")
except Exception as e:
    print(f"Database init skipped due to error: {e}")
PY
echo "Starting Gunicorn..."
export WORKERS=${WEB_CONCURRENCY:-2}
echo "Using WEB_CONCURRENCY=${WORKERS}, PORT=${PORT:-5000}"
exec gunicorn --bind 0.0.0.0:${PORT:-5000} --workers ${WORKERS} --timeout 120 run:app
EOF
RUN tr -d '\r' < /app/entrypoint.sh > /app/entrypoint.sh.tmp && mv /app/entrypoint.sh.tmp /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Run the entrypoint script
CMD ["/app/entrypoint.sh"]
