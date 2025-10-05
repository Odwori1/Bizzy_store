#!/bin/bash

echo "=== Final Authentication Test ==="

# Test all users
users=("cashier1:cashier123" "testuser:testuser123" "newuser:newuser123")
for user_pass in "${users[@]}"; do
    IFS=':' read -r username password <<< "$user_pass"
    echo "Testing $username..."
    response=$(curl -s -X POST "http://localhost:8000/api/auth/token" \
      -H "Content-Type: application/json" \
      -d "{\"identifier\": \"$username\", \"password\": \"$password\"}")
    
    if echo "$response" | grep -q "access_token"; then
        echo "✅ SUCCESS: $username authentication worked"
    else
        echo "❌ FAILED: $username authentication failed"
        echo "Response: $response"
    fi
    echo "---"
done

echo "=== Test Complete ==="
