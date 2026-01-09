#!/bin/bash

# Script to create a superadmin user in Render environment
# Usage: ./create_superadmin_render.sh --username <username> --email <email> --password <password>

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --username)
            USERNAME="$2"
            shift 2
            ;;
        --email)
            EMAIL="$2"
            shift 2
            ;;
        --password)
            PASSWORD="$2"
            shift 2
            ;;
        --first-name)
            FIRST_NAME="$2"
            shift 2
            ;;
        --last-name)
            LAST_NAME="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 --username <username> --email <email> --password <password> [--first-name <first-name>] [--last-name <last-name>]"
            exit 1
            ;;
    esac
done

# Check if required parameters are provided
if [ -z "$USERNAME" ] || [ -z "$EMAIL" ] || [ -z "$PASSWORD" ]; then
    echo "Error: Missing required parameters"
    echo "Usage: $0 --username <username> --email <email> --password <password> [--first-name <first-name>] [--last-name <last-name>]"
    exit 1
fi

# Set default values if not provided
FIRST_NAME=${FIRST_NAME:-"Super"}
LAST_NAME=${LAST_NAME:-"Admin"}

echo "Creating superadmin user: $USERNAME with email: $EMAIL"

# Run the Python script to create the superadmin user
cd /app  # In Render, the app is typically in /app directory
python scripts/create_superadmin.py --username "$USERNAME" --email "$EMAIL" --password "$PASSWORD" --first-name "$FIRST_NAME" --last-name "$LAST_NAME"

if [ $? -eq 0 ]; then
    echo "Superadmin user created successfully!"
else
    echo "Failed to create superadmin user!"
    exit 1
fi