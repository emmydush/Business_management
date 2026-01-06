from flask import Blueprint, jsonify
from app import db
from sqlalchemy import text

status_bp = Blueprint('status', __name__)

@status_bp.route('/health', methods=['GET'])
def get_health():
    """Lightweight public health check endpoint.
    Returns 200 when the app and database respond; otherwise returns 503.
    """
    try:
        # Quick DB check
        try:
            db.session.execute(text('SELECT 1'))
            db_status = 'Connected'
        except Exception:
            db_status = 'Unreachable'

        health = {
            'status': 'Healthy' if db_status == 'Connected' else 'Degraded',
            'database': db_status
        }

        status_code = 200 if db_status == 'Connected' else 503
        return jsonify(health), status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500
