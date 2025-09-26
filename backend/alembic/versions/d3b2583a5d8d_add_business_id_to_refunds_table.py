"""Add business_id to refunds table - CORRECTED VERSION

Revision ID: d3b2583a5d8d
Revises: 62f159f3bb33
Create Date: 2025-09-24 20:14:18.153222

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'd3b2583a5d8d'
down_revision = '62f159f3bb33'
branch_labels = None
depends_on = None

def upgrade():
    # Step 1: First add the columns as nullable
    op.add_column('refunds', sa.Column('business_id', sa.Integer(), nullable=True))
    op.add_column('refunds', sa.Column('business_refund_number', sa.Integer(), nullable=True))
    
    # Step 2: Set default business_id for existing records
    # Use business_id from sales table if possible, otherwise default to 1
    op.execute("""
        UPDATE refunds 
        SET business_id = sales.business_id 
        FROM sales 
        WHERE refunds.sale_id = sales.id
    """)
    
    # Step 3: Set business_id for any remaining records
    op.execute("UPDATE refunds SET business_id = 1 WHERE business_id IS NULL")
    
    # Step 4: Now make business_id NOT NULL
    op.alter_column('refunds', 'business_id', nullable=False)
    
    # Step 5: Add foreign key constraint
    op.create_foreign_key(op.f('fk_refunds_business_id_businesses'), 'refunds', 'businesses', ['business_id'], ['id'])
    
    # Step 6: Drop the audit table
    op.drop_index(op.f('ix_user_business_audit_changed_at'), table_name='user_business_audit')
    op.drop_index(op.f('ix_user_business_audit_user_id'), table_name='user_business_audit')
    op.drop_table('user_business_audit')
    
    # Step 7: Fix users foreign key constraint
    op.drop_constraint('fk_users_business_id', 'users', type_='foreignkey')

def downgrade():
    # Recreate the audit table
    op.create_table('user_business_audit',
    sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('user_id', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('old_business_id', sa.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('new_business_id', sa.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('changed_by', sa.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('changed_at', postgresql.TIMESTAMP(), server_default=sa.text('now()'), autoincrement=False, nullable=False),
    sa.Column('change_type', sa.VARCHAR(length=20), autoincrement=False, nullable=False),
    sa.Column('reason', sa.VARCHAR(length=200), autoincrement=False, nullable=True),
    sa.ForeignKeyConstraint(['changed_by'], ['users.id'], name='fk_user_business_audit_changed_by_users', ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_user_business_audit_user_id_users', ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name='pk_user_business_audit')
    )
    op.create_index('ix_user_business_audit_user_id', 'user_business_audit', ['user_id'], unique=False)
    op.create_index('ix_user_business_audit_changed_at', 'user_business_audit', ['changed_at'], unique=False)
    
    # Drop the new columns
    op.drop_constraint('fk_refunds_business_id_businesses', 'refunds', type_='foreignkey')
    op.drop_column('refunds', 'business_refund_number')
    op.drop_column('refunds', 'business_id')
    
    # Restore users foreign key
    op.create_foreign_key('fk_users_business_id', 'users', 'businesses', ['business_id'], ['id'], ondelete='RESTRICT')
