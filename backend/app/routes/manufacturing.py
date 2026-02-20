from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.manufacturing import BillOfMaterials, BOMItem, ProductionOrder, ProductionMaterial, ProductionOperation
from app.models.manufacturing import BOMStatus, ProductionOrderStatus
from app.models.product import Product
from app.models.inventory_transaction import InventoryTransaction
from app.utils.middleware import get_business_id
from datetime import datetime, date
import uuid

manufacturing_bp = Blueprint('manufacturing', __name__)

def generate_id(prefix):
    return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"

# ============== BILLS OF MATERIALS ==============

@manufacturing_bp.route('/bom', methods=['GET'])
@jwt_required()
def get_boms():
    business_id = get_business_id()
    branch_id = request.args.get('branch_id', type=int)
    product_id = request.args.get('product_id', type=int)
    status = request.args.get('status')
    
    query = BillOfMaterials.query.filter_by(business_id=business_id)
    
    if branch_id:
        query = query.filter_by(branch_id=branch_id)
    if product_id:
        query = query.filter_by(product_id=product_id)
    if status:
        query = query.filter_by(status=BOMStatus[status.upper()])
    
    boms = query.order_by(BillOfMaterials.created_at.desc()).all()
    return jsonify([b.to_dict() for b in boms])

@manufacturing_bp.route('/bom/<int:bom_id>', methods=['GET'])
@jwt_required()
def get_bom(bom_id):
    business_id = get_business_id()
    bom = BillOfMaterials.query.filter_by(id=bom_id, business_id=business_id).first()
    if not bom:
        return jsonify({'error': 'BOM not found'}), 404
    return jsonify(bom.to_dict())

@manufacturing_bp.route('/bom', methods=['POST'])
@jwt_required()
def create_bom():
    business_id = get_business_id()
    user_id = get_jwt_identity()
    data = request.get_json()
    
    bom = BillOfMaterials(
        business_id=business_id,
        branch_id=data.get('branch_id'),
        bom_id=generate_id('BOM'),
        product_id=data['product_id'],
        name=data['name'],
        description=data.get('description'),
        version=data.get('version', '1.0'),
        quantity=data.get('quantity', 1),
        created_by=user_id
    )
    
    # Calculate costs from items
    material_cost = 0
    for item_data in data.get('items', []):
        product = Product.query.get(item_data['product_id'])
        if product and product.cost_price:
            qty = item_data.get('quantity_required', 1)
            scrap = item_data.get('scrap_percent', 0) / 100
            material_cost += float(product.cost_price) * qty * (1 + scrap)
        
        item = BOMItem(
            product_id=item_data['product_id'],
            quantity_required=item_data.get('quantity_required', 1),
            unit_of_measure=item_data.get('unit_of_measure', 'pcs'),
            scrap_percent=item_data.get('scrap_percent', 0),
            sequence=item_data.get('sequence', 0),
            notes=item_data.get('notes')
        )
        bom.items.append(item)
    
    bom.material_cost = material_cost
    bom.labor_cost = data.get('labor_cost', 0)
    bom.overhead_cost = data.get('overhead_cost', 0)
    bom.total_cost = material_cost + bom.labor_cost + bom.overhead_cost
    
    db.session.add(bom)
    db.session.commit()
    return jsonify(bom.to_dict()), 201

@manufacturing_bp.route('/bom/<int:bom_id>', methods=['PUT'])
@jwt_required()
def update_bom(bom_id):
    business_id = get_business_id()
    bom = BillOfMaterials.query.filter_by(id=bom_id, business_id=business_id).first()
    if not bom:
        return jsonify({'error': 'BOM not found'}), 404
    
    data = request.get_json()
    
    # Update basic fields
    for key in ['name', 'description', 'version', 'quantity', 'labor_cost', 'overhead_cost']:
        if key in data:
            setattr(bom, key, data[key])
    
    # Update items if provided
    if 'items' in data:
        BOMItem.query.filter_by(bom_id=bom_id).delete()
        
        material_cost = 0
        for item_data in data['items']:
            product = Product.query.get(item_data['product_id'])
            if product and product.cost_price:
                qty = item_data.get('quantity_required', 1)
                scrap = item_data.get('scrap_percent', 0) / 100
                material_cost += float(product.cost_price) * qty * (1 + scrap)
            
            item = BOMItem(
                bom_id=bom_id,
                product_id=item_data['product_id'],
                quantity_required=item_data.get('quantity_required', 1),
                unit_of_measure=item_data.get('unit_of_measure', 'pcs'),
                scrap_percent=item_data.get('scrap_percent', 0),
                sequence=item_data.get('sequence', 0),
                notes=item_data.get('notes')
            )
            db.session.add(item)
        
        bom.material_cost = material_cost
        bom.total_cost = material_cost + bom.labor_cost + bom.overhead_cost
    
    db.session.commit()
    return jsonify(bom.to_dict())

@manufacturing_bp.route('/bom/<int:bom_id>', methods=['DELETE'])
@jwt_required()
def delete_bom(bom_id):
    business_id = get_business_id()
    bom = BillOfMaterials.query.filter_by(id=bom_id, business_id=business_id).first()
    if not bom:
        return jsonify({'error': 'BOM not found'}), 404
    
    db.session.delete(bom)
    db.session.commit()
    return jsonify({'message': 'BOM deleted'})

@manufacturing_bp.route('/bom/<int:bom_id>/activate', methods=['POST'])
@jwt_required()
def activate_bom(bom_id):
    business_id = get_business_id()
    bom = BillOfMaterials.query.filter_by(id=bom_id, business_id=business_id).first()
    if not bom:
        return jsonify({'error': 'BOM not found'}), 404
    
    bom.status = BOMStatus.ACTIVE
    db.session.commit()
    return jsonify(bom.to_dict())

# ============== PRODUCTION ORDERS ==============

@manufacturing_bp.route('/production', methods=['GET'])
@jwt_required()
def get_production_orders():
    business_id = get_business_id()
    branch_id = request.args.get('branch_id', type=int)
    status = request.args.get('status')
    product_id = request.args.get('product_id', type=int)
    
    query = ProductionOrder.query.filter_by(business_id=business_id)
    
    if branch_id:
        query = query.filter_by(branch_id=branch_id)
    if status:
        query = query.filter_by(status=ProductionOrderStatus[status.upper()])
    if product_id:
        query = query.filter_by(product_id=product_id)
    
    orders = query.order_by(ProductionOrder.planned_start_date.desc()).all()
    return jsonify([o.to_dict() for o in orders])

@manufacturing_bp.route('/production/<int:order_id>', methods=['GET'])
@jwt_required()
def get_production_order(order_id):
    business_id = get_business_id()
    order = ProductionOrder.query.filter_by(id=order_id, business_id=business_id).first()
    if not order:
        return jsonify({'error': 'Production order not found'}), 404
    return jsonify(order.to_dict())

@manufacturing_bp.route('/production', methods=['POST'])
@jwt_required()
def create_production_order():
    business_id = get_business_id()
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Get BOM
    bom = BillOfMaterials.query.filter_by(id=data['bom_id'], business_id=business_id).first()
    if not bom:
        return jsonify({'error': 'BOM not found'}), 404
    
    order = ProductionOrder(
        business_id=business_id,
        branch_id=data.get('branch_id'),
        order_id=generate_id('PO'),
        bom_id=data['bom_id'],
        product_id=bom.product_id,
        quantity_to_produce=data['quantity_to_produce'],
        planned_start_date=datetime.strptime(data['planned_start_date'], '%Y-%m-%d').date() if data.get('planned_start_date') else None,
        planned_end_date=datetime.strptime(data['planned_end_date'], '%Y-%m-%d').date() if data.get('planned_end_date') else None,
        estimated_cost=bom.total_cost * data['quantity_to_produce'],
        priority=data.get('priority', 0),
        notes=data.get('notes'),
        created_by=user_id
    )
    
    # Create material requirements from BOM
    for bom_item in bom.items:
        qty_needed = bom_item.quantity_required * data['quantity_to_produce']
        scrap = 1 + (bom_item.scrap_percent / 100)
        qty_with_scrap = qty_needed * scrap
        
        material = ProductionMaterial(
            product_id=bom_item.product_id,
            quantity_required=qty_with_scrap,
            quantity_remaining=qty_with_scrap,
            warehouse_id=data.get('warehouse_id')
        )
        order.materials.append(material)
    
    # Create operations if provided
    for op_data in data.get('operations', []):
        operation = ProductionOperation(
            sequence=op_data.get('sequence', 0),
            operation_name=op_data['operation_name'],
            description=op_data.get('description'),
            work_center=op_data.get('work_center'),
            setup_time=op_data.get('setup_time', 0),
            run_time=op_data.get('run_time', 0),
            employee_id=op_data.get('employee_id')
        )
        order.operations.append(operation)
    
    db.session.add(order)
    db.session.commit()
    return jsonify(order.to_dict()), 201

@manufacturing_bp.route('/production/<int:order_id>', methods=['PUT'])
@jwt_required()
def update_production_order(order_id):
    business_id = get_business_id()
    order = ProductionOrder.query.filter_by(id=order_id, business_id=business_id).first()
    if not order:
        return jsonify({'error': 'Production order not found'}), 404
    
    data = request.get_json()
    
    for key in ['quantity_to_produce', 'planned_start_date', 'planned_end_date', 'priority', 'notes']:
        if key in data:
            if 'date' in key:
                setattr(order, key, datetime.strptime(data[key], '%Y-%m-%d').date() if data[key] else None)
            else:
                setattr(order, key, data[key])
    
    if 'status' in data:
        order.status = ProductionOrderStatus[data['status'].upper()]
        
        # Handle status-specific logic
        if data['status'].upper() == 'IN_PROGRESS':
            order.actual_start_date = date.today()
        elif data['status'].upper() == 'COMPLETED':
            order.actual_end_date = date.today()
    
    db.session.commit()
    return jsonify(order.to_dict())

@manufacturing_bp.route('/production/<int:order_id>/start', methods=['POST'])
@jwt_required()
def start_production(order_id):
    business_id = get_business_id()
    order = ProductionOrder.query.filter_by(id=order_id, business_id=business_id).first()
    if not order:
        return jsonify({'error': 'Production order not found'}), 404
    
    order.status = ProductionOrderStatus.IN_PROGRESS
    order.actual_start_date = date.today()
    
    # Issue materials from inventory
    for material in order.materials:
        if material.quantity_issued < material.quantity_required:
            qty_to_issue = material.quantity_required - material.quantity_issued
            
            # Create inventory transaction
            trans = InventoryTransaction(
                business_id=business_id,
                product_id=material.product_id,
                warehouse_id=material.warehouse_id,
                transaction_type='production_issue',
                quantity=-qty_to_issue,
                reference=f"Production Order: {order.order_id}"
            )
            db.session.add(trans)
            
            material.quantity_issued += qty_to_issue
            material.quantity_remaining = material.quantity_required - material.quantity_issued
    
    db.session.commit()
    return jsonify(order.to_dict())

@manufacturing_bp.route('/production/<int:order_id>/complete', methods=['POST'])
@jwt_required()
def complete_production(order_id):
    business_id = get_business_id()
    order = ProductionOrder.query.filter_by(id=order_id, business_id=business_id).first()
    if not order:
        return jsonify({'error': 'Production order not found'}), 404
    
    data = request.get_json()
    quantity_produced = data.get('quantity_produced', order.quantity_to_produce)
    
    order.status = ProductionOrderStatus.COMPLETED
    order.actual_end_date = date.today()
    order.quantity_produced = quantity_produced
    
    # Receive finished goods into inventory
    for material in order.materials:
        # This is simplified - in reality you'd track material usage more precisely
        pass
    
    # Create inventory receipt for finished product
    trans = InventoryTransaction(
        business_id=business_id,
        product_id=order.product_id,
        transaction_type='production_receipt',
        quantity=quantity_produced,
        reference=f"Production Order: {order.order_id}"
    )
    db.session.add(trans)
    
    db.session.commit()
    return jsonify(order.to_dict())

@manufacturing_bp.route('/production/<int:order_id>', methods=['DELETE'])
@jwt_required()
def delete_production_order(order_id):
    business_id = get_business_id()
    order = ProductionOrder.query.filter_by(id=order_id, business_id=business_id).first()
    if not order:
        return jsonify({'error': 'Production order not found'}), 404
    
    order.status = ProductionOrderStatus.CANCELLED
    db.session.commit()
    return jsonify({'message': 'Production order cancelled'})

# ============== PRODUCTION MATERIALS ==============

@manufacturing_bp.route('/production/<int:order_id>/materials', methods=['GET'])
@jwt_required()
def get_production_materials(order_id):
    business_id = get_business_id()
    order = ProductionOrder.query.filter_by(id=order_id, business_id=business_id).first()
    if not order:
        return jsonify({'error': 'Production order not found'}), 404
    
    materials = ProductionMaterial.query.filter_by(order_id=order_id).all()
    return jsonify([m.to_dict() for m in materials])

@manufacturing_bp.route('/production/<int:order_id>/materials/<int:material_id>/issue', methods=['POST'])
@jwt_required()
def issue_material(order_id, material_id):
    business_id = get_business_id()
    order = ProductionOrder.query.filter_by(id=order_id, business_id=business_id).first()
    if not order:
        return jsonify({'error': 'Production order not found'}), 404
    
    material = ProductionMaterial.query.filter_by(id=material_id, order_id=order_id).first()
    if not material:
        return jsonify({'error': 'Material not found'}), 404
    
    data = request.get_json()
    qty = data.get('quantity', material.quantity_remaining)
    
    if qty > material.quantity_remaining:
        return jsonify({'error': 'Cannot issue more than remaining'}), 400
    
    # Create inventory transaction
    trans = InventoryTransaction(
        business_id=business_id,
        product_id=material.product_id,
        warehouse_id=material.warehouse_id,
        transaction_type='production_issue',
        quantity=-qty,
        reference=f"Production Order: {order.order_id}"
    )
    db.session.add(trans)
    
    material.quantity_issued += qty
    material.quantity_remaining -= qty
    
    db.session.commit()
    return jsonify(material.to_dict())

# ============== PRODUCTION OPERATIONS ==============

@manufacturing_bp.route('/production/<int:order_id>/operations/<int:operation_id>/start', methods=['POST'])
@jwt_required()
def start_operation(order_id, operation_id):
    business_id = get_business_id()
    order = ProductionOrder.query.filter_by(id=order_id, business_id=business_id).first()
    if not order:
        return jsonify({'error': 'Production order not found'}), 404
    
    operation = ProductionOperation.query.filter_by(id=operation_id, order_id=order_id).first()
    if not operation:
        return jsonify({'error': 'Operation not found'}), 404
    
    operation.status = 'in_progress'
    operation.started_at = datetime.utcnow()
    
    db.session.commit()
    return jsonify(operation.to_dict())

@manufacturing_bp.route('/production/<int:order_id>/operations/<int:operation_id>/complete', methods=['POST'])
@jwt_required()
def complete_operation(order_id, operation_id):
    business_id = get_business_id()
    order = ProductionOrder.query.filter_by(id=order_id, business_id=business_id).first()
    if not order:
        return jsonify({'error': 'Production order not found'}), 404
    
    operation = ProductionOperation.query.filter_by(id=operation_id, order_id=order_id).first()
    if not operation:
        return jsonify({'error': 'Operation not found'}), 404
    
    operation.status = 'completed'
    operation.completed_at = datetime.utcnow()
    
    db.session.commit()
    return jsonify(operation.to_dict())
