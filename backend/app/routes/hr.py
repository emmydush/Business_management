from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User, UserRole
from app.models.employee import Employee
from app.models.attendance import Attendance
from app.models.leave_request import LeaveRequest, LeaveStatus
from app.models.payroll import Payroll
from app.utils.decorators import staff_required, manager_required, admin_required
from app.utils.middleware import module_required, get_business_id
from datetime import datetime, date

hr_bp = Blueprint('hr', __name__)

@hr_bp.route('/employees', methods=['GET'])
@jwt_required()
@module_required('hr')
def get_employees():
    try:
        business_id = get_business_id()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        department = request.args.get('department', '')
        position = request.args.get('position', '')
        is_active = request.args.get('is_active', type=str)
        
        query = Employee.query.filter_by(business_id=business_id).join(User)
        
        if search:
            query = query.filter(
                db.or_(
                    Employee.employee_id.contains(search.upper()),
                    User.first_name.contains(search),
                    User.last_name.contains(search),
                    Employee.department.contains(search),
                    Employee.position.contains(search)
                )
            )
        
        if department:
            query = query.filter(Employee.department == department)
        
        if position:
            query = query.filter(Employee.position == position)
        
        if is_active is not None:
            query = query.filter(Employee.is_active == (is_active.lower() == 'true'))
        
        employees = query.order_by(Employee.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'employees': [employee.to_dict() for employee in employees.items],
            'total': employees.total,
            'pages': employees.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hr_bp.route('/employees', methods=['POST'])
@jwt_required()
@module_required('hr')
def create_employee():
    try:
        business_id = get_business_id()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['user_id', 'employee_id', 'department', 'position', 'hire_date']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if employee ID already exists for this business
        existing_employee = Employee.query.filter_by(business_id=business_id, employee_id=data['employee_id']).first()
        if existing_employee:
            return jsonify({'error': 'Employee ID already exists for this business'}), 409
        
        # Check if user exists and belongs to this business
        user = User.query.filter_by(id=data['user_id'], business_id=business_id).first()
        if not user:
            return jsonify({'error': 'User not found for this business'}), 404
        
        # Check if user already has an employee record
        if user.employee:
            return jsonify({'error': 'User already has an employee record'}), 400
        
        employee = Employee(
            business_id=business_id,
            user_id=data['user_id'],
            employee_id=data['employee_id'],
            department=data['department'],
            position=data['position'],
            hire_date=data['hire_date'],
            salary=data.get('salary'),
            address=data.get('address', ''),
            emergency_contact_name=data.get('emergency_contact_name', ''),
            emergency_contact_phone=data.get('emergency_contact_phone', ''),
            bank_account=data.get('bank_account', '')
        )
        
        db.session.add(employee)
        db.session.commit()
        
        return jsonify({
            'message': 'Employee created successfully',
            'employee': employee.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_bp.route('/employees/<int:employee_id>', methods=['GET'])
@jwt_required()
@module_required('hr')
def get_employee(employee_id):
    try:
        business_id = get_business_id()
        employee = Employee.query.filter_by(id=employee_id, business_id=business_id).first()
        
        if not employee:
            return jsonify({'error': 'Employee not found'}), 404
        
        return jsonify({'employee': employee.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hr_bp.route('/employees/<int:employee_id>', methods=['PUT'])
@jwt_required()
@module_required('hr')
def update_employee(employee_id):
    try:
        business_id = get_business_id()
        employee = Employee.query.filter_by(id=employee_id, business_id=business_id).first()
        
        if not employee:
            return jsonify({'error': 'Employee not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'department' in data:
            employee.department = data['department']
        if 'position' in data:
            employee.position = data['position']
        if 'salary' in data:
            employee.salary = data['salary']
        if 'address' in data:
            employee.address = data['address']
        if 'emergency_contact_name' in data:
            employee.emergency_contact_name = data['emergency_contact_name']
        if 'emergency_contact_phone' in data:
            employee.emergency_contact_phone = data['emergency_contact_phone']
        if 'bank_account' in data:
            employee.bank_account = data['bank_account']
        if 'is_active' in data:
            employee.is_active = data['is_active']
        
        employee.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Employee updated successfully',
            'employee': employee.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_bp.route('/employees/<int:employee_id>', methods=['DELETE'])
@jwt_required()
@module_required('hr')
def delete_employee(employee_id):
    try:
        business_id = get_business_id()
        employee = Employee.query.filter_by(id=employee_id, business_id=business_id).first()
        
        if not employee:
            return jsonify({'error': 'Employee not found'}), 404
        
        db.session.delete(employee)
        db.session.commit()
        
        return jsonify({'message': 'Employee deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_bp.route('/departments', methods=['GET'])
@jwt_required()
@module_required('hr')
def get_departments():
    try:
        business_id = get_business_id()
        # Get all unique departments for this business
        departments = db.session.query(Employee.department).filter(
            Employee.business_id == business_id,
            Employee.department.isnot(None)
        ).distinct().all()
        
        department_list = [dept[0] for dept in departments if dept[0]]
        
        return jsonify({'departments': department_list}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hr_bp.route('/positions', methods=['GET'])
@jwt_required()
@module_required('hr')
def get_positions():
    try:
        business_id = get_business_id()
        # Get all unique positions for this business
        positions = db.session.query(Employee.position).filter(
            Employee.business_id == business_id,
            Employee.position.isnot(None)
        ).distinct().all()
        
        position_list = [pos[0] for pos in positions if pos[0]]
        
        return jsonify({'positions': position_list}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hr_bp.route('/payroll', methods=['GET'])
@jwt_required()
@module_required('hr')
def get_payroll():
    try:
        business_id = get_business_id()
        # Calculate total employees and total salary for this business
        total_employees = db.session.query(db.func.count(Employee.id)).filter(
            Employee.business_id == business_id,
            Employee.is_active == True
        ).scalar()
        
        total_salary = db.session.query(db.func.sum(Employee.salary)).filter(
            Employee.business_id == business_id,
            Employee.salary.isnot(None)
        ).scalar() or 0.0
        
        # Get employees with salary info for this business
        employees_with_salary = Employee.query.filter_by(business_id=business_id).filter(
            Employee.salary.isnot(None)
        ).all()
        
        payroll = {
            'total_employees': total_employees,
            'total_salary': float(total_salary),
            'monthly_payroll': float(total_salary),
            'employees': [emp.to_dict() for emp in employees_with_salary]
        }
        
        return jsonify({'payroll': payroll}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hr_bp.route('/attendance', methods=['GET'])
@jwt_required()
@module_required('hr')
def get_attendance():
    try:
        business_id = get_business_id()
        today = date.today()
        
        # Count total attendance records for today for this business
        total_records = db.session.query(db.func.count(Attendance.id)).join(Employee).filter(
            Employee.business_id == business_id,
            Attendance.date == today
        ).scalar()
        
        # Count present employees for this business
        present_count = db.session.query(db.func.count(Attendance.id)).join(Employee).filter(
            Employee.business_id == business_id,
            Attendance.date == today,
            Attendance.status.in_(['present', 'late'])
        ).scalar()
        
        absent_count = total_records - present_count
        
        late_count = db.session.query(db.func.count(Attendance.id)).join(Employee).filter(
            Employee.business_id == business_id,
            Attendance.date == today,
            Attendance.status == 'late'
        ).scalar()
        
        attendance = {
            'total_records': total_records,
            'present_today': present_count,
            'absent_today': absent_count,
            'late_arrivals': late_count
        }
        
        return jsonify({'attendance': attendance}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hr_bp.route('/leave-requests', methods=['GET'])
@jwt_required()
@module_required('hr')
def get_leave_requests():
    try:
        business_id = get_business_id()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        status = request.args.get('status', '')
        employee_id = request.args.get('employee_id', type=int)
        
        query = LeaveRequest.query.join(Employee).filter(Employee.business_id == business_id)
        
        if status:
            try:
                query = query.filter(LeaveRequest.status == LeaveStatus[status.upper()])
            except KeyError:
                pass
        
        if employee_id:
            query = query.filter(LeaveRequest.employee_id == employee_id)
        
        leave_requests = query.order_by(LeaveRequest.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'leave_requests': [lr.to_dict() for lr in leave_requests.items],
            'total': leave_requests.total,
            'pages': leave_requests.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hr_bp.route('/leave-requests/<int:leave_id>/approve', methods=['PUT'])
@jwt_required()
@module_required('hr')
@manager_required
def approve_leave_request(leave_id):
    try:
        business_id = get_business_id()
        leave_request = LeaveRequest.query.join(Employee).filter(
            LeaveRequest.id == leave_id,
            Employee.business_id == business_id
        ).first()
        
        if not leave_request:
            return jsonify({'error': 'Leave request not found for this business'}), 404
        
        if leave_request.status != LeaveStatus.PENDING:
            return jsonify({'error': 'Leave request is not in pending status'}), 400
        
        current_user_id = get_jwt_identity()
        leave_request.status = LeaveStatus.APPROVED
        leave_request.approved_by = current_user_id
        leave_request.approved_date = date.today()
        
        db.session.commit()
        
        return jsonify({'message': 'Leave request approved successfully', 'leave_request': leave_request.to_dict()}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_bp.route('/leave-requests/<int:leave_id>/reject', methods=['PUT'])
@jwt_required()
@module_required('hr')
@manager_required
def reject_leave_request(leave_id):
    try:
        business_id = get_business_id()
        leave_request = LeaveRequest.query.join(Employee).filter(
            LeaveRequest.id == leave_id,
            Employee.business_id == business_id
        ).first()
        
        if not leave_request:
            return jsonify({'error': 'Leave request not found for this business'}), 404
        
        if leave_request.status != LeaveStatus.PENDING:
            return jsonify({'error': 'Leave request is not in pending status'}), 400
        
        current_user_id = get_jwt_identity()
        leave_request.status = LeaveStatus.REJECTED
        leave_request.approved_by = current_user_id
        leave_request.approved_date = date.today()
        
        db.session.commit()
        
        return jsonify({'message': 'Leave request rejected successfully', 'leave_request': leave_request.to_dict()}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500