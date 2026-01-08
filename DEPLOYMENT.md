# Deployment Guide

This guide explains how to deploy the Business Management application to Render.

## Render Configuration

### Environment Variables

Add these environment variables to your Render service:

#### Required Variables
- `SECRET_KEY`: Your secret key for cryptographic operations
- `JWT_SECRET_KEY`: Secret key for JWT token generation
- `DATABASE_URL`: PostgreSQL database connection string
- `MAIL_SERVER`: SMTP server address (e.g., smtp.gmail.com)
- `MAIL_PORT`: SMTP server port (e.g., 587)
- `MAIL_USE_TLS`: Set to true for TLS encryption
- `MAIL_USERNAME`: SMTP username
- `MAIL_PASSWORD`: SMTP password
- `MAIL_DEFAULT_SENDER`: Default sender email address

### Render Service Configuration

Your Render service ID is: `srv-d5g15tuuk2gs7399bmpg`

To connect to the Render API, you can use the API key: `rnd_mw77RjPsNreFUglwog5J166gygIu`

### Deployment Steps

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the build command to: `cd backend && pip install -r requirements.txt`
4. Set the start command to: `cd backend && gunicorn --bind 0.0.0.0:$PORT --workers 2 run:app`
5. Add the required environment variables
6. Set the runtime to Python

### Alternative: Using render.yaml

You can also use the provided `render.yaml` file in the root of the project to automatically configure your Render deployment.

## Database Setup

Render will automatically provision a PostgreSQL database when you follow the configuration in `render.yaml`.

## Email Configuration

Email settings can be configured either through environment variables (as shown above) or through the database via the superadmin panel. The application prioritizes database-stored settings when available, falling back to environment variables.

## Troubleshooting

If you encounter issues during deployment:

1. Check that all required environment variables are set
2. Ensure the database connection string is correct
3. Verify that Flask-Mail is properly configured
4. Confirm that the port binding uses the `$PORT` environment variable provided by Render