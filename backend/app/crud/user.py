from sqlalchemy.orm import Session, joinedload
from app.models.user import User
from typing import List
from app.schemas.user_schema import UserCreate
from passlib.context import CryptContext
from app.models.inventory import InventoryHistory
from app.models.sale import Sale
from app.models.business import Business
from app.models import Permission, Role

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def create_user(db: Session, user: UserCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        is_active=True,
        #role=user.role if hasattr(user, 'role') else "cashier"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_all_users(db: Session, skip: int = 0, limit: int = 100):
    """Get all users from the database, eager loading their roles."""
    # Eager load the roles relationship to access the role_name property
    return db.query(User).options(joinedload(User.roles)).offset(skip).limit(limit).all()

def update_user(db: Session, user_id: int, user_update):
    """
    Update a user's information.
    Now accepts either a UserCreate object or a dictionary.
    """
    print(f"DEBUG update_user: Starting update for user_id={user_id}")
    print(f"DEBUG update_user: Received update data: {user_update}")
    
    db_user = get_user(db, user_id)
    if not db_user:
        print(f"DEBUG update_user: User with ID {user_id} not found!")
        return None

    # Convert Pydantic model to dict, or use the dict if that's what was passed in
    if hasattr(user_update, 'model_dump'):
        update_data = user_update.model_dump(exclude_unset=True)
    else:
        update_data = user_update

    print(f"DEBUG update_user: Processed update data: {update_data}")

    # If password is being updated, hash it
    if 'password' in update_data:
        update_data['hashed_password'] = pwd_context.hash(update_data['password'])
        del update_data['password']

    for field, value in update_data.items():
        if hasattr(db_user, field):
            print(f"DEBUG update_user: Setting {field} = {value}")
            setattr(db_user, field, value)
        else:
            print(f"DEBUG update_user: Field {field} does not exist on User model!")

    try:
        db.commit()
        db.refresh(db_user)
        print(f"DEBUG update_user: Update successful for user_id={user_id}")
        return db_user
    except Exception as e:
        print(f"DEBUG update_user: Error during commit: {e}")
        db.rollback()
        return None

def delete_user(db: Session, user_id: int):
    db_user = get_user(db, user_id)
    if not db_user:
        return False

    db.query(InventoryHistory).filter(InventoryHistory.changed_by == user_id).update(
        {InventoryHistory.changed_by: None},
        synchronize_session=False
    )

    db.query(Sale).filter(Sale.user_id == user_id).update(
        {Sale.user_id: None},
        synchronize_session=False
    )

    db.query(Business).filter(Business.user_id == user_id).delete()
    db.delete(db_user)
    db.commit()
    return True

def authenticate_user(db: Session, identifier: str, password: str):
    user = get_user_by_email(db, identifier)
    if not user:
        user = get_user_by_username(db, identifier)

    if not user:
        return False
    if not pwd_context.verify(password, user.hashed_password):
        return False
    return user

def get_user_by_email_or_username(db: Session, identifier: str):
    user = get_user_by_email(db, identifier)
    if user:
        return user
    return get_user_by_username(db, identifier)

def toggle_user_status(db: Session, user_id: int):
    db_user = get_user(db, user_id)
    if not db_user:
        return None

    db_user.is_active = not db_user.is_active
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_permissions(db: Session, user_id: int) -> List[str]:
    """
    Get all permissions for a user by aggregating permissions from all their roles.
    Returns a list of permission names (e.g., ['sale:create', 'product:read']).
    """
    user = db.query(User).options(
        joinedload(User.roles).joinedload(Role.permissions)  # Eagerly load roles and their permissions
    ).filter(User.id == user_id).first()

    if not user:
        return []

    # Collect all unique permissions from all of the user's roles
    permissions_set = set()
    for role in user.roles:
        for permission in role.permissions:
            permissions_set.add(permission.name)

    return list(permissions_set)
