from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    # 1. First, backup the old table (just in case)
    op.execute("CREATE TABLE expenses_backup AS SELECT * FROM expenses")
    
    # 2. Drop the old table
    op.drop_table('expenses')
    
    # 3. Create the new clean table
    op.create_table('expenses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('description', sa.String(255), nullable=True),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('payment_method', sa.String(50), server_default='cash', nullable=True),
        sa.Column('receipt_url', sa.String(500), nullable=True),
        sa.Column('is_recurring', sa.Boolean(), server_default='false', nullable=True),
        sa.Column('recurrence_interval', sa.String(50), nullable=True),
        sa.Column('business_id', sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['business_id'], ['businesses.id'], ),
        sa.ForeignKeyConstraint(['category_id'], ['expense_categories.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], )
    )
    
    # 4. Create index
    op.create_index('ix_expenses_id', 'expenses', ['id'])

def downgrade():
    # 1. Drop the new table
    op.drop_table('expenses')
    
    # 2. Restore the old table from backup
    op.execute("CREATE TABLE expenses AS SELECT * FROM expenses_backup")
    
    # 3. Drop the backup table
    op.drop_table('expenses_backup')
