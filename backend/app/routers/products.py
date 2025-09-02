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
# REPLACE this import
# from app.core.auth import oauth2_scheme
# WITH these imports:
from app.core.permissions import requires_permission

router = APIRouter(
    prefix="/api/products",
    tags=["products"],
    # REPLACE the global dependency. We will protect each endpoint individually.
    # dependencies=[Depends(oauth2_scheme)]
)

# Create a product - Requires product:create permission
@router.post("/", response_model=Product, dependencies=[Depends(requires_permission("product:create"))])
def create_new_product(product: ProductCreate, db: Session = Depends(get_db)):
    """Create a product (requires product:create permission)"""
    db_product = get_product_by_barcode(db, barcode=product.barcode)
    if db_product:
        raise HTTPException(status_code=400, detail="Barcode already registered")
    return create_product(db=db, product=product)

# List all products - Requires product:read permission
@router.get("/", response_model=list[Product], dependencies=[Depends(requires_permission("product:read"))])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all products (requires product:read permission)"""
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
    db: Session = Depends(get_db)
):
    """Update product details (requires product:update permission)"""
    return update_product(db=db, product_id=product_id, product=product)

# Delete a product - Requires product:delete permission
@router.delete("/{product_id}", dependencies=[Depends(requires_permission("product:delete"))])
def remove_product(product_id: int, db: Session = Depends(get_db)):
    """Delete a product (requires product:delete permission)"""
    delete_product(db, product_id=product_id)
    return {"ok": True}
