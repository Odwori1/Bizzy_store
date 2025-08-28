import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.database import get_db
from app.models.product import Product
from app.models.user import User
from app.core.auth import create_access_token

client = TestClient(app)

# Test data
TEST_PRODUCT = {
    "name": "Test Product",
    "description": "Test product for inventory testing",
    "price": 10.99,
    "barcode": "TEST123456",
    "stock_quantity": 20,
    "min_stock_level": 5
}

def override_get_db():
    """Override get_db dependency for testing"""
    try:
        db = Session()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
def test_user(db: Session):
    """Create a test user"""
    user = User(
        email="test@example.com",
        username="testuser",
        password_hash="hashed_password",  # In real tests, use proper hashing
        role="admin",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture
def test_product(db: Session):
    """Create a test product"""
    product = Product(**TEST_PRODUCT)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

@pytest.fixture
def auth_token(test_user):
    """Create auth token for test user"""
    return create_access_token({"sub": test_user.email, "id": test_user.id, "role": test_user.role})

def test_get_inventory_history_unauthorized():
    """Test that inventory history requires authentication"""
    response = client.get("/api/inventory/history")
    assert response.status_code == 401

def test_get_inventory_history_authorized(auth_token, test_product, db: Session):
    """Test retrieving inventory history with auth"""
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.get("/api/inventory/history", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_adjust_inventory_restock(auth_token, test_product, db: Session):
    """Test restocking inventory"""
    headers = {"Authorization": f"Bearer {auth_token}"}
    adjustment_data = {
        "product_id": test_product.id,
        "quantity_change": 10,
        "reason": "Restock test"
    }
    
    response = client.post("/api/inventory/adjust", json=adjustment_data, headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["product_id"] == test_product.id
    assert data["current_stock"] == 30  # 20 initial + 10 restock
    assert data["needs_restock"] == False

def test_adjust_inventory_reduce_stock(auth_token, test_product, db: Session):
    """Test reducing inventory stock"""
    headers = {"Authorization": f"Bearer {auth_token}"}
    adjustment_data = {
        "product_id": test_product.id,
        "quantity_change": -5,
        "reason": "Damage adjustment"
    }
    
    response = client.post("/api/inventory/adjust", json=adjustment_data, headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["current_stock"] == 15  # 20 initial - 5 adjustment
    assert data["needs_restock"] == False

def test_adjust_inventory_insufficient_stock(auth_token, test_product, db: Session):
    """Test preventing negative stock"""
    headers = {"Authorization": f"Bearer {auth_token}"}
    adjustment_data = {
        "product_id": test_product.id,
        "quantity_change": -100,  # Try to remove more than available
        "reason": "Invalid adjustment"
    }
    
    response = client.post("/api/inventory/adjust", json=adjustment_data, headers=headers)
    assert response.status_code == 400
    assert "Insufficient stock" in response.json()["detail"]

def test_get_low_stock_alerts(auth_token, test_product, db: Session):
    """Test low stock alerts"""
    # First, reduce stock below minimum level
    test_product.stock_quantity = 3  # Below min_stock_level of 5
    db.commit()
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.get("/api/inventory/low-stock", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert len(data) == 1
    assert data[0]["product_id"] == test_product.id
    assert data[0]["current_stock"] == 3
    assert data[0]["min_stock_level"] == 5

def test_get_stock_levels(auth_token, test_product, db: Session):
    """Test getting all stock levels"""
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.get("/api/inventory/stock-levels", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert len(data) == 1
    assert data[0]["product_id"] == test_product.id
    assert data[0]["product_name"] == "Test Product"
    assert data[0]["current_stock"] == 20
