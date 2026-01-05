import requests

BASE = 'http://localhost:5000'
LOGIN = BASE + '/api/auth/login'
UPLOAD = BASE + '/api/inventory/products/bulk-upload'

username = 'admin'
password = 'password123'

print('Logging in as admin...')
r = requests.post(LOGIN, json={'username': username, 'password': password})
if r.status_code != 200:
    print('Login failed:', r.status_code, r.text)
    raise SystemExit(1)

token = r.json().get('access_token')
print('Got token:', bool(token))

headers = {'Authorization': f'Bearer {token}'}
import os
csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'public', 'product_bulk_sample.csv'))
files = {'file': open(csv_path, 'rb')}
print('Uploading CSV...')
r2 = requests.post(UPLOAD, headers=headers, files=files)
print('Upload status:', r2.status_code)
print('Response:', r2.json())

resp = r2.json()
assert 'created_count' in resp
assert 'errors' in resp
print('Test passed: bulk upload responded with created_count and errors')
