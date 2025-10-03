"""fix_sequence_synchronization

Revision ID: b405030c954c
Revises: a9e561753aa8
Create Date: 2025-10-01 09:53:33.902269

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import orm
from sqlalchemy.ext.declarative import declarative_base

# revision identifiers, used by Alembic.
revision = 'b405030c954c'
down_revision = 'a9e561753aa8'
branch_labels = None
depends_on = None

Base = declarative_base()

class Sale(Base):
    __tablename__ = 'sales'
    id = sa.Column(sa.Integer, primary_key=True)
    business_id = sa.Column(sa.Integer)
    business_sale_number = sa.Column(sa.Integer)
    created_at = sa.Column(sa.DateTime)  # 🆕 ADDED THIS FIELD

class Product(Base):
    __tablename__ = 'products'
    id = sa.Column(sa.Integer, primary_key=True)
    business_id = sa.Column(sa.Integer)
    business_product_number = sa.Column(sa.Integer)
    created_at = sa.Column(sa.DateTime)  # 🆕 ADDED THIS FIELD

class Expense(Base):
    __tablename__ = 'expenses'
    id = sa.Column(sa.Integer, primary_key=True)
    business_id = sa.Column(sa.Integer)
    business_expense_number = sa.Column(sa.Integer)
    date = sa.Column(sa.DateTime)  # 🆕 ADDED THIS FIELD

class BusinessSequence(Base):
    __tablename__ = 'business_sequences'
    business_id = sa.Column(sa.Integer, primary_key=True)
    entity_type = sa.Column(sa.String, primary_key=True)
    last_number = sa.Column(sa.Integer)

def upgrade():
    bind = op.get_bind()
    session = orm.Session(bind=bind)
    
    try:
        print("Fixing sequence synchronization for all businesses...")
        
        # 1. Fix sales sequences
        print("\n1. Synchronizing sales sequences...")
        sales_businesses = session.query(Sale.business_id).distinct().all()
        for (business_id,) in sales_businesses:
            # Get the maximum business_sale_number for this business
            max_sale_number = session.query(
                sa.func.max(Sale.business_sale_number)
            ).filter(
                Sale.business_id == business_id,
                Sale.business_sale_number.isnot(None)
            ).scalar()
            
            if max_sale_number:
                # Update or create sequence
                sequence = session.query(BusinessSequence).filter(
                    BusinessSequence.business_id == business_id,
                    BusinessSequence.entity_type == 'sale'
                ).first()
                
                if sequence:
                    if sequence.last_number < max_sale_number:
                        print(f"  Business {business_id}: Fixing sales sequence from {sequence.last_number} to {max_sale_number}")
                        sequence.last_number = max_sale_number
                    else:
                        print(f"  Business {business_id}: Sales sequence OK ({sequence.last_number})")
                else:
                    print(f"  Business {business_id}: Creating sales sequence at {max_sale_number}")
                    sequence = BusinessSequence(
                        business_id=business_id,
                        entity_type='sale',
                        last_number=max_sale_number
                    )
                    session.add(sequence)
        
        # 2. Fix product sequences
        print("\n2. Synchronizing product sequences...")
        product_businesses = session.query(Product.business_id).distinct().all()
        for (business_id,) in product_businesses:
            max_product_number = session.query(
                sa.func.max(Product.business_product_number)
            ).filter(
                Product.business_id == business_id,
                Product.business_product_number.isnot(None)
            ).scalar()
            
            if max_product_number:
                sequence = session.query(BusinessSequence).filter(
                    BusinessSequence.business_id == business_id,
                    BusinessSequence.entity_type == 'product'
                ).first()
                
                if sequence:
                    if sequence.last_number < max_product_number:
                        print(f"  Business {business_id}: Fixing product sequence from {sequence.last_number} to {max_product_number}")
                        sequence.last_number = max_product_number
                    else:
                        print(f"  Business {business_id}: Product sequence OK ({sequence.last_number})")
                else:
                    print(f"  Business {business_id}: Creating product sequence at {max_product_number}")
                    sequence = BusinessSequence(
                        business_id=business_id,
                        entity_type='product',
                        last_number=max_product_number
                    )
                    session.add(sequence)
        
        # 3. Fix expense sequences
        print("\n3. Synchronizing expense sequences...")
        expense_businesses = session.query(Expense.business_id).distinct().all()
        for (business_id,) in expense_businesses:
            max_expense_number = session.query(
                sa.func.max(Expense.business_expense_number)
            ).filter(
                Expense.business_id == business_id,
                Expense.business_expense_number.isnot(None)
            ).scalar()
            
            if max_expense_number:
                sequence = session.query(BusinessSequence).filter(
                    BusinessSequence.business_id == business_id,
                    BusinessSequence.entity_type == 'expense'
                ).first()
                
                if sequence:
                    if sequence.last_number < max_expense_number:
                        print(f"  Business {business_id}: Fixing expense sequence from {sequence.last_number} to {max_expense_number}")
                        sequence.last_number = max_expense_number
                    else:
                        print(f"  Business {business_id}: Expense sequence OK ({sequence.last_number})")
                else:
                    print(f"  Business {business_id}: Creating expense sequence at {max_expense_number}")
                    sequence = BusinessSequence(
                        business_id=business_id,
                        entity_type='expense',
                        last_number=max_expense_number
                    )
                    session.add(sequence)
        
        session.commit()
        print("\n✅ Sequence synchronization completed for all businesses!")
        
        # 4. Check for and fix duplicate numbers
        print("\n4. Checking for duplicate numbers...")
        
        # Check sales duplicates
        sales_duplicates = session.query(
            Sale.business_id, Sale.business_sale_number, sa.func.count('*').label('count')
        ).filter(
            Sale.business_sale_number.isnot(None)
        ).group_by(
            Sale.business_id, Sale.business_sale_number
        ).having(
            sa.func.count('*') > 1
        ).all()
        
        if sales_duplicates:
            print("❌ Found sales duplicates that need fixing:")
            for biz_id, sale_num, count in sales_duplicates:
                print(f"  Business {biz_id}, Sale #{sale_num}: {count} duplicates")
                
                # Fix duplicates by renumbering chronologically
                duplicate_sales = session.query(Sale).filter(
                    Sale.business_id == biz_id,
                    Sale.business_sale_number == sale_num
                ).order_by(Sale.created_at).all()
                
                # Keep the first one, renumber the rest
                for idx, sale in enumerate(duplicate_sales):
                    if idx == 0:
                        continue  # Keep the original number for the first one
                    # Get next available number
                    max_num = session.query(sa.func.max(Sale.business_sale_number)).filter(
                        Sale.business_id == biz_id
                    ).scalar()
                    new_number = max_num + 1 if max_num else 1
                    print(f"    Renumbering sale ID {sale.id} from #{sale_num} to #{new_number}")
                    sale.business_sale_number = new_number
                
                session.commit()
        else:
            print("✅ No sales duplicate numbers found!")
        
        print("\n🎉 Sequence synchronization fix completed successfully!")
        
    except Exception as e:
        session.rollback()
        print(f"❌ Fix failed: {e}")
        raise
    finally:
        session.close()

def downgrade():
    # This is a data fix, no downgrade needed for data
    pass
