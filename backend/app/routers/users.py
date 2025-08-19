from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.user_schema import UserCreate, User
from app.crud.user import create_user, get_user, get_user_by_email
from app.database import get_db
from app.core.auth import oauth2_scheme

router = APIRouter(
    prefix="/api/users",
    tags=["users"]
)

# Public endpoint - no auth required
@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
def create_new_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    return create_user(db=db, user=user)

# Secured endpoints - require auth
@router.get("/{user_id}", response_model=User, dependencies=[Depends(oauth2_scheme)])
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return db_user
