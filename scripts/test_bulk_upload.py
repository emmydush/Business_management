import requests
import sys

BASE = 'http://localhost:5000'
LOGIN = BASE + '/api/auth/login'
UPLOAD = BASE + '/api/inventory/products/bulk-upload'

username = 'superadmin'
password = 'superadmin123'

print('Logging in...')
r = requests.post(LOGIN, json={'username': username, 'password': password})
if r.status_code != 200:
    print('Login failed:', r.status_code, r.text)
    sys.exit(1)

token = r.json().get('access_token')
print('Got token:', bool(token))

headers = {'Authorization': f'Bearer {token}'}
files = {'file': open('frontend/public/product_bulk_sample.csv', 'rb')}
print('Uploading CSV...')
r2 = requests.post(UPLOAD, headers=headers, files=files)
print('Upload status:', r2.status_code)
print('Response:', r2.text)
