/**
 * 🛒 TEST DE CHARGE - NAVIGATION MARKETPLACE
 * 
 * Simule 100 utilisateurs naviguant sur le marketplace
 * Objectif : < 300ms pour 95% des requêtes de listing
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Métriques personnalisées
const productLoadSuccess = new Rate('product_load_success');
const productLoadDuration = new Trend('product_load_duration');
const searchDuration = new Trend('search_duration');

// Configuration du test
export const options = {
  stages: [
    { duration: '1m', target: 20 },   // Montée
    { duration: '5m', target: 100 },  // Pic 100 users
    { duration: '2m', target: 50 },   // Descente
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<300'],
    'product_load_success': ['rate>0.98'],
    'http_req_failed': ['rate<0.02'],
  },
};

const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://wddlktajnhwhyquwcdgf.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZGxrdGFqbmh3aHlxdXdjZGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNDA1NjUsImV4cCI6MjA2OTcxNjU2NX0.rViBegpawtg1sFwafH_fczlB0oeA8E6V3MtDELcSIiU';

const SEARCH_TERMS = ['phone', 'laptop', 'shoes', 'clothes', 'electronics'];
const CATEGORIES = ['Électronique', 'Mode', 'Maison', 'Alimentation'];

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  };

  // Scénario 1 : Listing principal (30% des users)
  if (Math.random() < 0.3) {
    const startTime = new Date().getTime();
    
    const productsResponse = http.get(
      `${SUPABASE_URL}/rest/v1/marketplace_products?is_active=eq.true&order=created_at.desc&limit=20&select=id,name,price,product_images,seller_id,rating_average,sales_count`,
      { headers }
    );

    const duration = new Date().getTime() - startTime;
    productLoadDuration.add(duration);

    const success = check(productsResponse, {
      'Listing produits OK': (r) => r.status === 200,
      'Produits retournés': (r) => JSON.parse(r.body).length > 0,
    });

    productLoadSuccess.add(success);
  }

  // Scénario 2 : Recherche (40% des users)
  else if (Math.random() < 0.7) {
    const searchTerm = SEARCH_TERMS[Math.floor(Math.random() * SEARCH_TERMS.length)];
    const startTime = new Date().getTime();

    const searchResponse = http.get(
      `${SUPABASE_URL}/rest/v1/marketplace_products?name.ilike=%25${searchTerm}%25&is_active=eq.true&limit=15&select=id,name,price,product_images`,
      { headers }
    );

    const duration = new Date().getTime() - startTime;
    searchDuration.add(duration);

    check(searchResponse, {
      'Recherche OK': (r) => r.status === 200,
    });
  }

  // Scénario 3 : Filtrage par catégorie (30% des users)
  else {
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    
    const categoryResponse = http.get(
      `${SUPABASE_URL}/rest/v1/marketplace_products?category=eq.${encodeURIComponent(category)}&is_active=eq.true&limit=20&select=id,name,price,product_images`,
      { headers }
    );

    check(categoryResponse, {
      'Filtrage catégorie OK': (r) => r.status === 200,
    });
  }

  sleep(Math.random() * 3 + 1); // 1-4s entre requêtes
}

export function handleSummary(data) {
  return {
    'load-tests/results/marketplace-browse-summary.json': JSON.stringify(data, null, 2),
    stdout: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RÉSULTATS - TEST MARKETPLACE NAVIGATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Requêtes totales: ${data.metrics.http_reqs.values.count}
⏱️  Durée moyenne: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
📈 95e percentile: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
🔍 Durée recherche moy: ${data.metrics.search_duration?.values.avg.toFixed(2) || 'N/A'}ms
❌ Taux d'échec: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `,
  };
}
