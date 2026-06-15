/**
 * 🧹 CLEANUP STALE DRIVERS - Phase 1
 * Marque offline les chauffeurs avec last_ping > 5 minutes
 * Exécuté automatiquement toutes les 5 minutes via cron
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

    console.log('🧹 [CleanupStaleDrivers] Starting cleanup...');

    // Calculer le timestamp limite (5 minutes dans le passé)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    // Marquer offline les chauffeurs sans ping récent
    const { data: updated, error } = await supabase
      .from('driver_locations')
      .update({ 
        is_online: false, 
        is_available: false 
      })
      .lt('last_ping', fiveMinutesAgo)
      .eq('is_online', true)
      .select();

    if (error) throw error;

    const count = updated?.length || 0;
    console.log(`✅ [CleanupStaleDrivers] Marked ${count} drivers as offline`);

    // Logger l'activité
    if (count > 0) {
      await supabase.from('activity_logs').insert({
        action: 'cleanup_stale_drivers',
        details: {
          drivers_cleaned: count,
          threshold: '5 minutes',
          timestamp: new Date().toISOString()
        }
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        drivers_cleaned: count,
        threshold_minutes: 5,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ [CleanupStaleDrivers] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as any).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
