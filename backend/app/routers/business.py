from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.business_schema import BusinessCreate, Business
from app.crud.business import create_business, get_business_by_user, update_business
from app.database import get_db
from app.core.auth import get_current_user

router = APIRouter(
    prefix="/api/business",
    tags=["business"]
)

@router.post("/", response_model=Business)
def create_user_business(
    business: BusinessCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create or update business information"""
    existing_business = get_business_by_user(db, current_user["id"])
    if existing_business:
        return update_business(db, existing_business.id, business)
    return create_business(db, business, current_user["id"])

@router.get("/", response_model=Business)
def get_business(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get business information for current user"""
    business = get_business_by_user(db, current_user["id"])
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    return business
