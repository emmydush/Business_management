from app import db
from app.models.communication import Notification
from app.models.user import User

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
    """
    if product.stock_quantity <= product.reorder_level:
        title = "Low Stock Alert"
        message = f"Product '{product.name}' (ID: {product.product_id}) is low on stock. Current quantity: {product.stock_quantity}. Reorder level: {product.reorder_level}."
        type = 'warning'
        
        if product.stock_quantity == 0:
            title = "Out of Stock Alert"
            message = f"Product '{product.name}' (ID: {product.product_id}) is out of stock!"
            type = 'danger'
            
        # Check if a similar notification was already created recently to avoid spamming
        # For now, we'll just create it. In a real app, we might check the last notification date.
        notify_managers(product.business_id, title, message, type)

def check_expiry_and_notify(product):
    """
    Checks if a product is expired or nearing expiry and creates a notification.
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

