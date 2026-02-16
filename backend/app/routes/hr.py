from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User, UserRole
from app.models.employee import Employee
from app.models.attendance import Attendance
from app.models.leave_request import LeaveRequest, LeaveStatus
from app.models.payroll import Payroll
from app.models.task import Task
from app.utils.decorators import staff_required, manager_required, admin_required, subscription_required
from app.utils.middleware import module_required, get_business_id, get_active_branch_id
from datetime import datetime, date

hr_bp = Blueprint('hr', __name__)

@hr_bp.route('/employees', methods=['GET'])
@jwt_required()
@module_required('hr')
def get_employees():
    try:
        business_id = get_business_id()
        
        # If no business_id, return empty list
        if not business_id:
            return jsonify({
                'employees': [],
                'total': 0,
                'pages': 0,
                'current_page': 1
            }), 200
        
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        department = request.args.get('department', '')
        position = request.args.get('position', '')
        is_active = request.args.get('is_active', type=str)
        
        query = Employee.query.filter_by(business_id=business_id)
        if branch_id:
            query = query.filter_by(branch_id=branch_id)
        
        # Use outerjoin to handle cases where user might not exist
        query = query.outerjoin(User)
        
        if search:
            search_filter = f'%{search}%'
            query = query.filter(
                db.or_(
                    Employee.employee_id.ilike(search_filter),
                    User.first_name.ilike(search_filter),
                    User.last_name.ilike(search_filter),
                    Employee.department.ilike(search_filter),
                    Employee.position.ilike(search_filter)
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
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in get_employees: {str(e)}")
        print(error_trace)
        return jsonify({'error': str(e), 'trace': error_trace}), 500

@hr_bp.route('/employees', methods=['POST'])
@jwt_required()
@module_required('hr')
@subscription_required
def create_employee():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
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
            branch_id=branch_id,
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
@subscription_required
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
        if 'branch_id' in data:
            employee.branch_id = data['branch_id']
        
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
@subscription_required
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
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        
        query = db.session.query(Employee.department).filter(
            Employee.business_id == business_id,
            Employee.department.isnot(None)
        )
        if branch_id:
            query = query.filter(Employee.branch_id == branch_id)
            
        departments = query.distinct().all()
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
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        
        query = db.session.query(Employee.position).filter(
            Employee.business_id == business_id,
            Employee.position.isnot(None)
        )
        if branch_id:
            query = query.filter(Employee.branch_id == branch_id)
            
        positions = query.distinct().all()
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
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        
        # Calculate total employees and total salary for this business/branch
        emp_query = db.session.query(db.func.count(Employee.id)).filter(
            Employee.business_id == business_id,
            Employee.is_active == True
        )
        if branch_id:
            emp_query = emp_query.filter(Employee.branch_id == branch_id)
        total_employees = emp_query.scalar()
        
        sal_query = db.session.query(db.func.sum(Employee.salary)).filter(
            Employee.business_id == business_id,
            Employee.salary.isnot(None)
        )
        if branch_id:
            sal_query = sal_query.filter(Employee.branch_id == branch_id)
        total_salary = sal_query.scalar() or 0.0
        
        # Get employees with salary info
        emp_list_query = Employee.query.filter_by(business_id=business_id).filter(
            Employee.salary.isnot(None)
        )
        if branch_id:
            emp_list_query = emp_list_query.filter(Employee.branch_id == branch_id)
        employees_with_salary = emp_list_query.all()
        
        # Calculate next pay date - last day of current month
        from datetime import date
        import calendar
        today = date.today()
        last_day_of_month = calendar.monthrange(today.year, today.month)[1]
        next_pay_date = date(today.year, today.month, last_day_of_month)
        
        payroll = {
            'total_employees': total_employees,
            'total_salary': float(total_salary),
            'monthly_payroll': float(total_salary),
            'next_pay_date': next_pay_date.isoformat(),
            'pay_cycle': 'End of month',
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
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        today = date.today()
        
        # Count total attendance records for today
        total_query = db.session.query(db.func.count(Attendance.id)).filter(
            Attendance.business_id == business_id,
            Attendance.date == today
        )
        if branch_id:
            total_query = total_query.filter(Attendance.branch_id == branch_id)
        total_records = total_query.scalar()
        
        # Count present employees
        present_query = db.session.query(db.func.count(Attendance.id)).filter(
            Attendance.business_id == business_id,
            Attendance.date == today,
            Attendance.status.in_(['present', 'late'])
        )
        if branch_id:
            present_query = present_query.filter(Attendance.branch_id == branch_id)
        present_count = present_query.scalar()
        
        absent_count = total_records - present_count
        
        late_query = db.session.query(db.func.count(Attendance.id)).filter(
            Attendance.business_id == business_id,
            Attendance.date == today,
            Attendance.status == 'late'
        )
        if branch_id:
            late_query = late_query.filter(Attendance.branch_id == branch_id)
        late_count = late_query.scalar()
        
        attendance = {
            'total_records': total_records,
            'present_today': present_count,
            'absent_today': absent_count,
            'late_arrivals': late_count
        }
        
        return jsonify({'attendance': attendance}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hr_bp.route('/attendance/records', methods=['GET'])
@jwt_required()
@module_required('hr')
def get_attendance_records():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        date_str = request.args.get('date')
        search = request.args.get('search', '')

        query = Attendance.query.filter(Attendance.business_id == business_id)
        if branch_id:
            query = query.filter(Attendance.branch_id == branch_id)

        if date_str:
            try:
                from datetime import datetime
                date_val = datetime.strptime(date_str, '%Y-%m-%d').date()
                query = query.filter(Attendance.date == date_val)
            except Exception:
                pass

        if search:
            # Search by employee name or id
            query = query.join(Employee).join(User).filter(
                db.or_(
                    Employee.employee_id.contains(search.upper()),
                    User.first_name.contains(search),
                    User.last_name.contains(search)
                )
            )

        paginated = query.order_by(Attendance.date.desc(), Attendance.check_in_time.desc()).paginate(page=page, per_page=per_page, error_out=False)

        return jsonify({
            'attendance_records': [att.to_dict() for att in paginated.items],
            'total': paginated.total,
            'pages': paginated.pages,
            'current_page': page
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hr_bp.route('/performance', methods=['GET'])
@jwt_required()
@module_required('hr')
def get_performance():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        from datetime import date, timedelta
        period_days = int(request.args.get('days', 30))
        since = date.today() - timedelta(days=period_days)
        prev_since = since - timedelta(days=period_days)
        prev_until = since

        emp_query = Employee.query.filter_by(business_id=business_id)
        if branch_id:
            emp_query = emp_query.filter_by(branch_id=branch_id)
        employees = emp_query.all()
        
        performance = []

        # Aggregates for summary
        total_assigned_current = 0
        total_completed_current = 0
        total_rating_current = 0.0
        total_rating_prev = 0.0
        n_employees = 0
        top_performers_count = 0

        for emp in employees:
            user = emp.user
            user_id = user.id if user else None
            # Tasks assigned/completed - current period
            assigned = db.session.query(db.func.count(Task.id)).filter(Task.assigned_to == user_id, Task.business_id == business_id, Task.created_at >= since).scalar() or 0
            completed = db.session.query(db.func.count(Task.id)).filter(Task.assigned_to == user_id, Task.business_id == business_id, Task.status == 'completed', Task.updated_at >= since).scalar() or 0
            # Tasks for previous period
            assigned_prev = db.session.query(db.func.count(Task.id)).filter(Task.assigned_to == user_id, Task.business_id == business_id, Task.created_at >= prev_since, Task.created_at < prev_until).scalar() or 0
            completed_prev = db.session.query(db.func.count(Task.id)).filter(Task.assigned_to == user_id, Task.business_id == business_id, Task.status == 'completed', Task.updated_at >= prev_since, Task.updated_at < prev_until).scalar() or 0
            # Attendance over current period
            attendance_present = db.session.query(db.func.count(Attendance.id)).filter(Attendance.employee_id == emp.id, Attendance.date >= since, Attendance.status.in_(['present', 'late'])).scalar() or 0
            attendance_rate = round((attendance_present / max(1, period_days)) * 100, 1)
            # Previous attendance
            attendance_prev = db.session.query(db.func.count(Attendance.id)).filter(Attendance.employee_id == emp.id, Attendance.date >= prev_since, Attendance.date < prev_until, Attendance.status.in_(['present', 'late'])).scalar() or 0
            attendance_rate_prev = round((attendance_prev / max(1, period_days)) * 100, 1)

            task_score = (completed / assigned) if assigned > 0 else 0
            rating = round((task_score * 3.0) + (attendance_rate / 100.0 * 2.0), 2)  # scale to 5

            task_score_prev = (completed_prev / assigned_prev) if assigned_prev > 0 else 0
            rating_prev = round((task_score_prev * 3.0) + (attendance_rate_prev / 100.0 * 2.0), 2)

            # Last review: most recent completed task timestamp
            last_task = Task.query.filter(Task.assigned_to == user_id, Task.business_id == business_id, Task.status == 'completed').order_by(Task.updated_at.desc()).first()
            last_review = last_task.updated_at.isoformat() if last_task else None

            # Status
            if assigned == 0:
                status = 'No Tasks'
            elif completed >= assigned:
                status = 'Completed'
            else:
                status = 'In Progress'

            performance.append({
                'employee': {
                    'id': emp.id,
                    'employee_id': emp.employee_id,
                    'first_name': user.first_name if user else None,
                    'last_name': user.last_name if user else None,
                    'position': emp.position
                },
                'assigned_tasks': int(assigned),
                'completed_tasks': int(completed),
                'attendance_rate': float(attendance_rate),
                'rating': rating,
                'last_review': last_review,
                'status': status
            })

            # aggregates
            total_assigned_current += assigned
            total_completed_current += completed
            total_rating_current += rating
            total_rating_prev += rating_prev
            n_employees += 1
            if rating > 4.5:
                top_performers_count += 1

        avg_rating_current = round((total_rating_current / n_employees), 2) if n_employees > 0 else 0.0
        avg_rating_prev = round((total_rating_prev / n_employees), 2) if n_employees > 0 else 0.0
        avg_rating_change = round((avg_rating_current - avg_rating_prev), 2)
        goals_completed_pct = round((total_completed_current / total_assigned_current) * 100) if total_assigned_current > 0 else 0

        summary = {
            'avg_rating': avg_rating_current,
            'avg_rating_change': avg_rating_change,
            'goals_completed_percentage': int(goals_completed_pct),
            'top_performers_count': top_performers_count,
            'top_rating_threshold': 4.5,
            'period_days': period_days
        }

        return jsonify({'performance': performance, 'summary': summary}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hr_bp.route('/leave-requests', methods=['GET'])
@jwt_required()
@module_required('hr')
def get_leave_requests():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        status = request.args.get('status', '')
        employee_id = request.args.get('employee_id', type=int)
        
        query = LeaveRequest.query.filter(LeaveRequest.business_id == business_id)
        if branch_id:
            query = query.filter(LeaveRequest.branch_id == branch_id)
        
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
@subscription_required
def approve_leave_request(leave_id):
    try:
        business_id = get_business_id()
        leave_request = LeaveRequest.query.filter(
            LeaveRequest.id == leave_id,
            LeaveRequest.business_id == business_id
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
@subscription_required
def reject_leave_request(leave_id):
    try:
        business_id = get_business_id()
        leave_request = LeaveRequest.query.filter(
            LeaveRequest.id == leave_id,
            LeaveRequest.business_id == business_id
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