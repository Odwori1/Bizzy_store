from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.product import Product
from app.models.inventory import InventoryHistory
from app.schemas.inventory_schema import InventoryAdjustment
from datetime import datetime

def get_inventory_history(db: Session, product_id: int = None, skip: int = 0, limit: int = 100):
    """Get inventory history, optionally filtered by product"""
    # Use join to get product names
    query = db.query(
        InventoryHistory, 
        Product.name.label('product_name')
    ).join(
        Product, InventoryHistory.product_id == Product.id
    )
    
    if product_id:
        query = query.filter(InventoryHistory.product_id == product_id)
    
    # Filter out records with NULL changed_by to prevent validation errors
    query = query.filter(InventoryHistory.changed_by.isnot(None))
    
    results = query.order_by(InventoryHistory.changed_at.desc()).offset(skip).limit(limit).all()
    
    # Convert to dictionary format with product names
    history_with_names = []
    for history, product_name in results:
        history_dict = {
            'id': history.id,
            'product_id': history.product_id,
            'product_name': product_name,  # Add product name
            'change_type': history.change_type,
            'quantity_change': history.quantity_change,
            'previous_quantity': history.previous_quantity,
            'new_quantity': history.new_quantity,
            'reason': history.reason,
            'changed_by': history.changed_by,
            'changed_at': history.changed_at
        }
        history_with_names.append(history_dict)
    
    return history_with_names

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
