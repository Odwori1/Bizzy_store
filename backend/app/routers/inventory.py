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

router = APIRouter(
    prefix="/api/inventory",
    tags=["inventory"]
)

@router.get("/history", response_model=List[InventoryHistory])
def read_inventory_history(
    product_id: int = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get inventory history, optionally filtered by product"""
    return get_inventory_history(db, product_id, skip, limit)

@router.post("/adjust", response_model=StockLevel)
def adjust_inventory_quantity(
    adjustment: InventoryAdjustment,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Adjust inventory quantity (restock or adjustment)"""
    # Verify product exists
    product = get_product(db, adjustment.product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Verify sufficient stock for negative adjustments
    if adjustment.quantity_change < 0 and product.stock_quantity + adjustment.quantity_change < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient stock for this adjustment"
        )
    
    updated_product = adjust_inventory(db, adjustment, current_user["id"])
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

@router.get("/low-stock", response_model=List[LowStockAlert])
def get_low_stock_alerts(
    threshold: int = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get products with low stock levels"""
    low_stock_items = get_low_stock_items(db, threshold)
    return [
        {
            "product_id": item.id,
            "product_name": item.name,
            "current_stock": item.stock_quantity,
            "min_stock_level": item.min_stock_level
        }
        for item in low_stock_items
    ]

@router.get("/stock-levels", response_model=List[StockLevel])
def get_current_stock_levels(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get current stock levels for all products"""
    return get_stock_levels(db, skip, limit)
