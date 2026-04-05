from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order, OrderItem, OrderStatus
from app.models.invoice import Invoice, InvoiceStatus
from app.models.audit_log import create_audit_log, AuditAction
from app.utils.decorators import staff_required, manager_required
from app.utils.middleware import get_business_id, get_active_branch_id
from datetime import datetime, timedelta
import re
import csv
import io
from app.utils.notifications import check_low_stock_and_notify

sales_bp = Blueprint('sales', __name__)

@sales_bp.route('/orders', methods=['GET'])
@jwt_required()
def get_orders():
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
        
        query = Order.query.filter_by(business_id=business_id)
        if branch_id:
            query = query.filter_by(branch_id=branch_id)
        
        if search:
            query = query.join(Customer).filter(
                db.or_(
                    Order.order_id.contains(search.upper()),
                    Customer.first_name.contains(search),
                    Customer.last_name.contains(search),
                    Customer.company.contains(search)
                )
            )
        
        if status:
            try:
                query = query.filter(Order.status == OrderStatus[status.upper()])
            except KeyError:
                pass
        
        if customer_id:
            query = query.filter(Order.customer_id == customer_id)
        
        if date_from:
            query = query.filter(Order.order_date >= date_from)
        
        if date_to:
            query = query.filter(Order.order_date <= date_to)
        
        orders = query.order_by(Order.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'orders': [order.to_dict() for order in orders.items],
            'total': orders.total,
            'pages': orders.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/orders', methods=['POST'])
@jwt_required()
def create_order(is_pos_sale=False):
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        data = request.get_json()
        
        # Validate required fields
        # For POS sales, customer_id is optional (can use customer_name for walk-ins)
        required_fields = ['items']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Handle customer for POS vs regular orders
        customer_id = data.get('customer_id')
        customer_name = data.get('customer_name', 'Walk-in Customer')
        
        # If customer_id is provided, validate it exists
        if customer_id:
            customer = Customer.query.filter_by(id=customer_id, business_id=business_id).first()
            if not customer:
                return jsonify({'error': 'Customer not found for this business'}), 404
        else:
            # For walk-in customers, create a customer record if customer_name is provided and not default
            if customer_name and customer_name != 'Walk-in Customer':
                print(f"Creating customer for walk-in: {customer_name}")  # Debug log
                # Check if customer already exists with this name
                existing_customer = Customer.query.filter_by(
                    business_id=business_id, 
                    first_name=customer_name.split(' ')[0],
                    last_name=' '.join(customer_name.split(' ')[1:]) if ' ' in customer_name else ''
                ).first()
                
                if existing_customer:
                    print(f"Found existing customer: {existing_customer.id}")  # Debug log
                    customer_id = existing_customer.id
                else:
                    # Create new customer record for walk-in
                    name_parts = customer_name.split(' ', 1)
                    
                    # Generate customer ID (e.g., CUST0001)
                    last_customer = Customer.query.filter_by(business_id=business_id).order_by(Customer.id.desc()).first()
                    if last_customer:
                        try:
                            last_id = int(last_customer.customer_id[4:])  # Remove 'CUST' prefix
                            new_customer_id = f'CUST{last_id + 1:04d}'
                        except:
                            new_customer_id = f'CUST{datetime.now().strftime("%Y%m%d%H%M%S")}'
                    else:
                        new_customer_id = 'CUST0001'
                    
                    new_customer = Customer(
                        business_id=business_id,
                        customer_id=new_customer_id,
                        first_name=name_parts[0],
                        last_name=name_parts[1] if len(name_parts) > 1 else '',
                        email=f'walkin-{name_parts[0].lower()}@example.com',  # Default email for walk-ins
                        phone='',
                        address='',
                        is_active=True
                    )
                    db.session.add(new_customer)
                    db.session.flush()  # Get the ID without committing
                    customer_id = new_customer.id
                    print(f"Created new customer: {customer_id} with ID {new_customer_id}")  # Debug log
            else:
                customer_id = None
                print("Using default walk-in customer - no customer_id")  # Debug log
        
        print(f"Final customer_id for order: {customer_id}")  # Debug log
        
        # Generate order ID (e.g., ORD0001)
        last_order = Order.query.filter_by(business_id=business_id).order_by(Order.id.desc()).first()
        if last_order:
            try:
                # Only parse if it starts with ORD prefix
                if last_order.order_id and last_order.order_id.startswith('ORD'):
                    last_id = int(last_order.order_id[3:])  # Remove 'ORD' prefix
                    order_id = f'ORD{last_id + 1:04d}'
                else:
                    # Use timestamp-based ID for non-standard formats
                    order_id = f'ORD{datetime.now().strftime("%Y%m%d%H%M%S")}'
            except (ValueError, AttributeError):
                # Handle any parsing errors gracefully
                order_id = f'ORD{datetime.now().strftime("%Y%m%d%H%M%S")}'
        else:
            order_id = 'ORD0001'
        
        # Validate and process items
        order_items = []
        subtotal = 0
        
        # Check if we have items to process
        has_items = data['items'] and len(data['items']) > 0
        
        if has_items:
            # First, validate all items and check stock availability
            validated_items = []
            for item_data in data['items']:
                required_item_fields = ['product_id', 'quantity', 'unit_price']
                for field in required_item_fields:
                    if field not in item_data:
                        return jsonify({'error': f'Item {field} is required'}), 400
                
                # Use FOR UPDATE to lock the product row during stock check to prevent race conditions
                product = Product.query.filter_by(id=item_data['product_id'], business_id=business_id).with_for_update().first()
                if not product:
                    return jsonify({'error': f'Product with ID {item_data["product_id"]} not found for this business'}), 404
                
                if product.stock_quantity < item_data['quantity']:
                    return jsonify({'error': f'Insufficient stock for product {product.name}. Available: {product.stock_quantity}, Requested: {item_data["quantity"]}'}), 400
                
                validated_items.append((item_data, product))
            
            # Process items after validation
            for item_data, product in validated_items:
                # Calculate line total
                discount_percent = item_data.get('discount_percent', 0)
                line_total = item_data['quantity'] * item_data['unit_price']
                if discount_percent > 0:
                    discount_amount = line_total * (discount_percent / 100)
                    line_total -= discount_amount
                
                order_item = OrderItem(
                    product_id=item_data['product_id'],
                    quantity=item_data['quantity'],
                    unit_price=item_data['unit_price'],
                    discount_percent=discount_percent,
                    line_total=line_total
                )
                
                order_items.append(order_item)
                subtotal += line_total
                
                # Reduce stock immediately during processing
                product.stock_quantity -= item_data['quantity']
                
                # Check for low stock and notify
                check_low_stock_and_notify(product)
        
        # Calculate totals - ensure all numeric values are floats
        tax_rate = float(data.get('tax_rate', 0))
        tax_amount = float(subtotal) * (tax_rate / 100) if tax_rate > 0 else 0
        discount_amount = float(data.get('discount_amount', 0))
        shipping_cost = float(data.get('shipping_cost', 0))
        total_amount = float(subtotal) + float(tax_amount) - float(discount_amount) + float(shipping_cost)
        
        # Determine status based on whether it's a POS sale
        if is_pos_sale:
            # POS sales are paid immediately and delivered on spot
            order_status = OrderStatus.DELIVERED  # since items are given immediately at POS
        else:
            # Regular orders start as pending
            order_status = OrderStatus[data.get('status', 'PENDING').upper()] if data.get('status') in [s.name for s in OrderStatus] else OrderStatus.PENDING
        
        # Handle order_date - ensure it's a date object
        order_date = data.get('order_date', datetime.utcnow().date())
        if isinstance(order_date, str):
            order_date = datetime.strptime(order_date, '%Y-%m-%d').date()
        
        # Handle required_date and shipped_date - ensure they are date objects
        required_date = data.get('required_date')
        if required_date and isinstance(required_date, str):
            required_date = datetime.strptime(required_date, '%Y-%m-%d').date()
            
        shipped_date = data.get('shipped_date')
        if shipped_date and isinstance(shipped_date, str):
            shipped_date = datetime.strptime(shipped_date, '%Y-%m-%d').date()
        
        # Create order
        order = Order(
            business_id=business_id,
            branch_id=branch_id,
            order_id=order_id,
            customer_id=customer_id,
            customer_name=customer_name,  # Store walk-in customer name
            user_id=get_jwt_identity(),
            order_date=order_date,
            required_date=required_date,
            shipped_date=shipped_date,
            status=order_status,
            subtotal=subtotal,
            tax_amount=tax_amount,
            discount_amount=discount_amount,
            shipping_cost=shipping_cost,
            total_amount=total_amount,
            notes=data.get('notes', '')
        )
        
        # Add items to order
        for item in order_items:
            order.order_items.append(item)
        
        db.session.add(order)
        db.session.flush() # Get order ID

        # Re-fetch customer object if customer_id exists to ensure it's in the current session
        customer = None
        if customer_id:
            customer = Customer.query.filter_by(id=customer_id, business_id=business_id).first()

        # Handle Payment Status and Invoice Creation
        payment_status = data.get('payment_status', 'PAID').upper()
        invoice_id = f"INV-{order.order_id}"
        
        inv_status = InvoiceStatus.SENT
        amount_paid = 0
        amount_due = total_amount
        
        if payment_status == 'PAID':
            inv_status = InvoiceStatus.PAID
            amount_paid = total_amount
            amount_due = 0
        elif payment_status == 'PARTIAL':
            # For partial payments, use amount_paid from data or default to 50%
            amount_paid = float(data.get('amount_paid', total_amount / 2))
            amount_due = total_amount - amount_paid
            inv_status = InvoiceStatus.PARTIALLY_PAID if amount_due > 0 else InvoiceStatus.PAID
        elif payment_status == 'UNPAID':
            inv_status = InvoiceStatus.SENT
            amount_paid = 0
            amount_due = total_amount
        
        # Ensure order_date is a date object (not string)
        issue_date = order.order_date
        if isinstance(issue_date, str):
            issue_date = datetime.strptime(issue_date, '%Y-%m-%d').date()
        
        # Set due_date to 30 days from issue_date
        due_date = issue_date + timedelta(days=30)
        
        invoice = Invoice(
            business_id=business_id,
            branch_id=branch_id,
            invoice_id=invoice_id,
            order_id=order.id,
            customer_id=order.customer_id,
            issue_date=issue_date,
            due_date=due_date,
            total_amount=total_amount,
            amount_paid=amount_paid,
            amount_due=amount_due,
            status=inv_status
        )
        db.session.add(invoice)
        
        # Update customer balance for unpaid/partial amounts (only if customer exists)
        if amount_due > 0 and customer:
            customer.balance = float(customer.balance or 0) + float(amount_due)
            
        db.session.commit()
        
        # Create audit log for order creation
        try:
            current_user_id = int(get_jwt_identity())
            create_audit_log(
                user_id=current_user_id,
                business_id=business_id,
                action=AuditAction.CREATE,
                entity_type='order',
                entity_id=order.id,
                branch_id=branch_id,
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent'),
                new_values={
                    'order_id': order.order_id,
                    'customer_name': order.customer_name,
                    'total_amount': float(total_amount),
                    'status': order.status.value,
                    'is_pos_sale': is_pos_sale,
                    'item_count': len(order_items),
                    'created_by': current_user_id
                }
            )
        except Exception as e:
            # Don't let audit logging errors affect order creation
            print(f"Audit logging error: {str(e)}")
        
        return jsonify({
            'message': 'Order created successfully',
            'order': order.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/orders/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id):
    try:
        business_id = get_business_id()
        order = Order.query.filter_by(id=order_id, business_id=business_id).first()
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        return jsonify({'order': order.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/orders/<int:order_id>', methods=['PUT'])
@jwt_required()
def update_order(order_id):
    try:
        business_id = get_business_id()
        order = Order.query.filter_by(id=order_id, business_id=business_id).first()
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        data = request.get_json()
        
        if 'status' in data:
            status_val = data['status'].upper()
            if status_val in [s.name for s in OrderStatus]:
                order.status = OrderStatus[status_val]
        
        if 'payment_status' in data:
            from app.models.invoice import Invoice, InvoiceStatus
            p_status = data['payment_status'].upper()
            
            if not order.invoice:
                # Create invoice if it doesn't exist
                invoice_id = f"INV-{order.order_id}"
                
                # Ensure order_date is a date object (not string)
                issue_date = order.order_date
                if isinstance(issue_date, str):
                    issue_date = datetime.strptime(issue_date, '%Y-%m-%d').date()
                
                # Set due_date to 30 days from issue_date
                due_date = issue_date + timedelta(days=30)
                
                order.invoice = Invoice(
                    business_id=business_id,
                    branch_id=order.branch_id,
                    invoice_id=invoice_id,
                    order_id=order.id,
                    customer_id=order.customer_id,
                    issue_date=issue_date,
                    due_date=due_date,
                    total_amount=order.total_amount,
                    amount_due=order.total_amount,
                    status=InvoiceStatus.SENT
                )
                db.session.add(order.invoice)
                # Initial balance update for new invoice (only if customer exists)
                if order.customer:
                    order.customer.balance = float(order.customer.balance or 0) + float(order.total_amount)
            
            old_due = float(order.invoice.amount_due)
            
            if p_status == 'PAID':
                order.invoice.status = InvoiceStatus.PAID
                order.invoice.amount_due = 0
                order.invoice.amount_paid = float(order.invoice.total_amount)
                # Reduce customer balance since fully paid (only if customer exists)
                if order.customer:
                    order.customer.balance = float(order.customer.balance or 0) - float(old_due)
            elif p_status == 'UNPAID':
                order.invoice.status = InvoiceStatus.SENT
                order.invoice.amount_due = float(order.invoice.total_amount)
                order.invoice.amount_paid = 0
                # Increase customer balance for unpaid amount (only if customer exists)
                if order.customer:
                    order.customer.balance = float(order.customer.balance or 0) + float(order.invoice.total_amount)
            elif p_status == 'PARTIAL':
                # Partial payment - customer pays some amount, some still due
                # Calculate the new amount_paid from the total - new amount_due
                new_amount_due = float(order.invoice.total_amount) - float(order.invoice.amount_paid)
                order.invoice.status = InvoiceStatus.PARTIALLY_PAID
                order.invoice.amount_due = new_amount_due if new_amount_due > 0 else 0
                # Balance should reflect the remaining amount due (only if customer exists)
                if order.customer:
                    order.customer.balance = float(order.customer.balance or 0) - float(order.invoice.amount_due) + float(old_due)
            
            new_due = float(order.invoice.amount_due)
            # Adjust balance based on the change in amount due (only if customer exists)
            if order.customer:
                order.customer.balance = float(order.customer.balance or 0) - float(old_due) + float(new_due)
        
        if 'customer_id' in data:
            customer = Customer.query.filter_by(id=data['customer_id'], business_id=business_id).first()
            if customer:
                order.customer_id = data['customer_id']
        
        if 'order_date' in data:
            try:
                order.order_date = datetime.strptime(data['order_date'], '%Y-%m-%d').date()
            except:
                pass

        if 'required_date' in data:
            try:
                order.required_date = datetime.strptime(data['required_date'], '%Y-%m-%d').date() if data['required_date'] else None
            except:
                pass
        
        if 'shipped_date' in data:
            try:
                order.shipped_date = datetime.strptime(data['shipped_date'], '%Y-%m-%d').date() if data['shipped_date'] else None
            except:
                pass
        
        if 'notes' in data:
            order.notes = data['notes']
        
        order.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Order updated successfully',
            'order': order.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/orders/<int:order_id>', methods=['DELETE'])
@jwt_required()
@manager_required
def delete_order(order_id):
    try:
        business_id = get_business_id()
        order = Order.query.filter_by(id=order_id, business_id=business_id).first()
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        # If there's an invoice, subtract its due amount from customer balance (only if customer exists)
        if order.invoice and order.customer:
            order.customer.balance = float(order.customer.balance or 0) - float(order.invoice.amount_due)
            
        db.session.delete(order)
        db.session.commit()
        
        return jsonify({'message': 'Order deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/pos', methods=['POST'])
@jwt_required()
@staff_required
def create_pos_sale():
    try:
        return create_order(is_pos_sale=True)
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/export/orders', methods=['GET'])
@jwt_required()
def export_orders():
    """
    Export sales orders to CSV format
    """
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        status = request.args.get('status', '')
        customer_id = request.args.get('customer_id', type=int)
        date_from = request.args.get('date_from', '')
        date_to = request.args.get('date_to', '')
        
        # Build query with same filters as get_orders
        query = Order.query.filter_by(business_id=business_id)
        if branch_id:
            query = query.filter_by(branch_id=branch_id)
        
        if status:
            try:
                query = query.filter(Order.status == OrderStatus[status.upper()])
            except KeyError:
                pass
        
        if customer_id:
            query = query.filter(Order.customer_id == customer_id)
        
        if date_from:
            query = query.filter(Order.order_date >= date_from)
        
        if date_to:
            query = query.filter(Order.order_date <= date_to)
        
        # Get all orders (no pagination for export)
        orders = query.order_by(Order.created_at.desc()).all()
        
        # Create CSV data
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'Order ID', 'Customer Name', 'Customer Email', 'Customer Phone',
            'Order Date', 'Status', 'Subtotal', 'Tax Amount', 'Discount Amount',
            'Shipping Cost', 'Total Amount', 'Items Count', 'Notes', 'Created At'
        ])
        
        # Write order data
        for order in orders:
            # Get customer info
            customer_name = 'Walk-in Customer'
            customer_email = ''
            customer_phone = ''
            
            if order.customer:
                customer_name = f"{order.customer.first_name} {order.customer.last_name}".strip()
                if order.customer.company:
                    customer_name = order.customer.company
                customer_email = order.customer.email or ''
                customer_phone = order.customer.phone or ''
            
            # Get items count
            items_count = len(order.order_items) if order.order_items else 0
            
            writer.writerow([
                order.order_id or '',
                customer_name,
                customer_email,
                customer_phone,
                order.order_date.strftime('%Y-%m-%d') if order.order_date else '',
                order.status.value if order.status else '',
                float(order.subtotal) if order.subtotal else 0,
                float(order.tax_amount) if order.tax_amount else 0,
                float(order.discount_amount) if order.discount_amount else 0,
                float(order.shipping_cost) if order.shipping_cost else 0,
                float(order.total_amount) if order.total_amount else 0,
                items_count,
                order.notes or '',
                order.created_at.strftime('%Y-%m-%d %H:%M:%S') if order.created_at else ''
            ])
        
        # Create response
        output.seek(0)
        csv_data = output.getvalue()
        
        # Generate filename with timestamp
        filename = f'sales_orders_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        
        # Create Flask response
        response = Response(
            csv_data,
            mimetype='text/csv',
            headers={
                'Content-Disposition': f'attachment; filename="{filename}"',
                'Content-Type': 'text/csv; charset=utf-8'
            }
        )
        
        return response
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500