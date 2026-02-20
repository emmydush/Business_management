#!/usr/bin/env python3
import sys
from app import create_app, db
from app.models.subscription import Plan

FEATURES_TO_ADD = ['Inventory Management', 'Product Management']

def main(dry_run=True):
    app = create_app()
    with app.app_context():
        plans = Plan.query.all()
        if not plans:
            print('No plans found in database.')
            return 1

        changed = 0
        for plan in plans:
            features = plan.features or []
            updated = False
            for f in FEATURES_TO_ADD:
                if f not in features:
                    features.append(f)
                    updated = True
            if updated:
                print(f"Updating plan id={plan.id} name='{plan.name}' - adding features: {FEATURES_TO_ADD}")
                if not dry_run:
                    plan.features = features
                    db.session.add(plan)
                    db.session.commit()
                changed += 1

        print(f"Processed {len(plans)} plans. Plans changed: {changed}.")
        if dry_run:
            print('Dry run complete. Rerun with --apply to persist changes.')
    return 0

if __name__ == '__main__':
    apply_changes = '--apply' in sys.argv
    sys.exit(main(dry_run=not apply_changes))
