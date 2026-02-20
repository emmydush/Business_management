from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.service import Appointment, Service, TimeEntry, Quote, QuoteItem
from app.models.service import AppointmentStatus, QuoteStatus
from app.utils.middleware import get_business_id
from app.models.customer import Customer
from app.models.employee import Employee
from datetime import datetime, date, time, timedelta
import uuid

service_bp = Blueprint('service', __name__)

def generate_id(prefix):
    return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"

# ============== SERVICES ==============

@service_bp.route('/services', methods=['GET'])
@jwt_required()
def get_services():
    business_id = get_business_id()
    branch_id = request.args.get('branch_id', type=int)
    
    query = Service.query.filter_by(business_id=business_id)
    if branch_id:
        query = query.filter_by(branch_id=branch_id)
    
    services = query.filter_by(is_active=True).order_by(Service.name).all()
    return jsonify([s.to_dict() for s in services])

@service_bp.route('/services/<int:service_id>', methods=['GET'])
@jwt_required()
def get_service(service_id):
    business_id = get_business_id()
    service = Service.query.filter_by(id=service_id, business_id=business_id).first()
    if not service:
        return jsonify({'error': 'Service not found'}), 404
    return jsonify(service.to_dict())

@service_bp.route('/services', methods=['POST'])
@jwt_required()
def create_service():
    try:
        business_id = get_business_id()
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({'error': 'Service name is required'}), 400
        if data.get('duration_minutes') is None and data.get('duration_minutes') == '':
            return jsonify({'error': 'Duration is required'}), 400
        if data.get('price') is None and data.get('price') == '':
            return jsonify({'error': 'Price is required'}), 400
        
        service = Service(
            business_id=business_id,
            branch_id=data.get('branch_id'),
            service_id=generate_id('SVC'),
            name=data['name'],
            description=data.get('description'),
            category=data.get('category'),
            duration_minutes=data.get('duration_minutes', 60),
            price=data.get('price', 0),
            cost=data.get('cost'),
            is_recurring=data.get('is_recurring', False),
            recurring_interval=data.get('recurring_interval')
        )
        
        db.session.add(service)
        db.session.commit()
        return jsonify(service.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error creating service: {str(e)}")
        return jsonify({'error': f'Failed to create service: {str(e)}'}), 500

@service_bp.route('/services/<int:service_id>', methods=['PUT'])
@jwt_required()
def update_service(service_id):
    try:
        business_id = get_business_id()
        service = Service.query.filter_by(id=service_id, business_id=business_id).first()
        if not service:
            return jsonify({'error': 'Service not found'}), 404
        
        data = request.get_json()
        for key, value in data.items():
            if hasattr(service, key) and key not in ['id', 'business_id', 'service_id']:
                setattr(service, key, value)
        
        db.session.commit()
        return jsonify(service.to_dict())
    except Exception as e:
        db.session.rollback()
        print(f"Error updating service: {str(e)}")
        return jsonify({'error': f'Failed to update service: {str(e)}'}), 500

@service_bp.route('/services/<int:service_id>', methods=['DELETE'])
@jwt_required()
def delete_service(service_id):
    try:
        business_id = get_business_id()
        service = Service.query.filter_by(id=service_id, business_id=business_id).first()
        if not service:
            return jsonify({'error': 'Service not found'}), 404
        
        service.is_active = False
        db.session.commit()
        return jsonify({'message': 'Service deleted'})
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting service: {str(e)}")
        return jsonify({'error': f'Failed to delete service: {str(e)}'}), 500

# ============== APPOINTMENTS ==============

@service_bp.route('/appointments', methods=['GET'])
@jwt_required()
def get_appointments():
    business_id = get_business_id()
    branch_id = request.args.get('branch_id', type=int)
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    customer_id = request.args.get('customer_id', type=int)
    status = request.args.get('status')
    
    query = Appointment.query.filter_by(business_id=business_id)
    
    if branch_id:
        query = query.filter_by(branch_id=branch_id)
    if start_date:
        query = query.filter(Appointment.appointment_date >= datetime.strptime(start_date, '%Y-%m-%d').date())
    if end_date:
        query = query.filter(Appointment.appointment_date <= datetime.strptime(end_date, '%Y-%m-%d').date())
    if customer_id:
        query = query.filter_by(customer_id=customer_id)
    if status:
        query = query.filter_by(status=AppointmentStatus[status.upper()])
    
    appointments = query.order_by(Appointment.appointment_date, Appointment.start_time).all()
    return jsonify([a.to_dict() for a in appointments])

@service_bp.route('/appointments/<int:appointment_id>', methods=['GET'])
@jwt_required()
def get_appointment(appointment_id):
    business_id = get_business_id()
    appointment = Appointment.query.filter_by(id=appointment_id, business_id=business_id).first()
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
    return jsonify(appointment.to_dict())

@service_bp.route('/appointments', methods=['POST'])
@jwt_required()
def create_appointment():
    try:
        business_id = get_business_id()
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        if not data.get('title'):
            return jsonify({'error': 'Appointment title is required'}), 400
        if not data.get('customer_id'):
            return jsonify({'error': 'Customer is required'}), 400
        if not data.get('appointment_date'):
            return jsonify({'error': 'Appointment date is required'}), 400
        if not data.get('start_time') or not data.get('end_time'):
            return jsonify({'error': 'Start and end times are required'}), 400
        
        # Parse date and time
        appointment_date = datetime.strptime(data['appointment_date'], '%Y-%m-%d').date()
        start_time = datetime.strptime(data['start_time'], '%H:%M').time()
        end_time = datetime.strptime(data['end_time'], '%H:%M').time()
        
        # Calculate duration
        start_dt = datetime.combine(appointment_date, start_time)
        end_dt = datetime.combine(appointment_date, end_time)
        duration_minutes = int((end_dt - start_dt).total_seconds() / 60)
        
        appointment = Appointment(
            business_id=business_id,
            branch_id=data.get('branch_id'),
            appointment_id=generate_id('APT'),
            customer_id=data['customer_id'],
            service_id=data.get('service_id'),
            employee_id=data.get('employee_id'),
            user_id=user_id,
            title=data['title'],
            description=data.get('description'),
            appointment_date=appointment_date,
            start_time=start_time,
            end_time=end_time,
            duration_minutes=duration_minutes,
            notes=data.get('notes'),
            is_recurring=data.get('is_recurring', False),
            recurring_pattern=data.get('recurring_pattern')
        )
        
        db.session.add(appointment)
        db.session.commit()
        return jsonify(appointment.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error creating appointment: {str(e)}")
        return jsonify({'error': f'Failed to create appointment: {str(e)}'}), 500

@service_bp.route('/appointments/<int:appointment_id>', methods=['PUT'])
@jwt_required()
def update_appointment(appointment_id):
    business_id = get_business_id()
    appointment = Appointment.query.filter_by(id=appointment_id, business_id=business_id).first()
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
    
    data = request.get_json()
    for key, value in data.items():
        if hasattr(appointment, key) and key not in ['id', 'business_id', 'appointment_id']:
            if key in ['appointment_date'] and value:
                setattr(appointment, key, datetime.strptime(value, '%Y-%m-%d').date())
            elif key in ['start_time', 'end_time'] and value:
                setattr(appointment, key, datetime.strptime(value, '%H:%M').time())
            elif key == 'status' and value:
                setattr(appointment, key, AppointmentStatus[value.upper()])
            else:
                setattr(appointment, key, value)
    
    # Recalculate duration if times changed
    if 'start_time' in data or 'end_time' in data:
        start_dt = datetime.combine(appointment.appointment_date, appointment.start_time)
        end_dt = datetime.combine(appointment.appointment_date, appointment.end_time)
        appointment.duration_minutes = int((end_dt - start_dt).total_seconds() / 60)
    
    db.session.commit()
    return jsonify(appointment.to_dict())

@service_bp.route('/appointments/<int:appointment_id>', methods=['DELETE'])
@jwt_required()
def delete_appointment(appointment_id):
    business_id = get_business_id()
    appointment = Appointment.query.filter_by(id=appointment_id, business_id=business_id).first()
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
    
    appointment.status = AppointmentStatus.CANCELLED
    db.session.commit()
    return jsonify({'message': 'Appointment cancelled'})

# ============== TIME ENTRIES ==============

@service_bp.route('/time-entries', methods=['GET'])
@jwt_required()
def get_time_entries():
    business_id = get_business_id()
    branch_id = request.args.get('branch_id', type=int)
    employee_id = request.args.get('employee_id', type=int)
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = TimeEntry.query.filter_by(business_id=business_id)
    
    if branch_id:
        query = query.filter_by(branch_id=branch_id)
    if employee_id:
        query = query.filter_by(employee_id=employee_id)
    if start_date:
        query = query.filter(TimeEntry.entry_date >= datetime.strptime(start_date, '%Y-%m-%d').date())
    if end_date:
        query = query.filter(TimeEntry.entry_date <= datetime.strptime(end_date, '%Y-%m-%d').date())
    
    entries = query.order_by(TimeEntry.entry_date.desc(), TimeEntry.start_time.desc()).all()
    return jsonify([e.to_dict() for e in entries])

@service_bp.route('/time-entries', methods=['POST'])
@jwt_required()
def create_time_entry():
    try:
        business_id = get_business_id()
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        if not data.get('employee_id'):
            return jsonify({'error': 'Employee is required'}), 400
        if not data.get('entry_date'):
            return jsonify({'error': 'Entry date is required'}), 400
        if not data.get('start_time'):
            return jsonify({'error': 'Start time is required'}), 400
        
        # Parse date and time
        entry_date = datetime.strptime(data['entry_date'], '%Y-%m-%d').date()
        start_time = datetime.strptime(data['start_time'], '%H:%M').time()
        end_time = datetime.strptime(data['end_time'], '%H:%M').time() if data.get('end_time') else None
        
        # Calculate duration
        duration_minutes = 0
        if end_time:
            start_dt = datetime.combine(entry_date, start_time)
            end_dt = datetime.combine(entry_date, end_time)
            duration_minutes = int((end_dt - start_dt).total_seconds() / 60)
        
        entry = TimeEntry(
            business_id=business_id,
            branch_id=data.get('branch_id'),
            entry_id=generate_id('TM'),
            employee_id=data['employee_id'],
            user_id=user_id,
            order_id=data.get('order_id'),
            project_id=data.get('project_id'),
            task_id=data.get('task_id'),
            entry_date=entry_date,
            start_time=start_time,
            end_time=end_time,
            duration_minutes=duration_minutes,
            description=data.get('description'),
            hourly_rate=data.get('hourly_rate'),
            is_billable=data.get('is_billable', True)
        )
        
        # Calculate total amount
        if entry.hourly_rate and duration_minutes:
            entry.total_amount = entry.hourly_rate * (duration_minutes / 60)
        
        db.session.add(entry)
        db.session.commit()
        return jsonify(entry.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error creating time entry: {str(e)}")
        return jsonify({'error': f'Failed to create time entry: {str(e)}'}), 500

@service_bp.route('/time-entries/<int:entry_id>', methods=['PUT'])
@jwt_required()
def update_time_entry(entry_id):
    business_id = get_business_id()
    entry = TimeEntry.query.filter_by(id=entry_id, business_id=business_id).first()
    if not entry:
        return jsonify({'error': 'Time entry not found'}), 404
    
    data = request.get_json()
    for key, value in data.items():
        if hasattr(entry, key) and key not in ['id', 'business_id', 'entry_id']:
            if key in ['entry_date'] and value:
                setattr(entry, key, datetime.strptime(value, '%Y-%m-%d').date())
            elif key in ['start_time', 'end_time'] and value:
                setattr(entry, key, datetime.strptime(value, '%H:%M').time())
            else:
                setattr(entry, key, value)
    
    # Recalculate duration and amount
    if entry.end_time:
        start_dt = datetime.combine(entry.entry_date, entry.start_time)
        end_dt = datetime.combine(entry.entry_date, entry.end_time)
        entry.duration_minutes = int((end_dt - start_dt).total_seconds() / 60)
        
        if entry.hourly_rate:
            entry.total_amount = entry.hourly_rate * (entry.duration_minutes / 60)
    
    db.session.commit()
    return jsonify(entry.to_dict())

@service_bp.route('/time-entries/<int:entry_id>/approve', methods=['POST'])
@jwt_required()
def approve_time_entry(entry_id):
    business_id = get_business_id()
    user_id = get_jwt_identity()
    entry = TimeEntry.query.filter_by(id=entry_id, business_id=business_id).first()
    if not entry:
        return jsonify({'error': 'Time entry not found'}), 404
    
    entry.is_approved = True
    entry.approved_by = user_id
    entry.approved_at = datetime.utcnow()
    
    db.session.commit()
    return jsonify(entry.to_dict())

# ============== QUOTES ==============

@service_bp.route('/quotes', methods=['GET'])
@jwt_required()
def get_quotes():
    business_id = get_business_id()
    branch_id = request.args.get('branch_id', type=int)
    customer_id = request.args.get('customer_id', type=int)
    status = request.args.get('status')
    
    query = Quote.query.filter_by(business_id=business_id)
    
    if branch_id:
        query = query.filter_by(branch_id=branch_id)
    if customer_id:
        query = query.filter_by(customer_id=customer_id)
    if status:
        query = query.filter_by(status=QuoteStatus[status.upper()])
    
    quotes = query.order_by(Quote.quote_date.desc()).all()
    return jsonify([q.to_dict() for q in quotes])

@service_bp.route('/quotes/<int:quote_id>', methods=['GET'])
@jwt_required()
def get_quote(quote_id):
    business_id = get_business_id()
    quote = Quote.query.filter_by(id=quote_id, business_id=business_id).first()
    if not quote:
        return jsonify({'error': 'Quote not found'}), 404
    return jsonify(quote.to_dict())

@service_bp.route('/quotes', methods=['POST'])
@jwt_required()
def create_quote():
    try:
        business_id = get_business_id()
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        if not data.get('customer_id'):
            return jsonify({'error': 'Customer is required'}), 400
        if not data.get('valid_until'):
            return jsonify({'error': 'Valid until date is required'}), 400
        
        quote = Quote(
            business_id=business_id,
            branch_id=data.get('branch_id'),
            quote_id=generate_id('QT'),
            customer_id=data['customer_id'],
            user_id=user_id,
            quote_date=datetime.strptime(data['quote_date'], '%Y-%m-%d').date() if data.get('quote_date') else date.today(),
            valid_until=datetime.strptime(data['valid_until'], '%Y-%m-%d').date(),
            notes=data.get('notes'),
            terms=data.get('terms')
        )
        
        # Calculate totals from items
        subtotal = 0
        for item_data in data.get('items', []):
            quantity = item_data.get('quantity', 1)
            unit_price = item_data.get('unit_price', 0)
            discount = item_data.get('discount_percent', 0)
            line_total = quantity * unit_price * (1 - discount / 100)
            
            item = QuoteItem(
                description=item_data['description'],
                quantity=quantity,
                unit_price=unit_price,
                discount_percent=discount,
                line_total=line_total,
                product_id=item_data.get('product_id'),
                service_id=item_data.get('service_id')
            )
            quote.items.append(item)
            subtotal += line_total
        
        quote.subtotal = subtotal
        quote.tax_amount = data.get('tax_amount', 0)
        quote.discount_amount = data.get('discount_amount', 0)
        quote.total_amount = subtotal + quote.tax_amount - quote.discount_amount
        
        db.session.add(quote)
        db.session.commit()
        return jsonify(quote.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error creating quote: {str(e)}")
        return jsonify({'error': f'Failed to create quote: {str(e)}'}), 500

@service_bp.route('/quotes/<int:quote_id>', methods=['PUT'])
@jwt_required()
def update_quote(quote_id):
    business_id = get_business_id()
    quote = Quote.query.filter_by(id=quote_id, business_id=business_id).first()
    if not quote:
        return jsonify({'error': 'Quote not found'}), 404
    
    data = request.get_json()
    
    # Update quote fields
    for key in ['valid_until', 'notes', 'terms']:
        if key in data:
            if key == 'valid_until':
                setattr(quote, key, datetime.strptime(data[key], '%Y-%m-%d').date())
            else:
                setattr(quote, key, data[key])
    
    # Update items if provided
    if 'items' in data:
        # Remove old items
        QuoteItem.query.filter_by(quote_id=quote.id).delete()
        
        subtotal = 0
        for item_data in data['items']:
            quantity = item_data.get('quantity', 1)
            unit_price = item_data.get('unit_price', 0)
            discount = item_data.get('discount_percent', 0)
            line_total = quantity * unit_price * (1 - discount / 100)
            
            item = QuoteItem(
                quote_id=quote.id,
                description=item_data['description'],
                quantity=quantity,
                unit_price=unit_price,
                discount_percent=discount,
                line_total=line_total,
                product_id=item_data.get('product_id'),
                service_id=item_data.get('service_id')
            )
            db.session.add(item)
            subtotal += line_total
        
        quote.subtotal = subtotal
        quote.tax_amount = data.get('tax_amount', quote.tax_amount)
        quote.discount_amount = data.get('discount_amount', quote.discount_amount)
        quote.total_amount = subtotal + quote.tax_amount - quote.discount_amount
    
    db.session.commit()
    return jsonify(quote.to_dict())

@service_bp.route('/quotes/<int:quote_id>/send', methods=['POST'])
@jwt_required()
def send_quote(quote_id):
    business_id = get_business_id()
    quote = Quote.query.filter_by(id=quote_id, business_id=business_id).first()
    if not quote:
        return jsonify({'error': 'Quote not found'}), 404
    
    quote.status = QuoteStatus.SENT
    db.session.commit()
    return jsonify(quote.to_dict())

@service_bp.route('/quotes/<int:quote_id>/accept', methods=['POST'])
@jwt_required()
def accept_quote(quote_id):
    business_id = get_business_id()
    quote = Quote.query.filter_by(id=quote_id, business_id=business_id).first()
    if not quote:
        return jsonify({'error': 'Quote not found'}), 404
    
    quote.status = QuoteStatus.ACCEPTED
    db.session.commit()
    return jsonify(quote.to_dict())

@service_bp.route('/quotes/<int:quote_id>/reject', methods=['POST'])
@jwt_required()
def reject_quote(quote_id):
    business_id = get_business_id()
    quote = Quote.query.filter_by(id=quote_id, business_id=business_id).first()
    if not quote:
        return jsonify({'error': 'Quote not found'}), 404
    
    quote.status = QuoteStatus.REJECTED
    db.session.commit()
    return jsonify(quote.to_dict())

@service_bp.route('/quotes/<int:quote_id>', methods=['DELETE'])
@jwt_required()
def delete_quote(quote_id):
    business_id = get_business_id()
    quote = Quote.query.filter_by(id=quote_id, business_id=business_id).first()
    if not quote:
        return jsonify({'error': 'Quote not found'}), 404
    
    db.session.delete(quote)
    db.session.commit()
    return jsonify({'message': 'Quote deleted'})
