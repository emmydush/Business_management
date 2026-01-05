"""Check for username/email duplicates per business before applying migration."""
from app import create_app, db

app = create_app()

with app.app_context():
    conn = db.engine.connect()

    print('Checking username duplicates by business...')
    res = conn.execute("SELECT username, business_id, count(*) FROM users GROUP BY username, business_id HAVING count(*) > 1;")
    rows = res.fetchall()
    if rows:
        print('Found duplicate usernames:')
        for r in rows:
            print(r)
    else:
        print('No username duplicates found')

    print('\nChecking email duplicates by business...')
    res = conn.execute("SELECT email, business_id, count(*) FROM users GROUP BY email, business_id HAVING count(*) > 1;")
    rows = res.fetchall()
    if rows:
        print('Found duplicate emails:')
        for r in rows:
            print(r)
    else:
        print('No email duplicates found')

    conn.close()