from sqlalchemy.orm import Session
from app.models.product import Product
from app.schemas.product_schema import ProductCreate, ProductUpdate

def get_product(db: Session, product_id: int):
    """Get a single product by ID"""
    return db.query(Product).filter(Product.id == product_id).first()

def get_products(db: Session, skip: int = 0, limit: int = 100):
    """Get multiple products with pagination"""
    return db.query(Product).offset(skip).limit(limit).all()

def get_product_by_barcode(db: Session, barcode: str):
    """Get product by barcode (unique identifier)"""
    return db.query(Product).filter(Product.barcode == barcode).first()

def create_product(db: Session, product: ProductCreate):
    """Create a new product"""
    db_product = Product(
        name=product.name,
        description=product.description,
        price=product.price,
        cost_price=product.cost_price,  # NEW: Add cost price
        barcode=product.barcode,
        stock_quantity=product.stock_quantity,
        min_stock_level=product.min_stock_level if hasattr(product, 'min_stock_level') else 5
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: int, product: ProductUpdate):
    """Update existing product"""
    db_product = get_product(db, product_id)
    if db_product:
        update_data = product.dict(exclude_unset=True)
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
