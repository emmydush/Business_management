FROM python:3.11-slim

WORKDIR /app

# Install system dependencies required for building Python packages and connecting to PostgreSQL
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV FLASK_APP=run.py
ENV PYTHONUNBUFFERED=1
ENV PORT=5000

EXPOSE 5000

# The run.py file contains database initialization logic under if __name__ == '__main__'
CMD ["python", "run.py"]
