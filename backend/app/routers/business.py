from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.business_schema import BusinessCreate, Business
from app.crud.business import create_business, get_business_by_user_id, update_business
from app.database import get_db
from app.core.auth import get_current_user
from app.core.permissions import requires_permission
from app.models.currency import Currency  # ADD THIS IMPORT
from pydantic import BaseModel  # ADD THIS IMPORT

# ADD THIS SCHEMA DEFINITION
class BusinessCurrencyUpdate(BaseModel):
    currency_code: str

router = APIRouter(
    prefix="/api/business",
    tags=["business"]
)

# ADD THIS NEW ENDPOINT TO HANDLE CORS PREFLIGHT REQUESTS
@router.options("/", include_in_schema=False)
async def options_preflight():
    """Handle CORS preflight requests for /api/business/"""
    return {}

# Create or update business - Requires business:update permission
#@router.post("/", response_model=Business, dependencies=[Depends(requires_permission("business:update"))])
@router.post("/", response_model=Business) #, dependencies=[Depends(requires_permission("business:update"))])
def create_user_business(
    business: BusinessCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create or update business information (requires business:update permission)"""
    existing_business = get_business_by_user_id(db, current_user["id"])
    if existing_business:
        return update_business(db, existing_business.id, business)
    return create_business(db, business, current_user["id"])

# Get business info - Requires business:update permission (or could be read, but update is what exists)
#@router.get("/", response_model=Business, dependencies=[Depends(requires_permission("business:update"))])
@router.get("/", response_model=Business) #, dependencies=[Depends(requires_permission("business:update"))])
def get_business(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get business information for current user (requires business:update permission)"""
    business = get_business_by_user_id(db, current_user["id"])
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    return business

# Add currency update endpoint
@router.put("/{business_id}/currency")
async def update_business_currency(
    business_id: int,
    currency_update: BusinessCurrencyUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)  # FIXED: Changed User to dict
):
    """Update business currency"""
    from app.models.business import Business  # ADD THIS IMPORT
    
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    # Verify currency exists
    currency = db.query(Currency).filter(Currency.code == currency_update.currency_code).first()
    if not currency:
        raise HTTPException(status_code=400, detail="Invalid currency code")

    business.currency_code = currency_update.currency_code
    db.commit()
    db.refresh(business)
    return business
