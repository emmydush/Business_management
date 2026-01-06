from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.warehouse import Warehouse
from app.utils.decorators import staff_required, manager_required
from app.utils.middleware import module_required, get_business_id
from datetime import datetime
import uuid

warehouse_bp = Blueprint('warehouse', __name__)


@warehouse_bp.route('/', methods=['GET'])
@jwt_required()
@module_required('inventory')  # Assuming warehouses fall under inventory module
def get_warehouses():
    try:
        business_id = get_business_id()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        warehouses = Warehouse.query.filter_by(business_id=business_id, is_active=True)\
            .order_by(Warehouse.created_at.desc()).paginate(
                page=page, per_page=per_page, error_out=False
            )
        
        return jsonify({
            'warehouses': [warehouse.to_dict() for warehouse in warehouses.items],
            'total': warehouses.total,
            'pages': warehouses.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@warehouse_bp.route('/<int:warehouse_id>', methods=['GET'])
@jwt_required()
@module_required('inventory')
def get_warehouse(warehouse_id):
    try:
        business_id = get_business_id()
        warehouse = Warehouse.query.filter_by(id=warehouse_id, business_id=business_id).first()
        
        if not warehouse:
            return jsonify({'error': 'Warehouse not found'}), 404
        
        return jsonify({'warehouse': warehouse.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@warehouse_bp.route('/', methods=['POST'])
@jwt_required()
@module_required('inventory')
@manager_required
def create_warehouse():
    try:
        business_id = get_business_id()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'location']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Generate warehouse ID
        last_warehouse = Warehouse.query.filter_by(business_id=business_id).order_by(Warehouse.id.desc()).first()
        if last_warehouse:
            try:
                last_id = int(last_warehouse.warehouse_id[3:])  # Remove 'WH-' prefix
                warehouse_id = f'WH-{last_id + 1:04d}'
            except:
                warehouse_id = f'WH-{datetime.now().strftime("%Y%m%d%H%M%S")}'
        else:
            warehouse_id = 'WH-0001'
        
        # Check if warehouse name already exists for this business
        existing_warehouse = Warehouse.query.filter_by(business_id=business_id, name=data['name']).first()
        if existing_warehouse:
            return jsonify({'error': 'Warehouse name already exists for this business'}), 409
        
        # Check if manager exists (if provided)
        manager_id = None
        if data.get('manager_id'):
            manager = User.query.filter_by(id=data['manager_id'], business_id=business_id).first()
            if not manager:
                return jsonify({'error': 'Manager not found for this business'}), 404
            manager_id = data['manager_id']
        
        warehouse = Warehouse(
            business_id=business_id,
            warehouse_id=warehouse_id,
            name=data['name'],
            location=data.get('location'),
            manager_id=manager_id,
            status=data.get('status', 'active'),
            capacity_percentage=data.get('capacity_percentage', 0),
            total_items=data.get('total_items', 0),
            max_capacity=data.get('max_capacity', 10000),
            notes=data.get('notes', '')
        )
        
        db.session.add(warehouse)
        db.session.commit()
        
        return jsonify({
            'message': 'Warehouse created successfully',
            'warehouse': warehouse.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@warehouse_bp.route('/<int:warehouse_id>', methods=['PUT'])
@jwt_required()
@module_required('inventory')
@manager_required
def update_warehouse(warehouse_id):
    try:
        business_id = get_business_id()
        warehouse = Warehouse.query.filter_by(id=warehouse_id, business_id=business_id).first()
        
        if not warehouse:
            return jsonify({'error': 'Warehouse not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'name' in data:
            # Check if new name already exists for this business (excluding current warehouse)
            existing_warehouse = Warehouse.query.filter_by(
                business_id=business_id, 
                name=data['name']
            ).filter(Warehouse.id != warehouse_id).first()
            if existing_warehouse:
                return jsonify({'error': 'Warehouse name already exists for this business'}), 409
            warehouse.name = data['name']
        
        if 'location' in data:
            warehouse.location = data['location']
            
        if 'manager_id' in data:
            manager = User.query.filter_by(id=data['manager_id'], business_id=business_id).first()
            if not manager:
                return jsonify({'error': 'Manager not found for this business'}), 404
            warehouse.manager_id = data['manager_id']
            
        if 'status' in data:
            warehouse.status = data['status']
            
        if 'capacity_percentage' in data:
            warehouse.capacity_percentage = data['capacity_percentage']
            
        if 'total_items' in data:
            warehouse.total_items = data['total_items']
            
        if 'max_capacity' in data:
            warehouse.max_capacity = data['max_capacity']
            
        if 'notes' in data:
            warehouse.notes = data['notes']
            
        if 'is_active' in data:
            warehouse.is_active = data['is_active']
        
        warehouse.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Warehouse updated successfully',
            'warehouse': warehouse.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@warehouse_bp.route('/<int:warehouse_id>', methods=['DELETE'])
@jwt_required()
@module_required('inventory')
@manager_required
def delete_warehouse(warehouse_id):
    try:
        business_id = get_business_id()
        warehouse = Warehouse.query.filter_by(id=warehouse_id, business_id=business_id).first()
        
        if not warehouse:
            return jsonify({'error': 'Warehouse not found'}), 404
        
        db.session.delete(warehouse)
        db.session.commit()
        
        return jsonify({'message': 'Warehouse deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500