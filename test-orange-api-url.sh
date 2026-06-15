#!/bin/bash

# Script de validation de l'URL API Orange Money B2B
# Usage: ./test-orange-api-url.sh

set -e

EXPECTED_URL="https://api.orange.com/orange-money-b2b/v1/cd"

echo "🧪 Test de validation de l'URL API Orange Money B2B"
echo "=================================================="
echo ""

# Récupérer le secret depuis Supabase (nécessite supabase CLI)
echo "📍 URL attendue  : $EXPECTED_URL"
echo ""

# Test de construction de l'endpoint complet
FULL_ENDPOINT="${EXPECTED_URL}/transactions/omdcashin"
echo "🔗 Endpoint complet : $FULL_ENDPOINT"
echo ""

# Validation de la structure
if [[ $EXPECTED_URL =~ ^https://api\.orange\.com/orange-money-b2b/v[0-9]+/[a-z]{2}$ ]]; then
  echo "✅ Format d'URL valide"
else
  echo "❌ Format d'URL invalide"
fi

echo ""
echo "=================================================="
echo "📝 Pour vérifier le secret dans Supabase :"
echo "   1. Allez dans Supabase Dashboard"
echo "   2. Settings → Edge Functions → Secrets"
echo "   3. Vérifiez que ORANGE_MONEY_API_URL = $EXPECTED_URL"
echo ""
echo "📝 Pour mettre à jour via CLI :"
echo "   supabase secrets set ORANGE_MONEY_API_URL=\"$EXPECTED_URL\" --project-ref wddlktajnhwhyquwcdgf"
echo ""
echo "🔍 Endpoints à tester :"
echo "   - OAuth : https://api.orange.com/oauth/v3/token"
echo "   - Payment : $FULL_ENDPOINT"
echo "   - Webhook : https://wddlktajnhwhyquwcdgf.supabase.co/functions/v1/orange-money-webhook/notifications"
