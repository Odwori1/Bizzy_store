from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.crud.supplier import (
    create_supplier, get_suppliers, get_supplier, update_supplier, delete_supplier,
    create_purchase_order, get_purchase_orders, get_purchase_order, update_po_status, receive_po_items,
    _purchase_order_to_dict, get_purchase_orders_by_supplier  # <-- ADD the new function here
)
from app.schemas.supplier_schema import Supplier, SupplierCreate, PurchaseOrder, PurchaseOrderCreate
from app.database import get_db
from app.core.auth import get_current_user

router = APIRouter(
    prefix="/api/suppliers",
    tags=["suppliers"]
)

@router.post("/", response_model=Supplier, status_code=status.HTTP_201_CREATED)
def create_new_supplier(
    supplier: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new supplier"""
    try:
        return create_supplier(db, supplier)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/", response_model=List[Supplier])
def read_suppliers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all suppliers"""
    return get_suppliers(db, skip, limit)

@router.get("/{supplier_id}", response_model=Supplier)
def read_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific supplier"""
    supplier = get_supplier(db, supplier_id)
    if not supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")
    return supplier

@router.put("/{supplier_id}", response_model=Supplier)
def update_existing_supplier(
    supplier_id: int,
    supplier_data: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update a supplier"""
    supplier = update_supplier(db, supplier_id, supplier_data.dict(exclude_unset=True))
    if not supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")
    return supplier

@router.delete("/{supplier_id}")
def delete_existing_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete a supplier"""
    supplier = delete_supplier(db, supplier_id)
    if not supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")
    return {"message": "Supplier deleted successfully"}

@router.post("/purchase-orders/", response_model=PurchaseOrder, status_code=status.HTTP_201_CREATED)
def create_new_purchase_order(
    po_data: PurchaseOrderCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new purchase order"""
    try:
        # Get the ORM object from the create function
        po_orm_object = create_purchase_order(db, po_data, current_user["id"])
        # Convert it to the proper dictionary format that includes 'items'
        po_dict = _purchase_order_to_dict(po_orm_object)
        return po_dict
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/purchase-orders/", response_model=List[PurchaseOrder])
def read_purchase_orders(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all purchase orders"""
    return get_purchase_orders(db, skip, limit)

@router.get("/{supplier_id}/purchase-orders", response_model=List[PurchaseOrder])
def read_supplier_purchase_orders(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all purchase orders for a specific supplier"""
    # First, check if the supplier exists (optional but good practice)
    supplier = get_supplier(db, supplier_id)
    if not supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")

    # Get the purchase orders for this supplier
    purchase_orders = get_purchase_orders_by_supplier(db, supplier_id)
    return purchase_orders

@router.get("/purchase-orders/{po_id}", response_model=PurchaseOrder)
def read_purchase_order(
    po_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific purchase order"""
    po = get_purchase_order(db, po_id)
    if not po:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase order not found")
    return po

@router.patch("/purchase-orders/{po_id}/status")
def update_purchase_order_status(
    po_id: int,
    new_status: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update purchase order status"""
    valid_statuses = ["draft", "ordered", "received", "cancelled"]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")

    po = update_po_status(db, po_id, new_status)
    if not po:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase order not found")
    return po

@router.post("/purchase-orders/{po_id}/receive")
def receive_purchase_order_items(
    po_id: int,
    received_items: List[dict],
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Receive items from a purchase order"""
    try:
        return receive_po_items(db, po_id, received_items, current_user["id"])
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
