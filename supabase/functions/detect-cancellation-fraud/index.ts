/**
 * ✅ PHASE 2: DETECT CANCELLATION FRAUD
 * 
 * Détecte les annulations abusives des clients quand le chauffeur est proche.
 * 
 * Logique anti-fraude:
 * - Si client annule > 2 fois en 24h quand chauffeur < 500m
 * - Facturer le client pour la course
 * - Compenser le chauffeur (80% du tarif)
 * - Alerter les admins
 * 
 * Prévient la fraude où clients demandent aux chauffeurs d'annuler 
 * pour négocier un tarif hors-app.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface CancellationRequest {
  bookingId: string;
  bookingType: 'transport' | 'delivery';
  clientId: string;
  driverId: string;
  cancellationReason?: string;
  driverLocation?: {
    lat: number;
    lng: number;
  };
  pickupLocation: {
    lat: number;
    lng: number;
  };
  estimatedPrice: number;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const {
      bookingId,
      bookingType,
      clientId,
      driverId,
      cancellationReason,
      driverLocation,
      pickupLocation,
      estimatedPrice
    }: CancellationRequest = await req.json();

    console.log(`🚫 Analyzing cancellation: ${bookingType} ${bookingId}`);
    console.log(`👤 Client: ${clientId}, Driver: ${driverId}`);

    // 1. Calculer la distance entre chauffeur et pickup
    let distanceFromPickup = 999; // Default très loin
    let driverWasNear = false;

    if (driverLocation) {
      distanceFromPickup = calculateDistance(
        driverLocation.lat,
        driverLocation.lng,
        pickupLocation.lat,
        pickupLocation.lng
      );
      driverWasNear = distanceFromPickup < 0.5; // < 500m = proche

      console.log(`📍 Driver distance from pickup: ${distanceFromPickup.toFixed(2)}km`);
      console.log(`🎯 Driver was near: ${driverWasNear}`);
    } else {
      console.log('⚠️ No driver location provided, assuming far');
    }

    // 2. Compter les annulations du client aujourd'hui (dernières 24h)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: recentCancellations, error: cancelError } = await supabase
      .from('client_cancellation_tracking')
      .select('*')
      .eq('client_id', clientId)
      .gte('created_at', twentyFourHoursAgo);

    if (cancelError) {
      console.error('❌ Error fetching cancellations:', cancelError);
      throw cancelError;
    }

    const cancellationsToday = (recentCancellations?.length || 0) + 1; // +1 pour celle-ci
    const nearCancellationsToday = recentCancellations?.filter(c => c.driver_was_near).length || 0;
    const totalNearCancellations = driverWasNear ? nearCancellationsToday + 1 : nearCancellationsToday;

    console.log(`📊 Client cancellations today: ${cancellationsToday}`);
    console.log(`🎯 Near-pickup cancellations today: ${totalNearCancellations}`);

    // 3. Déterminer si c'est suspect
    const isSuspicious = driverWasNear && totalNearCancellations >= 2;
    
    console.log(`🚨 Is suspicious: ${isSuspicious}`);

    let actionTaken: 'none' | 'warned' | 'charged' | 'banned' = 'none';
    let chargeAmount = 0;

    // 4. Si fraude détectée (> 2 annulations quand chauffeur proche)
    if (isSuspicious) {
      console.log('🚨🚨 FRAUD DETECTED - Taking action');

      // A. Facturer le client
      chargeAmount = estimatedPrice;
      
      const { data: clientWallet } = await supabase
        .from('user_wallets')
        .select('balance')
        .eq('user_id', clientId)
        .single();

      if (clientWallet && clientWallet.balance >= chargeAmount) {
        // Débiter le wallet du client
        await supabase
          .from('user_wallets')
          .update({ 
            balance: clientWallet.balance - chargeAmount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', clientId);

        // Transaction wallet client
        await supabase.from('wallet_transactions').insert({
          user_id: clientId,
          amount: -chargeAmount,
          transaction_type: 'cancellation_penalty',
          description: `Pénalité annulation abusive - Course ${bookingId.substring(0, 8)}`,
          status: 'completed',
          metadata: {
            booking_id: bookingId,
            booking_type: bookingType,
            cancellations_count: totalNearCancellations,
            reason: 'fraudulent_cancellation'
          }
        });

        actionTaken = 'charged';
        console.log(`💰 Client charged ${chargeAmount} CDF`);
      } else {
        console.warn('⚠️ Client wallet insufficient for penalty');
      }

      // B. Compenser le chauffeur (80% du prix)
      const driverCompensation = estimatedPrice * 0.8;

      await supabase
        .from('user_wallets')
        .update({ 
          balance: supabase.raw(`balance + ${driverCompensation}`),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', driverId);

      // Transaction wallet chauffeur
      await supabase.from('wallet_transactions').insert({
        user_id: driverId,
        amount: driverCompensation,
        transaction_type: 'cancellation_compensation',
        description: `Compensation annulation client - Course ${bookingId.substring(0, 8)}`,
        status: 'completed',
        metadata: {
          booking_id: bookingId,
          booking_type: bookingType,
          original_price: estimatedPrice,
          client_id: clientId
        }
      });

      console.log(`💵 Driver compensated ${driverCompensation} CDF`);

      // C. Notifier le client
      await supabase.from('push_notifications').insert({
        user_id: clientId,
        title: '🚫 Annulation Abusive Détectée',
        message: `Vous avez été facturé ${chargeAmount} CDF pour annulation répétée quand le chauffeur était proche. Cette pratique est interdite.`,
        notification_type: 'fraud_warning',
        priority: 'urgent',
        metadata: {
          booking_id: bookingId,
          charge_amount: chargeAmount,
          cancellations_count: totalNearCancellations
        }
      });

      // D. Notifier le chauffeur
      await supabase.from('push_notifications').insert({
        user_id: driverId,
        title: '✅ Compensation Annulation',
        message: `Vous avez reçu ${driverCompensation} CDF en compensation pour l'annulation abusive du client.`,
        notification_type: 'compensation_received',
        priority: 'high',
        metadata: {
          booking_id: bookingId,
          compensation_amount: driverCompensation
        }
      });

      // E. Alerter les admins
      const { data: admins } = await supabase
        .from('clients')
        .select('user_id')
        .eq('role', 'admin');

      if (admins && admins.length > 0) {
        for (const admin of admins) {
          await supabase.from('push_notifications').insert({
            user_id: admin.user_id,
            title: '🚨 Fraude Détectée',
            message: `Client ${clientId.substring(0, 8)} a annulé ${totalNearCancellations}x quand chauffeur proche. Action: Facturé ${chargeAmount} CDF.`,
            notification_type: 'admin_fraud_alert',
            priority: 'urgent',
            metadata: {
              client_id: clientId,
              driver_id: driverId,
              booking_id: bookingId,
              cancellations_count: totalNearCancellations,
              action_taken: actionTaken
            }
          });
        }
      }

      // F. Bannir le client si > 3 fraudes
      if (totalNearCancellations >= 3) {
        await supabase
          .from('clients')
          .update({ 
            is_banned: true,
            ban_reason: `Annulations abusives répétées (${totalNearCancellations}x)`,
            banned_at: new Date().toISOString()
          })
          .eq('user_id', clientId);

        actionTaken = 'banned';
        console.log(`🔒 Client BANNED for repeated fraud`);
      }
    }

    // 5. Enregistrer l'annulation dans le tracking
    await supabase.from('client_cancellation_tracking').insert({
      booking_id: bookingId,
      booking_type: bookingType,
      client_id: clientId,
      driver_id: driverId,
      cancellation_reason: cancellationReason,
      driver_distance_from_pickup: distanceFromPickup,
      driver_was_near: driverWasNear,
      is_suspicious: isSuspicious,
      client_cancellation_count_today: cancellationsToday,
      action_taken: actionTaken,
      charge_amount: actionTaken === 'charged' ? chargeAmount : null,
      charged_at: actionTaken === 'charged' ? new Date().toISOString() : null
    });

    // 6. Marquer la course comme annulée
    const tableName = bookingType === 'transport' ? 'transport_bookings' : 'delivery_orders';
    
    await supabase
      .from(tableName)
      .update({
        status: 'cancelled_by_client',
        cancellation_reason: cancellationReason,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    console.log(`✅ Cancellation processed with action: ${actionTaken}`);

    return new Response(
      JSON.stringify({
        success: true,
        fraud_detected: isSuspicious,
        action_taken: actionTaken,
        cancellations_count: cancellationsToday,
        near_cancellations_count: totalNearCancellations,
        driver_was_near: driverWasNear,
        distance_from_pickup_km: distanceFromPickup,
        charge_amount: chargeAmount,
        message: isSuspicious 
          ? `Fraude détectée: client facturé ${chargeAmount} CDF, chauffeur compensé`
          : 'Annulation normale enregistrée'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: unknown) {
    console.error('💥 Cancellation fraud detection error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
