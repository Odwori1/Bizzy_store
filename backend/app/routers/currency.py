from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.currency import Currency, ExchangeRate
from app.services.currency_service import CurrencyService

router = APIRouter(prefix="/api/currencies", tags=["currencies"])

@router.get("/")
async def get_currencies(db: Session = Depends(get_db)):
    """Get all available currencies"""
    currencies = db.query(Currency).filter(Currency.is_active == True).all()
    return currencies

@router.get("/{currency_code}")
async def get_currency(currency_code: str, db: Session = Depends(get_db)):
    """Get specific currency details"""
    currency = db.query(Currency).filter(Currency.code == currency_code, Currency.is_active == True).first()
    if not currency:
        raise HTTPException(status_code=404, detail="Currency not found")
    return currency

@router.get("/convert/{amount}/{from_currency}/{to_currency}")
async def convert_currency(
    amount: float, 
    from_currency: str, 
    to_currency: str,
    db: Session = Depends(get_db)
):
    """Convert amount between currencies"""
    service = CurrencyService(db)
    converted = await service.convert_amount(amount, from_currency, to_currency)
    return {
        "original_amount": amount,
        "from_currency": from_currency,
        "to_currency": to_currency,
        "converted_amount": converted
    }
