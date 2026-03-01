#!/usr/bin/env python3
"""
Backend server module for the Business Management System
Used in packaged Electron application
"""

import sys
import os
import subprocess
import threading
import time
from waitress import serve
from app import create_app

def start_backend():
    """Start the Flask backend server"""
    app = create_app()
    
    # In production mode, use waitress to serve the application
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '127.0.0.1')
    print(f"Starting backend server on {host}:{port}...")
    serve(app, host=host, port=port, threads=4)
    
if __name__ == "__main__":
    start_backend()