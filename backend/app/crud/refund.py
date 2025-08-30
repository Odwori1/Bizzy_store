from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List

from app.models.refund import Refund, RefundItem
from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.models.inventory import InventoryHistory
from app.schemas.refund_schema import RefundCreate

def process_refund(db: Session, refund_data: RefundCreate, user_id: int):
    """
    Process a refund for a sale. This function:
    1. Validates the refund request
    2. Creates Refund and RefundItem records
    3. Updates sale_items.refunded_quantity
    4. Restores product inventory
    5. Logs inventory history
    """
    try:
        # 1. VALIDATION: Get the sale and ensure it exists
        sale = db.query(Sale).filter(Sale.id == refund_data.sale_id).first()
        if not sale:
            raise ValueError(f"Sale with ID {refund_data.sale_id} not found.")

        total_refund_amount = 0.0
        refund_items_to_create = []

        # Pre-fetch all sale items for this sale to avoid repeated queries
        sale_items_map = {item.id: item for item in sale.sale_items}

        # 2. VALIDATION: Validate each item in the refund request
        for item in refund_data.refund_items:
            sale_item = sale_items_map.get(item.sale_item_id)
            
            # Check if the sale item exists and belongs to the correct sale
            if not sale_item:
                raise ValueError(f"Sale item with ID {item.sale_item_id} not found in sale #{sale.id}.")
            
            # Check if trying to refund more than was purchased
            total_possible_to_refund = sale_item.quantity - sale_item.refunded_quantity
            if item.quantity > total_possible_to_refund:
                raise ValueError(f"Cannot refund {item.quantity} of '{sale_item.product.name}'. Only {total_possible_to_refund} units are eligible for refund.")
            
            # Calculate the amount to refund for this item
            item_refund_amount = item.quantity * sale_item.unit_price
            total_refund_amount += item_refund_amount

            # Prepare data for RefundItem creation
            refund_items_to_create.append({
                "sale_item_id": item.sale_item_id,
                "quantity": item.quantity,
                "refund_amount": item_refund_amount
            })

        # 3. CREATE THE REFUND RECORD
        db_refund = Refund(
            sale_id=refund_data.sale_id,
            user_id=user_id,
            reason=refund_data.reason,
            total_amount=total_refund_amount,
            status="processed"
        )
        db.add(db_refund)
        db.flush()  # Get the refund ID without committing the transaction

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

            # Get the product to restore inventory
            product = db.query(Product).filter(Product.id == sale_item.product_id).first()
            if product:
                previous_quantity = product.stock_quantity
                product.stock_quantity += quantity_to_refund  # Restore the stock

                # Record inventory history
                inventory_history = InventoryHistory(
                    product_id=product.id,
                    change_type="refund",
                    quantity_change=quantity_to_refund,  # Positive for refund/restock
                    previous_quantity=previous_quantity,
                    new_quantity=product.stock_quantity,
                    reason=f"Refund #{db_refund.id} for Sale #{sale.id}",
                    changed_by=user_id
                )
                db.add(inventory_history)

        # 5. OPTIONAL: Update sale payment_status if entire sale is refunded
        total_sale_refunded = all(
            (sale_item.refunded_quantity == sale_item.quantity) 
            for sale_item in sale.sale_items
        )
        if total_sale_refunded:
            sale.payment_status = "refunded"

        db.commit()
        db.refresh(db_refund)
        return db_refund

    except (ValueError, IntegrityError) as e:
        db.rollback()
        raise e

def get_refunds_by_sale(db: Session, sale_id: int):
    """Get all refunds for a specific sale"""
    return db.query(Refund).filter(Refund.sale_id == sale_id).all()

def get_refund(db: Session, refund_id: int):
    """Get a specific refund by ID"""
    return db.query(Refund).filter(Refund.id == refund_id).first()
