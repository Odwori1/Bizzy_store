# Read the current file
with open('app/crud/refund.py', 'r') as f:
    content = f.read()

# Find and replace the refund creation section
old_code = '''        # 3. CREATE THE REFUND RECORD
        db_refund = Refund(
            sale_id=refund_data.sale_id,
            user_id=user_id,
            reason=refund_data.reason,
            total_amount=total_refund_amount,  # USD amount
            original_amount=total_original_refund_amount,  # Local currency amount
            original_currency=original_currency,
            exchange_rate_at_refund=exchange_rate,
            status="processed"
        )'''

new_code = '''        # 3. CREATE THE REFUND RECORD
        # Get the next business_refund_number for this business
        business_id = sale.business_id
        last_refund_number = db.query(Refund.business_refund_number).filter(
            Refund.business_id == business_id
        ).order_by(Refund.business_refund_number.desc()).first()
        next_refund_number = (last_refund_number[0] + 1) if last_refund_number and last_refund_number[0] else 1
        
        db_refund = Refund(
            sale_id=refund_data.sale_id,
            user_id=user_id,
            business_id=business_id,  # 🚨 CRITICAL: Add business_id
            business_refund_number=next_refund_number,  # 🚨 CRITICAL: Add virtual numbering
            reason=refund_data.reason,
            total_amount=total_refund_amount,  # USD amount
            original_amount=total_original_refund_amount,  # Local currency amount
            original_currency=original_currency,
            exchange_rate_at_refund=exchange_rate,
            status="processed"
        )'''

# Replace the code
content = content.replace(old_code, new_code)

# Write back
with open('app/crud/refund.py', 'w') as f:
    f.write(content)

print("Refund CRUD fix applied!")
