import sqlite3
import os

db_path = 'instance/business_management.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute('ALTER TABLE businesses ADD COLUMN slug VARCHAR(100)')
        print("Added slug column")
    except sqlite3.OperationalError:
        print("Slug column already exists")
        
    try:
        cursor.execute('CREATE UNIQUE INDEX idx_businesses_slug ON businesses(slug)')
        print("Created index")
    except sqlite3.OperationalError:
        print("Index already exists")
        
    # Update slugs where NULL
    cursor.execute('SELECT id, name FROM businesses WHERE slug IS NULL')
    businesses = cursor.fetchall()
    for b_id, name in businesses:
        slug = name.lower().replace(' ', '-')
        # check if slug exists, if so append id
        cursor.execute('SELECT id FROM businesses WHERE slug = ?', (slug,))
        if cursor.fetchone():
            slug = f"{slug}-{b_id}"
        cursor.execute('UPDATE businesses SET slug = ? WHERE id = ?', (slug, b_id))
        print(f"Updated business {b_id} with slug {slug}")
        
    conn.commit()
    conn.close()
else:
    print(f"Database not found at {db_path}")
