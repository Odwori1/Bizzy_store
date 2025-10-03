# ~/Bizzy_store/backend/app/crud/refund.py - COMPLETE FIXED VERSION
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from app.models.refund import Refund, RefundItem
from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.models.inventory import InventoryHistory
from app.schemas.refund_schema import RefundCreate
from app.services.sequence_service import SequenceService

def detect_and_fix_swapped_amounts(refund: Refund) -> Refund:
    """Detect and fix swapped currency amounts in refund records."""
    if refund and refund.original_amount is not None and refund.total_amount is not None:
        if refund.original_amount < 1 and refund.total_amount > 0.1:
            print(f"🔄 Fixing swapped amounts for refund {refund.id}")
            refund.total_amount, refund.original_amount = refund.original_amount, refund.total_amount
    return refund

def process_refund(db: Session, refund_data: RefundCreate, user_id: int):
    """Process a refund for a sale - FIXED VERSION"""
    try:
        # 1. VALIDATION: Get the sale and ensure it exists
        sale = db.query(Sale).filter(Sale.id == refund_data.sale_id).first()
        if not sale:
            raise ValueError(f"Sale with ID {refund_data.sale_id} not found.")

        # Get the currency context from the original sale
        original_currency = sale.original_currency
        exchange_rate = sale.exchange_rate_at_sale

        total_refund_amount = 0.0
        total_original_refund_amount = 0.0
        refund_items_to_create = []

        # Pre-fetch all sale items for this sale
        sale_items_map = {item.id: item for item in sale.sale_items}

        # 2. VALIDATION: Validate each item in the refund request
        for item in refund_data.refund_items:
            sale_item = sale_items_map.get(item.sale_item_id)
            if not sale_item:
                raise ValueError(f"Sale item with ID {item.sale_item_id} not found in sale #{sale.id}.")

            total_possible_to_refund = sale_item.quantity - sale_item.refunded_quantity
            if item.quantity > total_possible_to_refund:
                raise ValueError(f"Cannot refund {item.quantity} of '{sale_item.product.name}'. Only {total_possible_to_refund} units are eligible for refund.")

            item_original_refund_amount = item.quantity * sale_item.original_unit_price
            item_refund_amount = item.quantity * sale_item.unit_price

            total_refund_amount += item_refund_amount
            total_original_refund_amount += item_original_refund_amount

            refund_items_to_create.append({
                "sale_item_id": item.sale_item_id,
                "quantity": item.quantity,
                "refund_amount": item_refund_amount
            })

        # 3. CREATE THE REFUND RECORD - FIXED PATTERN
        business_id = sale.business_id

        # Get sequence number FIRST (within transaction)
        business_refund_number = SequenceService.get_next_number(db, business_id, 'refund')

        db_refund = Refund(
            sale_id=refund_data.sale_id,
            user_id=user_id,
            business_id=business_id,
            business_refund_number=business_refund_number,  # Use the sequence number we already obtained
            reason=refund_data.reason,
            total_amount=total_refund_amount,
            original_amount=total_original_refund_amount,
            original_currency=original_currency,
            exchange_rate_at_refund=exchange_rate,
            status="processed"
        )
        db.add(db_refund)
        db.flush()

        # 4. PROCESS EACH REFUND ITEM
        for item_data in refund_items_to_create:
            sale_item_id = item_data["sale_item_id"]
            quantity_to_refund = item_data["quantity"]

            # Create RefundItem record
            db_refund_item = RefundItem(
                refund_id=db_refund.id,
                sale_item_id=sale_item_id,
                quantity=quantity_to_refund
            )
            db.add(db_refund_item)

            # Update the sale_item's refunded_quantity
            sale_item = sale_items_map[sale_item_id]
            sale_item.refunded_quantity += quantity_to_refund

            # Restore product inventory
            product = db.query(Product).filter(Product.id == sale_item.product_id).first()
            if product:
                previous_quantity = product.stock_quantity
                product.stock_quantity += quantity_to_refund

                # FIXED: Add business inventory numbering
                inventory_history = InventoryHistory(
                    product_id=product.id,
                    business_id=business_id,
                    business_inventory_number=SequenceService.get_next_number(db, business_id, 'inventory'),  # ADDED THIS LINE
                    change_type="refund",
                    quantity_change=quantity_to_refund,
                    previous_quantity=previous_quantity,
                    new_quantity=product.stock_quantity,
                    reason=f"Refund #{business_refund_number} for Sale #{sale.business_sale_number}",
                    changed_by=user_id
                )
                db.add(inventory_history)

        # 5. Update sale payment_status if entire sale is refunded
        total_sale_refunded = all(
            (sale_item.refunded_quantity == sale_item.quantity)
            for sale_item in sale.sale_items
        )
        if total_sale_refunded:
            sale.payment_status = "refunded"

        # SINGLE COMMIT for everything
        db.commit()
        db.refresh(db_refund)

        # Set business_sale_number before returning
        db_refund.business_sale_number = sale.business_sale_number
        return db_refund

    except Exception as e:
        db.rollback()
        raise e

def get_refunds_by_sale(db: Session, sale_id: int, business_id: int = None):
    """Get all refunds for a specific sale and fix any swapped amounts"""
    refunds = db.query(Refund).filter(Refund.sale_id == sale_id).all()
    for refund in refunds:
        sale = db.query(Sale).filter(Sale.id == refund.sale_id).first()
        if sale:
            refund.business_sale_number = sale.business_sale_number
    return [detect_and_fix_swapped_amounts(refund) for refund in refunds]

def get_refund(db: Session, refund_id: int, business_id: int = None):
    """Get a specific refund by ID and fix any swapped amounts"""
    refund = db.query(Refund).filter(Refund.id == refund_id).first()
    if refund:
        sale = db.query(Sale).filter(Sale.id == refund.sale_id).first()
        if sale:
            refund.business_sale_number = sale.business_sale_number
    return detect_and_fix_swapped_amounts(refund)

def get_refunds_by_business(db: Session, business_id: int, skip: int = 0, limit: int = 100):
    """Get all refunds for a business - use stored numbering"""
    refunds = db.query(Refund).filter(Refund.business_id == business_id)\
        .order_by(Refund.created_at.desc())\
        .offset(skip).limit(limit).all()
    for refund in refunds:
        sale = db.query(Sale).filter(Sale.id == refund.sale_id).first()
        if sale:
            refund.business_sale_number = sale.business_sale_number
    return [detect_and_fix_swapped_amounts(refund) for refund in refunds]

def fix_existing_swapped_refunds(db: Session):
    """Fix all existing refunds in the database that have swapped amounts"""
    swapped_refunds = db.query(Refund).filter(
        Refund.original_amount < 1,
        Refund.total_amount > 0.1
    ).all()
    fixed_count = 0
    for refund in swapped_refunds:
        print(f"Fixing refund {refund.id}: {refund.original_amount} <-> {refund.total_amount}")
        refund.total_amount, refund.original_amount = refund.original_amount, refund.total_amount
        fixed_count += 1
    if fixed_count > 0:
        db.commit()
        print(f"✅ Fixed {fixed_count} refunds with swapped amounts")
    return fixed_count
