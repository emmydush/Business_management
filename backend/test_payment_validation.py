#!/usr/bin/env python3
import sys
sys.path.append('.')
from app import create_app, db
from app.models.invoice import Invoice, InvoiceStatus
from datetime import datetime, timedelta
import re

app = create_app()
with app.app_context():
    try:
        print('Testing payment validation exactly as implemented...')
        
        # Test case: 3600
        amount_input = '3600'
        print(f'Testing amount input: {amount_input}')
        
        # Exact same validation logic as in record_invoice_payment
        amount_str = str(amount_input).strip()
        print(f'amount_str after strip: {amount_str}')
        
        # Remove common currency symbols but keep numbers and decimal point
        cleaned_amount = re.sub(r'[^\d.]', '', amount_str)
        print(f'cleaned_amount: {cleaned_amount}')
        
        # Validate that we have a valid number after cleaning
        print(f'not cleaned_amount: {not cleaned_amount}')
        print(f'cleaned_amount == .: {cleaned_amount == "."}')
        
        if not cleaned_amount or cleaned_amount == '.':
            error_msg = 'Please enter a valid payment amount'
            print(f'ERROR: {error_msg} - Original: {amount_str}')
            print('This should NOT trigger for 3600')
        else:
            try:
                payment_amount = float(cleaned_amount)
                print(f'Successfully converted: {amount_input} -> {payment_amount}')
                print('This should work for 3600')
            except (ValueError, TypeError):
                error_msg = 'Please enter a valid payment amount'
                print(f'ERROR: {error_msg} - Original: {amount_input}, Cleaned: {cleaned_amount}')
        
    except Exception as e:
        print('Test Error:', e)
        import traceback
        traceback.print_exc()
