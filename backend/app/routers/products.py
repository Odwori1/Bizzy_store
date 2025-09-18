from fastapi import APIRouter, Depends, HTTPException, Query
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
from app.core.permissions import requires_permission
from app.core.auth import get_current_user
from typing import List, Optional

router = APIRouter(
    prefix="/api/products",
    tags=["products"],
)

# Create a product - Requires product:create permission
@router.post("/", response_model=Product, dependencies=[Depends(requires_permission("product:create"))])
def create_new_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user) # CHANGED: Type hint is now 'dict'
):
    """Create a product (requires product:create permission)"""
    db_product = get_product_by_barcode(db, barcode=product.barcode)
    if db_product:
        raise HTTPException(status_code=400, detail="Barcode already registered")
    # FIXED: Access user ID from the dictionary
    return create_product(db=db, product_data=product, user_id=current_user["id"])

# List all products with optional barcode filtering - Requires product:read permission
@router.get("/", response_model=List[Product], dependencies=[Depends(requires_permission("product:read"))])
def read_products(
    skip: int = 0,
    limit: int = 100,
    barcode: Optional[str] = Query(None, description="Filter by barcode"),
    db: Session = Depends(get_db)
):
    """List all products with optional barcode filtering"""
    if barcode:
        product = get_product_by_barcode(db, barcode=barcode)
        return [product] if product else []
    else:
        return get_products(db, skip=skip, limit=limit)

# Get product details - Requires product:read permission
@router.get("/{product_id}", response_model=Product, dependencies=[Depends(requires_permission("product:read"))])
def read_product(product_id: int, db: Session = Depends(get_db)):
    """Get product details (requires product:read permission)"""
    db_product = get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

# Update product details - Requires product:update permission
@router.put("/{product_id}", response_model=Product, dependencies=[Depends(requires_permission("product:update"))])
def update_existing_product(
    product_id: int,
    product: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user) # CHANGED: Type hint is now 'dict'
):
    """Update product details (requires product:update permission)"""
    # FIXED: Access user ID from the dictionary
    return update_product(db=db, product_id=product_id, product=product, user_id=current_user["id"])

# Delete a product - Requires product:delete permission
@router.delete("/{product_id}", dependencies=[Depends(requires_permission("product:delete"))])
def remove_product(product_id: int, db: Session = Depends(get_db)):
    """Delete a product (requires product:delete permission)"""
    delete_product(db, product_id=product_id)
    return {"ok": True}
