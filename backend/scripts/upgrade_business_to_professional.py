import os
import sys
from datetime import datetime, timedelta

# Ensure backend is importable
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from dotenv import load_dotenv
load_dotenv(os.path.join(BASE_DIR, '.env'))

from app import create_app, db
from app.models.subscription import Plan, PlanType, Subscription, SubscriptionStatus
from app.models.user import User

BUSINESS_ID = 10


def main():
    app = create_app()
    with app.app_context():
        # Find professional plan - use correct enum syntax
        prof_plan = Plan.query.filter(Plan.plan_type == PlanType.PROFESSIONAL).first()
        
        # Fallback: search by name
        if not prof_plan:
            prof_plan = Plan.query.filter(Plan.name.ilike('%professional%')).first()

        if not prof_plan:
            print('Professional plan not found. Here are available plans:')
            for p in Plan.query.all():
                print(f'  id={p.id} name={p.name} type={p.plan_type}')
            return

        print(f'Found Professional plan: id={prof_plan.id} name={prof_plan.name} type={prof_plan.plan_type}')

        # Find subscription(s) for business
        subs = Subscription.query.filter_by(business_id=BUSINESS_ID).all()
        if not subs:
            print(f'No subscription found for business {BUSINESS_ID}. Creating a new active subscription...')
            start = datetime.utcnow()
            end = start + timedelta(days=365)
            new_sub = Subscription(
                business_id=BUSINESS_ID,
                plan_id=prof_plan.id,
                status=SubscriptionStatus.ACTIVE,
                start_date=start,
                end_date=end,
                is_active=True
            )
            db.session.add(new_sub)
            db.session.commit()
            print(f'Created subscription id={new_sub.id} plan_id={prof_plan.id} start={start} end={end}')
            return

        # Show all subscriptions for this business
        print(f'Found {len(subs)} subscription(s) for business {BUSINESS_ID}:')
        for s in subs:
            print(f'  id={s.id} plan_id={s.plan_id} status={s.status} is_active={s.is_active} start={s.start_date} end={s.end_date}')

        # Update existing subscriptions: pick the first active or the first one
        sub = None
        for s in subs:
            if s.is_active:
                sub = s
                break
        if not sub:
            sub = subs[0]

        old_plan = sub.plan.to_dict() if sub.plan else None
        print(f'\nCurrent subscription details:')
        print(f'  id={sub.id}')
        print(f'  plan_id={sub.plan_id}')
        print(f'  status={sub.status}')
        print(f'  is_active={sub.is_active}')
        print(f'  start_date={sub.start_date}')
        print(f'  end_date={sub.end_date}')
        if old_plan:
            print(f'  old_plan_name={old_plan.get("name")}')
            print(f'  old_plan_type={old_plan.get("plan_type")}')
        
        print(f'\nWill update to Professional plan:')
        print(f'  plan_id -> {prof_plan.id} ({prof_plan.name})')
        print(f'  plan_type -> {prof_plan.plan_type.value}')

        # Execute update
        start = datetime.utcnow()
        end = start + timedelta(days=365)
        sub.plan_id = prof_plan.id
        sub.status = SubscriptionStatus.ACTIVE
        sub.start_date = start
        sub.end_date = end
        sub.is_active = True
        sub.updated_at = datetime.utcnow()
        db.session.add(sub)
        db.session.commit()

        print(f'\nSubscription updated successfully!')
        print(f'New status: ACTIVE')
        print(f'New plan: {prof_plan.name} ({prof_plan.plan_type.value})')
        print(f'Valid from {start} to {end}')

if __name__ == '__main__':
    main()
