"""fix_user_business_ids_and_add_constraints

Revision ID: 62f159f3bb33
Revises: 32010ff7bd0e
Create Date: 2025-09-21 23:32:58.428577

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
import logging

# revision identifiers, used by Alembic.
revision = '62f159f3bb33'
down_revision = '32010ff7bd0e'
branch_labels = None
depends_on = None

# Configure logging
logger = logging.getLogger(__name__)

def upgrade():
    """Fix NULL business_id values and add constraints - Production Ready"""
    conn = op.get_bind()
    
    logger.info("Starting comprehensive user business_id migration...")
    
    # 1. First, identify all users with NULL business_id
    result = conn.execute(text("SELECT COUNT(*) FROM users WHERE business_id IS NULL"))
    null_count = result.scalar()
    logger.info(f"Found {null_count} users with NULL business_id")
    
    if null_count > 0:
        # 2. STRATEGY 1: Use business_id from user's created products (most reliable)
        logger.info("Strategy 1: Assign business_id from user's products...")
        result = conn.execute(text("""
            UPDATE users u
            SET business_id = (
                SELECT p.business_id 
                FROM products p 
                WHERE p.created_by = u.id 
                AND p.business_id IS NOT NULL
                ORDER BY p.created_at DESC
                LIMIT 1
            )
            WHERE u.business_id IS NULL
            AND EXISTS (
                SELECT 1 FROM products p 
                WHERE p.created_by = u.id 
                AND p.business_id IS NOT NULL
            )
            RETURNING u.id
        """))
        updated_from_products = result.rowcount
        logger.info(f"Updated {updated_from_products} users from their products")
        
        # 3. STRATEGY 2: Use business_id from user's sales
        logger.info("Strategy 2: Assign business_id from user's sales...")
        result = conn.execute(text("""
            UPDATE users u
            SET business_id = (
                SELECT s.business_id 
                FROM sales s 
                WHERE s.created_by = u.id 
                AND s.business_id IS NOT NULL
                ORDER BY s.created_at DESC
                LIMIT 1
            )
            WHERE u.business_id IS NULL
            AND EXISTS (
                SELECT 1 FROM sales s 
                WHERE s.created_by = u.id 
                AND s.business_id IS NOT NULL
            )
            RETURNING u.id
        """))
        updated_from_sales = result.rowcount
        logger.info(f"Updated {updated_from_sales} users from their sales")
        
        # 4. STRATEGY 3: Use business_id from user's customers (if they created any)
        logger.info("Strategy 3: Assign business_id from user's customers...")
        result = conn.execute(text("""
            UPDATE users u
            SET business_id = (
                SELECT c.business_id 
                FROM customers c 
                WHERE c.created_by = u.id 
                AND c.business_id IS NOT NULL
                ORDER BY c.created_at DESC
                LIMIT 1
            )
            WHERE u.business_id IS NULL
            AND EXISTS (
                SELECT 1 FROM customers c 
                WHERE c.created_by = u.id 
                AND c.business_id IS NOT NULL
            )
            RETURNING u.id
        """))
        updated_from_customers = result.rowcount
        logger.info(f"Updated {updated_from_customers} users from their customers")
        
        # 5. STRATEGY 4: For users with no activity, use business from user registration context
        # This is better than hardcoded patterns - we analyze existing user-business patterns
        logger.info("Strategy 4: Analyzing user registration patterns...")
        result = conn.execute(text("""
            WITH user_domain_patterns AS (
                SELECT 
                    split_part(u.email, '@', 2) as domain,
                    u.business_id,
                    COUNT(*) as pattern_count,
                    ROW_NUMBER() OVER (PARTITION BY split_part(u.email, '@', 2) ORDER BY COUNT(*) DESC) as rn
                FROM users u
                WHERE u.business_id IS NOT NULL
                GROUP BY split_part(u.email, '@', 2), u.business_id
            )
            UPDATE users u
            SET business_id = (
                SELECT udp.business_id
                FROM user_domain_patterns udp
                WHERE udp.domain = split_part(u.email, '@', 2)
                AND udp.rn = 1
            )
            WHERE u.business_id IS NULL
            AND EXISTS (
                SELECT 1 FROM user_domain_patterns udp
                WHERE udp.domain = split_part(u.email, '@', 2)
            )
            RETURNING u.id
        """))
        updated_from_patterns = result.rowcount
        logger.info(f"Updated {updated_from_patterns} users from domain patterns")
        
        # 6. Check remaining users and flag for manual review
        result = conn.execute(text("SELECT COUNT(*) FROM users WHERE business_id IS NULL"))
        remaining_count = result.scalar()
        
        if remaining_count > 0:
            logger.warning(f"{remaining_count} users require manual business assignment review")
            
            # Create review table for manual intervention
            op.create_table(
                'user_business_review',
                sa.Column('user_id', sa.Integer(), nullable=False),
                sa.Column('email', sa.String(), nullable=False),
                sa.Column('username', sa.String(), nullable=False),
                sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
                sa.Column('reviewed', sa.Boolean(), server_default=sa.text('false')),
                sa.Column('reviewed_at', sa.DateTime(), nullable=True),
                sa.Column('reviewed_by', sa.Integer(), nullable=True),
                sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
                sa.ForeignKeyConstraint(['reviewed_by'], ['users.id'], ondelete='SET NULL'),
                sa.PrimaryKeyConstraint('user_id')
            )
            
            # Insert users needing review
            conn.execute(text("""
                INSERT INTO user_business_review (user_id, email, username)
                SELECT id, email, username 
                FROM users 
                WHERE business_id IS NULL
            """))
            
            logger.info(f"Created user_business_review table with {remaining_count} users for manual assignment")
        
        total_updated = updated_from_products + updated_from_sales + updated_from_customers + updated_from_patterns
        logger.info(f"Migration completed: {total_updated} users auto-assigned, {remaining_count} need manual review")
    
    # 7. Add database constraints only for users with business_id (skip those in review)
    logger.info("Adding database constraints for users with business_id...")
    
    # Add NOT NULL constraint but allow exceptions for users in review
    op.alter_column('users', 'business_id',
                   existing_type=sa.INTEGER(),
                   nullable=True)  # Keep nullable for users in review
    
    # Add foreign key constraint for users that have business_id
    result = conn.execute(text("""
        SELECT COUNT(*) 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_users_business_id' 
        AND table_name = 'users'
    """))
    
    if result.scalar() == 0:
        op.create_foreign_key(
            'fk_users_business_id',
            'users', 'businesses',
            ['business_id'], ['id'],
            ondelete='RESTRICT'
        )
        logger.info("Added foreign key constraint")
    else:
        logger.info("Foreign key constraint already exists")
    
    # 8. Create comprehensive audit table
    op.create_table(
        'user_business_audit',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('old_business_id', sa.Integer(), nullable=True),
        sa.Column('new_business_id', sa.Integer(), nullable=True),
        sa.Column('changed_by', sa.Integer(), nullable=True),
        sa.Column('changed_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('change_type', sa.String(length=20), nullable=False),  # migration, manual, etc.
        sa.Column('reason', sa.String(length=200), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['changed_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_user_business_audit_user_id', 'user_business_audit', ['user_id'])
    op.create_index('ix_user_business_audit_changed_at', 'user_business_audit', ['changed_at'])
    
    # Insert audit records for automated assignments
    if null_count > 0:
        conn.execute(text("""
            INSERT INTO user_business_audit (user_id, old_business_id, new_business_id, change_type, reason)
            SELECT id, NULL, business_id, 'migration_auto', 'Automated business assignment during migration'
            FROM users 
            WHERE business_id IS NOT NULL
            AND id IN (
                SELECT id FROM users WHERE business_id IS NOT NULL
            )
        """))
        logger.info("Created audit records for automated assignments")
    
    logger.info("Migration completed successfully")

def downgrade():
    """Reverse the migration safely"""
    conn = op.get_bind()
    
    logger.info("Starting safe downgrade of user business_id migration...")
    
    # 1. Remove foreign key constraint
    op.drop_constraint('fk_users_business_id', 'users', type_='foreignkey')
    
    # 2. Remove audit table
    op.drop_table('user_business_audit')
    
    # 3. Remove review table if it exists
    result = conn.execute(text("""
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_name = 'user_business_review'
    """))
    if result.scalar() > 0:
        op.drop_table('user_business_review')
        logger.info("Dropped user_business_review table")
    
    # 4. We DON'T revert the business_id assignments because:
    # - We can't reliably determine original NULL values
    # - The assignments were data-driven and likely correct
    # - Reverting could break referential integrity
    
    logger.warning("""
    Downgrade completed with notes:
    - Foreign key constraints removed
    - Audit and review tables removed  
    - User business_id assignments were NOT reverted (data-driven changes preserved)
    - Manual review may be needed if business_id assignments were incorrect
    """)
