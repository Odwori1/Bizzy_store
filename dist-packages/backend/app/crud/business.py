from sqlalchemy.orm import Session
from app.models.business import Business
from app.schemas.business_schema import BusinessCreate
from app.schemas.user_schema import UserCreate
from app.core.auth import get_password_hash
from app.models.permission import Role  # Import Role model

def create_business_with_owner(db: Session, business_data: BusinessCreate, owner_data: UserCreate):
    """
    Create a new business and its owner user in a single transaction.
    This is for NEW business registration (first-time users).
    """
    from app.models.user import User  # Import here to avoid circular imports

    # Check if business name already exists
    existing_business = db.query(Business).filter(Business.name == business_data.name).first()
    if existing_business:
        raise ValueError("Business name already registered")

    # Check if owner email already exists
    existing_user = db.query(User).filter(User.email == owner_data.email).first()
    if existing_user:
        raise ValueError("Email already registered")

    # Check if owner username already exists
    existing_username = db.query(User).filter(User.username == owner_data.username).first()
    if existing_username:
        raise ValueError("Username already taken")

    try:
        # Create the Business
        db_business = Business(**business_data.dict())
        db.add(db_business)
        db.flush()  # Get business ID without committing

        # Create the Owner User with the business_id
        hashed_password = get_password_hash(owner_data.password)
        db_owner = User(
            email=owner_data.email,
            username=owner_data.username,
            hashed_password=hashed_password,
            is_active=True,
            business_id=db_business.id  # Link user to the new business
        )
        db.add(db_owner)
        db.flush()

        # ============ ROLE ASSIGNMENT ============
        # CRITICAL: Assign Owner role to the new user
        owner_role = db.query(Role).filter(Role.name == "Owner").first()
        if owner_role:
            # Method 1: Use the relationship directly
            try:
                db_owner.roles.append(owner_role)
                db.flush()
                print(f"DEBUG: Successfully assigned Owner role to user {db_owner.id}")
            except Exception as e:
                print(f"DEBUG: Error using relationship append: {e}")
                # Method 2: Use direct SQL insert as fallback
                try:
                    from app.models.permission import user_role
                    stmt = user_role.insert().values(user_id=db_owner.id, role_id=owner_role.id)
                    db.execute(stmt)
                    db.flush()
                    print(f"DEBUG: Used direct SQL insert for role assignment")
                except Exception as sql_error:
                    print(f"DEBUG: SQL insert also failed: {sql_error}")
                    # Don't re-raise here, just log the error
        else:
            print("ERROR: Owner role not found in database!")

        # Debug: Verify the role was assigned
        if owner_role:
            try:
                from app.models.permission import user_role
                assigned_roles = db.execute(
                    db.select(user_role).where(user_role.c.user_id == db_owner.id)
                ).fetchall()
                print(f"DEBUG: Roles in association table for user {db_owner.id}: {assigned_roles}")
            except Exception as debug_error:
                print(f"DEBUG: Error checking role assignment: {debug_error}")
        # ============ END ROLE ASSIGNMENT ============

        # Commit the transaction
        db.commit()

        # Refresh to get complete data
        db.refresh(db_business)
        db.refresh(db_owner)

        return {
            "business": db_business,
            "owner": db_owner
        }

    except Exception as e:
        db.rollback()
        raise e

def create_business(db: Session, business: BusinessCreate, user_id: int):
    db_business = Business(**business.dict(), user_id=user_id)
    db.add(db_business)
    db.commit()
    db.refresh(db_business)
    return db_business

def get_business_by_user_id(db: Session, user_id: int):
    # NEW LOGIC: Get the user first, then return their business
    from app.models.user import User  # Import here to avoid circular imports
    user = db.query(User).filter(User.id == user_id).first()
    if user and user.business_id:
        return db.query(Business).filter(Business.id == user.business_id).first()
    return None  # Return None if user has no business

def update_business(db: Session, business_id: int, business_data: BusinessCreate):
    db_business = db.query(Business).filter(Business.id == business_id).first()
    if db_business:
        for key, value in business_data.dict().items():
            setattr(db_business, key, value)
        db.commit()
        db.refresh(db_business)
    return db_business

# NEW: Add business management functions
def disable_business(db: Session, business_id: int):
    """Disable a business by setting its status to inactive"""
    db_business = db.query(Business).filter(Business.id == business_id).first()
    if db_business:
        # You might want to add an 'is_active' field to the Business model first
        # For now, let's assume we have such a field
        if hasattr(db_business, 'is_active'):
            db_business.is_active = False
            db.commit()
            db.refresh(db_business)
        return db_business
    return None

def delete_business(db: Session, business_id: int):
    """Delete a business and all its associated data"""
    db_business = db.query(Business).filter(Business.id == business_id).first()
    if not db_business:
        return False
    
    # Note: This should be handled with proper cascade deletes or manual cleanup
    # of related records (users, sales, products, etc.)
    db.delete(db_business)
    db.commit()
    return True
