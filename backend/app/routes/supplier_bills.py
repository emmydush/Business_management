from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.supplier import Supplier
from app.models.purchase_order import PurchaseOrder
from app.models.supplier_bill import SupplierBill
from app.utils.decorators import staff_required, manager_required, subscription_required
from app.utils.middleware import module_required, get_business_id, get_active_branch_id
from datetime import datetime
import re

supplier_bills_bp = Blueprint('supplier_bills', __name__)

@supplier_bills_bp.route('/', methods=['GET'])
@jwt_required()
@module_required('suppliers')
def get_supplier_bills():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        status = request.args.get('status', '')
        supplier_id = request.args.get('supplier_id', type=int)
        date_from = request.args.get('date_from', '')
        date_to = request.args.get('date_to', '')

        query = SupplierBill.query.filter_by(business_id=business_id)
        
        if branch_id:
            query = query.filter_by(branch_id=branch_id)
        
        if search:
            query = query.join(Supplier).filter(
                db.or_(
                    SupplierBill.bill_number.ilike(f'%{search}%'),
                    Supplier.company_name.ilike(f'%{search}%'),
                    SupplierBill.status.ilike(f'%{search}%')
                )
            )
        
        if status:
            query = query.filter_by(status=status)
        
        if supplier_id:
            query = query.filter_by(supplier_id=supplier_id)
        
        if date_from:
            query = query.filter(SupplierBill.bill_date >= datetime.strptime(date_from, '%Y-%m-%d').date())
        
        if date_to:
            query = query.filter(SupplierBill.bill_date <= datetime.strptime(date_to, '%Y-%m-%d').date())

        bills = query.order_by(SupplierBill.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

        return jsonify({
            'supplier_bills': [bill.to_dict() for bill in bills.items],
            'pagination': {
                'page': page,
                'pages': bills.pages,
                'per_page': per_page,
                'total': bills.total
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@supplier_bills_bp.route('/<int:bill_id>', methods=['GET'])
@jwt_required()
@module_required('suppliers')
def get_supplier_bill(bill_id):
    try:
        business_id = get_business_id()
        bill = SupplierBill.query.filter_by(id=bill_id, business_id=business_id).first()
        
        if not bill:
            return jsonify({'error': 'Supplier bill not found'}), 404
        
        return jsonify({'supplier_bill': bill.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@supplier_bills_bp.route('/', methods=['POST'])
@jwt_required()
@module_required('suppliers')
@subscription_required
def create_supplier_bill():
    try:
        business_id = get_business_id()
        branch_id = get_active_branch_id()
        data = request.get_json()

        # Validate required fields
        required_fields = ['bill_number', 'supplier_id', 'bill_date', 'due_date', 'total_amount']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400

        # Validate supplier exists
        supplier = Supplier.query.filter_by(id=data['supplier_id'], business_id=business_id).first()
        if not supplier:
            return jsonify({'error': 'Supplier not found'}), 404

        # Validate purchase order exists if provided
        purchase_order = None
        if 'purchase_order_id' in data and data['purchase_order_id']:
            purchase_order = PurchaseOrder.query.filter_by(
                id=data['purchase_order_id'], 
                business_id=business_id
            ).first()
            if not purchase_order:
                return jsonify({'error': 'Purchase order not found'}), 404

        # Create supplier bill
        bill = SupplierBill(
            business_id=business_id,
            branch_id=branch_id,
            supplier_id=data['supplier_id'],
            purchase_order_id=data.get('purchase_order_id'),
            bill_number=data['bill_number'],
            bill_date=datetime.strptime(data['bill_date'], '%Y-%m-%d').date(),
            due_date=datetime.strptime(data['due_date'], '%Y-%m-%d').date(),
            subtotal=data.get('subtotal', 0),
            tax_amount=data.get('tax_amount', 0),
            discount_amount=data.get('discount_amount', 0),
            shipping_cost=data.get('shipping_cost', 0),
            total_amount=data['total_amount'],
            status=data.get('status', 'pending'),
            notes=data.get('notes', '')
        )

        db.session.add(bill)
        db.session.commit()

        return jsonify({
            'message': 'Supplier bill created successfully',
            'supplier_bill': bill.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@supplier_bills_bp.route('/<int:bill_id>', methods=['PUT'])
@jwt_required()
@module_required('suppliers')
@subscription_required
def update_supplier_bill(bill_id):
    try:
        business_id = get_business_id()
        bill = SupplierBill.query.filter_by(id=bill_id, business_id=business_id).first()

        if not bill:
            return jsonify({'error': 'Supplier bill not found'}), 404

        data = request.get_json()

        # Update allowed fields
        updatable_fields = [
            'bill_number', 'supplier_id', 'purchase_order_id', 'bill_date', 
            'due_date', 'subtotal', 'tax_amount', 'discount_amount', 
            'shipping_cost', 'total_amount', 'status', 'notes'
        ]

        for field in updatable_fields:
            if field in data:
                if field in ['bill_date', 'due_date']:
                    setattr(bill, field, datetime.strptime(data[field], '%Y-%m-%d').date())
                else:
                    setattr(bill, field, data[field])

        # Validate supplier exists if changing supplier
        if 'supplier_id' in data:
            supplier = Supplier.query.filter_by(id=data['supplier_id'], business_id=business_id).first()
            if not supplier:
                return jsonify({'error': 'Supplier not found'}), 404

        # Validate purchase order exists if changing purchase order
        if 'purchase_order_id' in data and data['purchase_order_id']:
            purchase_order = PurchaseOrder.query.filter_by(
                id=data['purchase_order_id'], 
                business_id=business_id
            ).first()
            if not purchase_order:
                return jsonify({'error': 'Purchase order not found'}), 404

        db.session.commit()

        return jsonify({
            'message': 'Supplier bill updated successfully',
            'supplier_bill': bill.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@supplier_bills_bp.route('/<int:bill_id>', methods=['DELETE'])
@jwt_required()
@module_required('suppliers')
@manager_required
def delete_supplier_bill(bill_id):
    try:
        business_id = get_business_id()
        bill = SupplierBill.query.filter_by(id=bill_id, business_id=business_id).first()

        if not bill:
            return jsonify({'error': 'Supplier bill not found'}), 404

        db.session.delete(bill)
        db.session.commit()

        return jsonify({'message': 'Supplier bill deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500