from flask_mail import Message
from app import db, mail
from app.models.settings import SystemSetting
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


class EmailService:
    @staticmethod
    def get_email_config(business_id=None):
        """Retrieve email configuration from database"""
        config = {}
        
        # First, try to get business-specific settings
        if business_id is not None:
            email_settings = SystemSetting.query.filter(
                SystemSetting.business_id == business_id,
                SystemSetting.setting_key.like('email_%')
            ).all()
            
            # If business-specific settings exist, use them
            if email_settings:
                for setting in email_settings:
                    config[setting.setting_key.replace('email_', '')] = setting.setting_value
                return config
        
        # If no business-specific settings or business_id is None, get global settings
        global_email_settings = SystemSetting.query.filter(
            SystemSetting.business_id.is_(None),  # Global settings
            SystemSetting.setting_key.like('email_%')
        ).all()
        
        for setting in global_email_settings:
            config[setting.setting_key.replace('email_', '')] = setting.setting_value
        
        return config

    @staticmethod
    def send_email(to_email, subject, body, business_id=None, html_body=None):
        """Send an email using configured SMTP settings"""
        try:
            # Get email configuration
            email_config = EmailService.get_email_config(business_id)
            
            # Check if email is enabled
            if email_config.get('enabled', 'false').lower() != 'true':
                return {'success': False, 'message': 'Email is not enabled'}
            
            # Check if we have required SMTP settings
            if not email_config.get('smtp_host') or not email_config.get('smtp_username'):
                return {'success': False, 'message': 'SMTP host and username are required for sending emails'}
            
            # Update Flask-Mail configuration based on database settings
            from app import create_app
            app = create_app()
            
            # Apply email settings from database
            app.config['MAIL_SERVER'] = email_config.get('smtp_host', 'localhost')
            app.config['MAIL_PORT'] = int(email_config.get('smtp_port', 587))
            app.config['MAIL_USERNAME'] = email_config.get('smtp_username', '')
            app.config['MAIL_PASSWORD'] = email_config.get('smtp_password', '')
            app.config['MAIL_DEFAULT_SENDER'] = email_config.get('sender_email', 'noreply@yourcompany.com')
            
            # Set TLS/SSL based on config
            enable_tls = email_config.get('enable_tls', 'true').lower() == 'true'
            enable_ssl = email_config.get('enable_ssl', 'false').lower() == 'true'
            
            app.config['MAIL_USE_TLS'] = enable_tls and not enable_ssl
            app.config['MAIL_USE_SSL'] = enable_ssl
            
            # Create and send message with the temporary app context
            with app.app_context():
                msg = Message(
                    subject=subject,
                    recipients=[to_email],
                    body=body,
                    html=html_body
                )
                
                # Set sender from config
                sender_email = email_config.get('sender_email', 'noreply@yourcompany.com')
                sender_name = email_config.get('sender_name', 'Your Company')
                msg.sender = f"{sender_name} <{sender_email}>"
                
                # Send the email
                mail.send(msg)
            
            return {'success': True, 'message': 'Email sent successfully'}
            
        except Exception as e:
            return {'success': False, 'message': f'Error sending email: {str(e)}'}

    @staticmethod
    def test_connection(business_id=None):
        """Test email configuration by attempting to connect to SMTP server"""
        try:
            email_config = EmailService.get_email_config(business_id)
            
            if not email_config.get('smtp_host') or not email_config.get('smtp_username'):
                return {'success': False, 'message': 'SMTP host and username are required'}
            
            # Test SMTP connection directly
            smtp_host = email_config.get('smtp_host', 'localhost')
            smtp_port = int(email_config.get('smtp_port', 587))
            username = email_config.get('smtp_username', '')
            password = email_config.get('smtp_password', '')
            
            # Determine if using SSL or TLS
            enable_tls = email_config.get('enable_tls', 'true').lower() == 'true'
            enable_ssl = email_config.get('enable_ssl', 'false').lower() == 'true'
            
            server = None
            try:
                if enable_ssl:
                    server = smtplib.SMTP_SSL(smtp_host, smtp_port)
                else:
                    server = smtplib.SMTP(smtp_host, smtp_port)
                    if enable_tls:
                        server.starttls()
                
                server.login(username, password)
                
                # Try to send a test email
                sender_email = email_config.get('sender_email', username)
                test_recipient = email_config.get('sender_email', username)  # Send to self for testing
                
                msg = MIMEMultipart()
                msg['From'] = sender_email
                msg['To'] = test_recipient
                msg['Subject'] = "Test Email Connection"
                
                body = "This is a test email to confirm your SMTP settings are working."
                msg.attach(MIMEText(body, 'plain'))
                
                server.send_message(msg)
                server.quit()
                
                return {'success': True, 'message': 'Email connection test successful'}
                
            except Exception as conn_error:
                if server:
                    server.quit()
                return {'success': False, 'message': f'Connection test failed: {str(conn_error)}'}
            
        except Exception as e:
            return {'success': False, 'message': f'Email connection test failed: {str(e)}'}