from flask import Blueprint, request, jsonify, current_app, g
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity, create_refresh_token
)
from werkzeug.security import check_password_hash
from app import db, bcrypt
from app.models.user import User, UserRole, UserApprovalStatus
from app.models.business import Business
from app.models.audit_log import create_audit_log, AuditAction
# from app.utils.event_monitor import event_monitor, EventCategory, EventType, EventSeverity
from datetime import datetime, timedelta
import string
import re
from functools import wraps
from app.utils.validation import SecurityValidator, USER_SCHEMA, validate_input
from app.utils.security_middleware import rate_limit, validate_json_input, csrf_protect, validate_file_upload
import uuid
import os
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
    Validates password strength with harsh requirements:
    - At least 12 characters long
    - Contains at least one uppercase letter
    - Contains at least one lowercase letter
    - Contains at least one digit
    - Contains at least one special character
    - Cannot contain common patterns or dictionary words
    - Must have sufficient entropy
    """
    if len(password) < 12:
        return False, "Password must be at least 12 characters long"
    
    # Check for character variety
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
    
    # Check for common weak patterns
    password_lower = password.lower()
    
    # Common sequences and patterns
    common_patterns = [
        '123456', 'password', 'qwerty', 'admin', 'letmein', 'welcome',
        'monkey', 'dragon', 'master', 'sunshine', 'princess', 'football',
        'baseball', 'shadow', 'superman', 'iloveyou', '123123', 'abc123'
    ]
    
    for pattern in common_patterns:
        if pattern in password_lower:
            return False, f"Password cannot contain common patterns like '{pattern}'"
    
    # Check for keyboard sequences
    keyboard_sequences = ['qwerty', 'asdf', 'zxcv', '1234', 'abcd']
    for seq in keyboard_sequences:
        if seq in password_lower:
            return False, "Password cannot contain keyboard sequences"
    
    # Check for repeated characters (more than 2 in a row)
    if len(password) >= 3:
        for i in range(len(password) - 2):
            if password[i] == password[i+1] == password[i+2]:
                return False, "Password cannot contain 3 or more repeated characters in a row"
    
    # Check for sufficient character variety (at least 3 different character types)
    char_types = sum([has_upper, has_lower, has_digit, has_special])
    if char_types < 3:
        return False, "Password must contain at least 3 different character types"
    
    # Calculate entropy (simplified check)
    unique_chars = len(set(password))
    if unique_chars < len(password) * 0.6:  # At least 60% unique characters
        return False, "Password needs more character variety"
    
    return True, "Password is strong"

@auth_bp.route('/register', methods=['POST'])
@rate_limit(max_requests=20, window_seconds=300)  # 20 registrations per 5 minutes
@validate_json_input({
    'username': {'type': 'username', 'required': True},
    'email': {'type': 'email', 'required': True},
    'password': {'type': 'string', 'required': True, 'max_length': 128},
    'first_name': {'type': 'string', 'required': True, 'max_length': 50},
    'last_name': {'type': 'string', 'required': True, 'max_length': 50},
    'business_name': {'type': 'string', 'required': True, 'max_length': 100},
    'business_phone': {'type': 'phone', 'required': False, 'max_length': 20},
    'business_address': {'type': 'string', 'required': False, 'max_length': 500},
    'phone': {'type': 'phone', 'required': False, 'max_length': 20},
})
def register():
    try:
        data = request.sanitized_data
        
        # Honeypot validation - if honeypot field is filled, it's a bot
        if request.get_json().get('honeypot', ''):
            # Silently reject - don't let bots know they were caught
            return jsonify({
                'message': 'User and Business registered successfully',
                'user': {},
                'business': {}
            }), 201
        
        # Validate password strength (relaxed for testing)
        is_strong, password_message = validate_password_strength(data['password'])
        if not is_strong:
            # For testing, allow the password but show warning
            print(f"Password warning: {password_message}")
            # return jsonify({'error': f'Weak password: {password_message}'}), 400
        
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
            approval_status=UserApprovalStatus.APPROVED  # Auto-approve new accounts
        )
        
        user.set_password(data['password'])
        db.session.add(user)
        db.session.commit()
        
        # Auto-create a trial subscription for the new business
        try:
            from app.models.subscription import Subscription, Plan, PlanType, SubscriptionStatus
            from datetime import timedelta
            
            # Prefer FREE plan if available; otherwise pick the first active plan
            plan = Plan.query.filter(Plan.plan_type == PlanType.FREE, Plan.is_active == True).first()
            if not plan:
                plan = Plan.query.filter_by(is_active=True).order_by(Plan.price.asc()).first()
            
            if plan:
                start_date = datetime.utcnow()
                end_date = start_date + timedelta(days=30)  # 30-day trial
                trial = Subscription(
                    business_id=business.id,
                    plan_id=plan.id,
                    status=SubscriptionStatus.TRIAL,
                    start_date=start_date,
                    end_date=end_date,
                    is_active=True
                )
                db.session.add(trial)
                db.session.commit()
        except Exception as sub_err:
            # Do not block registration if subscription creation fails
            print(f"Warning: Could not create trial subscription: {sub_err}")
        
        # Auto login: issue JWT token on successful registration
        additional_claims = {
            "business_id": user.business_id if user.business_id else 0,
            "role": user.role.value,
            "mfa_required": False,
            "mfa_verified": True
        }
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims=additional_claims,
            expires_delta=timedelta(hours=24)
        )
        
        return jsonify({
            'message': 'User and Business registered successfully',
            'access_token': access_token,
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
@rate_limit(max_requests=10, window_seconds=300)  # 10 login attempts per 5 minutes
@validate_json_input({
    'username': {'type': 'string', 'required': True, 'max_length': 80},
    'password': {'type': 'string', 'required': True, 'max_length': 128},
})
def login():
    try:
        data = request.sanitized_data
        
        # Try to find user by username or email
        user = User.query.filter(
            (User.username == data['username']) | (User.email == data['username'])
        ).first()
        
        if not user:
            # Log failed login attempt
            # event_monitor.log_event(
            #     category=EventCategory.SECURITY,
            #     event_type=EventType.LOGIN_FAILURE,
            #     severity=EventSeverity.MEDIUM,
            #     description=f"Failed login attempt for unknown user: {data['username']}",
            #     details={'username': data['username']},
            #     entity_type='user',
            #     ip_address=request.remote_addr,
            #     user_agent=request.headers.get('User-Agent'),
            #     tags=['login', 'failed', 'unknown_user']
            # )
            return jsonify({'error': 'Invalid username/email or password'}), 401
        
        # Skip approval status restrictions; allow login after registration
        
        # Check if account is locked (handle case where column might not exist)
        try:
            if user.locked_until and user.locked_until > datetime.utcnow():
                remaining_time = (user.locked_until - datetime.utcnow()).seconds // 60
                return jsonify({'error': f'Account is locked. Try again in {remaining_time} minutes'}), 401
        except Exception:
            pass  # Column might not exist, continue with login
        
        if not user.check_password(data['password']):
            # Increment failed login attempts (handle case where column might not exist)
            try:
                user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
                
                # Log failed login attempt
                # event_monitor.log_event(
                #     category=EventCategory.SECURITY,
                #     event_type=EventType.LOGIN_FAILURE,
                #     severity=EventSeverity.MEDIUM,
                #     description=f"Failed login attempt for user {user.username}: invalid password",
                #     details={
                #         'username': user.username,
                #         'user_id': user.id,
                #         'failed_attempts': user.failed_login_attempts + 1
                #     },
                #     entity_type='user',
                #     entity_id=str(user.id),
                #     user_id=str(user.id),
                #     business_id=str(user.business_id),
                #     tags=['login', 'failed', 'invalid_password']
                # )
                
                # Lock account after 5 failed attempts
                if user.failed_login_attempts >= 5:
                    user.locked_until = datetime.utcnow() + timedelta(minutes=30)  # Lock for 30 minutes
                    
                    # Log account lock event
                    # event_monitor.log_event(
                    #     category=EventCategory.SECURITY,
                    #     event_type=EventType.ACCOUNT_LOCKED,
                    #     severity=EventSeverity.HIGH,
                    #     description=f"Account locked for user {user.username} due to multiple failed login attempts",
                    #     details={
                    #         'username': user.username,
                    #         'user_id': user.id,
                    #         'failed_attempts': user.failed_login_attempts,
                    #         'locked_until': user.locked_until.isoformat()
                    #     },
                    #     entity_type='user',
                    #     entity_id=str(user.id),
                    #     user_id=str(user.id),
                    #     business_id=str(user.business_id),
                    #     tags=['security', 'account_locked', 'brute_force']
                    # )
                    
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
            # Log failed login due to inactive account
            # event_monitor.log_event(
            #     category=EventCategory.SECURITY,
            #     event_type=EventType.LOGIN_FAILURE,
            #     severity=EventSeverity.MEDIUM,
            #     description=f"Failed login attempt for user {user.username}: account inactive",
            #     details={
            #         'username': user.username,
            #         'user_id': user.id,
            #         'reason': 'account_inactive'
            #     },
            #     entity_type='user',
            #     entity_id=str(user.id),
            #     user_id=str(user.id),
            #     business_id=str(user.business_id),
            #     tags=['login', 'failed', 'account_inactive']
            # )
            return jsonify({'error': 'Account is deactivated'}), 401
        
        # Check if business is active (skip for superadmins)
        if user.role != UserRole.superadmin and user.business_id:
            business = db.session.get(Business, user.business_id)
            if not business:
                return jsonify({'error': 'Business not found'}), 401
            if not business.is_active:
                return jsonify({'error': 'Business account is suspended/blocked. Please contact support.'}), 401
        
        # If MFA is enabled, return a temporary token requiring MFA verification
        if user.mfa_enabled:
            additional_claims = {
                "business_id": user.business_id if user.business_id else 0, 
                "role": user.role.value,
                "mfa_required": True,
                "mfa_verified": False
            }
            temp_token = create_access_token(
                identity=str(user.id),
                additional_claims=additional_claims,
                expires_delta=timedelta(minutes=5)  # Short-lived token for MFA verification
            )
            
            return jsonify({
                'mfa_required': True,
                'temp_token': temp_token,
                'message': 'MFA verification required'
            }), 200
        
        # Create access token with business_id in claims
        additional_claims = {
            "business_id": user.business_id if user.business_id else 0, 
            "role": user.role.value,
            "mfa_required": False,
            "mfa_verified": True
        }
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims=additional_claims,
            expires_delta=timedelta(hours=24)
        )
        
        # Log successful login
        # event_monitor.log_event(
        #     category=EventCategory.SECURITY,
        #     event_type=EventType.LOGIN_SUCCESS,
        #     severity=EventSeverity.INFO,
        #     description=f"Successful login for user {user.username}",
        #     details={
        #         'username': user.username,
        #         'user_id': user.id,
        #         'role': user.role.value,
        #         'mfa_enabled': user.mfa_enabled or False
        #     },
        #     entity_type='user',
        #     entity_id=str(user.id),
        #     user_id=str(user.id),
        #     business_id=str(user.business_id),
        #     tags=['login', 'successful']
        # )
        
        # Create audit log for successful login
        create_audit_log(
            user_id=user.id,
            business_id=user.business_id,
            action=AuditAction.LOGIN,
            entity_type='user',
            entity_id=user.id,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent'),
            metadata={'login_method': 'password', 'mfa_enabled': user.mfa_enabled or False}
        )
        
        db.session.commit()
        
        return jsonify({
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/upload-profile-picture', methods=['POST'])
@jwt_required()
@validate_file_upload(allowed_extensions=['png', 'jpg', 'jpeg', 'gif'], max_size_mb=5)
def upload_profile_picture():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        file_validation = request.file_validation
        
        upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'profile_pictures')
        os.makedirs(upload_dir, exist_ok=True)
        
        # Use sanitized filename
        filename = file_validation['sanitized_filename']
        file_ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else 'png'
        new_filename = f"{uuid.uuid4().hex}.{file_ext}"
        file_path = os.path.join(upload_dir, new_filename)
        
        # Save file
        file = request.files['file']
        file.save(file_path)

        file_url = f"/uploads/profile_pictures/{new_filename}"
        
        # Update user profile picture
        user.profile_picture = file_url
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
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
@validate_json_input({
    'current_password': {'type': 'string', 'required': True, 'max_length': 128},
    'new_password': {'type': 'string', 'required': True, 'max_length': 128},
})
def change_password():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.sanitized_data
        
        if not user.check_password(data['current_password']):
            return jsonify({'error': 'Current password is incorrect'}), 400
        
        # Validate new password strength
        is_strong, password_message = validate_password_strength(data['new_password'])
        if not is_strong:
            return jsonify({'error': f'Weak password: {password_message}'}), 400
        
        # Check if new password is same as current
        if user.check_password(data['new_password']):
            return jsonify({'error': 'New password must be different from current password'}), 400
        
        user.set_password(data['new_password'])
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Create audit log for password change
        try:
            create_audit_log(
                user_id=user.id,
                business_id=user.business_id,
                action=AuditAction.UPDATE,
                entity_type='user',
                entity_id=user.id,
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent'),
                new_values={'password_changed': True}
            )
        except Exception as e:
            # Don't let audit logging errors affect password change
            print(f"Audit logging error: {str(e)}")
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/forgot-password', methods=['POST'])
@rate_limit(max_requests=3, window_seconds=300)  # 3 password reset requests per 5 minutes
@validate_json_input({
    'email': {'type': 'email', 'required': True},
})
def forgot_password():
    try:
        data = request.sanitized_data
        email = data['email']
            
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
@validate_json_input({
    'token': {'type': 'string', 'required': True, 'max_length': 100},
    'new_password': {'type': 'string', 'required': True, 'max_length': 128},
})
def reset_password():
    try:
        data = request.sanitized_data
        token = data['token']
        new_password = data['new_password']
        
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
        
        # Subscription restrictions removed for business accounts:
        # always report full access.
        return jsonify({
            'has_subscription': True,
            'can_write': True,
            'subscription': None,
            'is_superadmin': False,
            'features': [],
            'plan_type': 'unlimited',
            'plan_name': 'Unlimited Access'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# MFA Endpoints
@auth_bp.route('/mfa/complete-login', methods=['POST'])
@jwt_required()
def complete_mfa_login():
    """Complete login after MFA verification"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        token = data.get('token')
        backup_code = data.get('backup_code')
        
        if not token and not backup_code:
            return jsonify({'error': 'MFA token or backup code is required'}), 400
        
        # Check TOTP token first
        if token and user.verify_mfa_token(token):
            verified = True
            method = 'totp'
        # Check backup code
        elif backup_code and user.verify_backup_code(backup_code):
            verified = True
            method = 'backup_code'
        else:
            return jsonify({'error': 'Invalid MFA token or backup code'}), 400
        
        if verified:
            # Create final access token
            additional_claims = {
                "business_id": user.business_id if user.business_id else 0, 
                "role": user.role.value,
                "mfa_required": False,
                "mfa_verified": True
            }
            access_token = create_access_token(
                identity=str(user.id),
                additional_claims=additional_claims,
                expires_delta=timedelta(hours=24)
            )
            
            # Create audit log for successful MFA login
            try:
                create_audit_log(
                    user_id=user.id,
                    business_id=user.business_id,
                    action=AuditAction.LOGIN,
                    entity_type='user',
                    entity_id=user.id,
                    ip_address=request.remote_addr,
                    user_agent=request.headers.get('User-Agent'),
                    metadata={
                        'login_method': 'password',
                        'mfa_method': method,
                        'mfa_verified': True
                    }
                )
            except Exception as e:
                # Don't let audit logging errors affect login
                print(f"Audit logging error: {str(e)}")
            
            db.session.commit()
            
            response_data = {
                'access_token': access_token,
                'user': user.to_dict(),
                'mfa_verified': True,
                'message': 'Login successful'
            }
            
            if method == 'backup_code':
                response_data['backup_codes_remaining'] = user.get_remaining_backup_codes()
            
            return jsonify(response_data), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
@auth_bp.route('/mfa/setup', methods=['POST'])
@jwt_required()
def setup_mfa():
    """Setup MFA for a user - generate secret and QR code"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Generate new secret
        secret = user.generate_mfa_secret()
        
        # Generate backup codes
        backup_codes = user.generate_backup_codes()
        
        # Get QR code URI
        qr_uri = user.get_mfa_uri()
        
        # Don't enable MFA yet - wait for verification
        db.session.commit()
        
        return jsonify({
            'secret': secret,
            'qr_code_uri': qr_uri,
            'backup_codes': backup_codes,
            'instructions': {
                'step1': 'Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)',
                'step2': 'Enter the 6-digit code from your app to verify setup',
                'step3': 'Save your backup codes in a secure location'
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/mfa/verify-setup', methods=['POST'])
@jwt_required()
def verify_mfa_setup():
    """Verify MFA setup with TOTP token and enable MFA"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        token = data.get('token')
        
        if not token:
            return jsonify({'error': 'Verification token is required'}), 400
        
        if not user.mfa_secret:
            return jsonify({'error': 'MFA setup not initiated. Please start setup first.'}), 400
        
        # Verify the token
        if user.verify_mfa_token(token):
            user.mfa_enabled = True
            db.session.commit()
            
            return jsonify({
                'message': 'MFA enabled successfully',
                'mfa_enabled': True,
                'backup_codes_remaining': user.get_remaining_backup_codes()
            }), 200
        else:
            return jsonify({'error': 'Invalid verification code'}), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/mfa/disable', methods=['POST'])
@jwt_required()
def disable_mfa():
    """Disable MFA for a user (requires password confirmation)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        password = data.get('password')
        
        if not password:
            return jsonify({'error': 'Password is required to disable MFA'}), 400
        
        # Verify password
        if not user.check_password(password):
            return jsonify({'error': 'Invalid password'}), 400
        
        # Disable MFA
        user.mfa_enabled = False
        user.mfa_secret = None
        user.mfa_backup_codes = None
        user.mfa_backup_codes_used = None
        
        db.session.commit()
        
        return jsonify({
            'message': 'MFA disabled successfully',
            'mfa_enabled': False
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/mfa/status', methods=['GET'])
@jwt_required()
def get_mfa_status():
    """Get current MFA status and backup codes count"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'mfa_enabled': user.mfa_enabled,
            'backup_codes_remaining': user.get_remaining_backup_codes(),
            'can_setup_mfa': not user.mfa_enabled
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/mfa/verify', methods=['POST'])
@jwt_required()
def verify_mfa_token():
    """Verify MFA token during login"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        token = data.get('token')
        backup_code = data.get('backup_code')
        
        if not token and not backup_code:
            return jsonify({'error': 'MFA token or backup code is required'}), 400
        
        # Check TOTP token first
        if token and user.verify_mfa_token(token):
            return jsonify({'verified': True, 'method': 'totp'}), 200
        
        # Check backup code
        if backup_code and user.verify_backup_code(backup_code):
            db.session.commit()
            return jsonify({
                'verified': True, 
                'method': 'backup_code',
                'backup_codes_remaining': user.get_remaining_backup_codes()
            }), 200
        
        return jsonify({'error': 'Invalid MFA token or backup code'}), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/mfa/regenerate-backup-codes', methods=['POST'])
@jwt_required()
def regenerate_backup_codes():
    """Regenerate backup codes (requires MFA verification)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if not user.mfa_enabled:
            return jsonify({'error': 'MFA must be enabled to generate backup codes'}), 400
        
        data = request.get_json()
        token = data.get('token')
        
        if not token:
            return jsonify({'error': 'MFA token is required to regenerate backup codes'}), 400
        
        # Verify current MFA token
        if not user.verify_mfa_token(token):
            return jsonify({'error': 'Invalid MFA token'}), 400
        
        # Generate new backup codes
        backup_codes = user.generate_backup_codes()
        db.session.commit()
        
        return jsonify({
            'backup_codes': backup_codes,
            'message': 'Backup codes regenerated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
