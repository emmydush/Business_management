def get_base_template(content, title="Notification"):
    """
    Base HTML email template with professional styling.
    """
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{title}</title>
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f4f7f6;
            }}
            .container {{
                max-width: 600px;
                margin: 20px auto;
                background: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 10px rgba(0,0,0,0.05);
            }}
            .header {{
                background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                color: #ffffff;
                padding: 30px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 24px;
                font-weight: 600;
                letter-spacing: 0.5px;
            }}
            .content {{
                padding: 40px 30px;
            }}
            .footer {{
                background-color: #f9fafb;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #6b7280;
                border-top: 1px solid #e5e7eb;
            }}
            .button {{
                display: inline-block;
                padding: 12px 24px;
                background-color: #4f46e5;
                color: #ffffff !important;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin-top: 20px;
            }}
            .info-box {{
                background-color: #f3f4f6;
                padding: 20px;
                border-radius: 6px;
                margin: 20px 0;
                border-left: 4px solid #4f46e5;
            }}
            .credentials {{
                font-family: monospace;
                background: #e5e7eb;
                padding: 2px 5px;
                border-radius: 3px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Business Management System</h1>
            </div>
            <div class="content">
                {content}
            </div>
            <div class="footer">
                &copy; {2026} Business Management System. All rights reserved.<br>
                This is an automated message, please do not reply.
            </div>
        </div>
    </body>
    </html>
    """

def get_registration_received_template(first_name, business_name):
    content = f"""
    <h2 style="color: #111827; margin-top: 0;">Hello {first_name},</h2>
    <p>Thank you for registering your business <strong>'{business_name}'</strong> with us.</p>
    <p>Your registration is currently <strong>pending approval</strong> by our administration team. We will review your application and notify you as soon as it's processed.</p>
    <div class="info-box">
        <p style="margin: 0;"><strong>What happens next?</strong><br>
        Once approved, you will receive another email with instructions on how to access your dashboard.</p>
    </div>
    <p>Best regards,<br>The Team</p>
    """
    return get_base_template(content, "Registration Received")

def get_approval_template(first_name, login_url):
    content = f"""
    <h2 style="color: #111827; margin-top: 0;">Great news, {first_name}!</h2>
    <p>Your business account has been <strong>approved</strong>. You can now log in to the dashboard and start managing your business operations.</p>
    <a href="{login_url}" class="button">Log In to Dashboard</a>
    <p style="margin-top: 30px;">If the button above doesn't work, copy and paste this link into your browser:</p>
    <p style="font-size: 13px; color: #4f46e5;">{login_url}</p>
    <p>Best regards,<br>The Team</p>
    """
    return get_base_template(content, "Account Approved")

def get_rejection_template(first_name):
    content = f"""
    <h2 style="color: #111827; margin-top: 0;">Hello {first_name},</h2>
    <p>We regret to inform you that your business registration has been <strong>rejected</strong> at this time.</p>
    <p>If you have any questions regarding this decision or would like to provide additional information, please contact our support team.</p>
    <p>Best regards,<br>The Team</p>
    """
    return get_base_template(content, "Registration Update")

def get_password_reset_template(first_name, reset_url):
    content = f"""
    <h2 style="color: #111827; margin-top: 0;">Password Reset Request</h2>
    <p>Hello {first_name},</p>
    <p>You have requested to reset your password. Please click the button below to set a new password:</p>
    <a href="{reset_url}" class="button">Reset Password</a>
    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">This link will expire in 1 hour. If you did not request this, please ignore this email.</p>
    <p>Best regards,<br>The Team</p>
    """
    return get_base_template(content, "Password Reset")

def get_staff_welcome_template(first_name, username, password, login_url):
    content = f"""
    <h2 style="color: #111827; margin-top: 0;">Welcome to the Team!</h2>
    <p>Hello {first_name},</p>
    <p>An account has been created for you on our business management platform. You can now log in using the credentials below:</p>
    <div class="info-box">
        <p style="margin: 0;"><strong>Username:</strong> <span class="credentials">{username}</span></p>
        <p style="margin: 5px 0 0 0;"><strong>Password:</strong> <span class="credentials">{password}</span></p>
    </div>
    <a href="{login_url}" class="button">Log In Now</a>
    <p style="margin-top: 20px; color: #ef4444; font-size: 14px;"><strong>Important:</strong> For security reasons, please change your password immediately after your first login.</p>
    <p>Best regards,<br>The Team</p>
    """
    return get_base_template(content, "Welcome to the Team")

def get_superadmin_notification_template(business_name, owner_name, owner_email):
    content = f"""
    <h2 style="color: #111827; margin-top: 0;">New Business Registration</h2>
    <p>A new business has been registered and is pending your approval.</p>
    <div class="info-box">
        <p style="margin: 0;"><strong>Business:</strong> {business_name}</p>
        <p style="margin: 5px 0 0 0;"><strong>Owner:</strong> {owner_name}</p>
        <p style="margin: 5px 0 0 0;"><strong>Email:</strong> {owner_email}</p>
    </div>
    <p>Please log in to the superadmin dashboard to review this application.</p>
    """
    return get_base_template(content, "New Registration Alert")

def get_business_blocked_template(first_name, business_name, reason=None):
    content = f"""
    <h2 style="color: #111827; margin-top: 0;">Account Suspended/Blocked</h2>
    <p>Hello {first_name},</p>
    <p>We regret to inform you that your business <strong>'{business_name}'</strong> has been <strong>suspended/blocked</strong> by the administrator.</p>
    {f'<div class="info-box"><p style="margin: 0;"><strong>Reason:</strong> {reason}</p></div>' if reason else ''}
    <p>If you believe this is an error or would like to appeal this decision, please contact our support team.</p>
    <p>Best regards,<br>The Team</p>
    """
    return get_base_template(content, "Account Suspended")

def get_business_activated_template(first_name, business_name):
    content = f"""
    <h2 style="color: #111827; margin-top: 0;">Account Reactivated</h2>
    <p>Hello {first_name},</p>
    <p>Great news! Your business <strong>'{business_name}'</strong> has been <strong>reactivated</strong> by the administrator.</p>
    <p>You can now log in to your dashboard and continue managing your business operations.</p>
    <p>Best regards,<br>The Team</p>
    """
    return get_base_template(content, "Account Reactivated")

def get_low_stock_report_template(first_name, business_name, products, report_date):
    products_html = ""
    for product in products:
        products_html += f"""
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{product['name']}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{product['sku']}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: {'#ef4444' if product['stock_quantity'] == 0 else '#f59e0b'};">{product['stock_quantity']}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{product['reorder_level']}</td>
        </tr>
        """
    
    content = f"""
    <h2 style="color: #111827; margin-top: 0;">Low Stock Report</h2>
    <p>Hello {first_name},</p>
    <p>This is your scheduled low stock report for <strong>{business_name}</strong> dated {report_date}.</p>
    <p>The following products are below their reorder level:</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
            <tr style="background-color: #f9fafb;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Product Name</th>
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">SKU</th>
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Current Stock</th>
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Reorder Level</th>
            </tr>
        </thead>
        <tbody>
            {products_html}
        </tbody>
    </table>
    <p>Please review and reorder these items as needed.</p>
    <p>Best regards,<br>The System</p>
    """
    return get_base_template(content, "Low Stock Report")

def get_expired_products_report_template(first_name, business_name, products, report_date):
    products_html = ""
    for product in products:
        products_html += f"""
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{product['name']}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{product['sku']}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #ef4444;">{product['expiry_date']}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{product['stock_quantity']}</td>
        </tr>
        """
    
    content = f"""
    <h2 style="color: #111827; margin-top: 0;">Expired Products Report</h2>
    <p>Hello {first_name},</p>
    <p>This is your scheduled expired products report for <strong>{business_name}</strong> dated {report_date}.</p>
    <p>The following products have expired or are nearing expiry:</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
            <tr style="background-color: #f9fafb;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Product Name</th>
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">SKU</th>
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Expiry Date</th>
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Stock Quantity</th>
            </tr>
        </thead>
        <tbody>
            {products_html}
        </tbody>
    </table>
    <p>Please review these items and take appropriate action.</p>
    <p>Best regards,<br>The System</p>
    """
    return get_base_template(content, "Expired Products Report")
