import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Cette fonction est invoquée automatiquement par le trigger auto_dispatch_delivery
    // Elle récupère les données depuis activity_logs et appelle delivery-dispatcher

    const { data: recentLogs } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('activity_type', 'delivery_dispatch_triggered')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!recentLogs || recentLogs.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'No pending dispatches' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const dispatched = [];

    for (const log of recentLogs) {
      const metadata = log.metadata as { order_id?: string; pickup_lat?: number; pickup_lng?: number; delivery_type?: string } | null;
      if (!metadata?.order_id) continue;
      
      const { order_id, pickup_lat, pickup_lng, delivery_type } = metadata;

      // Vérifier si l'ordre n'a pas déjà été traité
      const { data: order } = await supabase
        .from('delivery_orders')
        .select('status, user_id')
        .eq('id', order_id)
        .single();

      if (!order || order.status !== 'pending') {
        continue; // Déjà traité
      }

      // Invoquer delivery-dispatcher
      const dispatchResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/delivery-dispatcher`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
          },
          body: JSON.stringify({
            orderId: order_id,
            pickupLat: pickup_lat,
            pickupLng: pickup_lng,
            deliveryType: delivery_type
          })
        }
      );

      const result = await dispatchResponse.json();
      dispatched.push({ order_id, result });

      console.log(`✅ Dispatched order ${order_id}:`, result);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        dispatched_count: dispatched.length,
        dispatched
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('❌ Error in invoke-delivery-dispatcher:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as any).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
