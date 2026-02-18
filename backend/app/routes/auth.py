from flask import Blueprint, request, jsonify, url_for, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from app import db, bcrypt
from app.models.user import User, UserRole, UserApprovalStatus
from app.models.business import Business
from datetime import datetime, timedelta
import re, os, uuid
import string
from werkzeug.utils import secure_filename

ALLOWED_EXT = {'png', 'jpg', 'jpeg', 'gif'}

# Create blueprint
auth_bp = Blueprint('auth', __name__)

# Lazy rate limiter decorator for auth routes
def get_limiter():
    """Get the rate limiter from the app"""
    return current_app.extensions.get('limiter')

def validate_password_strength(password):
    """
    Validates password strength with the following criteria:
    - At least 8 characters long
    - Contains at least one uppercase letter
    - Contains at least one lowercase letter
    - Contains at least one digit
    - Contains at least one special character
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(c in string.punctuation for c in password)
    
    if not has_upper:
        return False, "Password must contain at least one uppercase letter"
    if not has_lower:
        return False, "Password must contain at least one lowercase letter"
    if not has_digit:
        return False, "Password must contain at least one digit"
    if not has_special:
        return False, "Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)"
    
    return True, "Password is strong"

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'first_name', 'last_name', 'business_name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Honeypot validation - if honeypot field is filled, it's a bot
        if data.get('honeypot', ''):
            # Silently reject - don't let bots know they were caught
            return jsonify({
                'message': 'User and Business registered successfully',
                'user': {},
                'business': {}
            }), 201
        
        # Validate email format
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Validate password strength
        is_strong, password_message = validate_password_strength(data['password'])
        if not is_strong:
            return jsonify({'error': f'Weak password: {password_message}'}), 400
        
        # Check if business email already exists
        if Business.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'A business with this email is already registered'}), 409
        
        # Create new business with extended fields
        business = Business(
            name=data['business_name'],
            email=data['email'],
            phone=data.get('business_phone', ''),
            address=data.get('business_address', ''),
            registration_number=data.get('registration_number', ''),
            tax_id=data.get('tax_id', ''),
            industry=data.get('industry', ''),
            company_size=data.get('company_size', 'small'),
            website=data.get('website', ''),
            description=data.get('business_description', ''),
            business_type=data.get('business_type', ''),
            country=data.get('country', ''),
            currency=data.get('currency', 'USD'),
            timezone=data.get('timezone', 'UTC'),
            logo=data.get('business_logo', '')
        )
        db.session.add(business)
        db.session.flush() # Get business ID

        # Ensure username/email are unique within this business
        if User.query.filter_by(username=data['username'], business_id=business.id).first():
            return jsonify({'error': 'Username already exists for this business'}), 409
        if User.query.filter_by(email=data['email'], business_id=business.id).first():
            return jsonify({'error': 'Email already exists for this business'}), 409
        
        # Create new user
        role_str = data.get('role', 'admin').lower() # Default to admin for the person who registers the business
        if role_str not in [r.value for r in UserRole]:
            role_str = 'admin'
            
        user = User(
            username=data['username'],
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            phone=data.get('phone', ''),
            profile_picture=data.get('profile_picture'),
            role=UserRole[role_str],
            business_id=business.id,
            approval_status=UserApprovalStatus.PENDING  # New businesses are pending approval
        )
        
        user.set_password(data['password'])
        db.session.add(user)
        db.session.commit()
        
        # Send emails
        try:
            from app.utils.email import send_registration_email, notify_superadmin_new_registration
            send_registration_email(user, business)
            notify_superadmin_new_registration(user, business)
        except Exception as email_err:
            print(f"Warning: Could not send registration emails: {email_err}")
        
        return jsonify({
            'message': 'User and Business registered successfully',
            'user': user.to_dict(),
            'business': business.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        # Log the full error for debugging
        import traceback
        error_details = f"{str(e)}\n{traceback.format_exc()}"
        print(f"Registration error: {error_details}")
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        username_or_email = data.get('username', '').strip()
        password = data.get('password', '')
        
        if not username_or_email or not password:
            return jsonify({'error': 'Username/Email and password are required'}), 400
        
        # Try finding by username first, then by email
        user = User.query.filter_by(username=username_or_email).first()
        if not user:
            user = User.query.filter_by(email=username_or_email).first()
            
        if not user:
            return jsonify({'error': 'Invalid username/email or password'}), 401
        
        # Check approval status - user must be approved to login
        if user.approval_status == UserApprovalStatus.PENDING:
            return jsonify({'error': 'Account is pending approval. Please contact administrator.'}), 401
        
        if user.approval_status == UserApprovalStatus.REJECTED:
            return jsonify({'error': 'Account has been rejected. Please contact administrator.'}), 401
        
        # Check if account is locked (handle case where column might not exist)
        try:
            if user.locked_until and user.locked_until > datetime.utcnow():
                remaining_time = (user.locked_until - datetime.utcnow()).seconds // 60
                return jsonify({'error': f'Account is locked. Try again in {remaining_time} minutes'}), 401
        except Exception:
            pass  # Column might not exist, continue with login
        
        if not user.check_password(password):
            # Increment failed login attempts (handle case where column might not exist)
            try:
                user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
                
                # Lock account after 5 failed attempts
                if user.failed_login_attempts >= 5:
                    user.locked_until = datetime.utcnow() + timedelta(minutes=30)  # Lock for 30 minutes
                    db.session.commit()
                    return jsonify({'error': 'Too many failed login attempts. Account locked for 30 minutes'}), 401
                
                db.session.commit()
            except Exception:
                pass  # Column might not exist
            return jsonify({'error': 'Invalid username/email or password'}), 401
        
        # Reset failed login attempts on successful login (handle case where column might not exist)
        try:
            user.failed_login_attempts = 0
            user.locked_until = None
        except Exception:
            pass  # Column might not exist
        
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 401
        
        # Check if business is active (skip for superadmins)
        if user.role != UserRole.superadmin and user.business_id:
            business = db.session.get(Business, user.business_id)
            if not business:
                return jsonify({'error': 'Business not found'}), 401
            if not business.is_active:
                return jsonify({'error': 'Business account is suspended/blocked. Please contact support.'}), 401
        
        # Create access token with business_id in claims
        additional_claims = {
            "business_id": user.business_id if user.business_id else 0, 
            "role": user.role.value
        }
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims=additional_claims,
            expires_delta=timedelta(hours=24)
        )
        
        db.session.commit()
        
        return jsonify({
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/upload-profile-picture', methods=['POST'])
def upload_profile_picture():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        filename = secure_filename(file.filename)
        ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
        if ext not in ALLOWED_EXT:
            return jsonify({'error': 'Invalid file extension'}), 400

        upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'profile_pictures')
        os.makedirs(upload_dir, exist_ok=True)
        new_filename = f"{uuid.uuid4().hex}.{ext}"
        file_path = os.path.join(upload_dir, new_filename)
        file.save(file_path)

        file_url = f"/uploads/profile_pictures/{new_filename}"
        return jsonify({'url': file_url}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'phone' in data:
            user.phone = data['phone']
        if 'email' in data:
            # Check if email is already taken by another user within the same business
            existing_user = User.query.filter_by(email=data['email'], business_id=user.business_id).first()
            if existing_user and existing_user.id != user.id:
                return jsonify({'error': 'Email already exists for this business'}), 409
            user.email = data['email']
        if 'profile_picture' in data:
            user.profile_picture = data['profile_picture']
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        if not data.get('current_password') or not data.get('new_password'):
            return jsonify({'error': 'Current password and new password are required'}), 400
        
        if not user.check_password(data['current_password']):
            return jsonify({'error': 'Current password is incorrect'}), 400
        
        # Validate new password strength
        is_strong, password_message = validate_password_strength(data['new_password'])
        if not is_strong:
            return jsonify({'error': f'Weak password: {password_message}'}), 400
        
        user.set_password(data['new_password'])
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
            
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'message': 'If your email is registered, you will receive a reset link.'}), 200
            
        import secrets
        token = secrets.token_urlsafe(32)
        user.reset_token = token
        user.reset_token_expiry = datetime.utcnow() + timedelta(hours=1)
        db.session.commit()
        
        # Send reset email
        try:
            from app.utils.email import send_password_reset_email
            send_password_reset_email(user, token)
        except Exception as email_err:
            print(f"Warning: Could not send reset email: {email_err}")
        
        return jsonify({'message': 'If your email is registered, you will receive a reset link.'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.get_json()
        token = data.get('token')
        new_password = data.get('new_password')
        
        if not token or not new_password:
            return jsonify({'error': 'Token and new password are required'}), 400
        
        # Validate new password strength
        is_strong, password_message = validate_password_strength(new_password)
        if not is_strong:
            return jsonify({'error': f'Weak password: {password_message}'}), 400
            
        user = User.query.filter_by(reset_token=token).first()
        
        if not user or user.reset_token_expiry < datetime.utcnow():
            return jsonify({'error': 'Invalid or expired reset token'}), 400
            
        user.set_password(new_password)
        user.reset_token = None
        user.reset_token_expiry = None
        db.session.commit()
        
        return jsonify({'message': 'Password has been reset successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/subscription-status', methods=['GET'])
@jwt_required()
def get_subscription_status():
    """
    Get the current user's business subscription status
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Superadmins always have full access
        if user.role == UserRole.superadmin:
            return jsonify({
                'has_subscription': True,
                'can_write': True,
                'subscription': None,
                'is_superadmin': True
            }), 200
        
        # Check if user has a business
        if not user.business_id:
            return jsonify({
                'has_subscription': False,
                'can_write': False,
                'subscription': None,
                'error': 'No business association'
            }), 200
        
        # Check subscription status
        from app.utils.middleware import check_subscription_status
        has_subscription, subscription = check_subscription_status(user.business_id)
        
        # Build response with features for frontend access control
        features = []
        plan_type = None
        plan_name = None
        if subscription and subscription.plan:
            features = subscription.get_features() if hasattr(subscription, 'get_features') else (subscription.plan.features or [])
            plan_type = subscription.plan.plan_type.value
            plan_name = subscription.plan.name
        
        return jsonify({
            'has_subscription': has_subscription,
            'can_write': has_subscription,
            'subscription': subscription.to_dict() if subscription else None,
            'is_superadmin': False,
            'features': features,
            'plan_type': plan_type,
            'plan_name': plan_name
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500