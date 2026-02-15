import requests

url = "http://localhost:5000/api/auth/login"
payload = {"username": "emmanuel", "password": "Admin@1234"}

try:
    resp = requests.post(url, json=payload, timeout=10)
    print("Status:", resp.status_code)
    print("Body:", resp.text)
except Exception as e:
    print("Request error:", e)
