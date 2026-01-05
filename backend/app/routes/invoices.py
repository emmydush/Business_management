from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.customer import Customer
from app.models.order import Order
from app.models.invoice import Invoice, InvoiceStatus
from app.utils.decorators import staff_required, manager_required
from app.utils.middleware import module_required, get_business_id
from datetime import datetime
import re

invoices_bp = Blueprint('invoices', __name__)

@invoices_bp.route('/', methods=['GET'])
@jwt_required()
@module_required('sales')
def get_invoices():
    try:
        business_id = get_business_id()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        status = request.args.get('status', '')
        customer_id = request.args.get('customer_id', type=int)
        date_from = request.args.get('date_from', '')
        date_to = request.args.get('date_to', '')

        query = Invoice.query.filter_by(business_id=business_id)

        if search:
            query = query.join(Customer).filter(
                db.or_(
                    Invoice.invoice_id.contains(search.upper()),
                    Customer.first_name.contains(search),
                    Customer.last_name.contains(search),
                    Customer.company_name.contains(search)
                )
            )

        if status:
            try:
                query = query.filter(Invoice.status == InvoiceStatus[status.upper()])
            except KeyError:
                pass

        if customer_id:
            query = query.filter(Invoice.customer_id == customer_id)

        if date_from:
            query = query.filter(Invoice.issue_date >= date_from)

        if date_to:
            query = query.filter(Invoice.issue_date <= date_to)

        invoices = query.order_by(Invoice.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

        return jsonify({
            'invoices': [invoice.to_dict() for invoice in invoices.items],
            'total': invoices.total,
            'pages': invoices.pages,
            'current_page': page
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@invoices_bp.route('/', methods=['POST'])
@jwt_required()
@module_required('sales')
def create_invoice():
    try:
        business_id = get_business_id()
        data = request.get_json()

        # Validate required fields
        required_fields = ['order_id', 'customer_id', 'total_amount']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400

        # Check if order exists for this business
        order = Order.query.filter_by(id=data['order_id'], business_id=business_id).first()
        if not order:
            return jsonify({'error': 'Order not found for this business'}), 404

        # Check if customer exists for this business
        customer = Customer.query.filter_by(id=data['customer_id'], business_id=business_id).first()
        if not customer:
            return jsonify({'error': 'Customer not found for this business'}), 404

        # Generate invoice ID (e.g., INV0001)
        last_invoice = Invoice.query.filter_by(business_id=business_id).order_by(Invoice.id.desc()).first()
        if last_invoice:
            try:
                last_id = int(last_invoice.invoice_id[3:])  # Remove 'INV' prefix
                invoice_id = f'INV{last_id + 1:04d}'
            except:
                invoice_id = f'INV{datetime.now().strftime("%Y%m%d%H%M%S")}'
        else:
            invoice_id = 'INV0001'

        # Calculate totals
        subtotal = data.get('subtotal', 0)
        tax_amount = data.get('tax_amount', 0)
        discount_amount = data.get('discount_amount', 0)
        shipping_cost = data.get('shipping_cost', 0)
        total_amount = data['total_amount']
        amount_paid = data.get('amount_paid', 0)
        amount_due = total_amount - amount_paid

        # Create invoice
        invoice = Invoice(
            business_id=business_id,
            invoice_id=invoice_id,
            order_id=data['order_id'],
            customer_id=data['customer_id'],
            issue_date=data.get('issue_date', datetime.utcnow().date()),
            due_date=data['due_date'],
            status=InvoiceStatus[data.get('status', 'SENT').upper()] if data.get('status') in [s.name for s in InvoiceStatus] else InvoiceStatus.SENT,
            subtotal=subtotal,
            tax_amount=tax_amount,
            discount_amount=discount_amount,
            shipping_cost=shipping_cost,
            total_amount=total_amount,
            amount_paid=amount_paid,
            amount_due=amount_due,
            notes=data.get('notes', ''),
            terms=data.get('terms', '')
        )

        db.session.add(invoice)
        db.session.commit()

        return jsonify({
            'message': 'Invoice created successfully',
            'invoice': invoice.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@invoices_bp.route('/<int:invoice_id>', methods=['GET'])
@jwt_required()
@module_required('sales')
def get_invoice(invoice_id):
    try:
        business_id = get_business_id()
        invoice = Invoice.query.filter_by(id=invoice_id, business_id=business_id).first()

        if not invoice:
            return jsonify({'error': 'Invoice not found'}), 404

        return jsonify({'invoice': invoice.to_dict()}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@invoices_bp.route('/<int:invoice_id>', methods=['PUT'])
@jwt_required()
@module_required('sales')
def update_invoice(invoice_id):
    try:
        business_id = get_business_id()
        invoice = Invoice.query.filter_by(id=invoice_id, business_id=business_id).first()

        if not invoice:
            return jsonify({'error': 'Invoice not found'}), 404

        data = request.get_json()

        if 'status' in data:
            if data['status'] in [s.name for s in InvoiceStatus]:
                invoice.status = InvoiceStatus[data['status']]

        if 'due_date' in data:
            invoice.due_date = data['due_date']

        if 'notes' in data:
            invoice.notes = data['notes']

        if 'terms' in data:
            invoice.terms = data['terms']

        if 'total_amount' in data:
            invoice.total_amount = data['total_amount']

        if 'amount_paid' in data:
            invoice.amount_paid = data['amount_paid']
            invoice.amount_due = invoice.total_amount - invoice.amount_paid

        invoice.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'Invoice updated successfully',
            'invoice': invoice.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@invoices_bp.route('/<int:invoice_id>', methods=['DELETE'])
@jwt_required()
@module_required('sales')
@manager_required
def delete_invoice(invoice_id):
    try:
        business_id = get_business_id()
        invoice = Invoice.query.filter_by(id=invoice_id, business_id=business_id).first()

        if not invoice:
            return jsonify({'error': 'Invoice not found'}), 404

        db.session.delete(invoice)
        db.session.commit()

        return jsonify({'message': 'Invoice deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@invoices_bp.route('/<int:invoice_id>/status', methods=['PUT'])
@jwt_required()
@module_required('sales')
def update_invoice_status(invoice_id):
    try:
        business_id = get_business_id()
        invoice = Invoice.query.filter_by(id=invoice_id, business_id=business_id).first()

        if not invoice:
            return jsonify({'error': 'Invoice not found'}), 404

        data = request.get_json()

        if not data.get('status'):
            return jsonify({'error': 'Status is required'}), 400

        if data['status'] not in [s.name for s in InvoiceStatus]:
            return jsonify({'error': 'Invalid status'}), 400

        invoice.status = InvoiceStatus[data['status']]
        invoice.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'Invoice status updated successfully',
            'invoice': invoice.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@invoices_bp.route('/<int:invoice_id>/payment', methods=['PUT'])
@jwt_required()
@module_required('sales')
def record_invoice_payment(invoice_id):
    try:
        business_id = get_business_id()
        invoice = Invoice.query.filter_by(id=invoice_id, business_id=business_id).first()

        if not invoice:
            return jsonify({'error': 'Invoice not found'}), 404

        data = request.get_json()

        if not data.get('amount'):
            return jsonify({'error': 'Payment amount is required'}), 400

        payment_amount = float(data['amount'])
        if payment_amount <= 0:
            return jsonify({'error': 'Payment amount must be greater than 0'}), 400

        # Update payment information
        invoice.amount_paid = float(invoice.amount_paid) + payment_amount
        invoice.amount_due = float(invoice.total_amount) - float(invoice.amount_paid)

        # Update status based on payment
        if invoice.amount_due <= 0:
            invoice.status = InvoiceStatus.PAID
        else:
            invoice.status = InvoiceStatus.SENT  # or PARTIALLY_PAID if we had that status

        invoice.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'Payment recorded successfully',
            'invoice': invoice.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500