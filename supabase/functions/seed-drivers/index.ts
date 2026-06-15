import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const driversData = [
  {
    id: 'abj-001',
    full_name: 'Kouassi Jean-Baptiste',
    phone_number: '+2250708123456',
    rating: 4.8,
    vehicle_type: 'woro-woro',
    vehicle_model: 'Toyota Corolla 2018',
    license_plate: 'CI-2024-ABJ-001',
    city: 'Abidjan',
    latitude: 5.3364,
    longitude: -4.0267,
    is_available: true,
    is_online: true
  },
  {
    id: 'abj-002',
    full_name: 'Traoré Mamadou',
    phone_number: '+2250708234567',
    rating: 4.6,
    vehicle_type: 'taxi-compteur',
    vehicle_model: 'Nissan Almera 2020',
    license_plate: 'CI-2024-ABJ-002',
    city: 'Abidjan',
    latitude: 5.3408,
    longitude: -3.9891,
    is_available: true,
    is_online: true
  },
  {
    id: 'abj-003',
    full_name: 'Yao Akissi Marie',
    phone_number: '+2250708345678',
    rating: 4.9,
    vehicle_type: 'moto-taxi',
    vehicle_model: 'Honda CG 125',
    license_plate: 'CI-2024-M-003',
    city: 'Abidjan',
    latitude: 5.2893,
    longitude: -3.9757,
    is_available: true,
    is_online: true
  },
  {
    id: 'kin-001',
    full_name: 'Kabila Joseph',
    phone_number: '+243812345678',
    rating: 4.7,
    vehicle_type: 'taxi-bus',
    vehicle_model: 'Toyota Hiace 2019',
    license_plate: 'CD-2024-KIN-001',
    city: 'Kinshasa',
    latitude: -4.3217,
    longitude: 15.3069,
    is_available: true,
    is_online: true
  },
  {
    id: 'kin-002',
    full_name: 'Mulumba Grace',
    phone_number: '+243823456789',
    rating: 4.5,
    vehicle_type: 'vtc-prive',
    vehicle_model: 'Honda Civic 2021',
    license_plate: 'CD-2024-KIN-002',
    city: 'Kinshasa',
    latitude: -4.2634,
    longitude: 15.2429,
    is_available: true,
    is_online: true
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

    let successCount = 0;
    let errorCount = 0;

    for (const driver of driversData) {
      try {
        // Insert or update driver profile
        const { error: profileError } = await supabase
          .from('driver_profiles')
          .upsert({
            user_id: driver.id,
            full_name: driver.full_name,
            phone_number: driver.phone_number,
            rating: driver.rating,
            vehicle_type: driver.vehicle_type,
            vehicle_model: driver.vehicle_model,
            license_plate: driver.license_plate,
            city: driver.city,
            is_verified: true,
            is_active: true
          }, { onConflict: 'user_id' });

        if (profileError) {
          console.error(`Profile error for ${driver.full_name}:`, profileError);
          errorCount++;
          continue;
        }

        // Insert or update driver location
        const { error: locationError } = await supabase
          .from('driver_locations')
          .upsert({
            driver_id: driver.id,
            latitude: driver.latitude,
            longitude: driver.longitude,
            city: driver.city,
            is_available: driver.is_available,
            is_online: driver.is_online,
            last_ping: new Date().toISOString()
          }, { onConflict: 'driver_id' });

        if (locationError) {
          console.error(`Location error for ${driver.full_name}:`, locationError);
          errorCount++;
          continue;
        }

        console.log(`✓ Driver ${driver.full_name} seeded successfully`);
        successCount++;

      } catch (error: unknown) {
        console.error(`Error seeding driver ${driver.full_name}:`, error);
        errorCount++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Seeded ${successCount} drivers successfully`,
      stats: {
        total: driversData.length,
        success: successCount,
        errors: errorCount
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Seed drivers error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});