/**
 * ⏰ CANCEL EXPIRED BOOKINGS - Phase 1
 * Annule automatiquement les bookings pending > 5 minutes sans chauffeur
 * Exécuté automatiquement toutes les 2 minutes via cron
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('⏰ [CancelExpiredBookings] Starting cancellation...');

    // Calculer le timestamp limite (5 minutes dans le passé)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    // Annuler les bookings expirés
    const { data: cancelled, error } = await supabase
      .from('transport_bookings')
      .update({ 
        status: 'cancelled',
        cancellation_reason: 'Timeout - aucun chauffeur disponible',
        cancelled_at: new Date().toISOString()
      })
      .eq('status', 'pending')
      .is('driver_id', null)
      .lt('created_at', fiveMinutesAgo)
      .select();

    if (error) throw error;

    const count = cancelled?.length || 0;
    console.log(`✅ [CancelExpiredBookings] Cancelled ${count} expired bookings`);

    // Logger l'activité
    if (count > 0) {
      await supabase.from('activity_logs').insert({
        action: 'cancel_expired_bookings',
        details: {
          bookings_cancelled: count,
          timeout_minutes: 5,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Notifier les utilisateurs (optionnel)
    if (cancelled && cancelled.length > 0) {
      for (const booking of cancelled) {
        // TODO: Envoyer notification push à l'utilisateur
        console.log(`📧 Notifying user ${booking.user_id} about cancelled booking ${booking.id}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        bookings_cancelled: count,
        timeout_minutes: 5,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ [CancelExpiredBookings] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as any).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
