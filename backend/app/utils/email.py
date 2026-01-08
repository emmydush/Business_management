import os
from flask import current_app
from app.utils.email_service import EmailService

def send_email_with_business_context(to_email, subject, body, business_id=None):
    """
    Sends an email using the EmailService which retrieves settings from database.
    If settings are missing, it logs the email to console (mock mode).
    """
    try:
        result = EmailService.send_email(
            to_email=to_email,
            subject=subject,
            body=body,
            business_id=business_id
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


def send_email(to_email, subject, body):
    """
    Sends an email using the EmailService with global settings.
    This is a wrapper function that uses no business context (global settings).
    """
    return send_email_with_business_context(to_email, subject, body, business_id=None)

def send_registration_email(user, business):
    """
    Sends an email to the user confirming their registration.
    """
    subject = "Business Registration Received"
    body = f"""
    Hello {user.first_name},

    Thank you for registering your business '{business.name}' with us.
    Your registration is currently pending approval by our superadmin.
    You will receive another email once your account has been approved or rejected.

    Best regards,
    The Team
    """
    return send_email_with_business_context(user.email, subject, body, business.id)

def send_approval_email(user, business_id=None):
    """
    Sends an email to the user when their account is approved.
    """
    subject = "Business Account Approved"
    body = f"""
    Hello {user.first_name},

    Great news! Your business account has been approved.
    You can now log in to the dashboard and start managing your business.

    Login URL: {os.getenv('FRONTEND_URL', 'http://localhost:3000')}/login

    Best regards,
    The Team
    """
    return send_email_with_business_context(user.email, subject, body, business_id)

def send_rejection_email(user, business_id=None):
    """
    Sends an email to the user when their account is rejected.
    """
    subject = "Business Account Registration Update"
    body = f"""
    Hello {user.first_name},

    We regret to inform you that your business registration has been rejected at this time.
    If you have any questions, please contact our support team.

    Best regards,
    The Team
    """
    return send_email_with_business_context(user.email, subject, body, business_id)

def notify_superadmin_new_registration(user, business):
    """
    Notifies the superadmin about a new business registration.
    """
    superadmin_email = os.getenv('SUPERADMIN_EMAIL', 'superadmin@business.com')
    subject = "New Business Registration Pending Approval"
    body = f"""
    A new business has been registered and is pending approval.

    Business Name: {business.name}
    Owner Name: {user.first_name} {user.last_name}
    Owner Email: {user.email}

    Please log in to the superadmin dashboard to review and approve/reject this registration.
    """
    # Use global settings for superadmin notifications
    return send_email_with_business_context(superadmin_email, subject, body, business_id=None)
