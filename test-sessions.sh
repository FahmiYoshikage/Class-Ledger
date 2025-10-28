#!/bin/bash

# Test script untuk debugging Session Management

echo "=== Testing Session Management Endpoints ==="
echo ""

# Get token from login
echo "1. Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"jawirjawir"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed or token not found"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful"
echo "Token (first 50 chars): ${TOKEN:0:50}..."
echo ""

# Test /api/sessions endpoint
echo "2. Testing GET /api/sessions..."
SESSIONS_RESPONSE=$(curl -s -X GET http://localhost:5000/api/sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Response:"
echo "$SESSIONS_RESPONSE" | jq '.'
echo ""

# Test /api/sessions/stats endpoint
echo "3. Testing GET /api/sessions/stats..."
STATS_RESPONSE=$(curl -s -X GET http://localhost:5000/api/sessions/stats \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Response:"
echo "$STATS_RESPONSE" | jq '.'
echo ""

echo "=== Test Complete ==="

#