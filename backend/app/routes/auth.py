from flask import Blueprint, request, jsonify, url_for
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from app import db, bcrypt
from app.models.user import User, UserRole, UserApprovalStatus
from app.models.business import Business
from datetime import datetime, timedelta
import re, os, uuid
from werkzeug.utils import secure_filename

ALLOWED_EXT = {'png', 'jpg', 'jpeg', 'gif'}

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'first_name', 'last_name', 'business_name', 'profile_picture']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate email format
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Uniqueness checks are tenant-scoped; actual checks performed after business creation
        
        # Create new business
        business = Business(
            name=data['business_name'],
            email=data['email'], # Use user email as business email initially
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
            approval_status=UserApprovalStatus.APPROVED  # New users are automatically approved
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
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Username and password are required'}), 400
        
        users = User.query.filter_by(username=data['username']).all()
        if not users:
            return jsonify({'error': 'Invalid credentials'}), 401
        if len(users) > 1:
            return jsonify({'error': 'Multiple accounts found with this username; please login with email or include business context'}), 400
        user = users[0]

        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 401
        
        # Removed approval status check - users can login regardless of approval status
        # Require profile picture before allowing login
        if not user.profile_picture:
            return jsonify({'error': 'Profile picture is required. Please upload a profile picture before logging in.'}), 403
        
        # Create access token with business_id in claims
        additional_claims = {"business_id": user.business_id, "role": user.role.value}
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims=additional_claims,
            expires_delta=timedelta(hours=24)
        )
        
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

        upload_dir = os.path.join(os.path.dirname(__file__), '..', 'static', 'uploads', 'profile_pictures')
        os.makedirs(upload_dir, exist_ok=True)
        new_filename = f"{uuid.uuid4().hex}.{ext}"
        file_path = os.path.join(upload_dir, new_filename)
        file.save(file_path)

        file_url = url_for('static', filename=f'uploads/profile_pictures/{new_filename}', _external=False)
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
        
        if len(data['new_password']) < 6:
            return jsonify({'error': 'New password must be at least 6 characters long'}), 400
        
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
        
        print(f"Password reset token for {email}: {token}")
        
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