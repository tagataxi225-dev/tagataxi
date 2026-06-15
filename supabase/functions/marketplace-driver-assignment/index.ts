import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, ...params } = await req.json()
    console.log('Marketplace driver assignment action:', action, params)

    switch (action) {
      case 'auto_assign_marketplace_order':
        const { order_id: auto_order_id, pickup_lat, pickup_lng, city: order_city = 'Kinshasa' } = params;
        
        console.log(`Auto-assignation marketplace pour commande ${auto_order_id} à ${pickup_lat}, ${pickup_lng}`);

        // Utiliser la fonction RPC sécurisée pour trouver les drivers
        const { data: secureDrivers, error: rpcError } = await supabase.rpc('find_nearby_drivers_secure', {
          user_lat: pickup_lat,
          user_lng: pickup_lng,
          max_distance_km: 10,
          vehicle_class_filter: ['moto', 'voiture', 'standard'],
          service_type_filter: ['delivery', 'marketplace']
        });

        if (rpcError) {
          console.error('Erreur RPC find_nearby_drivers_secure:', rpcError);
          throw rpcError;
        }

        console.log(`${secureDrivers?.length || 0} livreurs trouvés via RPC sécurisé`);

        if (!secureDrivers || secureDrivers.length === 0) {
          // Fallback: élargir le rayon à 15km
          const { data: fallbackDrivers, error: fallbackError } = await supabase.rpc('find_nearby_drivers_secure', {
            user_lat: pickup_lat,
            user_lng: pickup_lng,
            max_distance_km: 15,
            vehicle_class_filter: ['moto', 'voiture', 'standard'],
            service_type_filter: ['delivery', 'marketplace']
          });

          if (fallbackError || !fallbackDrivers || fallbackDrivers.length === 0) {
            return new Response(
              JSON.stringify({ 
                success: false, 
                message: 'Aucun livreur disponible dans un rayon de 15km',
                drivers: []
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
            );
          }

          // Assigner automatiquement le premier driver disponible
          const bestDriver = fallbackDrivers[0];
          
          const { error: assignError } = await supabase
            .from('marketplace_delivery_assignments')
            .insert({
              order_id: auto_order_id,
              driver_id: bestDriver.driver_id,
              assignment_status: 'assigned',
              delivery_fee: 5000,
              pickup_coordinates: { lat: pickup_lat, lng: pickup_lng }
            });

          if (!assignError) {
            await supabase
              .from('marketplace_orders')
              .update({ 
                status: 'assigned_to_driver',
                assigned_to_driver_at: new Date().toISOString()
              })
              .eq('id', auto_order_id);

            await supabase
              .from('driver_locations')
              .update({ is_available: false })
              .eq('driver_id', bestDriver.driver_id);
          }

          return new Response(
            JSON.stringify({ 
              success: true, 
              driver_assigned: bestDriver,
              message: 'Livreur assigné automatiquement (rayon élargi)'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
          );
        }

        // Assigner le meilleur driver (le plus proche)
        const topDriver = secureDrivers[0];
        
        const { error: autoAssignError } = await supabase
          .from('marketplace_delivery_assignments')
          .insert({
            order_id: auto_order_id,
            driver_id: topDriver.driver_id,
            assignment_status: 'assigned',
            delivery_fee: 5000,
            pickup_coordinates: { lat: pickup_lat, lng: pickup_lng }
          });

        if (autoAssignError) {
          console.error('Erreur auto-assignation:', autoAssignError);
          throw autoAssignError;
        }

        // Mettre à jour le statut de la commande
        await supabase
          .from('marketplace_orders')
          .update({ 
            status: 'assigned_to_driver',
            assigned_to_driver_at: new Date().toISOString()
          })
          .eq('id', auto_order_id);

        // Marquer le driver comme non disponible
        await supabase
          .from('driver_locations')
          .update({ is_available: false })
          .eq('driver_id', topDriver.driver_id);

        // Créer des alertes pour les 5 premiers drivers
        const driversToNotify = secureDrivers.slice(0, 5);
        for (const driver of driversToNotify) {
          await supabase.from('delivery_driver_alerts').insert({
            order_id: auto_order_id,
            driver_id: driver.driver_id,
            alert_type: 'marketplace_delivery',
            distance_km: driver.distance_km,
            order_details: {
              pickup_location: 'Adresse vendeur',
              delivery_location: 'Adresse client',
              estimated_price: 7000,
              delivery_type: 'marketplace'
            }
          });
        }
        
        // Logger l'activité
        await supabase.from('activity_logs').insert({
          activity_type: 'marketplace_driver_search',
          description: `${secureDrivers.length} livreurs trouvés, ${driversToNotify.length} notifiés`,
          reference_type: 'marketplace_order',
          reference_id: auto_order_id,
          metadata: {
            search_radius: 10,
            drivers_notified: driversToNotify.map(d => d.driver_id),
            assigned_driver: topDriver.driver_id
          }
        });

        return new Response(
          JSON.stringify({ 
            success: true, 
            driver_assigned: topDriver,
            drivers_notified: driversToNotify.length,
            message: 'Livreur assigné automatiquement avec succès'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        );
      
      case 'find_marketplace_drivers':
        const { lat, lng, max_distance = 10, city = 'Kinshasa' } = params;
        
        console.log(`Recherche manuelle de livreurs près de ${lat}, ${lng} dans un rayon de ${max_distance}km`);

        // Utiliser la fonction RPC sécurisée
        const { data: availableDrivers, error: driversError } = await supabase.rpc('find_nearby_drivers_secure', {
          user_lat: lat,
          user_lng: lng,
          max_distance_km: max_distance,
          vehicle_class_filter: ['moto', 'voiture', 'standard'],
          service_type_filter: ['delivery', 'marketplace']
        })

        if (driversError) {
          console.error('Error fetching drivers:', driversError)
          throw driversError
        }

        console.log(`${availableDrivers?.length || 0} livreurs trouvés via RPC sécurisé`);

        // Les drivers sont déjà formatés par la fonction RPC avec distance_km
        const formattedDrivers = (availableDrivers || []).map((driver: any) => ({
          driver_id: driver.driver_id,
          distance_km: driver.distance_km,
          estimated_arrival: Math.max(5, Math.round(driver.distance_km * 3 + 2)),
          vehicle_class: driver.vehicle_class || 'moto',
          is_online: true,
          is_verified: true
        }))

        return new Response(
          JSON.stringify({ 
            success: true, 
            drivers: formattedDrivers,
            message: `${formattedDrivers.length} livreur(s) trouvé(s)`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        )
      
      case 'assign_marketplace_driver':
        const { order_id, driver_id, pickup_location, delivery_location, assignment_fee } = params
        
        // Créer l'assignation de livraison
        const { data: assignment, error: assignmentError } = await supabase
          .from('marketplace_delivery_assignments')
          .insert({
            order_id,
            driver_id,
            pickup_location,
            delivery_location,
            assignment_status: 'assigned',
            delivery_fee: assignment_fee || 500,
            pickup_coordinates: null, // À améliorer avec géolocalisation
            delivery_coordinates: null // À améliorer avec géolocalisation
          })
          .select()
          .single()

        if (assignmentError) {
          console.error('Error creating assignment:', assignmentError)
          throw assignmentError
        }

        // Mettre à jour le statut de la commande
        const { error: orderUpdateError } = await supabase
          .from('marketplace_orders')
          .update({ 
            status: 'assigned_to_driver',
            assigned_to_driver_at: new Date().toISOString()
          })
          .eq('id', order_id)

        if (orderUpdateError) {
          console.error('Error updating order:', orderUpdateError)
          throw orderUpdateError
        }

        // Marquer le livreur comme non disponible temporairement
        const { error: driverUpdateError } = await supabase
          .from('driver_locations')
          .update({ is_available: false })
          .eq('driver_id', driver_id)

        if (driverUpdateError) {
          console.error('Error updating driver availability:', driverUpdateError)
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            assignment_id: assignment.id,
            message: 'Livreur marketplace assigné avec succès' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        )
      
      default:
        return new Response(
          JSON.stringify({ error: 'Action non reconnue' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        )
    }

  } catch (error: unknown) {
    console.error('Erreur marketplace-driver-assignment:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    )
  }
})