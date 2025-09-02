#!/usr/bin/env python3
from app.database import SessionLocal
from app.models.currency import Currency

def init_currencies():
    db = SessionLocal()
    
    currencies = [
        {"code": "USD", "name": "US Dollar", "symbol": "$", "decimal_places": 2, "symbol_position": "before"},
        {"code": "UGX", "name": "Ugandan Shilling", "symbol": "USh", "decimal_places": 0, "symbol_position": "before"},
        {"code": "KES", "name": "Kenyan Shilling", "symbol": "KSh", "decimal_places": 2, "symbol_position": "before"},
        {"code": "NGN", "name": "Nigerian Naira", "symbol": "₦", "decimal_places": 2, "symbol_position": "before"},
        {"code": "GBP", "name": "British Pound", "symbol": "£", "decimal_places": 2, "symbol_position": "before"},
        {"code": "EUR", "name": "Euro", "symbol": "€", "decimal_places": 2, "symbol_position": "after"},
        {"code": "INR", "name": "Indian Rupee", "symbol": "₹", "decimal_places": 2, "symbol_position": "before"},
        {"code": "JPY", "name": "Japanese Yen", "symbol": "¥", "decimal_places": 0, "symbol_position": "before"},
        {"code": "CNY", "name": "Chinese Yuan", "symbol": "¥", "decimal_places": 2, "symbol_position": "before"},
        {"code": "BRL", "name": "Brazilian Real", "symbol": "R$", "decimal_places": 2, "symbol_position": "before"},
    ]
    
    for curr_data in currencies:
        currency = db.query(Currency).filter(Currency.code == curr_data["code"]).first()
        if not currency:
            currency = Currency(**curr_data)
            db.add(currency)
    
    db.commit()
    db.close()
    print("✓ Currencies initialized successfully")

if __name__ == "__main__":
    init_currencies()
