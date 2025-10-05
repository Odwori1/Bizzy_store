from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.crud.inventory import (
    get_inventory_history,
    adjust_inventory,
    get_low_stock_items,
    get_stock_levels
)
from app.crud.product import get_product
from app.schemas.inventory_schema import (
    InventoryAdjustment,
    InventoryHistory,
    LowStockAlert,
    StockLevel
)
from app.database import get_db
from app.core.auth import get_current_user
from app.core.permissions import requires_permission

router = APIRouter(
    prefix="/api/inventory",
    tags=["inventory"]
)

# Get inventory history - Requires inventory:read permission
@router.get("/history", response_model=List[InventoryHistory], dependencies=[Depends(requires_permission("inventory:read"))])
def read_inventory_history(
    product_id: int = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get inventory history, optionally filtered by product (requires inventory:read permission)"""
    business_id = current_user.get("business_id")
    if not business_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not associated with a business"
        )
    return get_inventory_history(db, product_id, skip, limit, business_id)

# Adjust inventory - Requires inventory:update permission
@router.post("/adjust", response_model=StockLevel, dependencies=[Depends(requires_permission("inventory:update"))])
def adjust_inventory_quantity(
    adjustment: InventoryAdjustment,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Adjust inventory quantity (restock or adjustment) (requires inventory:update permission)"""
    # Verify product exists
    product = get_product(db, adjustment.product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    # Verify product belongs to user's business
    if product.business_id != current_user.get("business_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot adjust inventory for products in other businesses"
        )

    # Verify sufficient stock for negative adjustments
    if adjustment.quantity_change < 0 and product.stock_quantity + adjustment.quantity_change < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient stock for this adjustment"
        )
    updated_product = adjust_inventory(db, adjustment, current_user["id"], current_user.get("business_id"))
    if not updated_product:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to adjust inventory"
        )

    return {
        "product_id": updated_product.id,
        "product_name": updated_product.name,
        "current_stock": updated_product.stock_quantity,
        "min_stock_level": updated_product.min_stock_level,
        "last_restocked": updated_product.last_restocked,
        "needs_restock": updated_product.stock_quantity <= updated_product.min_stock_level
    }

# Get low stock alerts - Requires inventory:read permission
@router.get("/low-stock", response_model=List[LowStockAlert], dependencies=[Depends(requires_permission("inventory:read"))])
def get_low_stock_alerts(
    threshold: int = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get products with low stock levels (requires inventory:read permission)"""
    business_id = current_user.get("business_id")
    if not business_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not associated with a business"
        )
    low_stock_items = get_low_stock_items(db, threshold, business_id)
    return [
        {
            "product_id": item.id,
            "product_name": item.name,
            "current_stock": item.stock_quantity,
            "min_stock_level": item.min_stock_level
        }
        for item in low_stock_items
    ]

# Get current stock levels - Requires inventory:read permission
@router.get("/stock-levels", response_model=List[StockLevel], dependencies=[Depends(requires_permission("inventory:read"))])
def get_current_stock_levels(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get current stock levels for all products (requires inventory:read permission)"""
    business_id = current_user.get("business_id")
    if not business_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not associated with a business"
        )
    return get_stock_levels(db, skip, limit, business_id)
