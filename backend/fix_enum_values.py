import psycopg2
import urllib.parse

password = urllib.parse.quote_plus("Jesuslove@12")
conn_str = f"postgresql://postgres:{password}@127.0.0.1/all_inone"

try:
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    
    # Try to add all variations
    for val in ['superadmin', 'SUPERADMIN', 'admin', 'ADMIN', 'manager', 'MANAGER', 'staff', 'STAFF']:
        try:
            cur.execute(f"ALTER TYPE userrole ADD VALUE '{val}'")
            conn.commit()
            print(f"Added {val} to userrole")
        except Exception as e:
            conn.rollback()
            
    cur.close()
    conn.close()
    print("Done.")
except Exception as e:
    print(f"Error: {e}")
