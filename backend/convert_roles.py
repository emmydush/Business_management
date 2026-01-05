import psycopg2
import urllib.parse

password = urllib.parse.quote_plus("Jesuslove@12")
conn_str = f"postgresql://postgres:{password}@127.0.0.1/all_inone"

try:
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    
    # Update all users to use lowercase roles
    cur.execute("UPDATE users SET role = LOWER(role::text)::userrole")
    conn.commit()
    print("All user roles converted to lowercase.")
            
    cur.close()
    conn.close()
    print("Done.")
except Exception as e:
    print(f"Error: {e}")
