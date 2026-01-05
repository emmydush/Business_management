# create_data.py
# Wrapper to run database seeding logic
# Created: 2026-01-05

import sys
import os

# Ensure backend package is importable
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from seed_db import seed_data

if __name__ == '__main__':
    print('Running DB seeder via seed_db.seed_data()')
    seed_data()
