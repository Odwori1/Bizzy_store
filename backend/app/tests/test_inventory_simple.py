import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.product import Product
from app.models.inventory import InventoryHistory
from app.models.user import User
from app.crud.inventory import (
    get_inventory_history,
    adjust_inventory,
    get_low_stock_items,
    get_stock_levels
)
from app.schemas.inventory_schema import InventoryAdjustment

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db():
    """Create a test database session"""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    # Create tables
    from app.models.base import Base
    Base.metadata.create_all(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def test_user(db):
    """Create a test user"""
    user = User(
        email="test@example.com",
        username="testuser",
        password_hash="testhash",
        role="admin",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture
def test_product(db):
    """Create a test product"""
    product = Product(
        name="Test Product",
        price=10.99,
        barcode="TEST123",
        stock_quantity=20,
        min_stock_level=5
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

def test_adjust_inventory_restock(db, test_product, test_user):
    """Test restocking inventory"""
    adjustment = InventoryAdjustment(
        product_id=test_product.id,
        quantity_change=10,
        reason="Restock test"
    )
    
    result = adjust_inventory(db, adjustment, test_user.id)
    assert result is not None
    assert result.stock_quantity == 30  # 20 + 10
    assert result.last_restocked is not None

def test_adjust_inventory_reduction(db, test_product, test_user):
    """Test reducing inventory"""
    adjustment = InventoryAdjustment(
        product_id=test_product.id,
        quantity_change=-5,
        reason="Damage adjustment"
    )
    
    result = adjust_inventory(db, adjustment, test_user.id)
    assert result.stock_quantity == 15  # 20 - 5

def test_adjust_inventory_insufficient_stock(db, test_product, test_user):
    """Test preventing negative stock"""
    adjustment = InventoryAdjustment(
        product_id=test_product.id,
        quantity_change=-100,  # More than available
        reason="Invalid adjustment"
    )
    
    result = adjust_inventory(db, adjustment, test_user.id)
    assert result is None  # Should return None for insufficient stock

def test_get_low_stock_items(db, test_product):
    """Test low stock detection"""
    # Set stock below minimum
    test_product.stock_quantity = 3
    db.commit()
    
    low_stock = get_low_stock_items(db)
    assert len(low_stock) == 1
    assert low_stock[0].id == test_product.id
    assert low_stock[0].stock_quantity == 3

def test_get_stock_levels(db, test_product):
    """Test stock levels reporting"""
    stock_levels = get_stock_levels(db)
    assert len(stock_levels) == 1
    assert stock_levels[0]["product_id"] == test_product.id
    assert stock_levels[0]["current_stock"] == 20
    assert stock_levels[0]["needs_restock"] == False

def test_get_inventory_history(db, test_product, test_user):
    """Test inventory history retrieval"""
    # First make an adjustment to create history
    adjustment = InventoryAdjustment(
        product_id=test_product.id,
        quantity_change=5,
        reason="Test history"
    )
    adjust_inventory(db, adjustment, test_user.id)
    
    history = get_inventory_history(db)
    assert len(history) == 1
    assert history[0].product_id == test_product.id
    assert history[0].quantity_change == 5
