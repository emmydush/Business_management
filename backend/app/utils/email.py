import os
from flask import current_app
from app.utils.email_service import EmailService
from app.utils.email_templates import (
    get_registration_received_template,
    get_approval_template,
    get_rejection_template,
    get_password_reset_template,
    get_staff_welcome_template,
    get_superadmin_notification_template
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
    """
    superadmin_email = os.getenv('SUPERADMIN_EMAIL', 'superadmin@business.com')
    subject = "New Business Registration Pending Approval"
    body = f"A new business '{business.name}' has been registered by {user.first_name} {user.last_name} ({user.email})."
    html_body = get_superadmin_notification_template(business.name, f"{user.first_name} {user.last_name}", user.email)
    # Use global settings for superadmin notifications
    return send_email_with_business_context(superadmin_email, subject, body, business_id=None, force=True, html_body=html_body)

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
