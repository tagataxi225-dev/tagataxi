#!/bin/bash

# Script de test pour le webhook Orange Money B2B RDC
# Usage: ./test-orange-webhook.sh [transaction_id]

set -e

WEBHOOK_URL="https://wddlktajnhwhyquwcdgf.supabase.co/functions/v1/orange-money-webhook"

# Couleurs pour le terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing Orange Money Webhook${NC}"
echo "================================"
echo ""

# Test 1: Health check
echo -e "${YELLOW}Test 1: Health Check${NC}"
echo "---"
curl -s -X GET "${WEBHOOK_URL}/health" | jq .
echo ""
echo -e "${GREEN}✓ Health check completed${NC}"
echo ""

# Test 2: Invalid endpoint (should return 404)
echo -e "${YELLOW}Test 2: Invalid Endpoint (expecting 404)${NC}"
echo "---"
curl -s -X POST "${WEBHOOK_URL}/invalid" \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
echo ""
echo -e "${GREEN}✓ Invalid endpoint test completed${NC}"
echo ""

# Test 3: SUCCESS notification
TRANSACTION_ID="${1:-KWENDA_$(date +%s)_test}"
echo -e "${YELLOW}Test 3: SUCCESS Notification${NC}"
echo "Transaction ID: ${TRANSACTION_ID}"
echo "---"
curl -s -X POST "${WEBHOOK_URL}/notifications" \
  -H "Content-Type: application/json" \
  -d "{
    \"partnerTransactionId\": \"${TRANSACTION_ID}\",
    \"transactionStatus\": \"SUCCESS\",
    \"transactionId\": \"OM-TEST-$(date +%s)\",
    \"amount\": 500,
    \"currency\": \"CDF\",
    \"peerId\": \"243999999999\"
  }" | jq .
echo ""
echo -e "${GREEN}✓ SUCCESS notification test completed${NC}"
echo ""

# Test 4: FAILED notification
TRANSACTION_ID_FAILED="KWENDA_$(date +%s)_failed"
echo -e "${YELLOW}Test 4: FAILED Notification${NC}"
echo "Transaction ID: ${TRANSACTION_ID_FAILED}"
echo "---"
curl -s -X POST "${WEBHOOK_URL}/notifications" \
  -H "Content-Type: application/json" \
  -d "{
    \"partnerTransactionId\": \"${TRANSACTION_ID_FAILED}\",
    \"transactionStatus\": \"FAILED\",
    \"transactionId\": \"OM-FAILED-$(date +%s)\",
    \"amount\": 1000,
    \"currency\": \"CDF\",
    \"errorCode\": \"INSUFFICIENT_FUNDS\",
    \"errorMessage\": \"Solde insuffisant\"
  }" | jq .
echo ""
echo -e "${GREEN}✓ FAILED notification test completed${NC}"
echo ""

# Test 5: PENDING notification
TRANSACTION_ID_PENDING="KWENDA_$(date +%s)_pending"
echo -e "${YELLOW}Test 5: PENDING Notification${NC}"
echo "Transaction ID: ${TRANSACTION_ID_PENDING}"
echo "---"
curl -s -X POST "${WEBHOOK_URL}/notifications" \
  -H "Content-Type: application/json" \
  -d "{
    \"partnerTransactionId\": \"${TRANSACTION_ID_PENDING}\",
    \"transactionStatus\": \"PENDING\",
    \"transactionId\": \"OM-PENDING-$(date +%s)\",
    \"amount\": 2000,
    \"currency\": \"CDF\"
  }" | jq .
echo ""
echo -e "${GREEN}✓ PENDING notification test completed${NC}"
echo ""

# Test 6: Missing required fields
echo -e "${YELLOW}Test 6: Missing Required Fields${NC}"
echo "---"
curl -s -X POST "${WEBHOOK_URL}/notifications" \
  -H "Content-Type: application/json" \
  -d "{
    \"amount\": 500
  }" | jq .
echo ""
echo -e "${GREEN}✓ Missing fields test completed${NC}"
echo ""

echo "================================"
echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo -e "${BLUE}📝 Next steps:${NC}"
echo "1. Check Supabase logs at:"
echo "   https://supabase.com/dashboard/project/wddlktajnhwhyquwcdgf/functions/orange-money-webhook/logs"
echo ""
echo "2. Create a test transaction in payment_transactions table with:"
echo "   transaction_id = '${TRANSACTION_ID}'"
echo "   status = 'processing'"
echo "   payment_provider = 'orange'"
echo ""
echo "3. Re-run this script to test with a real transaction:"
echo "   ./test-orange-webhook.sh ${TRANSACTION_ID}"
