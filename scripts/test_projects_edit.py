import requests

BASE = 'http://127.0.0.1:5000/api'

# Login as superadmin
r = requests.post(f'{BASE}/auth/login', json={'username': 'superadmin', 'password': 'admin123'})
print('login status', r.status_code, r.text)
if r.status_code != 200:
    raise SystemExit('Login failed')

token = r.json()['access_token']
headers = {'Authorization': f'Bearer {token}'}

# Get project 1
r = requests.get(f'{BASE}/projects/1', headers=headers)
print('get project', r.status_code, r.text)

# Update project 1
payload = {'title': 'Website Redesign (Updated)', 'progress': 70}
r = requests.put(f'{BASE}/projects/1', json=payload, headers=headers)
print('update', r.status_code, r.text)

# Get project again
r = requests.get(f'{BASE}/projects/1', headers=headers)
print('get project after update', r.status_code, r.text)