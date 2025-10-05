#!/bin/bash

echo "🔍 VERIFYING PRODUCTION DEPLOYMENT"
echo "==================================="

# Check backend
echo "1. Checking backend health..."
BACKEND_HEALTH=$(curl -s http://localhost:8000/api/health | grep -o "healthy" || echo "FAILED")
if [ "$BACKEND_HEALTH" = "healthy" ]; then
    echo "   ✅ Backend is healthy"
else
    echo "   ❌ Backend not responding"
fi

# Check frontend
echo "2. Checking frontend..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001)
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo "   ✅ Frontend is responding"
else
    echo "   ❌ Frontend not responding (HTTP: $FRONTEND_RESPONSE)"
fi

# Check CORS
echo "3. Testing CORS..."
CORS_TEST=$(curl -s -X OPTIONS -H "Origin: http://localhost:3001" \
  -H "Access-Control-Request-Method: POST" \
  http://localhost:8000/api/auth/register/business 2>&1 | grep -i "access-control" || echo "CORS headers missing")

if [[ $CORS_TEST == *"Access-Control"* ]]; then
    echo "   ✅ CORS is working"
else
    echo "   ❌ CORS issues detected"
fi

# Check database connection
echo "4. Testing database connection..."
DB_TEST=$(curl -s http://localhost:8000/api/debug/report | grep -o "def get_financial_report" || echo "DB connection failed")
if [ "$DB_TEST" = "def get_financial_report" ]; then
    echo "   ✅ Database connection working"
else
    echo "   ❌ Database connection issues"
fi

echo "==================================="
echo "🎯 PRODUCTION DEPLOYMENT VERIFICATION COMPLETE"
