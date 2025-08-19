from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.product import Product
from app.models.inventory import InventoryHistory
from app.schemas.inventory_schema import InventoryAdjustment
from datetime import datetime

def get_inventory_history(db: Session, product_id: int = None, skip: int = 0, limit: int = 100):
    """Get inventory history, optionally filtered by product"""
    query = db.query(InventoryHistory)
    if product_id:
        query = query.filter(InventoryHistory.product_id == product_id)
    return query.order_by(InventoryHistory.changed_at.desc()).offset(skip).limit(limit).all()

def adjust_inventory(db: Session, adjustment: InventoryAdjustment, user_id: int):
    """Adjust inventory quantity and record history"""
    product = db.query(Product).filter(Product.id == adjustment.product_id).first()
    if not product:
        return None
    
    previous_quantity = product.stock_quantity
    product.stock_quantity += adjustment.quantity_change
    
    # Determine change type
    if adjustment.quantity_change > 0:
        change_type = "restock"
        product.last_restocked = datetime.now()
    else:
        change_type = "adjustment"
    
    # Create history record
    history = InventoryHistory(
        product_id=product.id,
        change_type=change_type,
        quantity_change=adjustment.quantity_change,
        previous_quantity=previous_quantity,
        new_quantity=product.stock_quantity,
        reason=adjustment.reason,
        changed_by=user_id
    )
    
    db.add(history)
    db.commit()
    db.refresh(product)
    db.refresh(history)
    
    return product

def get_low_stock_items(db: Session, threshold: int = None):
    """Get products with stock below minimum level"""
    query = db.query(Product).filter(Product.stock_quantity <= Product.min_stock_level)
    if threshold:
        query = query.filter(Product.stock_quantity <= threshold)
    return query.all()

def get_stock_levels(db: Session, skip: int = 0, limit: int = 100):
    """Get current stock levels for all products"""
    products = db.query(Product).offset(skip).limit(limit).all()
    return [
        {
            "product_id": p.id,
            "product_name": p.name,
            "current_stock": p.stock_quantity,
            "min_stock_level": p.min_stock_level,
            "last_restocked": p.last_restocked,
            "needs_restock": p.stock_quantity <= p.min_stock_level
        }
        for p in products
    ]
