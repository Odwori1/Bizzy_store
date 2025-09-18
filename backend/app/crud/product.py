from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
import asyncio

from app.models.product import Product
from app.models.business import Business
from app.models.user import User
from app.schemas.product_schema import ProductCreate, ProductUpdate
from app.services.currency_service import CurrencyService

def get_product(db: Session, product_id: int) -> Optional[Product]:
    """Get a single product by ID"""
    return db.query(Product).filter(Product.id == product_id).first()

def get_products(db: Session, skip: int = 0, limit: int = 100) -> List[Product]:
    """Get list of products with pagination"""
    return db.query(Product).offset(skip).limit(limit).all()

def get_product_by_barcode(db: Session, barcode: str) -> Optional[Product]:
    """Get product by barcode"""
    return db.query(Product).filter(Product.barcode == barcode).first()

def get_business_by_user_id(db: Session, user_id: int) -> Optional[Business]:
    """Get business associated with a user"""
    # First get the user with their business relationship
    user = db.query(User).options(joinedload(User.business)).filter(User.id == user_id).first()
    if user and user.business:
        return user.business
    return None

def create_product(db: Session, product_data: ProductCreate, user_id: int) -> Product:
    """Create a new product with proper currency conversion"""
    # Get the user's business to determine local currency
    business = get_business_by_user_id(db, user_id)
    
    # Determine the business's local currency
    local_currency = 'USD'
    if business and business.currency_code:
        local_currency = business.currency_code

    # Get the exchange rate for converting Local Currency -> USD
    exchange_rate = 1.0  # Default 1:1 if currency is USD or rate fetch fails
    if local_currency != 'USD':
        try:
            # Get USD to local currency rate, then invert for local to USD
            usd_to_local_rate = asyncio.run(CurrencyService(db).get_latest_exchange_rate('USD', local_currency)) or 1.0
            if usd_to_local_rate == 0:
                exchange_rate = 1.0
            else:
                exchange_rate = 1.0 / usd_to_local_rate
        except Exception as e:
            print(f"Warning: Could not get exchange rate for {local_currency}->USD: {e}. Using 1.0")
            exchange_rate = 1.0

    # User's input is the local price
    local_price = product_data.price
    local_cost_price = product_data.cost_price

    # Convert local prices to USD for internal database storage
    # USD = Local * Exchange_Rate (where Exchange_Rate is Local->USD)
    price_in_usd = local_price * exchange_rate
    cost_price_in_usd = local_cost_price * exchange_rate if local_cost_price is not None else None

    # Create the database product object
    db_product = Product(
        name=product_data.name,
        description=product_data.description,
        price=price_in_usd,           # USD amount for internal use
        cost_price=cost_price_in_usd,  # USD amount for internal use
        barcode=product_data.barcode,
        stock_quantity=product_data.stock_quantity,
        min_stock_level=product_data.min_stock_level,
        # Preserve the historical context
        original_price=local_price,             # Original local selling price
        original_cost_price=local_cost_price,   # Original local cost price
        original_currency_code=local_currency,
        exchange_rate_at_creation=exchange_rate # Rate used (Local -> USD)
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: int, product: ProductUpdate, user_id: int):
    """Update existing product. If price or cost is updated, recaptures the currency context."""
    db_product = get_product(db, product_id)
    if db_product:
        update_data = product.dict(exclude_unset=True)

        # If the price or cost is being updated, recapture the currency context
        if 'price' in update_data or 'cost_price' in update_data:
            business = get_business_by_user_id(db, user_id)
            currency_service = CurrencyService(db)
            current_rate = 1.0
            local_currency = 'USD'
            if business and business.currency_code:
                local_currency = business.currency_code
                if business.currency_code != 'USD':
                    try:
                        # Get USD to local currency rate, then invert for local to USD
                        usd_to_local_rate = asyncio.run(currency_service.get_latest_exchange_rate('USD', local_currency)) or 1.0
                        if usd_to_local_rate == 0:
                            current_rate = 1.0
                        else:
                            current_rate = 1.0 / usd_to_local_rate
                    except Exception as e:
                        print(f"Warning: Could not get exchange rate for update: {e}")
                        current_rate = 1.0

            # Recalculate USD price correctly - MULTIPLY by exchange rate
            if 'price' in update_data:
                new_local_price = update_data['price']
                update_data['price'] = new_local_price * current_rate
                update_data['original_price'] = new_local_price
                update_data['original_currency_code'] = local_currency
                update_data['exchange_rate_at_creation'] = current_rate

            # Convert cost_price to USD correctly
            if 'cost_price' in update_data:
                new_local_cost_price = update_data['cost_price']
                if new_local_cost_price is not None:
                    update_data['cost_price'] = new_local_cost_price * current_rate
                update_data['original_cost_price'] = new_local_cost_price

        for field, value in update_data.items():
            setattr(db_product, field, value)
        db.commit()
        db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    """Delete a product"""
    db_product = get_product(db, product_id)
    if db_product:
        db.delete(db_product)
        db.commit()
    return db_product

def search_products(db: Session, query: str, skip: int = 0, limit: int = 100) -> List[Product]:
    """Search products by name or description"""
    return db.query(Product).filter(
        (Product.name.ilike(f"%{query}%")) | (Product.description.ilike(f"%{query}%"))
    ).offset(skip).limit(limit).all()

def get_low_stock_products(db: Session) -> List[Product]:
    """Get products that are below minimum stock level"""
    return db.query(Product).filter(Product.stock_quantity <= Product.min_stock_level).all()

def update_product_stock(db: Session, product_id: int, quantity_change: int) -> Optional[Product]:
    """Update product stock quantity"""
    db_product = get_product(db, product_id)
    if db_product:
        db_product.stock_quantity += quantity_change
        db.commit()
        db.refresh(db_product)
    return db_product
