from sqlalchemy.orm import Session, joinedload
from sqlalchemy.sql import func
from sqlalchemy.exc import IntegrityError
from typing import List, Optional, Dict, Any
from app.models.supplier import Supplier, PurchaseOrder, PurchaseOrderItem
from app.models.product import Product
from app.models.inventory import InventoryHistory
from app.schemas.supplier_schema import SupplierCreate, PurchaseOrderCreate, PurchaseOrder as PurchaseOrderSchema
import random
import string

def generate_po_number():
    """Generate unique purchase order number: PO-YYYYMMDD-XXXXX"""
    from datetime import datetime
    date_part = datetime.now().strftime("%Y%m%d")
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
    return f"PO-{date_part}-{random_part}"

def create_supplier(db: Session, supplier_data: SupplierCreate, business_id: int = None):
    """Create a new supplier with business context"""
    try:
        # Check for existing supplier with same name in the same business
        existing = db.query(Supplier).filter(
            Supplier.name == supplier_data.name,
            Supplier.business_id == business_id
        ).first()
        if existing:
            raise ValueError("Supplier with this name already exists in your business")

        supplier_dict = supplier_data.dict()
        # 🚨 CRITICAL FIX: Add business_id to the supplier
        if business_id is not None:
            supplier_dict['business_id'] = business_id
            
        db_supplier = Supplier(**supplier_dict)
        db.add(db_supplier)
        db.commit()
        db.refresh(db_supplier)
        return db_supplier
    except IntegrityError:
        db.rollback()
        raise ValueError("Supplier with this name already exists")

def get_suppliers(db: Session, skip: int = 0, limit: int = 100, business_id: int = None):
    """Get all suppliers for a specific business"""
    query = db.query(Supplier)
    
    # 🚨 CRITICAL FIX: Add business filtering
    if business_id is not None:
        query = query.filter(Supplier.business_id == business_id)
    
    return query.order_by(Supplier.name).offset(skip).limit(limit).all()

def get_supplier(db: Session, supplier_id: int, business_id: int = None):
    """Get a single supplier by ID, filtered by business_id"""
    query = db.query(Supplier).filter(Supplier.id == supplier_id)
    
    # 🚨 CRITICAL FIX: Add business filtering
    if business_id is not None:
        query = query.filter(Supplier.business_id == business_id)
    
    return query.first()


def update_supplier(db: Session, supplier_id: int, supplier_data: dict):
    """Update a supplier"""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        return None

    # Remove None values to avoid overwriting with null
    update_data = {k: v for k, v in supplier_data.items() if v is not None}
    for key, value in update_data.items():
        setattr(supplier, key, value)

    db.commit()
    db.refresh(supplier)
    return supplier

def delete_supplier(db: Session, supplier_id: int):
    """Delete a supplier"""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if supplier:
        db.delete(supplier)
        db.commit()
    return supplier

def create_purchase_order(db: Session, po_data: PurchaseOrderCreate, user_id: int, business_id: int = None):
    """Create a new purchase order with business context"""
    try:
        # Generate PO number
        po_number = generate_po_number()

        # Calculate total amount
        total_amount = sum(item.quantity * item.unit_cost for item in po_data.items)

        # Create PO
        db_po = PurchaseOrder(
            supplier_id=po_data.supplier_id,
            po_number=po_number,
            total_amount=total_amount,
            expected_delivery=po_data.expected_delivery,
            notes=po_data.notes,
            created_by=user_id,
            business_id=business_id  # 🚨 CRITICAL FIX: Add business_id
        )

        db.add(db_po)
        db.commit()
        db.refresh(db_po)

        # Create PO items
        for item in po_data.items:
            db_item = PurchaseOrderItem(
                po_id=db_po.id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_cost=item.unit_cost,
                notes=item.notes
            )
            db.add(db_item)

        db.commit()
        db.refresh(db_po)
        return _purchase_order_to_dict(db_po)
    except Exception as e:
        db.rollback()
        raise e

# FIXED FUNCTION: This was broken with bad indentation and duplicate code.
def _purchase_order_to_dict(po: PurchaseOrder) -> Dict[str, Any]:
    """Convert PurchaseOrder ORM object to dict with proper items field"""
    po_dict = {
        "id": po.id,
        "supplier_id": po.supplier_id,
        "po_number": po.po_number,
        "status": po.status,
        "total_amount": po.total_amount,
        "order_date": po.order_date,
        "expected_delivery": po.expected_delivery,
        "received_date": po.received_date,
        "notes": po.notes,
        "created_by": po.created_by,
        "created_at": po.created_at,
        "updated_at": po.updated_at,
        "items": []  # Initialize the required 'items' list
    }

    # Add items if the relationship is loaded
    if po.po_items:
        for item in po.po_items:
            po_dict["items"].append({
                "id": item.id,
                "po_id": item.po_id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "unit_cost": item.unit_cost,
                "received_quantity": item.received_quantity,
                "notes": item.notes
            })

    return po_dict

def get_purchase_orders(db: Session, skip: int = 0, limit: int = 100, business_id: int = None):
    """Get all purchase orders for a specific business"""
    query = db.query(PurchaseOrder).options(
        joinedload(PurchaseOrder.po_items)
    )
    
    # 🚨 CRITICAL FIX: Add business filtering
    if business_id is not None:
        query = query.filter(PurchaseOrder.business_id == business_id)
    
    pos = query.order_by(PurchaseOrder.created_at.desc()).offset(skip).limit(limit).all()
    return [_purchase_order_to_dict(po) for po in pos]

def get_purchase_order(db: Session, po_id: int, business_id: int = None):
    """Get a single purchase order by ID, filtered by business"""
    query = db.query(PurchaseOrder).options(
        joinedload(PurchaseOrder.po_items)
    ).filter(PurchaseOrder.id == po_id)
    
    # 🚨 CRITICAL FIX: Add business filtering
    if business_id is not None:
        query = query.filter(PurchaseOrder.business_id == business_id)
    
    po = query.first()
    if po:
        return _purchase_order_to_dict(po)
    return None

def get_purchase_orders_by_supplier(db: Session, supplier_id: int, business_id: int = None):
    """Get all purchase orders for a specific supplier, filtered by business"""
    query = db.query(PurchaseOrder).options(
        joinedload(PurchaseOrder.po_items)
    ).filter(
        PurchaseOrder.supplier_id == supplier_id
    )
    
    # 🚨 CRITICAL FIX: Add business filtering
    if business_id is not None:
        query = query.filter(PurchaseOrder.business_id == business_id)
    
    pos = query.order_by(PurchaseOrder.created_at.desc()).all()
    return [_purchase_order_to_dict(po) for po in pos]

def update_po_status(db: Session, po_id: int, status: str):
    """Update purchase order status"""
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        return None

    po.status = status
    if status == "received":
        po.received_date = func.now()

    db.commit()
    db.refresh(po)
    return po

def receive_po_items(db: Session, po_id: int, received_items: List[dict], user_id: int):
    """Receive items from a purchase order and update inventory"""
    po = db.query(PurchaseOrder).options(
        joinedload(PurchaseOrder.po_items)
    ).filter(PurchaseOrder.id == po_id).first()

    if not po:
        raise ValueError("Purchase order not found")

    try:
        for received_item in received_items:
            po_item = db.query(PurchaseOrderItem).filter(
                PurchaseOrderItem.id == received_item['item_id'],
                PurchaseOrderItem.po_id == po_id
            ).first()

            if po_item:
                # Update received quantity
                po_item.received_quantity = received_item['quantity']

                # Update product inventory
                product = db.query(Product).filter(Product.id == po_item.product_id).first()
                if product:
                    previous_quantity = product.stock_quantity
                    product.stock_quantity += received_item['quantity']

                    # Record inventory history
                    inventory_history = InventoryHistory(
                        product_id=product.id,
                        change_type="restock",
                        quantity_change=received_item['quantity'],
                        previous_quantity=previous_quantity,
                        new_quantity=product.stock_quantity,
                        reason=f"PO #{po.po_number}",
                        changed_by=user_id
                    )
                    db.add(inventory_history)

        # Update PO status if all items received
        all_received = all(item.received_quantity >= item.quantity for item in po.po_items)
        if all_received:
            po.status = "received"
            po.received_date = func.now()

        db.commit()
        return po

    except Exception as e:
        db.rollback()
        raise ValueError(f"Failed to receive items: {str(e)}")
