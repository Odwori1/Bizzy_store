from sqlalchemy.orm import Session
from app.models.business import Business
from app.schemas.business_schema import BusinessCreate

def create_business(db: Session, business: BusinessCreate, user_id: int):
    db_business = Business(**business.dict(), user_id=user_id)
    db.add(db_business)
    db.commit()
    db.refresh(db_business)
    return db_business

def get_business_by_user(db: Session, user_id: int):
    return db.query(Business).filter(Business.user_id == user_id).first()

def update_business(db: Session, business_id: int, business_data: BusinessCreate):
    db_business = db.query(Business).filter(Business.id == business_id).first()
    if db_business:
        for key, value in business_data.dict().items():
            setattr(db_business, key, value)
        db.commit()
        db.refresh(db_business)
    return db_business
