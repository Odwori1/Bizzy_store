from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

# Import schemas, CRUD functions, and dependencies
from app.schemas.user_schema import UserCreate, User
from app.crud.user import create_user, get_user, get_user_by_email, get_user_by_username, get_all_users, update_user, delete_user
from app.database import get_db
from app.core.auth import get_current_user

router = APIRouter(
    prefix="/api/users",
    tags=["users"]
)

# --- Admin-only Endpoints ---

@router.get("/", response_model=List[User])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieve all users (Admin only).
    """
    # Simple role-based access control: only admins can list users
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin access required."
        )
    users = get_all_users(db, skip=skip, limit=limit)
    return users

@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
def create_new_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new user (Admin only).
    """
    # Secure this endpoint so only admins can create new users
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin access required."
        )

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

@router.put("/{user_id}", response_model=User)
def update_existing_user(
    user_id: int,
    user_update: UserCreate, # Using UserCreate for simplicity; a UserUpdate schema would be better later.
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Update a user's information (Admin only).
    """
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required.")

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

@router.delete("/{user_id}")
def delete_existing_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a user (Admin only).
    """
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required.")
    success = delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {"message": "User deleted successfully"}

# --- General Endpoints (for all authenticated users) ---

@router.get("/me", response_model=User)
def read_current_user(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return current_user

@router.get("/{user_id}", response_model=User)
def read_specific_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get a specific user's details (Admin only, or users getting their own info?).
    For now, let's keep it admin-only for simplicity.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required.")
    db_user = get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return db_user

@router.patch("/{user_id}/status", response_model=User)
def toggle_user_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Toggle user active status (Admin only)
    """
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required.")

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
