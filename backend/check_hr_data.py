from app import create_app, db
from app.models.employee import Employee
from app.models.user import User

app = create_app()
with app.app_context():
    employees = Employee.query.all()
    print(f"Total Employees: {len(employees)}")
    for emp in employees:
        print(f"ID: {emp.id}, Employee ID: {emp.employee_id}, User: {emp.user.first_name if emp.user else 'None'}")
    
    users = User.query.all()
    print(f"Total Users: {len(users)}")
    for user in users:
        print(f"ID: {user.id}, Username: {user.username}, Role: {user.role.value}")
