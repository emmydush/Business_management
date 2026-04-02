# Stage 1: Build the React frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy frontend package files and install dependencies
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

# Copy the rest of the frontend source code and build
COPY frontend/ ./
RUN npm run build

# Stage 2: Setup the Python backend (which will serve the frontend)
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies required for PostgreSQL and Python packages
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    python3-dev \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install them
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy the rest of the backend source code
COPY backend/ ./backend/

# Copy the built React app from the first stage into the expected folder
# The Flask app in __init__.py is already configured to serve from 'frontend/build'
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# Expose the standard backend port
EXPOSE 5000

# Set environment variables for production
ENV PORT=5000
ENV FLASK_APP=backend/run.py
ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1

# Change working directory so run.py context is correct
WORKDIR /app/backend

# Start the Flask application
CMD ["python", "run.py"]
