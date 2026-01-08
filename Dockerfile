# Use Python 3.10 slim image as base
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

# Create uploads directory
RUN mkdir -p /app/static/uploads

# Expose port
EXPOSE 5000

# Run the application
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120", "run:app"]