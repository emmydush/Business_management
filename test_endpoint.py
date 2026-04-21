import requests

for port in [10000, 5000]:
    print(f"\n--- Checking Port {port} ---")
    try:
        # Check health
        resp = requests.get(f"http://127.0.0.1:{port}/health")
        print(f"Health check: {resp.status_code} - {resp.text}")
        
        # Check POST
        resp = requests.post(f"http://127.0.0.1:{port}/api/hr/submit-leave", json={"test": "data"})
        print(f"POST submit-leave: {resp.status_code}")
        if resp.status_code == 405:
            print("  (Method Not Allowed - confirming shadowing/missing route)")
    except Exception as e:
        print(f"Error on port {port}: {e}")
