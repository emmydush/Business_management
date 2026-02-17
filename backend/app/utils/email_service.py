from flask_mail import Message
from flask import current_app
from app import db, mail
from app.models.settings import SystemSetting
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


class EmailService:
    @staticmethod
    def get_email_config(business_id=None):
        """Retrieve email configuration from database - only global settings from superadmin"""
        config = {}
        
        # Always use global settings (business_id is None) - configured in superadmin only
        # Business-specific email settings are disabled
        global_email_settings = SystemSetting.query.filter(
            SystemSetting.business_id.is_(None),  # Global settings only
            SystemSetting.setting_key.like('email_%')
        ).all()
        
        for setting in global_email_settings:
            config[setting.setting_key.replace('email_', '')] = setting.setting_value
        
        return config

    @staticmethod
    def send_email(to_email, subject, body, business_id=None, html_body=None, force=False, custom_config=None):
        """Send an email using configured SMTP settings - always uses global settings from superadmin"""
        try:
            # Get email configuration (always global settings from superadmin)
            if custom_config:
                email_config = custom_config
            else:
                # Always use global settings (business_id is ignored for email config)
                email_config = EmailService.get_email_config(business_id=None)
            
            # Check if email is enabled
            if not force and email_config.get('enabled', 'false').lower() != 'true':
                return {'success': False, 'message': 'Email is not enabled'}
            
            # Check if we have required SMTP settings
            smtp_host = email_config.get('smtp_host') or email_config.get('email_smtp_host')
            smtp_username = email_config.get('smtp_username') or email_config.get('email_smtp_username')
            smtp_password = email_config.get('smtp_password') or email_config.get('email_smtp_password')
            smtp_port = email_config.get('smtp_port') or email_config.get('email_smtp_port')
            sender_email = email_config.get('sender_email') or email_config.get('email_sender_email') or 'noreply@yourcompany.com'
            sender_name = email_config.get('sender_name') or email_config.get('email_sender_name') or 'Your Company'
            
            if not smtp_host or not smtp_username:
                return {'success': False, 'message': 'SMTP host and username are required for sending emails'}
            
            # Use smtplib directly to avoid issues with Flask-Mail's global state
            # and to allow dynamic configuration without re-creating the app
            
            # Determine if using SSL or TLS
            enable_tls = str(email_config.get('enable_tls', 'true')).lower() == 'true'
            enable_ssl = str(email_config.get('enable_ssl', 'false')).lower() == 'true'
            
            msg = MIMEMultipart()
            msg['From'] = f"{sender_name} <{sender_email}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            
            msg.attach(MIMEText(body, 'plain'))
            if html_body:
                msg.attach(MIMEText(html_body, 'html'))
            
            server = None
            try:
                port = int(smtp_port or 587)
                if enable_ssl:
                    server = smtplib.SMTP_SSL(smtp_host, port, timeout=10)
                else:
                    server = smtplib.SMTP(smtp_host, port, timeout=10)
                    if enable_tls:
                        server.starttls()
                
                if smtp_username and smtp_password:
                    server.login(smtp_username, smtp_password)
                
                server.send_message(msg)
                server.quit()
                return {'success': True, 'message': 'Email sent successfully'}
            except Exception as e:
                if server:
                    try: server.quit() 
                    except: pass
                return {'success': False, 'message': f'SMTP Error: {str(e)}'}
                
        except Exception as e:
            return {'success': False, 'message': f'Error sending email: {str(e)}'}

    @staticmethod
    def test_connection(business_id=None, custom_config=None):
        """Test email configuration by attempting to connect to SMTP server - uses global settings only"""
        # We can just reuse send_email for testing
        test_email = (custom_config.get('sender_email') or custom_config.get('email_sender_email')) if custom_config else None
        if not test_email:
            # Always use global settings
            config = EmailService.get_email_config(business_id=None)
            test_email = config.get('sender_email') or config.get('smtp_username')
            
        return EmailService.send_email(
            to_email=test_email,
            subject="Test Email Connection",
            body="This is a test email to confirm your SMTP settings are working.",
            business_id=business_id,
            force=True,
            custom_config=custom_config
        )