from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.crud.product import (
    get_product,
    get_products,
    create_product,
    update_product,
    delete_product,
    get_product_by_barcode
)
from app.schemas.product_schema import ProductCreate, ProductUpdate, Product
from app.database import get_db
from app.core.auth import oauth2_scheme

router = APIRouter(
    prefix="/api/products",
    tags=["products"],
    dependencies=[Depends(oauth2_scheme)]
)

@router.post("/", response_model=Product)
def create_new_product(product: ProductCreate, db: Session = Depends(get_db)):
    """Create a product (requires authentication)"""
    db_product = get_product_by_barcode(db, barcode=product.barcode)
    if db_product:
        raise HTTPException(status_code=400, detail="Barcode already registered")
    return create_product(db=db, product=product)

@router.get("/", response_model=list[Product])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all products"""
    return get_products(db, skip=skip, limit=limit)

@router.get("/{product_id}", response_model=Product)
def read_product(product_id: int, db: Session = Depends(get_db)):
    """Get product details"""
    db_product = get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

@router.put("/{product_id}", response_model=Product)
def update_existing_product(
    product_id: int, 
    product: ProductUpdate, 
    db: Session = Depends(get_db)
):
    """Update product details"""
    return update_product(db=db, product_id=product_id, product=product)

@router.delete("/{product_id}")
def remove_product(product_id: int, db: Session = Depends(get_db)):
    """Delete a product"""
    delete_product(db, product_id=product_id)
    return {"ok": True}
