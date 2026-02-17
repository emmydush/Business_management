from app import db
from app.models.communication import Notification
from app.models.user import User
from app.utils.email import send_low_stock_report_email, send_expired_products_report_email
from app.models.api_integrations import WebhookDelivery
from datetime import datetime
import uuid
import json
import hmac
import hashlib
import requests

def create_notification(business_id, user_id, title, message, type='info'):
    """
    Creates a notification for a specific user.
    """
    try:
        notification = Notification(
            business_id=business_id,
            user_id=user_id,
            title=title,
            message=message,
            type=type
        )
        db.session.add(notification)
        db.session.commit()
        return notification
    except Exception as e:
        db.session.rollback()
        print(f"Error creating notification: {str(e)}")
        return None

def notify_managers(business_id, title, message, type='info'):
    """
    Creates a notification for all managers and admins of a business.
    """
    try:
        from app.models.user import UserRole
        # Get all users with manager or admin roles for this business
        users = User.query.filter(
            User.business_id == business_id,
            User.role.in_([UserRole.manager, UserRole.admin, UserRole.superadmin])
        ).all()
        
        notifications = []
        for user in users:
            notification = Notification(
                business_id=business_id,
                user_id=user.id,
                title=title,
                message=message,
                type=type
            )
            db.session.add(notification)
            notifications.append(notification)
        
        db.session.commit()
        return notifications
    except Exception as e:
        db.session.rollback()
        print(f"Error notifying managers: {str(e)}")
        return []

def check_low_stock_and_notify(product):
    """
    Checks if a product's stock is low and creates a notification if it is.
    Also sends an email to business admins.
    """
    title = None
    message = None
    type = 'info'
    
    # Check for out of stock first
    if product.stock_quantity == 0:
        title = "Out of Stock Alert"
        message = f"Product '{product.name}' (ID: {product.product_id}) is out of stock!"
        type = 'danger'
    # Check for critical low stock (5 or below)
    elif product.stock_quantity <= 5:
        title = "Critical Low Stock Alert"
        message = f"Product '{product.name}' (ID: {product.product_id}) has critical low stock. Current quantity: {product.stock_quantity}. Reorder level: {product.reorder_level}."
        type = 'danger'
    # Check for general low stock based on reorder level
    elif product.stock_quantity <= product.reorder_level:
        title = "Low Stock Alert"
        message = f"Product '{product.name}' (ID: {product.product_id}) is low on stock. Current quantity: {product.stock_quantity}. Reorder level: {product.reorder_level}."
        type = 'warning'
    
    # If we have a notification to send
    if title and message:
        # Check if a similar notification was already created recently to avoid spamming
        # For now, we'll just create it. In a real app, we might check the last notification date.
        notify_managers(product.business_id, title, message, type)
        
        # Also send email to business admins
        try:
            from app.models.business import Business
            from app.models.user import UserRole
            business = db.session.get(Business, product.business_id)
            if business:
                # Get all admin users for this business
                admins = User.query.filter(
                    User.business_id == product.business_id,
                    User.role.in_([UserRole.admin, UserRole.manager])
                ).all()
                
                # Get low stock products for the business
                from app.models.product import Product
                low_stock_products = Product.query.filter(
                    Product.business_id == product.business_id,
                    Product.stock_quantity <= Product.reorder_level
                ).all()
                
                for admin in admins:
                    send_low_stock_report_email(admin, business, low_stock_products)
        except Exception as email_err:
            print(f"Warning: Could not send low stock email: {email_err}")

def check_expiry_and_notify(product):
    """
    Checks if a product is expired or nearing expiry and creates a notification.
    Also sends an email to business admins.
    """
    if not product.expiry_date:
        return

    from datetime import date, timedelta
    today = date.today()
    
    if product.expiry_date <= today:
        title = "Expired Product Alert"
        message = f"Product '{product.name}' (ID: {product.product_id}) has expired on {product.expiry_date}!"
        type = 'danger'
        notify_managers(product.business_id, title, message, type)
    elif product.expiry_date <= today + timedelta(days=30):
        title = "Product Nearing Expiry"
        message = f"Product '{product.name}' (ID: {product.product_id}) will expire soon on {product.expiry_date}."
        type = 'warning'
        notify_managers(product.business_id, title, message, type)
    
    # Also send email for expired products
    if product.expiry_date <= today or product.expiry_date <= today + timedelta(days=30):
        try:
            from app.models.business import Business
            from app.models.user import UserRole
            business = db.session.get(Business, product.business_id)
            if business:
                # Get all admin users for this business
                admins = User.query.filter(
                    User.business_id == product.business_id,
                    User.role.in_([UserRole.admin, UserRole.manager])
                ).all()
                
                # Get expired/expiring products for the business
                from app.models.product import Product
                expired_products = Product.query.filter(
                    Product.business_id == product.business_id,
                    Product.expiry_date <= today + timedelta(days=30),
                    Product.is_active == True
                ).all()
                
                for admin in admins:
                    send_expired_products_report_email(admin, business, expired_products)
        except Exception as email_err:
            print(f"Warning: Could not send expiry email: {email_err}")

