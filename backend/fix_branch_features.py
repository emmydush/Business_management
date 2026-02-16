"""
Script to ensure Professional plans have proper multi-branch features
"""
from app import create_app, db
from app.models.subscription import Plan, PlanType

def fix_professional_plan_features():
    app = create_app()
    
    with app.app_context():
        # Find professional plans
        professional_plans = Plan.query.filter_by(plan_type=PlanType.PROFESSIONAL).all()
        
        if not professional_plans:
            print("❌ No professional plans found")
            return
            
        for plan in professional_plans:
            print(f"Checking plan: {plan.name}")
            
            # Ensure it has Multi-branch feature
            required_features = [
                'Multi-branch',
                'HR & Payroll',
                'Inventory Management',
                'Advanced Reporting'
            ]
            
            current_features = plan.features or []
            features_added = []
            
            for feature in required_features:
                if feature not in current_features:
                    current_features.append(feature)
                    features_added.append(feature)
                    print(f"  ✅ Added feature: {feature}")
            
            if features_added:
                plan.features = current_features
                plan.max_branches = 5  # Ensure branch limit is set
                db.session.commit()
                print(f"  💾 Updated plan with new features")
            else:
                print(f"  ✅ All required features already present")
            
            print(f"  Current features: {plan.features}")
            print(f"  Branch limit: {plan.max_branches}")

if __name__ == '__main__':
    fix_professional_plan_features()