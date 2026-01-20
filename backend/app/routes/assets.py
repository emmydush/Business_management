from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models.asset import Asset, AssetStatus
from app.models.user import User
from app.models.business import Business
from app.utils.middleware import module_required, get_active_branch_id
from datetime import datetime

assets_bp = Blueprint('assets', __name__)

@assets_bp.route('/', methods=['GET'])
@jwt_required()
@module_required('hr')
def get_assets():
    try:
        claims = get_jwt()
        business_id = claims.get('business_id')
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        search = request.args.get('search', '')
        status = request.args.get('status', '')
        category = request.args.get('category', '')

        query = Asset.query.filter_by(business_id=business_id)
        if branch_id:
            query = query.filter_by(branch_id=branch_id)

        if search:
            query = query.filter(
                db.or_(
                    Asset.name.ilike(f"%{search}%"),
                    Asset.serial_number.ilike(f"%{search}%"),
                    Asset.asset_tag.ilike(f"%{search}%")
                )
            )

        if status:
            query = query.filter(Asset.status == status)

        if category:
            query = query.filter(Asset.category.ilike(f"%{category}%"))

        pagination = query.order_by(Asset.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        assets = [asset.to_dict() for asset in pagination.items]

        # Get asset statistics
        total_assets_query = Asset.query.filter_by(business_id=business_id)
        if branch_id:
            total_assets_query = total_assets_query.filter_by(branch_id=branch_id)
        
        total_assets = total_assets_query.count()
        assigned_count = total_assets_query.filter_by(status=AssetStatus.ASSIGNED).count()
        available_count = total_assets_query.filter_by(status=AssetStatus.AVAILABLE).count()
        in_repair_count = total_assets_query.filter_by(status=AssetStatus.IN_REPAIR).count()

        return jsonify({
            'assets': assets,
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
            'stats': {
                'total_assets': total_assets,
                'assigned': assigned_count,
                'available': available_count,
                'in_repair': in_repair_count
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@assets_bp.route('/<int:asset_id>', methods=['GET'])
@jwt_required()
@module_required('hr')
def get_asset(asset_id):
    try:
        claims = get_jwt()
        business_id = claims.get('business_id')
        
        asset = Asset.query.filter_by(id=asset_id, business_id=business_id).first()
        if not asset:
            return jsonify({'error': 'Asset not found'}), 404

        return jsonify({'asset': asset.to_dict()}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@assets_bp.route('/', methods=['POST'])
@jwt_required()
@module_required('hr')
def create_asset():
    try:
        claims = get_jwt()
        business_id = claims.get('business_id')
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        current_user_id = get_jwt_identity()
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'category']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400

        # Check if serial number already exists
        if data.get('serial_number'):
            existing_asset = Asset.query.filter_by(serial_number=data['serial_number']).first()
            if existing_asset:
                return jsonify({'error': 'Serial number already exists'}), 400

        # Check if asset tag already exists
        if data.get('asset_tag'):
            existing_asset = Asset.query.filter_by(asset_tag=data['asset_tag']).first()
            if existing_asset:
                return jsonify({'error': 'Asset tag already exists'}), 400

        asset = Asset(
            business_id=business_id,
            branch_id=branch_id,
            name=data['name'],
            category=data.get('category'),
            serial_number=data.get('serial_number'),
            asset_tag=data.get('asset_tag'),
            description=data.get('description'),
            value=data.get('value'),
            status=data.get('status', AssetStatus.AVAILABLE),
            assigned_to=data.get('assigned_to'),
            assigned_date=datetime.strptime(data['assigned_date'], '%Y-%m-%d').date() if data.get('assigned_date') else None,
            purchase_date=datetime.strptime(data['purchase_date'], '%Y-%m-%d').date() if data.get('purchase_date') else None,
            warranty_expiry=datetime.strptime(data['warranty_expiry'], '%Y-%m-%d').date() if data.get('warranty_expiry') else None,
            location=data.get('location'),
            notes=data.get('notes')
        )

        db.session.add(asset)
        db.session.commit()

        return jsonify({
            'message': 'Asset created successfully',
            'asset': asset.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@assets_bp.route('/<int:asset_id>', methods=['PUT'])
@jwt_required()
@module_required('hr')
def update_asset(asset_id):
    try:
        claims = get_jwt()
        business_id = claims.get('business_id')
        
        asset = Asset.query.filter_by(id=asset_id, business_id=business_id).first()
        if not asset:
            return jsonify({'error': 'Asset not found'}), 404

        data = request.get_json()

        # Update allowed fields
        updatable_fields = [
            'name', 'category', 'serial_number', 'asset_tag', 'description',
            'value', 'status', 'assigned_to', 'assigned_date', 'purchase_date',
            'warranty_expiry', 'location', 'notes', 'branch_id'
        ]

        for field in updatable_fields:
            if field in data:
                if field in ['assigned_date', 'purchase_date', 'warranty_expiry']:
                    if data[field]:
                        setattr(asset, field, datetime.strptime(data[field], '%Y-%m-%d').date())
                    else:
                        setattr(asset, field, None)
                else:
                    setattr(asset, field, data[field])

        asset.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'Asset updated successfully',
            'asset': asset.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@assets_bp.route('/<int:asset_id>', methods=['DELETE'])
@jwt_required()
@module_required('hr')
def delete_asset(asset_id):
    try:
        claims = get_jwt()
        business_id = claims.get('business_id')
        
        asset = Asset.query.filter_by(id=asset_id, business_id=business_id).first()
        if not asset:
            return jsonify({'error': 'Asset not found'}), 404

        db.session.delete(asset)
        db.session.commit()

        return jsonify({'message': 'Asset deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500