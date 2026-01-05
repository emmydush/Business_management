import psycopg2

try:
    conn = psycopg2.connect("postgresql://postgres:Jesuslove@12@127.0.0.1/all_inone")
    cur = conn.cursor()
    cur.execute("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'userrole'")
    roles = [row[0] for row in cur.fetchall()]
    print(f"Database Enum Roles: {roles}")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
