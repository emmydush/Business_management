from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.customer import Customer
from app.models.order import Order, OrderStatus
from app.models.invoice import Invoice
from app.models.product import Product
from app.models.returns import Return, ReturnItem, ReturnStatus
from app.models.audit_log import create_audit_log, AuditAction
from app.utils.decorators import staff_required, manager_required, admin_required
from app.utils.middleware import get_business_id, get_active_branch_id
from datetime import datetime
import re

returns_bp = Blueprint('returns', __name__)

@returns_bp.route('/', methods=['GET'])
@jwt_required()
def get_returns():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        status = request.args.get('status', '')
        customer_id = request.args.get('customer_id', type=int)
        date_from = request.args.get('date_from', '')
        date_to = request.args.get('date_to', '')

        query = Return.query.filter_by(business_id=business_id).options(
            db.joinedload(Return.customer),
            db.joinedload(Return.order).joinedload(Order.customer),
            db.joinedload(Return.invoice)
        )
        if branch_id:
            query = query.filter_by(branch_id=branch_id)

        if search:
            query = query.join(Customer).filter(
                db.or_(
                    Return.return_id.contains(search.upper()),
                    Customer.first_name.contains(search),
                    Customer.last_name.contains(search),
                    Customer.company.contains(search)
                )
            )

        if status:
            try:
                # Try to find status by value (case-insensitive)
                status_value = status.upper()
                for enum_status in ReturnStatus:
                    if enum_status.value == status.lower():
                        query = query.filter(Return.status == enum_status)
                        break
                else:
                    # If not found by value, try by name
                    query = query.filter(Return.status == ReturnStatus[status_value])
            except KeyError:
                pass

        if customer_id:
            query = query.filter(Return.customer_id == customer_id)

        if date_from:
            query = query.filter(Return.return_date >= date_from)

        if date_to:
            query = query.filter(Return.return_date <= date_to)

        returns = query.order_by(Return.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

        return jsonify({
            'returns': [ret.to_dict() for ret in returns.items],
            'total': returns.total,
            'pages': returns.pages,
            'current_page': page
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@returns_bp.route('/', methods=['POST'])
@jwt_required()
def create_return():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        data = request.get_json()

        # Validate required fields
        required_fields = ['order_id', 'items', 'reason']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400

        if not data['items'] or not isinstance(data['items'], list):
            return jsonify({'error': 'Items must be a non-empty list'}), 400

        # Check if order exists for this business
        order = Order.query.filter_by(id=data['order_id'], business_id=business_id).first()
        if not order:
            return jsonify({'error': 'Order not found for this business'}), 404

        # Auto-link customer from order if not provided
        customer_id = data.get('customer_id')
        if not customer_id and order:
            customer_id = order.customer_id
            
        # Ensure customer exists if provided
        if customer_id:
            customer = Customer.query.filter_by(id=customer_id, business_id=business_id).first()
            if not customer:
                return jsonify({'error': 'Customer not found for this business'}), 404

        # Auto-link invoice from order if not provided
        invoice_id = data.get('invoice_id')
        if not invoice_id and order and order.invoice:
            invoice_id = order.invoice.id

        # Generate return ID (e.g., RET0001)
        last_return = Return.query.filter_by(business_id=business_id).order_by(Return.id.desc()).first()
        if last_return:
            try:
                # Handle cases where return_id might not follow the 'RET0000' format
                match = re.search(r'(\d+)$', last_return.return_id)
                if match:
                    last_num = int(match.group(1))
                    return_id = f'RET{last_num + 1:04d}'
                else:
                    return_id = f'RET{datetime.now().strftime("%Y%m%d%H%M%S")}'
            except:
                return_id = f'RET{datetime.now().strftime("%Y%m%d%H%M%S")}'
        else:
            return_id = 'RET0001'

        # Validate and process items with business logic checks
        return_items = []
        total_amount = 0

        for item_data in data['items']:
            required_item_fields = ['product_id', 'quantity', 'unit_price', 'reason']
            for field in required_item_fields:
                if field not in item_data:
                    return jsonify({'error': f'Return item {field} is required'}), 400

            product = Product.query.filter_by(id=item_data['product_id'], business_id=business_id).first()
            if not product:
                return jsonify({'error': f'Product with ID {item_data["product_id"]} not found for this business'}), 404

            # Check if the item was actually purchased in the original order
            original_order_item = None
            for order_item in order.order_items:
                if order_item.product_id == item_data['product_id']:
                    original_order_item = order_item
                    break
            
            if not original_order_item:
                return jsonify({'error': f'Product {product.name} was not found in the original order'}), 400
            
            if item_data['quantity'] > original_order_item.quantity:
                return jsonify({'error': f'Cannot return more items than purchased. Max returnable: {original_order_item.quantity}'}), 400

            line_total = item_data['quantity'] * item_data['unit_price']
            total_amount += line_total

            return_item = ReturnItem(
                product_id=item_data['product_id'],
                quantity=item_data['quantity'],
                unit_price=item_data['unit_price'],
                line_total=line_total,
                reason=item_data['reason']
            )

            return_items.append(return_item)

        # Handle return_date - ensure it's a date object
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

        # Create return
        return_obj = Return(
            business_id=business_id,
            branch_id=branch_id,
            return_id=return_id,
            order_id=data['order_id'],
            customer_id=customer_id,
            invoice_id=invoice_id,
            return_date=return_date,
            status=ReturnStatus[data.get('status', 'PENDING').upper()] if data.get('status') and data.get('status').upper() in [s.name for s in ReturnStatus] else ReturnStatus.PENDING,
            reason=data['reason'],
            total_amount=total_amount,
            refund_amount=data.get('refund_amount', 0),
            notes=data.get('notes', '')
        )

        # Add items to return and handle inventory restoration
        for item in return_items:
            return_obj.return_items.append(item)
            
            # Restore product stock when return is created
            product = Product.query.filter_by(id=item.product_id, business_id=business_id).first()
            if product:
                product.stock_quantity += item.quantity
                print(f"Restored {item.quantity} units to product {product.name} (ID: {product.id})")

        db.session.add(return_obj)
        db.session.flush() # Get return ID

        # Update order status to indicate return has been requested
        print(f"Current order status: {order.status.value}")
        if order.status.value.lower() == 'delivered':
            order.status = OrderStatus.RETURNED
            print(f"Updated order status to: {order.status.value}")
        elif order.status.value.lower() == 'returned':
            print("Order already marked as returned")
        else:
            print(f"Order status '{order.status.value}' - not updating for return")
        
        # Handle financial aspects - customer balance and refund
        if customer_id and total_amount > 0:
            customer = Customer.query.filter_by(id=customer_id, business_id=business_id).first()
            if customer:
                # Create a credit for the customer (negative balance = store owes customer)
                customer.balance = float(customer.balance or 0) - float(total_amount)
                print(f"Updated customer {customer.first_name} balance: {customer.balance}")

        db.session.commit()

        # Create audit log for return creation
        try:
            current_user_id = int(get_jwt_identity())
            create_audit_log(
                user_id=current_user_id,
                business_id=business_id,
                action=AuditAction.CREATE,
                entity_type='return',
                entity_id=return_obj.id,
                branch_id=branch_id,
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent'),
                new_values={
                    'return_id': return_obj.return_id,
                    'order_id': order.order_id,
                    'customer_name': customer.first_name + ' ' + customer.last_name if customer else 'Walk-in Customer',
                    'total_amount': float(total_amount),
                    'status': return_obj.status.value,
                    'items_count': len(return_items),
                    'restored_stock': [(item.product_id, item.quantity) for item in return_items]
                }
            )
        except Exception as e:
            # Don't let audit logging errors affect return creation
            print(f"Audit logging error: {str(e)}")

        return jsonify({
            'message': 'Return created successfully',
            'return': return_obj.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@returns_bp.route('/<int:return_id>', methods=['GET'])
@jwt_required()
def get_return(return_id):
    try:
        business_id = get_business_id()
        return_obj = Return.query.filter_by(id=return_id, business_id=business_id).first()

        if not return_obj:
            return jsonify({'error': 'Return not found'}), 404

        return jsonify({'return': return_obj.to_dict()}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@returns_bp.route('/<int:return_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_return(return_id):
    try:
        business_id = get_business_id()
        return_obj = Return.query.filter_by(id=return_id, business_id=business_id).first()

        if not return_obj:
            return jsonify({'error': 'Return not found'}), 404

        data = request.get_json()

        if 'status' in data:
            raw_status = data['status'].upper() if data['status'] else ''
            # Accept both enum names (APPROVED) and enum values (approved)
            matched = None
            for s in ReturnStatus:
                if s.name == raw_status or s.value == data['status'].lower():
                    matched = s
                    break
            if matched:
                return_obj.status = matched
                if raw_status == 'REJECTED':
                    reason = data.get('reason', '')
                    if reason:
                        return_obj.notes = f"{return_obj.notes}\nRejection Reason: {reason}" if return_obj.notes else f"Rejection Reason: {reason}"
                # PROTECT ORDER STATUS: Ensure order stays "returned" if it has returns
                if return_obj.order and return_obj.order.status.value.lower() == 'delivered':
                    return_obj.order.status = OrderStatus.RETURNED
                    print(f"Protected order {return_obj.order.order_id} status - set to 'returned'")
            else:
                return jsonify({'error': f'Invalid status: {data["status"]}. Must be one of: pending, approved, rejected, processed'}), 400

        if 'reason' in data:
            return_obj.reason = data['reason']

        if 'notes' in data:
            return_obj.notes = data['notes']

        if 'refund_amount' in data:
            return_obj.refund_amount = data['refund_amount']

        if 'branch_id' in data:
            return_obj.branch_id = data['branch_id']

        return_obj.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'Return updated successfully',
            'return': return_obj.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@returns_bp.route('/<int:return_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_return(return_id):
    try:
        business_id = get_business_id()
        return_obj = Return.query.filter_by(id=return_id, business_id=business_id).first()

        if not return_obj:
            return jsonify({'error': 'Return not found'}), 404

        db.session.delete(return_obj)
        db.session.commit()

        return jsonify({'message': 'Return deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@returns_bp.route('/<int:return_id>/status', methods=['PUT'])
@jwt_required()
@admin_required
def update_return_status(return_id):
    try:
        business_id = get_business_id()
        return_obj = Return.query.filter_by(id=return_id, business_id=business_id).first()

        if not return_obj:
            return jsonify({'error': 'Return not found'}), 404

        data = request.get_json()

        if not data.get('status'):
            return jsonify({'error': 'Status is required'}), 400

        status_input = data['status'].upper()
        if status_input not in [s.name for s in ReturnStatus]:
            # Handle common aliases if necessary, or just return error
            if status_input == 'COMPLETED': status_input = 'PROCESSED'
            elif status_input == 'PROCESSING': status_input = 'APPROVED'
            
            if status_input not in [s.name for s in ReturnStatus]:
                return jsonify({'error': f'Invalid status: {data["status"]}'}), 400

        return_obj.status = ReturnStatus[status_input]
        if status_input == 'REJECTED':
            reason = data.get('reason', '')
            if reason:
                return_obj.notes = f"{return_obj.notes}\nRejection Reason: {reason}" if return_obj.notes else f"Rejection Reason: {reason}"
        return_obj.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'Return status updated successfully',
            'return': return_obj.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500