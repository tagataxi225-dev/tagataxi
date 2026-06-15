// 🧪 PHASE 2: Edge Function pour créer des chauffeurs de test fonctionnels
// Crée des chauffeurs avec abonnements actifs, positions GPS et statut vérifié

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestDriver {
  id: string;
  email: string;
  display_name: string;
  phone_number: string;
  service_type: 'taxi' | 'delivery';
  vehicle_class: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_plate: string;
  vehicle_color: string;
  city: string;
  latitude: number;
  longitude: number;
  rides_remaining: number;
}

// 10 chauffeurs de test pour Kinshasa et Abidjan
const TEST_DRIVERS: TestDriver[] = [
  // KINSHASA - TAXI VTC (5 chauffeurs)
  {
    id: 'test-driver-kin-001',
    email: 'driver.kin.001@test.kwenda.cd',
    display_name: 'Jean-Baptiste Mbala',
    phone_number: '+243812345001',
    service_type: 'taxi',
    vehicle_class: 'vtc_standard',
    vehicle_make: 'Toyota',
    vehicle_model: 'Corolla',
    vehicle_plate: 'CD-KIN-2024-001',
    vehicle_color: 'Noir',
    city: 'Kinshasa',
    latitude: -4.3217,  // Gombe
    longitude: 15.3069,
    rides_remaining: 50
  },
  {
    id: 'test-driver-kin-002',
    email: 'driver.kin.002@test.kwenda.cd',
    display_name: 'Grace Kalala',
    phone_number: '+243812345002',
    service_type: 'taxi',
    vehicle_class: 'vtc_premium',
    vehicle_make: 'Honda',
    vehicle_model: 'Accord',
    vehicle_plate: 'CD-KIN-2024-002',
    vehicle_color: 'Blanc',
    city: 'Kinshasa',
    latitude: -4.3800,  // Matonge
    longitude: 15.3200,
    rides_remaining: 75
  },
  {
    id: 'test-driver-kin-003',
    email: 'driver.kin.003@test.kwenda.cd',
    display_name: 'Patrice Tshisekedi',
    phone_number: '+243812345003',
    service_type: 'taxi',
    vehicle_class: 'taxi_bus',
    vehicle_make: 'Toyota',
    vehicle_model: 'Hiace',
    vehicle_plate: 'CD-KIN-2024-003',
    vehicle_color: 'Jaune',
    city: 'Kinshasa',
    latitude: -4.2900,  // Limete
    longitude: 15.2900,
    rides_remaining: 100
  },
  {
    id: 'test-driver-kin-004',
    email: 'driver.kin.004@test.kwenda.cd',
    display_name: 'Marie Mukendi',
    phone_number: '+243812345004',
    service_type: 'taxi',
    vehicle_class: 'moto_transport',
    vehicle_make: 'Honda',
    vehicle_model: 'CG 125',
    vehicle_plate: 'CD-KIN-M-004',
    vehicle_color: 'Rouge',
    city: 'Kinshasa',
    latitude: -4.3500,  // Kalamu
    longitude: 15.3100,
    rides_remaining: 200
  },
  {
    id: 'test-driver-kin-005',
    email: 'driver.kin.005@test.kwenda.cd',
    display_name: 'Joseph Kabila',
    phone_number: '+243812345005',
    service_type: 'taxi',
    vehicle_class: 'vtc_standard',
    vehicle_make: 'Nissan',
    vehicle_model: 'Sentra',
    vehicle_plate: 'CD-KIN-2024-005',
    vehicle_color: 'Gris',
    city: 'Kinshasa',
    latitude: -4.3100,  // Ngaliema
    longitude: 15.2800,
    rides_remaining: 60
  },
  
  // KINSHASA - LIVRAISON (2 livreurs)
  {
    id: 'test-driver-kin-del-001',
    email: 'delivery.kin.001@test.kwenda.cd',
    display_name: 'André Livreur',
    phone_number: '+243812345006',
    service_type: 'delivery',
    vehicle_class: 'moto_delivery',
    vehicle_make: 'Yamaha',
    vehicle_model: 'Crypton',
    vehicle_plate: 'CD-KIN-M-006',
    vehicle_color: 'Bleu',
    city: 'Kinshasa',
    latitude: -4.3300,
    longitude: 15.3150,
    rides_remaining: 999 // Livreurs pas de limite
  },
  {
    id: 'test-driver-kin-del-002',
    email: 'delivery.kin.002@test.kwenda.cd',
    display_name: 'Claude Livraison',
    phone_number: '+243812345007',
    service_type: 'delivery',
    vehicle_class: 'car_delivery',
    vehicle_make: 'Suzuki',
    vehicle_model: 'APV',
    vehicle_plate: 'CD-KIN-2024-007',
    vehicle_color: 'Vert',
    city: 'Kinshasa',
    latitude: -4.3400,
    longitude: 15.3000,
    rides_remaining: 999
  },

  // ABIDJAN - TAXI (2 chauffeurs)
  {
    id: 'test-driver-abj-001',
    email: 'driver.abj.001@test.kwenda.ci',
    display_name: 'Kouassi Jean-Baptiste',
    phone_number: '+2250708123001',
    service_type: 'taxi',
    vehicle_class: 'woro_woro',
    vehicle_make: 'Toyota',
    vehicle_model: 'Corolla',
    vehicle_plate: 'CI-ABJ-2024-001',
    vehicle_color: 'Orange',
    city: 'Abidjan',
    latitude: 5.3364,  // Plateau
    longitude: -4.0267,
    rides_remaining: 80
  },
  {
    id: 'test-driver-abj-002',
    email: 'driver.abj.002@test.kwenda.ci',
    display_name: 'Yao Akissi Marie',
    phone_number: '+2250708123002',
    service_type: 'taxi',
    vehicle_class: 'moto_taxi',
    vehicle_make: 'Honda',
    vehicle_model: 'CB 125',
    vehicle_plate: 'CI-ABJ-M-002',
    vehicle_color: 'Jaune',
    city: 'Abidjan',
    latitude: 5.3490,  // Yopougon (proche user test)
    longitude: -4.0768,
    rides_remaining: 150
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🧪 Début du seeding de chauffeurs de test...');

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const driver of TEST_DRIVERS) {
      try {
        console.log(`\n📝 Création de ${driver.display_name} (${driver.service_type})...`);

        // 1. Créer le profil chauffeur
        const { error: profileError } = await supabase
          .from('chauffeurs')
          .upsert({
            user_id: driver.id,
            email: driver.email,
            display_name: driver.display_name,
            phone_number: driver.phone_number,
            service_type: driver.service_type,
            vehicle_class: driver.vehicle_class,
            vehicle_make: driver.vehicle_make,
            vehicle_model: driver.vehicle_model,
            vehicle_plate: driver.vehicle_plate,
            vehicle_color: driver.vehicle_color,
            service_areas: [driver.city],
            is_active: true,
            verification_status: 'verified',
            rating_average: 4.5 + Math.random() * 0.5, // 4.5-5.0
            rating_count: Math.floor(Math.random() * 100) + 50,
            total_rides: Math.floor(Math.random() * 200) + 100,
            updated_at: new Date().toISOString()
          }, { 
            onConflict: 'user_id',
            ignoreDuplicates: false 
          });

        if (profileError) {
          throw new Error(`Profile error: ${profileError.message}`);
        }
        console.log(`  ✅ Profil créé`);

        // 2. Créer l'abonnement actif (uniquement pour taxi)
        if (driver.service_type === 'taxi') {
          const { error: subscriptionError } = await supabase
            .from('driver_subscriptions')
            .upsert({
              driver_id: driver.id,
              plan_id: 'standard', // Plan par défaut
              status: 'active',
              start_date: new Date().toISOString(),
              end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 jours
              rides_remaining: driver.rides_remaining,
              unlimited_rides: false,
              auto_renew: true,
              updated_at: new Date().toISOString()
            }, { 
              onConflict: 'driver_id',
              ignoreDuplicates: false 
            });

          if (subscriptionError) {
            throw new Error(`Subscription error: ${subscriptionError.message}`);
          }
          console.log(`  ✅ Abonnement créé (${driver.rides_remaining} courses restantes)`);
        }

        // 3. Créer la position GPS
        const { error: locationError } = await supabase
          .from('driver_locations')
          .upsert({
            driver_id: driver.id,
            latitude: driver.latitude,
            longitude: driver.longitude,
            city: driver.city,
            vehicle_class: driver.vehicle_class,
            is_online: true,
            is_available: true,
            is_verified: true,
            heading: Math.floor(Math.random() * 360),
            speed: 0,
            last_ping: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { 
            onConflict: 'driver_id',
            ignoreDuplicates: false 
          });

        if (locationError) {
          throw new Error(`Location error: ${locationError.message}`);
        }
        console.log(`  ✅ Position GPS créée (${driver.latitude}, ${driver.longitude})`);

        console.log(`✅ ${driver.display_name} créé avec succès`);
        successCount++;

      } catch (error: unknown) {
        console.error(`❌ Erreur pour ${driver.display_name}:`, error);
        errorCount++;
        errors.push(`${driver.display_name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Log de l'opération
    await supabase.from('activity_logs').insert({
      activity_type: 'test_drivers_seeded',
      description: `Seeding de ${successCount} chauffeurs de test`,
      metadata: {
        total: TEST_DRIVERS.length,
        success: successCount,
        errors: errorCount,
        timestamp: new Date().toISOString()
      }
    });

    console.log('\n📊 RÉSULTAT DU SEEDING:');
    console.log(`✅ Succès: ${successCount}/${TEST_DRIVERS.length}`);
    console.log(`❌ Échecs: ${errorCount}/${TEST_DRIVERS.length}`);

    return new Response(JSON.stringify({
      success: true,
      message: `Seeding terminé: ${successCount} chauffeurs créés`,
      stats: {
        total: TEST_DRIVERS.length,
        success: successCount,
        errors: errorCount,
        kinshasa_taxi: 5,
        kinshasa_delivery: 2,
        abidjan: 3
      },
      errors: errors.length > 0 ? errors : undefined,
      drivers: TEST_DRIVERS.map(d => ({
        id: d.id,
        name: d.display_name,
        type: d.service_type,
        city: d.city,
        rides_remaining: d.rides_remaining
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('❌ Erreur critique:', error);
    return new Response(JSON.stringify({ 
      error: 'Erreur lors du seeding',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
