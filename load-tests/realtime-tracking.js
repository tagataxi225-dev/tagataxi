/**
 * 📡 TEST DE CHARGE - TRACKING TEMPS RÉEL
 * 
 * Simule 200 utilisateurs avec tracking GPS actif
 * Objectif : Tester la charge sur Supabase Realtime
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import ws from 'k6/ws';

// Métriques
const locationUpdateSuccess = new Rate('location_update_success');
const realtimeConnectionSuccess = new Rate('realtime_connection_success');
const locationUpdateDuration = new Trend('location_update_duration');

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Montée
    { duration: '5m', target: 200 },  // Pic 200 connexions simultanées
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    'location_update_success': ['rate>0.95'],
    'realtime_connection_success': ['rate>0.90'],
    'http_req_failed': ['rate<0.05'],
  },
};

const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://wddlktajnhwhyquwcdgf.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZGxrdGFqbmh3aHlxdXdjZGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNDA1NjUsImV4cCI6MjA2OTcxNjU2NX0.rViBegpawtg1sFwafH_fczlB0oeA8E6V3MtDELcSIiU';

// Coordonnées de test (Kinshasa)
const BASE_LAT = -4.3217;
const BASE_LNG = 15.3069;

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  };

  // Simuler un chauffeur qui met à jour sa position toutes les 5 secondes
  for (let i = 0; i < 12; i++) { // 12 updates = 1 minute
    // Générer position GPS légèrement différente
    const lat = BASE_LAT + (Math.random() - 0.5) * 0.01;
    const lng = BASE_LNG + (Math.random() - 0.5) * 0.01;

    const locationPayload = JSON.stringify({
      latitude: lat,
      longitude: lng,
      is_online: true,
      is_available: Math.random() > 0.3, // 70% disponibles
      vehicle_class: 'standard',
      last_ping: new Date().toISOString(),
    });

    const startTime = new Date().getTime();

    // Note: En réalité, les updates passent par une Edge Function
    // qui vérifie l'authentification du chauffeur
    const updateResponse = http.post(
      `${SUPABASE_URL}/functions/v1/update-driver-location`,
      locationPayload,
      { headers }
    );

    const duration = new Date().getTime() - startTime;
    locationUpdateDuration.add(duration);

    const success = check(updateResponse, {
      'Location update OK': (r) => r.status === 200 || r.status === 204,
    });

    locationUpdateSuccess.add(success);

    sleep(5); // Update toutes les 5 secondes
  }

  // Tester une connexion WebSocket Realtime (1 fois sur 10)
  if (Math.random() < 0.1) {
    const wsUrl = SUPABASE_URL.replace('https://', 'wss://') + '/realtime/v1/websocket';
    
    const wsRes = ws.connect(wsUrl, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
      },
    }, function (socket) {
      socket.on('open', () => {
        realtimeConnectionSuccess.add(true);
        
        // Subscribe to driver_locations table
        socket.send(JSON.stringify({
          topic: 'realtime:public:driver_locations',
          event: 'phx_join',
          payload: {},
          ref: '1',
        }));
      });

      socket.on('message', (msg) => {
        // Just consume messages
      });

      socket.on('error', (e) => {
        realtimeConnectionSuccess.add(false);
      });

      // Maintenir connexion 30 secondes
      sleep(30);
      socket.close();
    });
  }
}

export function handleSummary(data) {
  return {
    'load-tests/results/realtime-tracking-summary.json': JSON.stringify(data, null, 2),
    stdout: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RÉSULTATS - TEST TRACKING TEMPS RÉEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Updates GPS: ${data.metrics.http_reqs.values.count}
✅ Taux succès updates: ${(data.metrics.location_update_success.values.rate * 100).toFixed(2)}%
🔌 Connexions WebSocket: ${(data.metrics.realtime_connection_success.values.rate * 100).toFixed(2)}%
⏱️  Durée moy update: ${data.metrics.location_update_duration.values.avg.toFixed(2)}ms
❌ Taux d'échec: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `,
  };
}
