"""
Script to ensure professional plan users have access to everything
"""

from app import create_app, db
from app.models.subscription import Plan, PlanType
from app.utils.subscription_validator import SubscriptionValidator

def ensure_professional_plan_universal_access():
    """
    Ensure that professional plan users have access to all features and unlimited resources
    """
    app = create_app()
    
    with app.app_context():
        print("=== Ensuring Professional Plan Universal Access ===\n")
        
        # Get all professional plans
        professional_plans = Plan.query.filter_by(plan_type=PlanType.PROFESSIONAL).all()
        
        if not professional_plans:
            print("❌ No professional plans found in the database")
            return
        
        print(f"Found {len(professional_plans)} professional plan(s)")
        
        for plan in professional_plans:
            print(f"  - Plan: {plan.name} (ID: {plan.id})")
            print(f"  - Current features: {plan.features}")
            print(f"  - Current max branches: {plan.max_branches}")
            
            # Ensure professional plans have all possible features
            all_possible_features = [
                'Multi-branch', 'HR & Payroll', 'Inventory Management', 
                'Advanced Reporting', 'Asset Management', 'Custom Integrations',
                'API Access', 'Dedicated Support', 'Advanced Analytics'
            ]
            
            current_features = plan.features or []
            features_updated = False
            
            for feature in all_possible_features:
                if feature not in current_features:
                    current_features.append(feature)
                    features_updated = True
                    print(f"    ✅ Added feature: {feature}")
            
            # Set high limits for professional plans
            if plan.max_users < 999999:
                plan.max_users = 999999
                features_updated = True
                print(f"    ✅ Updated max_users to unlimited")
                
            if plan.max_products < 999999:
                plan.max_products = 999999
                features_updated = True
                print(f"    ✅ Updated max_products to unlimited")
                
            if plan.max_orders < 999999:
                plan.max_orders = 999999
                features_updated = True
                print(f"    ✅ Updated max_orders to unlimited")
                
            if plan.max_branches < 999999:
                plan.max_branches = 999999
                features_updated = True
                print(f"    ✅ Updated max_branches to unlimited")
            
            if features_updated:
                db.session.commit()
                print(f"    💾 Updated plan: {plan.name}")
            else:
                print(f"    ✅ Plan already has all required features and limits")
        
        print("\n✅ Professional plan universal access ensured!")
        print("Now professional plan users will have access to all features and unlimited resources.")

if __name__ == "__main__":
    ensure_professional_plan_universal_access()