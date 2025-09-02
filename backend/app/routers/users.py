from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
# Import Pydantic schemas with clear names
from app.schemas.user_schema import User as UserSchema, UserCreate, UserRegister
from app.core.auth import get_password_hash
# Import SQLAlchemy model with clear name
from app.models.user import User as UserModel
from app.models.permission import Role
from app.crud.user import (
    create_user,
    get_user,
    get_user_by_email,
    get_user_by_username,
    get_all_users,
    update_user,
    delete_user
)
from app.database import get_db
from app.core.auth import get_current_user
from app.core.permissions import requires_permission

router = APIRouter(
    prefix="/api/users",
    tags=["users"]
)

# --- Admin-only Endpoints ---

# Use UserSchema for response models
@router.get("/", response_model=List[UserSchema], dependencies=[Depends(requires_permission("user:read"))])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """
    Retrieve all users (Requires user:read permission).
    """
    users = get_all_users(db, skip=skip, limit=limit)
    return users

# Use UserSchema for response model
@router.post("/", response_model=UserSchema, status_code=status.HTTP_201_CREATED, dependencies=[Depends(requires_permission("user:create"))])
def create_new_user(
    user: UserCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new user (Requires user:create permission).
    """
    # Check if email already exists
    db_user_by_email = get_user_by_email(db, email=user.email)
    if db_user_by_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    # Check if username already exists
    db_user_by_username = get_user_by_username(db, username=user.username)
    if db_user_by_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    return create_user(db=db, user=user)

# Use UserSchema for response model
@router.put("/{user_id}", response_model=UserSchema, dependencies=[Depends(requires_permission("user:update"))])
def update_existing_user(
    user_id: int,
    user_update: UserCreate,
    db: Session = Depends(get_db),
):
    """
    Update a user's information (Requires user:update permission).
    """
    # Check if new email is taken by another user
    existing_user_by_email = get_user_by_email(db, email=user_update.email)
    if existing_user_by_email and existing_user_by_email.id != user_id:
        raise HTTPException(status_code=400, detail="Email already in use by another account.")

    # Check if new username is taken by another user
    existing_user_by_username = get_user_by_username(db, username=user_update.username)
    if existing_user_by_username and existing_user_by_username.id != user_id:
        raise HTTPException(status_code=400, detail="Username already in use by another account.")

    updated_user = update_user(db, user_id, user_update)
    if updated_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return updated_user

@router.delete("/{user_id}", dependencies=[Depends(requires_permission("user:delete"))])
def delete_existing_user(
    user_id: int,
    db: Session = Depends(get_db),
):
    """
    Delete a user (Requires user:delete permission).
    """
    success = delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {"message": "User deleted successfully"}

# --- General Endpoints (for all authenticated users) ---

# Use UserSchema for response model
@router.get("/me", response_model=UserSchema)
def read_current_user(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return current_user

# Use UserSchema for response model
@router.get("/{user_id}", response_model=UserSchema)
def read_specific_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get a specific user's details (Admin or the user themselves).
    """
    # Keep this logic for now - it checks if user is accessing their own profile
    # We'll enhance this later with better permission logic
    if "user:read" not in current_user.get("permissions", []) and current_user.get("id") != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to access this resource.")
    db_user = get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return db_user

# Use UserSchema for response model
@router.patch("/{user_id}/status", response_model=UserSchema, dependencies=[Depends(requires_permission("user:update"))])
def toggle_user_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Toggle user active status (Requires user:update permission).
    """
    db_user = get_user(db, user_id)
    if db_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Prevent users from disabling themselves
    if user_id == current_user["id"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot change your own status")

    # Toggle the status
    db_user.is_active = not db_user.is_active
    db.commit()
    db.refresh(db_user)

    return db_user

@router.put("/{user_id}/role", status_code=status.HTTP_200_OK, dependencies=[Depends(requires_permission("role:manage"))])
def assign_user_role(
    user_id: int,
    role_data: dict,  # Expects {"role_id": 1}
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Assign a role to a user.
    Requires the 'role:manage' permission.
    """
    # Find the user and role - use UserModel (SQLAlchemy)
    db_user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Get the role directly from the database
    db_role = db.query(Role).filter(Role.id == role_data["role_id"]).first()
    if not db_role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")

    try:
        # Replace all of the user's current roles with the new one
        db_user.roles = [db_role]
        db.commit()
        db.refresh(db_user)
        return {"msg": f"Role '{db_role.name}' assigned successfully to user '{db_user.username}'"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
