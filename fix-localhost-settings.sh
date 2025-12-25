#!/bin/bash
# Fix localhost semester settings to match production expectations

API_URL="http://localhost:5000/api"

echo "🔧 Fixing localhost semester settings..."
echo ""

# Update start_date
echo "📅 Setting start_date to 2025-10-27..."
curl -s -X POST "$API_URL/settings" \
  -H "Content-Type: application/json" \
  -d '{"key":"start_date","value":"2025-10-27"}' | jq '.'

# Update paused_week to 7
echo ""
echo "⏸️ Setting paused_week to 7..."
curl -s -X POST "$API_URL/settings" \
  -H "Content-Type: application/json" \
  -d '{"key":"paused_week","value":7}' | jq '.'

# Keep semester_status as paused
echo ""
echo "⏸️ Confirming semester_status as paused..."
curl -s -X POST "$API_URL/settings" \
  -H "Content-Type: application/json" \
  -d '{"key":"semester_status","value":"paused"}' | jq '.'

echo ""
echo "✅ Settings updated! Now check current week:"
curl -s "$API_URL/settings/current-week" | jq '.'

echo ""
echo "🎯 Expected result: currentWeek should be 7 (paused)"
