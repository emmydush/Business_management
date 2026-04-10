FROM python:3.11-slim

WORKDIR /app

# Install system dependencies required for building Python packages and connecting to PostgreSQL
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    python3-dev \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV FLASK_APP=run.py
ENV PYTHONUNBUFFERED=1
ENV PORT=5000

# Use gunicorn for production. 
# We run database initialization logic first, then start the server.
# The app is imported from run.py
EXPOSE 10000
CMD ["sh", "-c", "python init_db.py && gunicorn --bind 0.0.0.0:$PORT run:app"]
