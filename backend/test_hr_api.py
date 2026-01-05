import requests

def test_hr_api():
    base_url = "http://localhost:5000/api"
    
    # Login as admin
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    response = requests.post(f"{base_url}/auth/login", json=login_data)
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return
    
    token = response.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test get employees
    response = requests.get(f"{base_url}/hr/employees", headers=headers)
    print(f"Get Employees: {response.status_code}")
    if response.status_code == 200:
        employees = response.json().get("employees", [])
        print(f"Found {len(employees)} employees")
        for emp in employees:
            print(f" - {emp.get('employee_id')}: {emp.get('user', {}).get('first_name')} {emp.get('user', {}).get('last_name')}")
    else:
        print(f"Error: {response.text}")

    # Test get payroll
    response = requests.get(f"{base_url}/hr/payroll", headers=headers)
    print(f"Get Payroll: {response.status_code}")
    if response.status_code == 200:
        payroll = response.json().get("payroll", {})
        print(f"Total Salary: {payroll.get('total_salary')}")
    else:
        print(f"Error: {response.text}")

    # Test get attendance
    response = requests.get(f"{base_url}/hr/attendance", headers=headers)
    print(f"Get Attendance: {response.status_code}")
    if response.status_code == 200:
        attendance = response.json().get("attendance", {})
        print(f"Present Today: {attendance.get('present_today')}")
    else:
        print(f"Error: {response.text}")

if __name__ == "__main__":
    test_hr_api()
