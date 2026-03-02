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

echo "Ensuring default superadmin exists..."
PYTHONPATH=/app python /app/scripts/create_default_superadmin.py || echo "Superadmin creation script failed"

echo "Starting Gunicorn server..."
export WORKERS=${WEB_CONCURRENCY:-2}
echo "Using $WORKERS workers on port ${PORT:-5000}"

echo "Testing application import..."
PYTHONPATH=/app python -c "from app import create_app; app = create_app(); print('✓ Application imported successfully')" || {
    echo "✗ Failed to import application"
    exit 1
}

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
    --capture-output \
    run:app
