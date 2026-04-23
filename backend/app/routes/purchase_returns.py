from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.supplier import Supplier
from app.models.purchase_order import PurchaseOrder
from app.models.product import Product
from app.models.purchase_return import PurchaseReturn, PurchaseReturnItem, PurchaseReturnStatus
from app.models.audit_log import create_audit_log, AuditAction
from app.utils.decorators import staff_required, manager_required, admin_required
from app.utils.middleware import get_business_id, get_active_branch_id
from datetime import datetime, timedelta
import re

purchase_returns_bp = Blueprint('purchase_returns', __name__)

@purchase_returns_bp.route('/', methods=['GET'])
@jwt_required()
def get_purchase_returns():
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

        query = PurchaseReturn.query.filter_by(business_id=business_id).options(
            db.joinedload(PurchaseReturn.supplier),
            db.joinedload(PurchaseReturn.purchase_order),
            db.joinedload(PurchaseReturn.creator),
            db.joinedload(PurchaseReturn.return_items).joinedload(PurchaseReturnItem.product)
        )
        
        if branch_id:
            query = query.filter_by(branch_id=branch_id)

        if search:
            query = query.join(Supplier).filter(
                db.or_(
                    PurchaseReturn.return_id.contains(search.upper()),
                    Supplier.name.contains(search),
                    PurchaseReturn.tracking_number.contains(search)
                )
            )

        if status:
            try:
                status_value = status.upper()
                for enum_status in PurchaseReturnStatus:
                    if enum_status.value == status.lower():
                        query = query.filter(PurchaseReturn.status == enum_status)
                        break
                else:
                    query = query.filter(PurchaseReturn.status == PurchaseReturnStatus[status_value])
            except KeyError:
                pass

        if supplier_id:
            query = query.filter(PurchaseReturn.supplier_id == supplier_id)

        if date_from:
            query = query.filter(PurchaseReturn.return_date >= date_from)

        if date_to:
            query = query.filter(PurchaseReturn.return_date <= date_to)

        returns = query.order_by(PurchaseReturn.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

        return jsonify({
            'purchase_returns': [ret.to_dict() for ret in returns.items],
            'total': returns.total,
            'pages': returns.pages,
            'current_page': page
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@purchase_returns_bp.route('/', methods=['POST'])
@jwt_required()
def create_purchase_return():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        data = request.get_json()

        # Validate required fields
        required_fields = ['purchase_order_id', 'supplier_id', 'items', 'reason', 'return_type']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400

        if not data['items'] or not isinstance(data['items'], list):
            return jsonify({'error': 'Items must be a non-empty list'}), 400

        # Check if purchase order exists
        purchase_order = PurchaseOrder.query.filter_by(
            id=data['purchase_order_id'], 
            business_id=business_id
        ).first()
        if not purchase_order:
            return jsonify({'error': 'Purchase order not found for this business'}), 404

        # Check if supplier exists
        supplier = Supplier.query.filter_by(id=data['supplier_id'], business_id=business_id).first()
        if not supplier:
            return jsonify({'error': 'Supplier not found for this business'}), 404

        # Generate return ID (e.g., PRRET0001)
        last_return = PurchaseReturn.query.filter_by(business_id=business_id).order_by(PurchaseReturn.id.desc()).first()
        if last_return:
            try:
                match = re.search(r'(\d+)$', last_return.return_id)
                if match:
                    last_num = int(match.group(1))
                    return_id = f'PRRET{last_num + 1:04d}'
                else:
                    return_id = f'PRRET{datetime.now().strftime("%Y%m%d%H%M%S")}'
            except:
                return_id = f'PRRET{datetime.now().strftime("%Y%m%d%H%M%S")}'
        else:
            return_id = 'PRRET0001'

        # Validate and process items with business logic checks
        return_items = []
        total_amount = 0

        for item_data in data['items']:
            required_item_fields = ['product_id', 'quantity', 'unit_cost', 'return_reason', 'condition']
            for field in required_item_fields:
                if field not in item_data:
                    return jsonify({'error': f'Return item {field} is required'}), 400

            product = Product.query.filter_by(id=item_data['product_id'], business_id=business_id).first()
            if not product:
                return jsonify({'error': f'Product with ID {item_data["product_id"]} not found for this business'}), 404

            # Check if the item was actually purchased in the original purchase order
            original_po_item = None
            for po_item in purchase_order.order_items:
                if po_item.product_id == item_data['product_id']:
                    original_po_item = po_item
                    break
            
            if not original_po_item:
                return jsonify({'error': f'Product {product.name} was not found in the original purchase order'}), 400
            
            if item_data['quantity'] > original_po_item.quantity:
                return jsonify({'error': f'Cannot return more items than purchased. Max returnable: {original_po_item.quantity}'}), 400

            line_total = item_data['quantity'] * item_data['unit_cost']
            total_amount += line_total

            return_item = PurchaseReturnItem(
                product_id=item_data['product_id'],
                quantity=item_data['quantity'],
                unit_cost=item_data['unit_cost'],
                total_cost=line_total,
                return_reason=item_data['return_reason'],
                condition=item_data['condition'],
                batch_number=item_data.get('batch_number'),
                expiry_date=datetime.strptime(item_data['expiry_date'], '%Y-%m-%d').date() if item_data.get('expiry_date') else None
            )

            return_items.append(return_item)

        # Handle return_date
        return_date_raw = data.get('return_date')
        if return_date_raw:
            try:
                if isinstance(return_date_raw, str):
                    return_date = datetime.strptime(return_date_raw, '%Y-%m-%d').date()
                else:
                    return_date = return_date_raw
            except ValueError:
                return_date = datetime.utcnow().date()
        else:
            return_date = datetime.utcnow().date()

        # Create purchase return
        return_obj = PurchaseReturn(
            business_id=business_id,
            branch_id=branch_id,
            return_id=return_id,
            purchase_order_id=data['purchase_order_id'],
            supplier_id=data['supplier_id'],
            return_date=return_date,
            expected_credit_date=datetime.strptime(data['expected_credit_date'], '%Y-%m-%d').date() if data.get('expected_credit_date') else return_date + timedelta(days=30),
            status=PurchaseReturnStatus[data.get('status', 'PENDING').upper()] if data.get('status') and data.get('status').upper() in [s.name for s in PurchaseReturnStatus] else PurchaseReturnStatus.PENDING,
            total_amount=total_amount,
            credit_amount=data.get('credit_amount', 0),
            restock_fee=data.get('restock_fee', 0),
            shipping_cost=data.get('shipping_cost', 0),
            reason=data['reason'],
            return_type=data['return_type'],
            notes=data.get('notes', ''),
            tracking_number=data.get('tracking_number'),
            carrier=data.get('carrier'),
            created_by=int(get_jwt_identity())
        )

        # Add items to return and handle inventory reduction
        for item in return_items:
            return_obj.return_items.append(item)
            
            # Reduce product stock when return to supplier is created
            product = Product.query.filter_by(id=item.product_id, business_id=business_id).first()
            if product:
                product.stock_quantity -= item.quantity
                print(f"Reduced {item.quantity} units from product {product.name} (ID: {product.id}) for supplier return")

        db.session.add(return_obj)
        db.session.flush() # Get return ID

        # Update purchase order status to indicate return has been initiated
        if purchase_order.status.value == 'RECEIVED':
            purchase_order.status = 'PARTIAL_RETURN'  # You might need to add this status to PurchaseOrderStatus
        
        # Handle financial aspects - supplier account
        if total_amount > 0:
            # Update supplier account balance (negative = supplier owes us)
            current_balance = float(supplier.account_balance or 0)
            supplier.account_balance = current_balance - float(total_amount - float(data.get('restock_fee', 0)))
            print(f"Updated supplier {supplier.name} account balance: {supplier.account_balance}")

        db.session.commit()

        # Create audit log for purchase return creation
        try:
            current_user_id = int(get_jwt_identity())
            create_audit_log(
                user_id=current_user_id,
                business_id=business_id,
                action=AuditAction.CREATE,
                entity_type='purchase_return',
                entity_id=return_obj.id,
                branch_id=branch_id,
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent'),
                new_values={
                    'return_id': return_obj.return_id,
                    'purchase_order_id': purchase_order.order_number,
                    'supplier_name': supplier.name,
                    'total_amount': float(total_amount),
                    'status': return_obj.status.value,
                    'return_type': return_obj.return_type,
                    'items_count': len(return_items),
                    'reduced_stock': [(item.product_id, item.quantity) for item in return_items]
                }
            )
        except Exception as e:
            print(f"Audit logging error: {str(e)}")

        return jsonify({
            'message': 'Purchase return created successfully',
            'purchase_return': return_obj.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@purchase_returns_bp.route('/<int:return_id>', methods=['GET'])
@jwt_required()
def get_purchase_return(return_id):
    try:
        business_id = get_business_id()
        return_obj = PurchaseReturn.query.filter_by(id=return_id, business_id=business_id).first()

        if not return_obj:
            return jsonify({'error': 'Purchase return not found'}), 404

        return jsonify({'purchase_return': return_obj.to_dict()}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@purchase_returns_bp.route('/<int:return_id>', methods=['PUT'])
@admin_required
def update_purchase_return(return_id):
    try:
        business_id = get_business_id()
        return_obj = PurchaseReturn.query.filter_by(id=return_id, business_id=business_id).first()

        if not return_obj:
            return jsonify({'error': 'Purchase return not found'}), 404

        data = request.get_json()

        if 'status' in data:
            if data['status'] in [s.name for s in PurchaseReturnStatus]:
                return_obj.status = PurchaseReturnStatus[data['status']]
                
                # Handle status-specific logic
                if data['status'] == 'CREDITED':
                    return_obj.actual_credit_date = datetime.utcnow().date()
                    # Update supplier account to reflect credit received
                    if return_obj.supplier:
                        return_obj.supplier.account_balance = float(return_obj.supplier.account_balance or 0) + float(return_obj.credit_amount or 0)

        if 'credit_amount' in data:
            return_obj.credit_amount = data['credit_amount']
            
        if 'restock_fee' in data:
            return_obj.restock_fee = data['restock_fee']
            
        if 'shipping_cost' in data:
            return_obj.shipping_cost = data['shipping_cost']
            
        if 'tracking_number' in data:
            return_obj.tracking_number = data['tracking_number']
            
        if 'carrier' in data:
            return_obj.carrier = data['carrier']
            
        if 'notes' in data:
            return_obj.notes = data['notes']

        return_obj.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'Purchase return updated successfully',
            'purchase_return': return_obj.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@purchase_returns_bp.route('/<int:return_id>', methods=['DELETE'])
@admin_required
def delete_purchase_return(return_id):
    try:
        business_id = get_business_id()
        return_obj = PurchaseReturn.query.filter_by(id=return_id, business_id=business_id).first()

        if not return_obj:
            return jsonify({'error': 'Purchase return not found'}), 404

        # Restore inventory before deleting
        for item in return_obj.return_items:
            product = Product.query.filter_by(id=item.product_id, business_id=business_id).first()
            if product:
                product.stock_quantity += item.quantity
                print(f"Restored {item.quantity} units to product {product.name} (ID: {product.id})")

        db.session.delete(return_obj)
        db.session.commit()

        return jsonify({'message': 'Purchase return deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@purchase_returns_bp.route('/<int:return_id>/status', methods=['PUT'])
@admin_required
def update_purchase_return_status(return_id):
    try:
        business_id = get_business_id()
        return_obj = PurchaseReturn.query.filter_by(id=return_id, business_id=business_id).first()

        if not return_obj:
            return jsonify({'error': 'Purchase return not found'}), 404

        data = request.get_json()

        if not data.get('status'):
            return jsonify({'error': 'Status is required'}), 400

        status_input = data['status'].upper()
        if status_input not in [s.name for s in PurchaseReturnStatus]:
            return jsonify({'error': f'Invalid status: {data["status"]}'}), 400

        return_obj.status = PurchaseReturnStatus[status_input]
        return_obj.updated_at = datetime.utcnow()
        
        # Handle status-specific actions
        if status_input == 'CREDITED':
            return_obj.actual_credit_date = datetime.utcnow().date()
            if return_obj.supplier:
                return_obj.supplier.account_balance = float(return_obj.supplier.account_balance or 0) + float(return_obj.credit_amount or 0)
        
        db.session.commit()

        return jsonify({
            'message': 'Purchase return status updated successfully',
            'purchase_return': return_obj.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
