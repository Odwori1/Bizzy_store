#!/bin/bash

# Get a new token using python3
TOKEN=$(curl -s -X 'POST' \
  'http://localhost:8000/api/auth/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'username=test@example.com&password=testpassword' | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

echo "Token obtained: $TOKEN"
echo

# Test sales endpoint (should be empty initially)
echo "Testing sales endpoint (should be empty initially):"
curl -s -X 'GET' "http://localhost:8000/api/sales/" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo

# Check available products
echo "Available products:"
curl -s -X 'GET' "http://localhost:8000/api/products/" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo

# Check available users (to get a valid user_id)
echo "Available users:"
curl -s -X 'GET' "http://localhost:8000/api/users/1" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo

# Use the first available product (ID 1 from your output)
PRODUCT_ID=1
echo "Using product ID: $PRODUCT_ID"
echo

# Create a test sale
echo "Creating test sale:"
curl -s -X 'POST' \
  "http://localhost:8000/api/sales/" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": 1,
    "sale_items": [
      {
        "product_id": '$PRODUCT_ID',
        "quantity": 2,
        "unit_price": 10.99
      }
    ],
    "payments": [
      {
        "amount": 25.50,
        "payment_method": "cash"
      }
    ],
    "tax_rate": 16.0
  }' | python3 -m json.tool
echo

# Verify the sale was created
echo "Sales list after creation:"
curl -s -X 'GET' "http://localhost:8000/api/sales/" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo

# Test daily sales report
echo "Daily sales report:"
curl -s -X 'GET' "http://localhost:8000/api/sales/reports/daily" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo

# Verify inventory was updated
echo "Inventory stock levels after sale:"
curl -s -X 'GET' "http://localhost:8000/api/inventory/stock-levels" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo

# Verify inventory history shows the sale
echo "Inventory history (should show sale deduction):"
curl -s -X 'GET' "http://localhost:8000/api/inventory/history" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
