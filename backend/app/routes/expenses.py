from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.expense import Expense, ExpenseCategory, ExpenseStatus
from app.utils.decorators import staff_required, manager_required
from app.utils.middleware import module_required, get_business_id, get_active_branch_id
from datetime import datetime

expenses_bp = Blueprint('expenses', __name__)

@expenses_bp.route('/categories', methods=['GET'])
@jwt_required()
@module_required('expenses')
def get_expense_categories():
    try:
        categories = [
            {'id': ExpenseCategory.OFFICE_SUPPLIES.value, 'name': 'Office Supplies'},
            {'id': ExpenseCategory.TRAVEL.value, 'name': 'Travel'},
            {'id': ExpenseCategory.MEALS.value, 'name': 'Meals'},
            {'id': ExpenseCategory.EQUIPMENT.value, 'name': 'Equipment'},
            {'id': ExpenseCategory.RENT.value, 'name': 'Rent'},
            {'id': ExpenseCategory.UTILITIES.value, 'name': 'Utilities'},
            {'id': ExpenseCategory.MARKETING.value, 'name': 'Marketing'},
            {'id': ExpenseCategory.OTHER.value, 'name': 'Other'}
        ]
        
        return jsonify({'categories': categories}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@expenses_bp.route('/expenses', methods=['GET'])
@jwt_required()
@module_required('expenses')
def get_expenses():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        category = request.args.get('category', '')
        status = request.args.get('status', '')
        date_from = request.args.get('date_from', '')
        date_to = request.args.get('date_to', '')
        
        query = Expense.query.filter_by(business_id=business_id)
        if branch_id:
            query = query.filter_by(branch_id=branch_id)
        
        if search:
            query = query.filter(
                db.or_(
                    Expense.expense_id.contains(search.upper()),
                    Expense.description.contains(search)
                )
            )
        
        if category:
            try:
                query = query.filter(Expense.category == ExpenseCategory[category.upper()])
            except KeyError:
                pass
        
        if status:
            try:
                query = query.filter(Expense.status == ExpenseStatus[status.upper()])
            except KeyError:
                pass
        
        if date_from:
            query = query.filter(Expense.expense_date >= date_from)
        
        if date_to:
            query = query.filter(Expense.expense_date <= date_to)
        
        expenses = query.order_by(Expense.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'expenses': [expense.to_dict() for expense in expenses.items],
            'total': expenses.total,
            'pages': expenses.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@expenses_bp.route('/expenses', methods=['POST'])
@jwt_required()
@module_required('expenses')
def create_expense():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['description', 'amount', 'category', 'expense_date']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Get current user
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Generate expense ID (e.g., EXP0001)
        last_expense = Expense.query.filter_by(business_id=business_id).order_by(Expense.id.desc()).first()
        if last_expense:
            try:
                last_id = int(last_expense.expense_id[3:])  # Remove 'EXP' prefix
                expense_id = f'EXP{last_id + 1:04d}'
            except:
                expense_id = f'EXP{datetime.now().strftime("%Y%m%d%H%M%S")}'
        else:
            expense_id = 'EXP0001'
        
        expense = Expense(
            business_id=business_id,
            branch_id=branch_id,
            expense_id=expense_id,
            description=data['description'],
            amount=data['amount'],
            category=ExpenseCategory[data['category'].upper()],
            expense_date=data['expense_date'],
            notes=data.get('notes', ''),
            created_by=current_user_id
        )
        
        # Set status based on user role
        if user.role.value in ['admin', 'manager']:
            expense.status = ExpenseStatus.APPROVED
            expense.approved_by = current_user_id
            expense.approved_date = datetime.utcnow().date()
        else:
            expense.status = ExpenseStatus.PENDING_APPROVAL
        
        db.session.add(expense)
        db.session.commit()
        
        return jsonify({
            'message': 'Expense created successfully',
            'expense': expense.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@expenses_bp.route('/expenses/<int:expense_id>', methods=['GET'])
@jwt_required()
@module_required('expenses')
def get_expense(expense_id):
    try:
        business_id = get_business_id()
        expense = Expense.query.filter_by(id=expense_id, business_id=business_id).first()
        
        if not expense:
            return jsonify({'error': 'Expense not found'}), 404
        
        return jsonify({'expense': expense.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@expenses_bp.route('/expenses/<int:expense_id>', methods=['PUT'])
@jwt_required()
@module_required('expenses')
def update_expense(expense_id):
    try:
        business_id = get_business_id()
        expense = Expense.query.filter_by(id=expense_id, business_id=business_id).first()
        
        if not expense:
            return jsonify({'error': 'Expense not found'}), 404
        
        data = request.get_json()
        
        # Only allow updates to certain fields based on status
        if expense.status not in [ExpenseStatus.DRAFT, ExpenseStatus.PENDING_APPROVAL]:
            return jsonify({'error': 'Cannot update expense that is already approved or paid'}), 400
        
        # Update allowed fields
        if 'description' in data:
            expense.description = data['description']
        if 'amount' in data:
            expense.amount = data['amount']
        if 'category' in data:
            expense.category = ExpenseCategory[data['category'].upper()]
        if 'expense_date' in data:
            expense.expense_date = data['expense_date']
        if 'notes' in data:
            expense.notes = data['notes']
        if 'branch_id' in data:
            expense.branch_id = data['branch_id']
        
        expense.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Expense updated successfully',
            'expense': expense.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@expenses_bp.route('/expenses/<int:expense_id>', methods=['DELETE'])
@jwt_required()
@module_required('expenses')
def delete_expense(expense_id):
    try:
        business_id = get_business_id()
        expense = Expense.query.filter_by(id=expense_id, business_id=business_id).first()
        
        if not expense:
            return jsonify({'error': 'Expense not found'}), 404
        
        # Only allow deletion for draft or pending approval expenses
        if expense.status not in [ExpenseStatus.DRAFT, ExpenseStatus.PENDING_APPROVAL]:
            return jsonify({'error': 'Cannot delete expense that is already approved or paid'}), 400
        
        db.session.delete(expense)
        db.session.commit()
        
        return jsonify({
            'message': 'Expense deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@expenses_bp.route('/expenses/approve/<int:expense_id>', methods=['PUT'])
@jwt_required()
@module_required('expenses')
def approve_expense(expense_id):
    try:
        business_id = get_business_id()
        expense = Expense.query.filter_by(id=expense_id, business_id=business_id).first()
        
        if not expense:
            return jsonify({'error': 'Expense not found'}), 404
        
        if expense.status != ExpenseStatus.PENDING_APPROVAL:
            return jsonify({'error': 'Expense is not pending approval'}), 400
        
        # Get current user (approver)
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user or user.role.value not in ['admin', 'manager']:
            return jsonify({'error': 'Insufficient permissions to approve expense'}), 403
        
        expense.status = ExpenseStatus.APPROVED
        expense.approved_by = current_user_id
        expense.approved_date = datetime.utcnow().date()
        expense.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Expense approved successfully',
            'expense': expense.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@expenses_bp.route('/expenses/reject/<int:expense_id>', methods=['PUT'])
@jwt_required()
@module_required('expenses')
def reject_expense(expense_id):
    try:
        business_id = get_business_id()
        expense = Expense.query.filter_by(id=expense_id, business_id=business_id).first()
        
        if not expense:
            return jsonify({'error': 'Expense not found'}), 404
        
        if expense.status != ExpenseStatus.PENDING_APPROVAL:
            return jsonify({'error': 'Expense is not pending approval'}), 400
        
        # Get current user (approver)
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user or user.role.value not in ['admin', 'manager']:
            return jsonify({'error': 'Insufficient permissions to reject expense'}), 403
        
        expense.status = ExpenseStatus.REJECTED
        expense.approved_by = current_user_id
        expense.approved_date = datetime.utcnow().date()
        expense.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Expense rejected successfully',
            'expense': expense.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@expenses_bp.route('/summary', methods=['GET'])
@jwt_required()
@module_required('expenses')
def get_expense_summary():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        
        # Calculate expense summary
        total_query = db.session.query(db.func.sum(Expense.amount)).filter(
            Expense.business_id == business_id,
            Expense.is_active == True
        )
        if branch_id:
            total_query = total_query.filter(Expense.branch_id == branch_id)
        total_expenses = total_query.scalar() or 0.0
        
        # Get monthly expenses for the current month
        from datetime import date
        current_month = date.today().replace(day=1)
        monthly_query = db.session.query(db.func.sum(Expense.amount)).filter(
            Expense.business_id == business_id,
            Expense.is_active == True,
            Expense.expense_date >= current_month
        )
        if branch_id:
            monthly_query = monthly_query.filter(Expense.branch_id == branch_id)
        monthly_expenses = monthly_query.scalar() or 0.0
        
        # Get breakdown by category
        from sqlalchemy import func
        breakdown_query = db.session.query(
            Expense.category,
            func.sum(Expense.amount).label('total')
        ).filter(
            Expense.business_id == business_id,
            Expense.is_active == True
        )
        if branch_id:
            breakdown_query = breakdown_query.filter(Expense.branch_id == branch_id)
        category_breakdown = breakdown_query.group_by(Expense.category).all()
        
        breakdown_list = []
        for category, total in category_breakdown:
            breakdown_list.append({
                'category': category.value,
                'amount': float(total)
            })
        
        summary = {
            'total_expenses': float(total_expenses),
            'monthly_expenses': float(monthly_expenses),
            'category_breakdown': breakdown_list
        }
        
        return jsonify({'summary': summary}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500