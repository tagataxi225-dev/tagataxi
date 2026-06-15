/**
 * 🚗 TEST DE CHARGE - RÉSERVATION TRANSPORT
 * 
 * Simule 50 utilisateurs réalisant des réservations de transport
 * Objectif : < 500ms pour 95% des requêtes
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Métriques personnalisées
const bookingSuccessRate = new Rate('booking_success');
const bookingDuration = new Trend('booking_duration');

// Configuration du test
export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Montée progressive
    { duration: '3m', target: 50 },   // Pic à 50 utilisateurs
    { duration: '1m', target: 0 },    // Descente
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% < 500ms
    'booking_success': ['rate>0.95'],   // 95% de succès
    'http_req_failed': ['rate<0.05'],   // Moins de 5% d'échecs
  },
};

// Variables d'environnement
const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://wddlktajnhwhyquwcdgf.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZGxrdGFqbmh3aHlxdXdjZGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNDA1NjUsImV4cCI6MjA2OTcxNjU2NX0.rViBegpawtg1sFwafH_fczlB0oeA8E6V3MtDELcSIiU';

// Coordonnées de test (Kinshasa)
const PICKUP_COORDS = { lat: -4.3217, lng: 15.3069 };
const DELIVERY_COORDS = { lat: -4.3489, lng: 15.2662 };

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  };

  // 1. Récupérer les chauffeurs disponibles (sans coordonnées exactes)
  const driversResponse = http.get(
    `${SUPABASE_URL}/rest/v1/chauffeurs?is_active=eq.true&verification_status=eq.verified&select=id,display_name,vehicle_class,rating_average&limit=10`,
    { headers }
  );

  check(driversResponse, {
    'Récupération chauffeurs OK': (r) => r.status === 200,
    'Chauffeurs disponibles': (r) => JSON.parse(r.body).length > 0,
  });

  sleep(1); // Simulation utilisateur navigue

  // 2. Calculer le prix estimé (Edge Function)
  const pricingPayload = JSON.stringify({
    pickup_lat: PICKUP_COORDS.lat,
    pickup_lng: PICKUP_COORDS.lng,
    delivery_lat: DELIVERY_COORDS.lat,
    delivery_lng: DELIVERY_COORDS.lng,
    service_type: 'taxi',
    vehicle_class: 'standard',
  });

  const pricingResponse = http.post(
    `${SUPABASE_URL}/functions/v1/calculate-ride-price`,
    pricingPayload,
    { headers }
  );

  const pricingSuccess = check(pricingResponse, {
    'Calcul prix OK': (r) => r.status === 200,
    'Prix calculé': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.calculated_price > 0;
      } catch {
        return false;
      }
    },
  });

  sleep(2); // Utilisateur valide

  // 3. Créer la réservation
  const bookingPayload = JSON.stringify({
    pickup_location: 'Gombe, Kinshasa',
    delivery_location: 'Lemba, Kinshasa',
    pickup_coordinates: PICKUP_COORDS,
    delivery_coordinates: DELIVERY_COORDS,
    service_type: 'taxi',
    vehicle_class: 'standard',
    estimated_price: 3500,
    payment_method: 'cash',
  });

  const startTime = new Date().getTime();
  
  const bookingResponse = http.post(
    `${SUPABASE_URL}/rest/v1/transport_bookings`,
    bookingPayload,
    { headers }
  );

  const endTime = new Date().getTime();
  const duration = endTime - startTime;

  const bookingSuccess = check(bookingResponse, {
    'Réservation créée': (r) => r.status === 201,
    'ID réservation retourné': (r) => {
      try {
        const data = JSON.parse(r.body);
        return Array.isArray(data) && data[0]?.id;
      } catch {
        return false;
      }
    },
  });

  // Enregistrer les métriques
  bookingSuccessRate.add(bookingSuccess);
  bookingDuration.add(duration);

  sleep(3); // Temps entre utilisateurs
}

export function handleSummary(data) {
  return {
    'load-tests/results/transport-booking-summary.json': JSON.stringify(data, null, 2),
    stdout: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RÉSULTATS - TEST RÉSERVATION TRANSPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Requêtes totales: ${data.metrics.http_reqs.values.count}
⏱️  Durée moyenne: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
📈 95e percentile: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
❌ Taux d'échec: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%
🎯 Taux de succès réservations: ${(data.metrics.booking_success.values.rate * 100).toFixed(2)}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `,
  };
}
