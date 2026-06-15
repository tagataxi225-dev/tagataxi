import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationRequest {
  driverId: string;
  orderType: 'taxi' | 'delivery' | 'marketplace';
  orderId: string;
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

    const { driverId, orderType, orderId }: ValidationRequest = await req.json();

    console.log(`🔍 Validating driver ${driverId} for ${orderType} order ${orderId}`);

    // 1. Récupérer le service_type du chauffeur via RPC
    const { data: driverServiceType, error: rpcError } = await supabase
      .rpc('get_driver_service_type', { driver_user_id: driverId });

    if (rpcError) {
      console.error('❌ RPC Error:', rpcError);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          reason: 'Driver service type not found',
          error: rpcError.message 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`✅ Driver service type: ${driverServiceType}`);

    // 2. Vérifier la compatibilité
    let isValid = false;
    let reason = '';

    switch (orderType) {
      case 'taxi':
        isValid = driverServiceType === 'taxi';
        reason = isValid ? 'Valid taxi driver' : 'Driver is not a taxi driver';
        break;
      
      case 'delivery':
        isValid = driverServiceType === 'delivery';
        reason = isValid ? 'Valid delivery driver' : 'Driver is not a delivery driver';
        break;
      
      case 'marketplace':
        // Marketplace peut être livré par un livreur seulement
        isValid = driverServiceType === 'delivery';
        reason = isValid ? 'Valid delivery driver for marketplace' : 'Marketplace requires delivery driver';
        break;
      
      default:
        isValid = false;
        reason = 'Unknown order type';
    }

    // 3. Log l'activité
    await supabase.from('activity_logs').insert({
      user_id: driverId,
      activity_type: 'validation',
      description: `Service type validation: ${isValid ? 'PASSED' : 'FAILED'}`,
      metadata: {
        order_id: orderId,
        order_type: orderType,
        driver_service_type: driverServiceType,
        validation_result: isValid,
        reason
      }
    });

    console.log(`${isValid ? '✅' : '❌'} Validation result: ${reason}`);

    return new Response(
      JSON.stringify({ 
        valid: isValid,
        driverServiceType,
        orderType,
        reason 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: unknown) {
    console.error('💥 Validation error:', error);
    return new Response(
      JSON.stringify({ 
        valid: false, 
        reason: 'Server error',
        error: (error as any).message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
