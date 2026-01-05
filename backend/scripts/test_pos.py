import requests

s = requests.Session()
login = s.post('http://localhost:5000/api/auth/login', json={'username':'superadmin','password':'admin123'})
print('login status', login.status_code, login.text)
if login.status_code==200:
    token = login.json().get('access_token')
    headers = {'Authorization': f'Bearer {token}'}
    order = {'customer_id':1,'items':[{'product_id':1,'quantity':1,'unit_price':10}],'subtotal':10,'tax_rate':0,'total_amount':10}
    r = s.post('http://localhost:5000/api/sales/pos', json=order, headers=headers)
    print('pos status', r.status_code, r.text)
else:
    print('Login failed; cannot test POS')