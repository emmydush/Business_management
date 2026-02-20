from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User, UserRole
from app.models.employee import Employee
from app.models.department import Department
from app.models.attendance import Attendance
from app.models.leave_request import LeaveRequest, LeaveStatus
from app.models.payroll import Payroll, PayrollStatus
from app.models.task import Task
from app.utils.decorators import staff_required, manager_required, admin_required, subscription_required
from app.utils.middleware import module_required, get_business_id, get_active_branch_id
from app.utils import momo
from datetime import datetime, date
import csv

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


@hr_bp.route('/employees/bulk-upload', methods=['POST'])
@jwt_required()
@module_required('hr')
@manager_required
@subscription_required
def bulk_upload_employees():
    """
    Bulk upload employees from a CSV file.

    Expected columns (case-insensitive, flexible):
    - employee_id (required, unique per business)
    - user_email (required: existing user email in this business)
    - department
    - position
    - hire_date (YYYY-MM-DD)
    - salary
    - address
    - emergency_contact_name
    - emergency_contact_phone
    - bank_account
    - is_active (true/false, defaults to true)

    Note: This bulk upload does NOT create user accounts; it links employees
    to existing users by email.
    """
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()

        if 'file' not in request.files:
            return jsonify({'error': 'No file part in the request'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        if not file.filename.lower().endswith('.csv'):
            return jsonify({'error': 'Only CSV files are supported. Please upload a .csv file'}), 400

        content = file.read().decode('utf-8-sig')
        reader = csv.DictReader(content.splitlines())

        # Helper to fetch a value from a row using flexible header matching
        def get_val(r, *candidates):
            if not r:
                return None
            for cand in candidates:
                for rk in list(r.keys()):
                    if rk is None:
                        continue
                    if rk.strip().lower() == cand.strip().lower():
                        return r.get(rk)
            return None

        created = []
        errors = []
        row_num = 1

        for row in reader:
            row_num += 1
            try:
                employee_id = (get_val(row, 'employee_id', 'Employee ID', 'employee id') or '').strip()
                user_email = (get_val(row, 'user_email', 'User Email', 'email', 'user email') or '').strip()

                if not employee_id or not user_email:
                    errors.append({'row': row_num, 'error': 'Missing required fields: employee_id, user_email'})
                    continue

                # Ensure employee_id unique per business
                existing_emp = Employee.query.filter_by(business_id=business_id, employee_id=employee_id).first()
                if existing_emp:
                    errors.append({'row': row_num, 'error': f'Employee ID {employee_id} already exists for this business'})
                    continue

                # Find user by email within the same business
                user = User.query.filter_by(email=user_email, business_id=business_id).first()
                if not user:
                    errors.append({'row': row_num, 'error': f'User with email {user_email} not found for this business'})
                    continue

                # Ensure user does not already have an employee record
                if user.employee:
                    errors.append({'row': row_num, 'error': f'User {user_email} already has an employee record'})
                    continue

                department = (get_val(row, 'department', 'Department') or '').strip()
                position = (get_val(row, 'position', 'Position') or '').strip()
                hire_date_raw = (get_val(row, 'hire_date', 'Hire Date', 'hire date') or '').strip()

                if not department or not position or not hire_date_raw:
                    errors.append({'row': row_num, 'error': 'Missing required fields: department, position, hire_date'})
                    continue

                # Parse hire_date
                try:
                    hire_date = datetime.strptime(hire_date_raw, '%Y-%m-%d').date()
                except ValueError:
                    errors.append({'row': row_num, 'error': f'Invalid hire_date (expected YYYY-MM-DD): {hire_date_raw}'})
                    continue

                # Salary
                try:
                    salary_raw = get_val(row, 'salary', 'Salary') or ''
                    salary = float(salary_raw) if salary_raw != '' else None
                except (ValueError, TypeError):
                    errors.append({'row': row_num, 'error': f'Invalid salary: {row.get("salary")}'})
                    continue

                address = (get_val(row, 'address', 'Address') or '').strip()
                emergency_contact_name = (get_val(row, 'emergency_contact_name', 'Emergency Contact Name', 'emergency contact name') or '').strip()
                emergency_contact_phone = (get_val(row, 'emergency_contact_phone', 'Emergency Contact Phone', 'emergency contact phone') or '').strip()
                bank_account = (get_val(row, 'bank_account', 'Bank Account', 'bank account') or '').strip()

                is_active_raw = (get_val(row, 'is_active', 'Is Active', 'is active') or '').strip().lower()
                is_active = True if is_active_raw == '' else is_active_raw in ['true', '1', 'yes', 'on']

                employee = Employee(
                    business_id=business_id,
                    branch_id=branch_id,
                    user_id=user.id,
                    employee_id=employee_id,
                    department=department,
                    position=position,
                    hire_date=hire_date,
                    salary=salary,
                    address=address,
                    emergency_contact_name=emergency_contact_name,
                    emergency_contact_phone=emergency_contact_phone,
                    bank_account=bank_account,
                    is_active=is_active
                )

                db.session.add(employee)
                db.session.commit()
                created.append(employee.to_dict())

            except Exception as row_err:
                db.session.rollback()
                errors.append({'row': row_num, 'error': str(row_err)})
                continue

        return jsonify({
            'created': created,
            'errors': errors,
            'created_count': len(created)
        }), 200

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
        
        # Get departments from the departments table
        departments = Department.query.filter_by(business_id=business_id).all()
        
        return jsonify({
            'departments': [dept.to_dict() for dept in departments]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hr_bp.route('/departments', methods=['POST'])
@jwt_required()
@module_required('hr')
@subscription_required
def create_department():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({'error': 'Department name is required'}), 400
        
        # Check if department name already exists for this business
        existing_dept = Department.query.filter_by(
            business_id=business_id, 
            name=data['name']
        ).first()
        
        if existing_dept:
            return jsonify({'error': 'Department name already exists'}), 409
        
        department = Department(
            business_id=business_id,
            name=data['name'],
            description=data.get('description', ''),
            head_id=data.get('head_id'),
            is_active=data.get('is_active', True)
        )
        
        db.session.add(department)
        db.session.commit()
        
        return jsonify({
            'message': 'Department created successfully',
            'department': department.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_bp.route('/departments/<int:dept_id>', methods=['PUT'])
@jwt_required()
@module_required('hr')
@subscription_required
def update_department(dept_id):
    try:
        business_id = get_business_id()
        department = Department.query.filter_by(id=dept_id, business_id=business_id).first()
        
        if not department:
            return jsonify({'error': 'Department not found'}), 404
        
        data = request.get_json()
        
        if 'name' in data:
            # Check if another department with same name exists
            existing_dept = Department.query.filter(
                Department.business_id == business_id,
                Department.name == data['name'],
                Department.id != dept_id
            ).first()
            
            if existing_dept:
                return jsonify({'error': 'Department name already exists'}), 409
            
            department.name = data['name']
        
        if 'description' in data:
            department.description = data['description']
        
        if 'head_id' in data:
            department.head_id = data['head_id']
        
        if 'is_active' in data:
            department.is_active = data['is_active']
        
        department.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Department updated successfully',
            'department': department.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_bp.route('/departments/<int:dept_id>', methods=['DELETE'])
@jwt_required()
@module_required('hr')
@subscription_required
def delete_department(dept_id):
    try:
        business_id = get_business_id()
        department = Department.query.filter_by(id=dept_id, business_id=business_id).first()
        
        if not department:
            return jsonify({'error': 'Department not found'}), 404
        
        # Check if department has employees
        if len(department.employees) > 0:
            return jsonify({
                'error': 'Cannot delete department with employees. Please reassign employees first.'
            }), 400
        
        db.session.delete(department)
        db.session.commit()
        
        return jsonify({'message': 'Department deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
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
        
        # Calculate total employees for this business/branch
        emp_query = db.session.query(db.func.count(Employee.id)).filter(
            Employee.business_id == business_id
        )
        if branch_id:
            emp_query = emp_query.filter(Employee.branch_id == branch_id)
        total_employees = emp_query.scalar()
        
        # Calculate total salary for employees with salary info
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

@hr_bp.route('/payroll', methods=['POST'])
@jwt_required()
@module_required('hr')
@subscription_required
def create_payroll():
    try:
        business_id = get_business_id()
        current_user_id = get_jwt_identity()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['pay_period_start', 'pay_period_end', 'employee_salaries']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        pay_period_start = datetime.strptime(data['pay_period_start'], '%Y-%m-%d').date()
        pay_period_end = datetime.strptime(data['pay_period_end'], '%Y-%m-%d').date()
        
        if pay_period_start > pay_period_end:
            return jsonify({'error': 'Pay period start date must be before end date'}), 400
        
        created_payrolls = []
        
        for emp_salary in data['employee_salaries']:
            # Validate employee data
            if 'employee_id' not in emp_salary or 'basic_salary' not in emp_salary:
                return jsonify({'error': 'employee_id and basic_salary are required for each employee'}), 400
            
            # Verify employee exists and belongs to business
            employee = Employee.query.filter_by(
                id=emp_salary['employee_id'], 
                business_id=business_id
            ).first()
            
            if not employee:
                return jsonify({'error': f'Employee with ID {emp_salary["employee_id"]} not found'}), 404
            
            if branch_id and employee.branch_id != branch_id:
                return jsonify({'error': f'Employee does not belong to the specified branch'}), 400
            
            # Calculate payroll amounts
            basic_salary = emp_salary.get('basic_salary', 0)
            allowances = emp_salary.get('allowances', 0)
            overtime_pay = emp_salary.get('overtime_pay', 0)
            bonuses = emp_salary.get('bonuses', 0)
            tax_deductions = emp_salary.get('tax_deductions', 0)
            other_deductions = emp_salary.get('other_deductions', 0)
            
            gross_pay = basic_salary + allowances + overtime_pay + bonuses
            net_pay = gross_pay - tax_deductions - other_deductions
            
            # Create payroll record
            payroll = Payroll(
                business_id=business_id,
                branch_id=branch_id,
                employee_id=employee.id,
                pay_period_start=pay_period_start,
                pay_period_end=pay_period_end,
                basic_salary=basic_salary,
                allowances=allowances,
                overtime_pay=overtime_pay,
                bonuses=bonuses,
                gross_pay=gross_pay,
                tax_deductions=tax_deductions,
                other_deductions=other_deductions,
                net_pay=net_pay,
                status=PayrollStatus.DRAFT,
                created_by=current_user_id,
                notes=emp_salary.get('notes', '')
            )
            
            db.session.add(payroll)
            created_payrolls.append(payroll)
        
        db.session.commit()
        
        return jsonify({
            'message': f'Payroll created successfully for {len(created_payrolls)} employees',
            'payrolls': [p.to_dict() for p in created_payrolls]
        }), 201
        
    except ValueError as ve:
        db.session.rollback()
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_bp.route('/payroll/<int:payroll_id>', methods=['PUT'])
@jwt_required()
@module_required('hr')
@subscription_required
def update_payroll(payroll_id):
    try:
        business_id = get_business_id()
        current_user_id = get_jwt_identity()
        payroll = Payroll.query.filter_by(id=payroll_id, business_id=business_id).first()
        
        if not payroll:
            return jsonify({'error': 'Payroll record not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        updatable_fields = [
            'basic_salary', 'allowances', 'overtime_pay', 'bonuses', 
            'tax_deductions', 'other_deductions', 'notes', 'status'
        ]
        
        for field in updatable_fields:
            if field in data:
                if field == 'status' and data[field] in [status.value for status in PayrollStatus]:
                    setattr(payroll, field, PayrollStatus(data[field]))
                else:
                    setattr(payroll, field, data[field])
        
        # Recalculate pay amounts if salary components changed
        if any(field in data for field in ['basic_salary', 'allowances', 'overtime_pay', 'bonuses', 'tax_deductions', 'other_deductions']):
            payroll.gross_pay = (payroll.basic_salary or 0) + (payroll.allowances or 0) + (payroll.overtime_pay or 0) + (payroll.bonuses or 0)
            payroll.net_pay = payroll.gross_pay - (payroll.tax_deductions or 0) - (payroll.other_deductions or 0)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Payroll record updated successfully',
            'payroll': payroll.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_bp.route('/payroll/history', methods=['GET'])
@jwt_required()
@module_required('hr')
def get_payroll_history():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status', '')
        employee_id = request.args.get('employee_id', type=int)
        month = request.args.get('month', type=int)
        year = request.args.get('year', type=int)
        
        query = Payroll.query.filter_by(business_id=business_id)
        
        if branch_id:
            query = query.filter_by(branch_id=branch_id)
        if status:
            try:
                query = query.filter_by(status=PayrollStatus(status))
            except:
                pass
        if employee_id:
            query = query.filter_by(employee_id=employee_id)
        if month and year:
            from datetime import date
            start_date = date(year, month, 1)
            if month == 12:
                end_date = date(year + 1, 1, 1)
            else:
                end_date = date(year, month + 1, 1)
            query = query.filter(Payroll.pay_period_start >= start_date, Payroll.pay_period_start < end_date)
        
        # Order by most recent first
        query = query.order_by(Payroll.created_at.desc())
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        payrolls = pagination.items
        
        return jsonify({
            'payrolls': [p.to_dict() for p in payrolls],
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hr_bp.route('/payroll/<int:payroll_id>', methods=['GET'])
@jwt_required()
@module_required('hr')
def get_payroll_detail(payroll_id):
    try:
        business_id = get_business_id()
        payroll = Payroll.query.filter_by(id=payroll_id, business_id=business_id).first()
        
        if not payroll:
            return jsonify({'error': 'Payroll record not found'}), 404
        
        return jsonify({'payroll': payroll.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hr_bp.route('/payroll/<int:payroll_id>/approve', methods=['PUT'])
@jwt_required()
@module_required('hr')
@subscription_required
def approve_payroll(payroll_id):
    try:
        business_id = get_business_id()
        current_user_id = get_jwt_identity()
        
        payroll = Payroll.query.filter_by(id=payroll_id, business_id=business_id).first()
        
        if not payroll:
            return jsonify({'error': 'Payroll record not found'}), 404
        
        if payroll.status != PayrollStatus.DRAFT:
            return jsonify({'error': 'Only draft payroll can be approved'}), 400
        
        payroll.status = PayrollStatus.APPROVED
        payroll.approved_by = current_user_id
        payroll.approved_date = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Payroll approved successfully',
            'payroll': payroll.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_bp.route('/payroll/<int:payroll_id>/mark-paid', methods=['PUT'])
@jwt_required()
@module_required('hr')
@subscription_required
def mark_payroll_paid(payroll_id):
    try:
        business_id = get_business_id()
        
        payroll = Payroll.query.filter_by(id=payroll_id, business_id=business_id).first()
        
        if not payroll:
            return jsonify({'error': 'Payroll record not found'}), 404
        
        if payroll.status not in [PayrollStatus.APPROVED, PayrollStatus.DRAFT]:
            return jsonify({'error': 'Payroll must be in approved or draft status to mark as paid'}), 400
        
        data = request.get_json() or {}
        payroll.status = PayrollStatus.PAID
        payroll.payment_date = datetime.strptime(data.get('payment_date', datetime.now().strftime('%Y-%m-%d')), '%Y-%m-%d').date()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Payroll marked as paid successfully',
            'payroll': payroll.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@hr_bp.route('/payroll/<int:payroll_id>/disburse', methods=['POST'])
@jwt_required()
@module_required('hr')
@subscription_required
def disburse_payroll(payroll_id):
    try:
        business_id = get_business_id()
        payroll = Payroll.query.filter_by(id=payroll_id, business_id=business_id).first()

        if not payroll:
            return jsonify({'error': 'Payroll record not found'}), 404

        if payroll.status != PayrollStatus.APPROVED:
            return jsonify({'error': 'Payroll must be approved before disbursement'}), 400

        employee = payroll.employee
        if not employee or not employee.user or not employee.user.phone:
            return jsonify({'error': 'Employee phone number not found for disbursement'}), 400

        phone = employee.user.phone
        amount = float(payroll.net_pay)
        data = request.get_json() or {}
        currency = data.get('currency', payroll.disbursement_currency or 'EUR')
        metadata = data.get('metadata', {})

        # Initiate disbursement via MoMo utils
        result = momo.disburse_to_wallet(amount=amount, phone_number=phone, currency=currency, payee_note=metadata.get('note', f'Payroll {payroll.id}'))

        if result.get('success'):
            payroll.disbursement_provider = 'mtn_momo'
            payroll.disbursement_reference = result.get('reference_id') or result.get('provider_reference')
            payroll.disbursement_status = result.get('status', 'pending')
            payroll.disbursement_amount = amount
            payroll.disbursement_currency = currency
            payroll.disbursed_at = datetime.utcnow()
            payroll.disbursement_metadata = result
            payroll.status = PayrollStatus.PAID
            payroll.payment_date = datetime.utcnow().date()
            db.session.commit()

            return jsonify({'message': 'Disbursement initiated', 'payroll': payroll.to_dict(), 'result': result}), 200
        else:
            payroll.disbursement_status = result.get('status', 'failed')
            payroll.disbursement_metadata = result
            db.session.commit()
            return jsonify({'error': 'Disbursement failed', 'details': result}), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@hr_bp.route('/payroll/batch-disburse', methods=['POST'])
@jwt_required()
@module_required('hr')
@subscription_required
def batch_disburse_payroll():
    try:
        business_id = get_business_id()
        data = request.get_json() or {}
        payroll_ids = data.get('payroll_ids')  # optional list

        query = Payroll.query.filter_by(business_id=business_id)
        if payroll_ids:
            query = query.filter(Payroll.id.in_(payroll_ids))
        else:
            # default: all approved payrolls
            query = query.filter(Payroll.status == PayrollStatus.APPROVED)

        payrolls = query.all()
        results = []

        for payroll in payrolls:
            try:
                employee = payroll.employee
                if not employee or not employee.user or not employee.user.phone:
                    results.append({'payroll_id': payroll.id, 'success': False, 'error': 'Missing phone'})
                    continue

                phone = employee.user.phone
                amount = float(payroll.net_pay)
                currency = payroll.disbursement_currency or 'EUR'

                res = momo.disburse_to_wallet(amount=amount, phone_number=phone, currency=currency, payee_note=f'Payroll {payroll.id}')

                if res.get('success'):
                    payroll.disbursement_provider = 'mtn_momo'
                    payroll.disbursement_reference = res.get('reference_id')
                    payroll.disbursement_status = res.get('status', 'pending')
                    payroll.disbursement_amount = amount
                    payroll.disbursement_currency = currency
                    payroll.disbursed_at = datetime.utcnow()
                    payroll.disbursement_metadata = res
                    payroll.status = PayrollStatus.PAID
                    payroll.payment_date = datetime.utcnow().date()
                    db.session.add(payroll)
                    db.session.commit()
                    results.append({'payroll_id': payroll.id, 'success': True, 'reference': res.get('reference_id')})
                else:
                    payroll.disbursement_status = res.get('status', 'failed')
                    payroll.disbursement_metadata = res
                    db.session.add(payroll)
                    db.session.commit()
                    results.append({'payroll_id': payroll.id, 'success': False, 'error': res})

            except Exception as e:
                db.session.rollback()
                results.append({'payroll_id': payroll.id, 'success': False, 'error': str(e)})

        return jsonify({'results': results}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_bp.route('/payroll/<int:payroll_id>', methods=['DELETE'])
@jwt_required()
@module_required('hr')
def delete_payroll(payroll_id):
    try:
        business_id = get_business_id()
        
        payroll = Payroll.query.filter_by(id=payroll_id, business_id=business_id).first()
        
        if not payroll:
            return jsonify({'error': 'Payroll record not found'}), 404
        
        if payroll.status == PayrollStatus.PAID:
            return jsonify({'error': 'Cannot delete paid payroll records'}), 400
        
        db.session.delete(payroll)
        db.session.commit()
        
        return jsonify({'message': 'Payroll record deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_bp.route('/payroll/summary', methods=['GET'])
@jwt_required()
@module_required('hr')
def get_payroll_summary():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        month = request.args.get('month', type=int)
        year = request.args.get('year', type=int)
        
        if not month:
            month = datetime.now().month
        if not year:
            year = datetime.now().year
        
        from datetime import date
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1)
        else:
            end_date = date(year, month + 1, 1)
        
        # Query for this period
        query = Payroll.query.filter(
            Payroll.business_id == business_id,
            Payroll.pay_period_start >= start_date,
            Payroll.pay_period_start < end_date
        )
        if branch_id:
            query = query.filter(Payroll.branch_id == branch_id)
        
        payrolls = query.all()
        
        total_gross = sum(float(p.gross_pay or 0) for p in payrolls)
        total_tax = sum(float(p.tax_deductions or 0) for p in payrolls)
        total_deductions = sum(float(p.other_deductions or 0) for p in payrolls)
        total_net = sum(float(p.net_pay or 0) for p in payrolls)
        total_bonuses = sum(float(p.bonuses or 0) for p in payrolls)
        total_allowances = sum(float(p.allowances or 0) for p in payrolls)
        total_overtime = sum(float(p.overtime_pay or 0) for p in payrolls)
        
        # Count by status
        draft_count = len([p for p in payrolls if p.status == PayrollStatus.DRAFT])
        approved_count = len([p for p in payrolls if p.status == PayrollStatus.APPROVED])
        paid_count = len([p for p in payrolls if p.status == PayrollStatus.PAID])
        
        return jsonify({
            'summary': {
                'month': month,
                'year': year,
                'total_employees': len(payrolls),
                'total_gross_pay': total_gross,
                'total_tax_deductions': total_tax,
                'total_other_deductions': total_deductions,
                'total_net_pay': total_net,
                'total_bonuses': total_bonuses,
                'total_allowances': total_allowances,
                'total_overtime': total_overtime,
                'draft_count': draft_count,
                'approved_count': approved_count,
                'paid_count': paid_count
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hr_bp.route('/payroll/bulk-approve', methods=['PUT'])
@jwt_required()
@module_required('hr')
@subscription_required
def bulk_approve_payroll():
    try:
        business_id = get_business_id()
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        payroll_ids = data.get('payroll_ids', [])
        if not payroll_ids:
            return jsonify({'error': 'No payroll IDs provided'}), 400
        
        payrolls = Payroll.query.filter(
            Payroll.id.in_(payroll_ids),
            Payroll.business_id == business_id,
            Payroll.status == PayrollStatus.DRAFT
        ).all()
        
        approved_count = 0
        for payroll in payrolls:
            payroll.status = PayrollStatus.APPROVED
            payroll.approved_by = current_user_id
            payroll.approved_date = datetime.utcnow()
            approved_count += 1
        
        db.session.commit()
        
        return jsonify({
            'message': f'{approved_count} payroll records approved successfully',
            'approved_count': approved_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_bp.route('/payroll/bulk-pay', methods=['PUT'])
@jwt_required()
@module_required('hr')
@subscription_required
def bulk_mark_paid():
    try:
        business_id = get_business_id()
        data = request.get_json()
        
        payroll_ids = data.get('payroll_ids', [])
        payment_date = datetime.strptime(data.get('payment_date', datetime.now().strftime('%Y-%m-%d')), '%Y-%m-%d').date()
        
        if not payroll_ids:
            return jsonify({'error': 'No payroll IDs provided'}), 400
        
        payrolls = Payroll.query.filter(
            Payroll.id.in_(payroll_ids),
            Payroll.business_id == business_id
        ).all()
        
        paid_count = 0
        for payroll in payrolls:
            if payroll.status in [PayrollStatus.APPROVED, PayrollStatus.DRAFT]:
                payroll.status = PayrollStatus.PAID
                payroll.payment_date = payment_date
                paid_count += 1
        
        db.session.commit()
        
        return jsonify({
            'message': f'{paid_count} payroll records marked as paid',
            'paid_count': paid_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
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
            except Exception as e:
                print(f"Warning: Invalid date format '{date_str}': {e}")

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

        # Use eager loading to avoid N+1 query problem
        emp_query = Employee.query.filter_by(business_id=business_id).options(
            db.joinedload(Employee.user)
        )
        if branch_id:
            emp_query = emp_query.filter_by(branch_id=branch_id)
        employees = emp_query.all()
        
        # Pre-fetch all tasks for the period in a single query
        employee_ids = [emp.id for emp in employees]
        user_ids = [emp.user_id for emp in employees if emp.user_id]
        
        # Get all task stats in bulk
        from sqlalchemy import case
        
        # Current period task stats
        task_stats_current = db.session.query(
            Task.assigned_to,
            db.func.count(Task.id).label('assigned'),
            db.func.sum(case((Task.status == 'completed', 1), else_=0)).label('completed')
        ).filter(
            Task.business_id == business_id,
            Task.created_at >= since,
            Task.assigned_to.in_(user_ids)
        ).group_by(Task.assigned_to).all()
        
        task_stats_current_dict = {t.assigned_to: {'assigned': t.assigned, 'completed': t.completed or 0} for t in task_stats_current}
        
        # Previous period task stats
        task_stats_prev = db.session.query(
            Task.assigned_to,
            db.func.count(Task.id).label('assigned'),
            db.func.sum(case((Task.status == 'completed', 1), else_=0)).label('completed')
        ).filter(
            Task.business_id == business_id,
            Task.created_at >= prev_since,
            Task.created_at < prev_until,
            Task.assigned_to.in_(user_ids)
        ).group_by(Task.assigned_to).all()
        
        task_stats_prev_dict = {t.assigned_to: {'assigned': t.assigned, 'completed': t.completed or 0} for t in task_stats_prev}
        
        # Get all attendance stats in bulk
        attendance_current = db.session.query(
            Attendance.employee_id,
            db.func.count(Attendance.id).label('present')
        ).filter(
            Attendance.employee_id.in_(employee_ids),
            Attendance.date >= since,
            Attendance.status.in_(['present', 'late'])
        ).group_by(Attendance.employee_id).all()
        
        attendance_current_dict = {a.employee_id: a.present for a in attendance_current}
        
        attendance_prev = db.session.query(
            Attendance.employee_id,
            db.func.count(Attendance.id).label('present')
        ).filter(
            Attendance.employee_id.in_(employee_ids),
            Attendance.date >= prev_since,
            Attendance.date < prev_until,
            Attendance.status.in_(['present', 'late'])
        ).group_by(Attendance.employee_id).all()
        
        attendance_prev_dict = {a.employee_id: a.present for a in attendance_prev}
        
        # Get last completed task for each user
        last_tasks = db.session.query(
            Task.assigned_to,
            db.func.max(Task.updated_at).label('last_review')
        ).filter(
            Task.business_id == business_id,
            Task.status == 'completed',
            Task.assigned_to.in_(user_ids)
        ).group_by(Task.assigned_to).all()
        
        last_task_dict = {t.assigned_to: t.last_review for t in last_tasks}
        
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
            user_id = emp.user_id
            
            # Get pre-fetched stats
            current_stats = task_stats_current_dict.get(user_id, {'assigned': 0, 'completed': 0})
            prev_stats = task_stats_prev_dict.get(user_id, {'assigned': 0, 'completed': 0})
            
            assigned = current_stats['assigned']
            completed = current_stats['completed']
            assigned_prev = prev_stats['assigned']
            completed_prev = prev_stats['completed']
            
            # Attendance over current period
            attendance_present = attendance_current_dict.get(emp.id, 0)
            attendance_rate = round((attendance_present / max(1, period_days)) * 100, 1)
            
            # Previous attendance
            attendance_prev_count = attendance_prev_dict.get(emp.id, 0)
            attendance_rate_prev = round((attendance_prev_count / max(1, period_days)) * 100, 1)

            task_score = (completed / assigned) if assigned > 0 else 0
            rating = round((task_score * 3.0) + (attendance_rate / 100.0 * 2.0), 2)  # scale to 5

            task_score_prev = (completed_prev / assigned_prev) if assigned_prev > 0 else 0
            rating_prev = round((task_score_prev * 3.0) + (attendance_rate_prev / 100.0 * 2.0), 2)

            # Last review: most recent completed task timestamp
            last_review_dt = last_task_dict.get(user_id)
            last_review = last_review_dt.isoformat() if last_review_dt else None

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
        import traceback
        print(f"Error in get_performance: {traceback.format_exc()}")
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


# ============ NEW USER-FRIENDLY ATTENDANCE ENDPOINTS ============

@hr_bp.route('/attendance/check-in', methods=['POST'])
@jwt_required()
@module_required('hr')
def check_in():
    """Quick check-in endpoint for employees"""
    try:
        business_id = get_business_id()
        current_user_id = get_jwt_identity()
        branch_id = get_active_branch_id()
        
        data = request.get_json() or {}
        employee_id = data.get('employee_id')
        location = data.get('work_location', '')
        notes = data.get('notes', '')
        
        # If no employee_id provided, try to get from current user
        if not employee_id:
            employee = Employee.query.filter(
                Employee.business_id == business_id,
                Employee.user_id == current_user_id
            ).first()
            if employee:
                employee_id = employee.id
        
        if not employee_id:
            return jsonify({'error': 'Employee not found'}), 404
        
        today = date.today()
        current_time = datetime.now().time()
        
        # Check if already checked in today
        existing = Attendance.query.filter(
            Attendance.employee_id == employee_id,
            Attendance.date == today
        ).first()
        
        if existing and existing.check_in_time:
            return jsonify({'error': 'Already checked in today', 'attendance': existing.to_dict()}), 400
        
        # Determine if late (after 9:00 AM)
        late_threshold = datetime.strptime('09:00:00', '%H:%M:%S').time()
        status = 'late' if current_time > late_threshold else 'present'
        
        if existing:
            existing.check_in_time = current_time
            existing.status = status
            existing.work_location = location or existing.work_location
            existing.notes = notes or existing.notes
            attendance = existing
        else:
            attendance = Attendance(
                business_id=business_id,
                branch_id=branch_id,
                employee_id=employee_id,
                date=today,
                check_in_time=current_time,
                status=status,
                work_location=location,
                notes=notes
            )
            db.session.add(attendance)
        
        db.session.commit()
        
        return jsonify({
            'message': f'Check-in successful at {current_time.strftime("%H:%M")}',
            'status': status,
            'attendance': attendance.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@hr_bp.route('/attendance/check-out', methods=['POST'])
@jwt_required()
@module_required('hr')
def check_out():
    """Quick check-out endpoint for employees"""
    try:
        business_id = get_business_id()
        current_user_id = get_jwt_identity()
        
        data = request.get_json() or {}
        employee_id = data.get('employee_id')
        notes = data.get('notes', '')
        
        # If no employee_id provided, try to get from current user
        if not employee_id:
            employee = Employee.query.filter(
                Employee.business_id == business_id,
                Employee.user_id == current_user_id
            ).first()
            if employee:
                employee_id = employee.id
        
        if not employee_id:
            return jsonify({'error': 'Employee not found'}), 404
        
        today = date.today()
        current_time = datetime.now().time()
        
        # Find today's attendance record
        attendance = Attendance.query.filter(
            Attendance.employee_id == employee_id,
            Attendance.date == today
        ).first()
        
        if not attendance:
            return jsonify({'error': 'No check-in record found for today'}), 404
        
        if attendance.check_out_time:
            return jsonify({'error': 'Already checked out today', 'attendance': attendance.to_dict()}), 400
        
        attendance.check_out_time = current_time
        attendance.notes = notes or attendance.notes
        
        # Calculate hours worked
        if attendance.check_in_time:
            check_in = datetime.combine(today, attendance.check_in_time)
            check_out = datetime.combine(today, current_time)
            hours_worked = (check_out - check_in).total_seconds() / 3600
            attendance.hours_worked = round(hours_worked, 2)
        
        # Check for early departure (before 5:00 PM)
        early_threshold = datetime.strptime('17:00:00', '%H:%M:%S').time()
        if current_time < early_threshold and attendance.status != 'late':
            attendance.status = 'early_departure'
        
        db.session.commit()
        
        return jsonify({
            'message': f'Check-out successful at {current_time.strftime("%H:%M")}',
            'hours_worked': attendance.hours_worked,
            'attendance': attendance.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@hr_bp.route('/attendance', methods=['POST'])
@jwt_required()
@module_required('hr')
@staff_required
def create_attendance():
    """Create a manual attendance record"""
    try:
        business_id = get_business_id()
        branch_id = get_active_branch_id()
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        employee_id = data.get('employee_id')
        date_str = data.get('date')
        check_in = data.get('check_in_time')
        check_out = data.get('check_out_time')
        status = data.get('status', 'present')
        work_location = data.get('work_location', '')
        notes = data.get('notes', '')
        
        if not employee_id:
            return jsonify({'error': 'Employee ID is required'}), 400
        
        if not date_str:
            return jsonify({'error': 'Date is required'}), 400
        
        # Validate date
        try:
            attendance_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Validate employee belongs to business
        employee = Employee.query.filter(
            Employee.id == employee_id,
            Employee.business_id == business_id
        ).first()
        
        if not employee:
            return jsonify({'error': 'Employee not found'}), 404
        
        # Parse times
        check_in_time = None
        check_out_time = None
        
        if check_in:
            try:
                check_in_time = datetime.strptime(check_in, '%H:%M:%S').time()
            except ValueError:
                try:
                    check_in_time = datetime.strptime(check_in, '%H:%M').time()
                except ValueError:
                    return jsonify({'error': 'Invalid check-in time format'}), 400
        
        if check_out:
            try:
                check_out_time = datetime.strptime(check_out, '%H:%M:%S').time()
            except ValueError:
                try:
                    check_out_time = datetime.strptime(check_out, '%H:%M').time()
                except ValueError:
                    return jsonify({'error': 'Invalid check-out time format'}), 400
        
        # Calculate hours worked
        hours_worked = 0.0
        if check_in_time and check_out_time:
            check_in_dt = datetime.combine(attendance_date, check_in_time)
            check_out_dt = datetime.combine(attendance_date, check_out_time)
            hours_worked = (check_out_dt - check_in_dt).total_seconds() / 3600
        
        # Check if record already exists
        existing = Attendance.query.filter(
            Attendance.employee_id == employee_id,
            Attendance.date == attendance_date
        ).first()
        
        if existing:
            # Update existing
            existing.check_in_time = check_in_time or existing.check_in_time
            existing.check_out_time = check_out_time or existing.check_out_time
            existing.status = status
            existing.work_location = work_location or existing.work_location
            existing.notes = notes or existing.notes
            existing.hours_worked = round(hours_worked, 2) if hours_worked > 0 else existing.hours_worked
            attendance = existing
        else:
            # Create new
            attendance = Attendance(
                business_id=business_id,
                branch_id=branch_id,
                employee_id=employee_id,
                date=attendance_date,
                check_in_time=check_in_time,
                check_out_time=check_out_time,
                status=status,
                work_location=work_location,
                notes=notes,
                hours_worked=round(hours_worked, 2)
            )
            db.session.add(attendance)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Attendance record created successfully',
            'attendance': attendance.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@hr_bp.route('/attendance/<int:attendance_id>', methods=['PUT'])
@jwt_required()
@module_required('hr')
@staff_required
def update_attendance(attendance_id):
    """Update an attendance record"""
    try:
        business_id = get_business_id()
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        attendance = Attendance.query.filter(
            Attendance.id == attendance_id,
            Attendance.business_id == business_id
        ).first()
        
        if not attendance:
            return jsonify({'error': 'Attendance record not found'}), 404
        
        # Update fields
        if 'check_in_time' in data and data['check_in_time']:
            try:
                attendance.check_in_time = datetime.strptime(data['check_in_time'], '%H:%M:%S').time()
            except ValueError:
                try:
                    attendance.check_in_time = datetime.strptime(data['check_in_time'], '%H:%M').time()
                except ValueError:
                    pass
        
        if 'check_out_time' in data and data['check_out_time']:
            try:
                attendance.check_out_time = datetime.strptime(data['check_out_time'], '%H:%M:%S').time()
            except ValueError:
                try:
                    attendance.check_out_time = datetime.strptime(data['check_out_time'], '%H:%M').time()
                except ValueError:
                    pass
        
        if 'status' in data:
            attendance.status = data['status']
        
        if 'work_location' in data:
            attendance.work_location = data['work_location']
        
        if 'notes' in data:
            attendance.notes = data['notes']
        
        # Recalculate hours worked if both times exist
        if attendance.check_in_time and attendance.check_out_time:
            check_in_dt = datetime.combine(attendance.date, attendance.check_in_time)
            check_out_dt = datetime.combine(attendance.date, attendance.check_out_time)
            hours_worked = (check_out_dt - check_in_dt).total_seconds() / 3600
            attendance.hours_worked = round(hours_worked, 2)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Attendance record updated successfully',
            'attendance': attendance.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@hr_bp.route('/attendance/<int:attendance_id>', methods=['DELETE'])
@jwt_required()
@module_required('hr')
@manager_required
def delete_attendance(attendance_id):
    """Delete an attendance record"""
    try:
        business_id = get_business_id()
        
        attendance = Attendance.query.filter(
            Attendance.id == attendance_id,
            Attendance.business_id == business_id
        ).first()
        
        if not attendance:
            return jsonify({'error': 'Attendance record not found'}), 404
        
        db.session.delete(attendance)
        db.session.commit()
        
        return jsonify({'message': 'Attendance record deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@hr_bp.route('/attendance/report', methods=['GET'])
@jwt_required()
@module_required('hr')
def get_attendance_report():
    """Get attendance report with date range"""
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        employee_id = request.args.get('employee_id', type=int)
        department = request.args.get('department', '')
        
        if not start_date_str or not end_date_str:
            # Default to last 30 days
            end_date = date.today()
            start_date = end_date - timedelta(days=30)
        else:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Build query
        query = Attendance.query.filter(
            Attendance.business_id == business_id,
            Attendance.date >= start_date,
            Attendance.date <= end_date
        )
        
        if branch_id:
            query = query.filter(Attendance.branch_id == branch_id)
        
        if employee_id:
            query = query.filter(Attendance.employee_id == employee_id)
        
        # Join with employees for filtering
        query = query.join(Employee)
        
        if department:
            query = query.filter(Employee.department == department)
        
        # Get all records
        records = query.order_by(Attendance.date.desc(), Attendance.employee_id).all()
        
        # Calculate statistics
        total_records = len(records)
        present_count = sum(1 for r in records if r.status == 'present')
        late_count = sum(1 for r in records if r.status == 'late')
        absent_count = sum(1 for r in records if r.status == 'absent')
        early_departure_count = sum(1 for r in records if r.status == 'early_departure')
        
        total_hours = sum(float(r.hours_worked or 0) for r in records)
        avg_hours = total_hours / max(1, total_records)
        
        # Group by employee
        employee_stats = {}
        for record in records:
            emp_id = record.employee_id
            if emp_id not in employee_stats:
                emp = record.employee
                employee_stats[emp_id] = {
                    'employee_id': emp_id,
                    'employee_name': f"{emp.user.first_name} {emp.user.last_name}" if emp.user else 'Unknown',
                    'employee_code': emp.employee_id,
                    'department': emp.department,
                    'total_days': 0,
                    'present': 0,
                    'late': 0,
                    'absent': 0,
                    'early_departure': 0,
                    'total_hours': 0
                }
            
            stats = employee_stats[emp_id]
            stats['total_days'] += 1
            if record.status == 'present':
                stats['present'] += 1
            elif record.status == 'late':
                stats['late'] += 1
            elif record.status == 'absent':
                stats['absent'] += 1
            elif record.status == 'early_departure':
                stats['early_departure'] += 1
            stats['total_hours'] += float(record.hours_worked or 0)
        
        # Calculate attendance rate for each employee
        for emp_id in employee_stats:
            stats = employee_stats[emp_id]
            stats['attendance_rate'] = round((stats['present'] + stats['late']) / max(1, stats['total_days']) * 100, 1)
        
        return jsonify({
            'report': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'total_records': total_records,
                'present': present_count,
                'late': late_count,
                'absent': absent_count,
                'early_departure': early_departure_count,
                'total_hours': round(total_hours, 2),
                'average_hours': round(avg_hours, 2)
            },
            'employee_stats': list(employee_stats.values()),
            'records': [r.to_dict() for r in records]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@hr_bp.route('/attendance/bulk', methods=['POST'])
@jwt_required()
@module_required('hr')
@manager_required
def bulk_create_attendance():
    """Bulk create attendance records"""
    try:
        business_id = get_business_id()
        branch_id = get_active_branch_id()
        
        data = request.get_json()
        if not data or 'records' not in data:
            return jsonify({'error': 'No records provided'}), 400
        
        records = data['records']
        if not isinstance(records, list) or len(records) == 0:
            return jsonify({'error': 'Records must be a non-empty array'}), 400
        
        created = []
        errors = []
        
        for idx, record_data in enumerate(records):
            try:
                employee_id = record_data.get('employee_id')
                date_str = record_data.get('date')
                status = record_data.get('status', 'present')
                
                if not employee_id or not date_str:
                    errors.append(f"Row {idx + 1}: Employee ID and date are required")
                    continue
                
                # Validate date
                try:
                    attendance_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                except ValueError:
                    errors.append(f"Row {idx + 1}: Invalid date format")
                    continue
                
                # Check if employee exists
                employee = Employee.query.filter(
                    Employee.id == employee_id,
                    Employee.business_id == business_id
                ).first()
                
                if not employee:
                    errors.append(f"Row {idx + 1}: Employee not found")
                    continue
                
                # Check if already exists
                existing = Attendance.query.filter(
                    Attendance.employee_id == employee_id,
                    Attendance.date == attendance_date
                ).first()
                
                if existing:
                    errors.append(f"Row {idx + 1}: Record already exists for this employee on this date")
                    continue
                
                # Parse times
                check_in_time = None
                check_out_time = None
                
                if record_data.get('check_in_time'):
                    try:
                        check_in_time = datetime.strptime(record_data['check_in_time'], '%H:%M:%S').time()
                    except ValueError:
                        try:
                            check_in_time = datetime.strptime(record_data['check_in_time'], '%H:%M').time()
                        except ValueError:
                            pass
                
                if record_data.get('check_out_time'):
                    try:
                        check_out_time = datetime.strptime(record_data['check_out_time'], '%H:%M:%S').time()
                    except ValueError:
                        try:
                            check_out_time = datetime.strptime(record_data['check_out_time'], '%H:%M').time()
                        except ValueError:
                            pass
                
                # Calculate hours worked
                hours_worked = 0.0
                if check_in_time and check_out_time:
                    check_in_dt = datetime.combine(attendance_date, check_in_time)
                    check_out_dt = datetime.combine(attendance_date, check_out_time)
                    hours_worked = (check_out_dt - check_in_dt).total_seconds() / 3600
                
                attendance = Attendance(
                    business_id=business_id,
                    branch_id=branch_id,
                    employee_id=employee_id,
                    date=attendance_date,
                    check_in_time=check_in_time,
                    check_out_time=check_out_time,
                    status=status,
                    work_location=record_data.get('work_location', ''),
                    notes=record_data.get('notes', ''),
                    hours_worked=round(hours_worked, 2)
                )
                
                db.session.add(attendance)
                created.append(attendance)
                
            except Exception as e:
                errors.append(f"Row {idx + 1}: {str(e)}")
        
        if created:
            db.session.commit()
        
        return jsonify({
            'message': f'Successfully created {len(created)} attendance records',
            'created': len(created),
            'failed': len(errors),
            'errors': errors if errors else None,
            'records': [a.to_dict() for a in created]
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@hr_bp.route('/attendance/<int:attendance_id>', methods=['GET'])
@jwt_required()
@module_required('hr')
def get_attendance_by_id(attendance_id):
    """Get a single attendance record by ID"""
    try:
        business_id = get_business_id()
        
        attendance = Attendance.query.filter(
            Attendance.id == attendance_id,
            Attendance.business_id == business_id
        ).first()
        
        if not attendance:
            return jsonify({'error': 'Attendance record not found'}), 404
        
        return jsonify({'attendance': attendance.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500