"""
Run this script to poll pending payroll disbursements and update their status.
Usage: activate your venv and run `python backend/scripts/check_disbursements.py`
"""
import os
from datetime import datetime

from dotenv import load_dotenv

# Ensure imports work by adding backend to path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
import sys
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

load_dotenv(os.path.join(BASE_DIR, '.env'))

from app import create_app, db
from app.models.payroll import Payroll, PayrollStatus
from app.utils import momo


def run():
    app = create_app()
    with app.app_context():
        # Find payrolls with pending disbursement_status
        pending = Payroll.query.filter(Payroll.disbursement_status.in_(['pending', 'initiated', None]), Payroll.disbursement_reference.isnot(None)).all()
        print(f'Found {len(pending)} pending disbursements')

        for p in pending:
            ref = p.disbursement_reference
            try:
                status_res = momo.check_disbursement_status(ref)
                print(ref, status_res)
                if status_res.get('success') and status_res.get('status'):
                    status = status_res.get('status')
                    p.disbursement_status = status
                    p.disbursement_metadata = status_res.get('data') or status_res
                    if status.upper() in ['SUCCESSFUL', 'COMPLETED', 'SUCCESS']:
                        p.status = PayrollStatus.PAID
                        p.payment_date = datetime.utcnow().date()
                        p.disbursed_at = datetime.utcnow()
                    db.session.add(p)
                    db.session.commit()
            except Exception as e:
                print('Error checking', ref, e)


if __name__ == '__main__':
    run()
