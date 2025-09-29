from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.crud.supplier import (
    create_supplier, get_suppliers, get_supplier, update_supplier, delete_supplier,
    create_purchase_order, get_purchase_orders, get_purchase_order, update_po_status, receive_po_items,
    _purchase_order_to_dict, get_purchase_orders_by_supplier
)
from app.schemas.supplier_schema import Supplier, SupplierCreate, PurchaseOrder, PurchaseOrderCreate
from app.database import get_db
from app.core.auth import get_current_user
from app.core.permissions import requires_permission

router = APIRouter(
    prefix="/api/suppliers",
    tags=["suppliers"]
)

# --- PURCHASE ORDER ENDPOINTS (MUST COME FIRST) ---

@router.post("/purchase-orders", response_model=PurchaseOrder, status_code=status.HTTP_201_CREATED)
def create_new_purchase_order(
    po: PurchaseOrderCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new purchase order"""
    try:
        return create_purchase_order(db, po, current_user["id"], business_id=current_user["business_id"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/purchase-orders", response_model=List[PurchaseOrder])
def read_purchase_orders(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all purchase orders"""
    try:
        return get_purchase_orders(db, skip, limit, business_id=current_user["business_id"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/purchase-orders/{po_id}", response_model=PurchaseOrder, dependencies=[Depends(requires_permission("purchase_order:read"))])
def read_purchase_order(
    po_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific purchase order (requires purchase_order:read permission)"""
    db_po = get_purchase_order(db, po_id, business_id=current_user["business_id"])
    if db_po is None:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return db_po

@router.patch("/purchase-orders/{po_id}/status", dependencies=[Depends(requires_permission("purchase_order:update"))])
def update_purchase_order_status(
    po_id: int,
    new_status: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update purchase order status (requires purchase_order:update permission)"""
    db_po = get_purchase_order(db, po_id, business_id=current_user["business_id"])
    if db_po is None:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    
    try:
        return update_po_status(db, po_id, new_status)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/purchase-orders/{po_id}/receive", dependencies=[Depends(requires_permission("purchase_order:receive"))])
def receive_purchase_order_items(
    po_id: int,
    received_items: List[dict],
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Receive purchase order items (requires purchase_order:receive permission)"""
    db_po = get_purchase_order(db, po_id, business_id=current_user["business_id"])
    if db_po is None:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    
    try:
        return receive_po_items(db, po_id, received_items)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- SUPPLIER ENDPOINTS (MUST COME AFTER PURCHASE ORDERS) ---

@router.post("/", response_model=Supplier, status_code=status.HTTP_201_CREATED, dependencies=[Depends(requires_permission("supplier:create"))])
def create_new_supplier(
    supplier: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new supplier (requires supplier:create permission)"""
    try:
        return create_supplier(db, supplier, business_id=current_user["business_id"])
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/", response_model=List[Supplier], dependencies=[Depends(requires_permission("supplier:read"))])
def read_suppliers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all suppliers for the current user's business"""
    try:
        return get_suppliers(db, skip, limit, business_id=current_user["business_id"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching suppliers: {str(e)}")

@router.get("/{supplier_id}", response_model=Supplier, dependencies=[Depends(requires_permission("supplier:read"))])
def read_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific supplier by ID"""
    db_supplier = get_supplier(db, supplier_id, business_id=current_user["business_id"])
    if db_supplier is None:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return db_supplier

@router.get("/{supplier_id}/purchase-orders", response_model=List[PurchaseOrder], dependencies=[Depends(requires_permission("purchase_order:read"))])
def read_supplier_purchase_orders(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all purchase orders for a specific supplier (requires purchase_order:read permission)"""
    supplier = get_supplier(db, supplier_id, business_id=current_user["business_id"])
    if not supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")

    purchase_orders = get_purchase_orders_by_supplier(db, supplier_id, business_id=current_user["business_id"])
    return purchase_orders

@router.put("/{supplier_id}", response_model=Supplier, dependencies=[Depends(requires_permission("supplier:update"))])
def update_existing_supplier(
    supplier_id: int,
    supplier_data: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update a supplier (requires supplier:update permission)"""
    supplier = update_supplier(db, supplier_id, supplier_data.dict(exclude_unset=True))
    if not supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")
    return supplier

@router.delete("/{supplier_id}", dependencies=[Depends(requires_permission("supplier:delete"))])
def delete_existing_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete a supplier (requires supplier:delete permission)"""
    supplier = delete_supplier(db, supplier_id)
    if not supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")
    return {"message": "Supplier deleted successfully"}
