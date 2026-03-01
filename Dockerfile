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

# Create entrypoint script with longer init timeout
RUN echo '#!/bin/bash\n\
    set -e\n\
    echo "Waiting for services to be ready..."\n\
    sleep 10\n\
    echo "Initializing database..."\n\
    PYTHONPATH=/app python scripts/init_db_safe.py || true\
    echo "Fixing user approval status..."\
    PYTHONPATH=/app python scripts/fix_all_users_approval.py || true\n\
    echo "Starting Gunicorn..."\n\
    exec gunicorn --bind 0.0.0.0:${PORT:-5000} --workers 2 --timeout 120 run:app' > /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

# Run the entrypoint script
CMD ["/app/entrypoint.sh"]
