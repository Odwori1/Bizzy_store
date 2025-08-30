#!/bin/bash

# Get authentication token
echo "=== GETTING AUTH TOKEN ==="
TOKEN_RESPONSE=$(curl -s -X 'POST' \
  'http://localhost:8000/api/auth/token' \
  -H 'Content-Type: application/json' \
  -d '{
    "identifier": "newmanager",
    "password": "manager123"
  }')

# Extract and export token
ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
export ACCESS_TOKEN="$ACCESS_TOKEN"

echo "Token: $ACCESS_TOKEN"
echo ""

# Test 1: Create a new supplier
echo "=== TEST 1: CREATE SUPPLIER ==="
curl -X 'POST' \
  'http://localhost:8000/api/suppliers/' \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Tech Gadgets Inc.",
    "contact_person": "John Doe",
    "email": "john@techgadgets.com",
    "phone": "+1234567890",
    "address": "123 Tech Street, Silicon Valley, CA",
    "tax_id": "TAX-123456",
    "payment_terms": "Net 30"
  }'
echo ""
echo ""

# Test 2: Create another supplier
echo "=== TEST 2: CREATE SECOND SUPPLIER ==="
curl -X 'POST' \
  'http://localhost:8000/api/suppliers/' \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Electronics World Ltd.",
    "contact_person": "Sarah Chen",
    "email": "sarah@electronicsworld.com",
    "phone": "+1987654321",
    "address": "456 Circuit Ave, Tech City, NY",
    "tax_id": "TAX-789012",
    "payment_terms": "Net 15"
  }'
echo ""
echo ""

# Test 3: Get all suppliers
echo "=== TEST 3: GET ALL SUPPLIERS ==="
curl -X 'GET' \
  'http://localhost:8000/api/suppliers/' \
  -H "Authorization: Bearer $ACCESS_TOKEN"
echo ""
echo ""

# Test 4: Get specific supplier (ID 1)
echo "=== TEST 4: GET SPECIFIC SUPPLIER (ID 1) ==="
curl -X 'GET' \
  'http://localhost:8000/api/suppliers/1' \
  -H "Authorization: Bearer $ACCESS_TOKEN"
echo ""
echo ""

# Test 5: Update supplier
echo "=== TEST 5: UPDATE SUPPLIER ==="
curl -X 'PUT' \
  'http://localhost:8000/api/suppliers/1' \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "contact_person": "Jane Smith",
    "email": "jane@techgadgets.com"
  }'
echo ""
echo ""

# Test 6: Verify update worked
echo "=== TEST 6: VERIFY UPDATE ==="
curl -X 'GET' \
  'http://localhost:8000/api/suppliers/1' \
  -H "Authorization: Bearer $ACCESS_TOKEN"
echo ""
echo ""

# Test 7: Create purchase order
echo "=== TEST 7: CREATE PURCHASE ORDER ==="
curl -X 'POST' \
  'http://localhost:8000/api/suppliers/purchase-orders/' \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "supplier_id": 1,
    "expected_delivery": "2025-01-15T00:00:00",
    "notes": "Urgent order for new products",
    "items": [
      {
        "product_id": 1,
        "quantity": 10,
        "unit_cost": 29.99,
        "notes": "Wireless headphones"
      },
      {
        "product_id": 2,
        "quantity": 5,
        "unit_cost": 99.99,
        "notes": "Smart watches"
      }
    ]
  }'
echo ""
echo ""

# Test 8: Get all purchase orders
echo "=== TEST 8: GET ALL PURCHASE ORDERS ==="
curl -X 'GET' \
  'http://localhost:8000/api/suppliers/purchase-orders/' \
  -H "Authorization: Bearer $ACCESS_TOKEN"
echo ""
echo ""

# Test 9: Get specific purchase order
echo "=== TEST 9: GET SPECIFIC PURCHASE ORDER ==="
curl -X 'GET' \
  'http://localhost:8000/api/suppliers/purchase-orders/1' \
  -H "Authorization: Bearer $ACCESS_TOKEN"
echo ""
echo ""

# Test 10: Update PO status to ordered
echo "=== TEST 10: UPDATE PO STATUS TO ORDERED ==="
curl -X 'PATCH' \
  'http://localhost:8000/api/suppliers/purchase-orders/1/status?status=ordered' \
  -H "Authorization: Bearer $ACCESS_TOKEN"
echo ""
echo ""

# Test 11: Verify PO status update
echo "=== TEST 11: VERIFY PO STATUS UPDATE ==="
curl -X 'GET' \
  'http://localhost:8000/api/suppliers/purchase-orders/1' \
  -H "Authorization: Bearer $ACCESS_TOKEN"
echo ""
echo ""

# Test 12: Receive PO items
echo "=== TEST 12: RECEIVE PO ITEMS ==="
curl -X 'POST' \
  'http://localhost:8000/api/suppliers/purchase-orders/1/receive' \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '[
    {
      "item_id": 1,
      "quantity": 10
    },
    {
      "item_id": 2,
      "quantity": 5
    }
  ]'
echo ""
echo ""

# Test 13: Verify PO status after receiving
echo "=== TEST 13: VERIFY PO STATUS AFTER RECEIVING ==="
curl -X 'GET' \
  'http://localhost:8000/api/suppliers/purchase-orders/1' \
  -H "Authorization: Bearer $ACCESS_TOKEN"
echo ""
echo ""

# Test 14: Try to create supplier with duplicate name
echo "=== TEST 14: TEST DUPLICATE SUPPLIER ==="
curl -X 'POST' \
  'http://localhost:8000/api/suppliers/' \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Tech Gadgets Inc.",
    "contact_person": "Another Person"
  }'
echo ""
echo ""

# Test 15: Try to get non-existent supplier
echo "=== TEST 15: TEST NON-EXISTENT SUPPLIER ==="
curl -X 'GET' \
  'http://localhost:8000/api/suppliers/999' \
  -H "Authorization: Bearer $ACCESS_TOKEN"
echo ""
echo ""

# Test 16: Try invalid PO status
echo "=== TEST 16: TEST INVALID PO STATUS ==="
curl -X 'PATCH' \
  'http://localhost:8000/api/suppliers/purchase-orders/1/status?status=invalid' \
  -H "Authorization: Bearer $ACCESS_TOKEN"
echo ""
echo ""

# Test 17: Delete supplier
echo "=== TEST 17: DELETE SUPPLIER ==="
curl -X 'DELETE' \
  'http://localhost:8000/api/suppliers/2' \
  -H "Authorization: Bearer $ACCESS_TOKEN"
echo ""
echo ""

# Test 18: Verify supplier was deleted
echo "=== TEST 18: VERIFY SUPPLIER DELETION ==="
curl -X 'GET' \
  'http://localhost:8000/api/suppliers/2' \
  -H "Authorization: Bearer $ACCESS_TOKEN"
echo ""
echo ""

# Test 19: Get all suppliers after operations
echo "=== TEST 19: FINAL SUPPLIERS LIST ==="
curl -X 'GET' \
  'http://localhost:8000/api/suppliers/' \
  -H "Authorization: Bearer $ACCESS_TOKEN"
echo ""
echo ""

# Test 20: Get all purchase orders after operations
echo "=== TEST 20: FINAL PURCHASE ORDERS LIST ==="
curl -X 'GET' \
  'http://localhost:8000/api/suppliers/purchase-orders/' \
  -H "Authorization: Bearer $ACCESS_TOKEN"
echo ""
echo ""

echo "=== SUPPLIER MANAGEMENT TESTS COMPLETED ==="
