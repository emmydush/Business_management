# Multi-Branch/Location Management System

## Overview
This implementation allows businesses with multiple branches/locations to manage and switch between them seamlessly.

## Architecture

### Database Schema
```
Business (1) ─────< (Many) Branch
   │                    │
   │                    │
   └──< (Many) User ───< UserBranchAccess >──┘
```

### Key Components:
1. **Branch Model** - Represents physical locations
2. **UserBranchAccess** - Maps which users can access which branches
3. **Branch API** - Backend routes for branch management
4. **BranchSwitcher** - Frontend UI component

---

## Setup Instructions

### 1. Database Migration

Add the Branch model to your models __init__.py:

```python
# backend/app/models/__init__.py
from .branch import Branch, UserBranchAccess
```

Register the blueprint in your Flask app:

```python
# backend/app/__init__.py or routes/__init__.py
from app.routes.branches import branches_bp

app.register_blueprint(branches_bp)
```

Run migration:
```bash
flask db migrate -m "Add branch and user_branch_access tables"
flask db upgrade
```

### 2. Frontend Integration

Add BranchSwitcher to your Navbar component:

```javascript
// frontend/src/components/Navbar.js
import BranchSwitcher from './BranchSwitcher';

// Inside your Navbar, add before notifications/profile:
<BranchSwitcher />
```

---

## API Endpoints

### Branch Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/branches/` | Get all branches | ✅ |
| GET | `/api/branches/accessible` | Get user's accessible branches | ✅ |
| POST | `/api/branches/` | Create new branch | ✅ Admin |
| PUT | `/api/branches/<id>` | Update branch | ✅ Admin |
| POST | `/api/branches/switch/<id>` | Switch active branch | ✅ |
| POST | `/api/branches/user-access` | Grant branch access | ✅ Admin |
| DELETE | `/api/branches/user-access/<id>` | Revoke branch access | ✅ Admin |

### Request/Response Examples

#### Create Branch
```json
POST /api/branches/
{
  "name": "Downtown Branch",
  "code": "BR002",
  "address": "123 Main St",
  "city": "Kigali",
  "phone": "+250788123456",
  "email": "downtown@business.com",
  "manager_id": 5,
  "is_headquarters": false
}
```

#### Switch Branch
```json
POST /api/branches/switch/2
// No body required

Response:
{
  "message": "Switched to branch: Downtown Branch",
  "branch": { ... },
  "success": true
}
```

#### Grant Access
```json
POST /api/branches/user-access
{
  "user_id": 10,
  "branch_id": 2,
  "is_default": false
}
```

---

## Usage Scenarios

### Scenario 1: Initial Setup
When first implementing:
1. Admin creates branches for the business
2. Admin assigns users to branches via UserBranchAccess
3. Users can now switch between their accessible branches

### Scenario 2: User Switching Branches
1. User clicks  branch switcher in navbar
2. Selects desired branch from dropdown
3. System sets that branch as default
4. Page reloads with new branch context
5. All subsequent operations use new branch

### Scenario 3: Branch-Specific Data
Modify your existing models to include branch_id:

```python
# Example: Product model with branch support
class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'))
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id')) # NEW
    # ... other fields
```

Then filter queries by current branch:
```python
# In your routes
current_branch_id = get_current_user_branch()  # Helper function
products = Product.query.filter_by(
    business_id=user.business_id,
    branch_id=current_branch_id
).all()
```

---

## Helper Functions

### Backend - Get Current User's Active Branch

```python
# backend/app/utils/branch_helper.py
from flask_jwt_extended import get_jwt_identity
from app.models.user import User
from app.models.branch import UserBranchAccess

def get_current_user_branch():
    """Get the current user's active/default branch ID"""
    current_user_id = get_jwt_identity()
    
    # Get user's default branch
    access = UserBranchAccess.query.filter_by(
        user_id=current_user_id,
        is_default=True
    ).first()
    
    return access.branch_id if access else None

def get_user_accessible_branch_ids(user_id):
    """Get all branch IDs a user has access to"""
    user = User.query.get(user_id)
    
    # Admins can access all branches in their business
    if user.role.value in ['admin', 'superadmin']:
        from app.models.branch import Branch
        branches = Branch.query.filter_by(business_id=user.business_id).all()
        return [b.id for b in branches]
    
    # Regular users only get their assigned branches
    access_records = UserBranchAccess.query.filter_by(user_id=user_id).all()
    return [access.branch_id for access in access_records]
```

### Frontend - Get Current Branch from Context

```javascript
// frontend/src/contexts/BranchContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const BranchContext = createContext();

export const BranchProvider = ({ children }) => {
    const [currentBranch, setCurrentBranch] = useState(null);
    const [branches, setBranches] = useState([]);

    useEffect(() => {
        fetchCurrentBranch();
    }, []);

    const fetchCurrentBranch = async () => {
        const token = sessionStorage.getItem('token');
        const response = await axios.get('/api/branches/accessible', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const defaultBranch = response.data.branches.find(b => b.is_default);
        setCurrentBranch(defaultBranch || response.data.branches[0]);
        setBranches(response.data.branches);
    };

    return (
        <BranchContext.Provider value={{ currentBranch, branches, setCurrentBranch, fetchCurrentBranch }}>
            {children}
        </BranchContext.Provider>
    );
};

export const useBranch = () => useContext(BranchContext);
```

---

## UI Features

### Branch Switcher Component
- **Dropdown in Navbar** - Easy access from anywhere
- **Visual Indicators** - Shows current branch, HQ badge
- **Quick Switching** - One-click branch change
- **Responsive** - Works on mobile and desktop
- **Auto-refresh** - Reloads data after switch

### Admin Features (Future Enhancement)
You can build an admin panel for:
- 📊 Branch performance dashboard
- 👥 User-branch assignment management
- 📍 Branch creation/editing
- 📈 Cross-branch reporting

---

## Best Practices

1. **Default Branch**: Always assign users a default branch
2. **Permissions**: Use branch-level permissions for sensitive operations
3. **Data Isolation**: Filter all queries by branch_id when relevant
4. **Performance**: Index branch_id columns for faster queries
5. **Audit Trail**: Log branch switches in audit logs

---

## Migration Path for Existing Data

If you have existing data without branches:

```python
# Create a migration script
def migrate_to_branches():
    # 1. Create a default "Main Office" branch for each business
    businesses = Business.query.all()
    for business in businesses:
        main_branch = Branch(
            business_id=business.id,
            name="Main Office",
            code="HQ",
            is_headquarters=True,
            is_active=True
        )
        db.session.add(main_branch)
        db.session.flush()  # Get the ID
        
        # 2. Assign all users to this default branch
        users = User.query.filter_by(business_id=business.id).all()
        for user in users:
            access = UserBranchAccess(
                user_id=user.id,
                branch_id=main_branch.id,
                is_default=True
            )
            db.session.add(access)
    
    db.session.commit()
```

---

## Testing

### Manual Testing Checklist
- [ ] Create multiple branches
- [ ] Assign users to branches
- [ ] Switch between branches
- [ ] Verify data isolation
- [ ] Test admin vs regular user access
- [ ] Test mobile responsiveness

### Example Test Data
```sql
-- Create test branches
INSERT INTO branches (business_id, name, code, is_headquarters, is_active) 
VALUES 
  (1, 'Main Office', 'HQ', true, true),
  (1, 'Downtown', 'DT', false, true),
  (1, 'Suburb Branch', 'SB', false, true);

-- Grant access
INSERT INTO user_branch_access (user_id, branch_id, is_default)
VALUES
  (5, 1, true),   -- User 5 default is Main
  (5, 2, false),  -- User 5 can access Downtown
  (6, 2, true);   -- User 6 default is Downtown
```

---

## Troubleshooting

**Issue**: User can't see any branches
- **Solution**: Check UserBranchAccess table, ensure user has at least one access record

**Issue**: Branch switch not persisting
- **Solution**: Verify is_default flag is being set correctly

**Issue**: Data from multiple branches showing
- **Solution**: Add branch_id filter to all relevant queries

---

## Future Enhancements

1. **Branch-Level Inventory** - Track stock per location
2. **Inter-Branch Transfers** - Move inventory between branches
3. **Branch Analytics** - Performance metrics per location
4. **Branch-Specific Settings** - Different configurations per branch
5. **Geo-Location** - Map view of branches
6. **Branch Calendar** - Location-specific events

---

## Support

For questions or issues with implementation, refer to:
- Backend API documentation
- Frontend component documentation
- Database schema diagrams
