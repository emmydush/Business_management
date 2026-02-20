import os
from flask import current_app
from app.utils.email_service import EmailService
from app.utils.email_templates import (
    get_registration_received_template,
    get_approval_template,
    get_rejection_template,
    get_password_reset_template,
    get_staff_welcome_template,
    get_superadmin_notification_template,
    get_business_blocked_template,
    get_business_activated_template,
    get_low_stock_report_template,
    get_expired_products_report_template
)

def send_email_with_business_context(to_email, subject, body, business_id=None, force=False, html_body=None):
    """
    Sends an email using the EmailService which retrieves settings from database.
    If settings are missing, it logs the email to console (mock mode).
    """
    try:
        result = EmailService.send_email(
            to_email=to_email,
            subject=subject,
            body=body,
            business_id=business_id,
            force=force,
            html_body=html_body
        )
        
        if result['success']:
            return True
        else:
            print(f"Error sending email: {result['message']}")
            # Fallback to mock mode if email service fails
            print("--- MOCK EMAIL START ---")
            print(f"To: {to_email}")
            print(f"Subject: {subject}")
            print(f"Body: {body}")
            print("--- MOCK EMAIL END ---")
            return False
    
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        # Fallback to mock mode if email service fails
        print("--- MOCK EMAIL START ---")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(f"Body: {body}")
        print("--- MOCK EMAIL END ---")
        return False


def send_email(to_email, subject, body, force=False, html_body=None):
    """
    Sends an email using the EmailService with global settings.
    This is a wrapper function that uses no business context (global settings).
    """
    return send_email_with_business_context(to_email, subject, body, business_id=None, force=force, html_body=html_body)

def send_registration_email(user, business):
    """
    Sends an email to the user confirming their registration.
    """
    subject = "Business Registration Received"
    body = f"Hello {user.first_name}, thank you for registering your business '{business.name}' with us. Your registration is currently pending approval."
    html_body = get_registration_received_template(user.first_name, business.name)
    return send_email_with_business_context(user.email, subject, body, business.id, force=True, html_body=html_body)

def send_approval_email(user, business_id=None, force=True):
    """
    Sends an email to the user when their account is approved.
    """
    subject = "Business Account Approved"
    login_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/login"
    body = f"Hello {user.first_name}, your business account has been approved. Login here: {login_url}"
    html_body = get_approval_template(user.first_name, login_url)
    return send_email_with_business_context(user.email, subject, body, business_id, force=force, html_body=html_body)

def send_rejection_email(user, business_id=None, force=True):
    """
    Sends an email to the user when their account is rejected.
    """
    subject = "Business Account Registration Update"
    body = f"Hello {user.first_name}, we regret to inform you that your business registration has been rejected."
    html_body = get_rejection_template(user.first_name)
    return send_email_with_business_context(user.email, subject, body, business_id, force=force, html_body=html_body)

def notify_superadmin_new_registration(user, business):
    """
    Notifies the superadmin about a new business registration.
    Sends to all superadmin users in the system and the configured SUPERADMIN_EMAIL.
    """
    from app.models.user import User, UserRole
    from app import db
    
    # Get superadmin email from environment
    superadmin_email_env = os.getenv('SUPERADMIN_EMAIL', 'superadmin@business.com')
    
    # Get all superadmin users from database
    superadmin_users = User.query.filter_by(role=UserRole.superadmin, is_active=True).all()
    superadmin_emails = [superadmin_email_env]
    
    # Add emails of all active superadmins
    for superadmin in superadmin_users:
        if superadmin.email and superadmin.email not in superadmin_emails:
            superadmin_emails.append(superadmin.email)
    
    subject = "New Business Registration Pending Approval"
    body = f"A new business '{business.name}' has been registered by {user.first_name} {user.last_name} ({user.email})."
    html_body = get_superadmin_notification_template(business.name, f"{user.first_name} {user.last_name}", user.email)
    
    # Send to all superadmin emails
    for email in superadmin_emails:
        try:
            send_email_with_business_context(email, subject, body, business_id=None, force=True, html_body=html_body)
        except Exception as e:
            print(f"Warning: Could not send notification to {email}: {e}")
    
    return True

def send_password_reset_email(user, token):
    """
    Sends a password reset email to the user.
    """
    reset_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/reset-password?token={token}"
    subject = "Password Reset Request"
    body = f"Hello {user.first_name}, you have requested to reset your password. Reset here: {reset_url}"
    html_body = get_password_reset_template(user.first_name, reset_url)
    # Use business context if available, otherwise global
    return send_email_with_business_context(user.email, subject, body, user.business_id, force=True, html_body=html_body)

def send_staff_welcome_email(user, password):
    """
    Sends a welcome email to a newly created staff member with their credentials.
    """
    login_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/login"
    subject = "Welcome to the Team - Your Account Credentials"
    body = f"Hello {user.first_name}, an account has been created for you. Username: {user.username}, Password: {password}"
    html_body = get_staff_welcome_template(user.first_name, user.username, password, login_url)
    # Use business context for staff emails
    return send_email_with_business_context(user.email, subject, body, user.business_id, force=True, html_body=html_body)

def send_business_blocked_email(user, business, reason=None):
    """
    Sends an email to the user when their business is blocked/suspended by superadmin.
    """
    subject = "Business Account Suspended/Blocked"
    body = f"Hello {user.first_name}, your business '{business.name}' has been suspended/blocked by the administrator."
    if reason:
        body += f"\n\nReason: {reason}"
    body += "\n\nPlease contact support if you have any questions."
    html_body = get_business_blocked_template(user.first_name, business.name, reason)
    return send_email_with_business_context(user.email, subject, body, business.id, force=True, html_body=html_body)

def send_business_activated_email(user, business):
    """
    Sends an email to the user when their business is reactivated by superadmin.
    """
    subject = "Business Account Reactivated"
    login_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/login"
    body = f"Hello {user.first_name}, your business '{business.name}' has been reactivated. You can now log in: {login_url}"
    html_body = get_business_activated_template(user.first_name, business.name)
    return send_email_with_business_context(user.email, subject, body, business.id, force=True, html_body=html_body)

def send_low_stock_report_email(user, business, products):
    """
    Sends a low stock report email to the user.
    """
    from datetime import date
    report_date = date.today().strftime('%Y-%m-%d')
    subject = f"Low Stock Report - {business.name}"
    
    products_data = []
    for product in products:
        products_data.append({
            'name': product.name,
            'sku': product.product_id or 'N/A',
            'stock_quantity': product.stock_quantity,
            'reorder_level': product.reorder_level
        })
    
    body = f"Low Stock Report for {business.name} on {report_date}.\n\n"
    for p in products_data:
        body += f"- {p['name']} (SKU: {p['sku']}): Stock={p['stock_quantity']}, Reorder Level={p['reorder_level']}\n"
    
    html_body = get_low_stock_report_template(user.first_name, business.name, products_data, report_date)
    return send_email_with_business_context(user.email, subject, body, business.id, force=True, html_body=html_body)

def send_expired_products_report_email(user, business, products):
    """
    Sends an expired products report email to the user.
    """
    from datetime import date
    report_date = date.today().strftime('%Y-%m-%d')
    subject = f"Expired Products Report - {business.name}"
    
    products_data = []
    for product in products:
        products_data.append({
            'name': product.name,
            'sku': product.product_id or 'N/A',
            'expiry_date': product.expiry_date.strftime('%Y-%m-%d') if product.expiry_date else 'N/A',
            'stock_quantity': product.stock_quantity
        })
    
    body = f"Expired Products Report for {business.name} on {report_date}.\n\n"
    for p in products_data:
        body += f"- {p['name']} (SKU: {p['sku']}): Expired on {p['expiry_date']}, Stock={p['stock_quantity']}\n"
    
    html_body = get_expired_products_report_template(user.first_name, business.name, products_data, report_date)
    return send_email_with_business_context(user.email, subject, body, business.id, force=True, html_body=html_body)
