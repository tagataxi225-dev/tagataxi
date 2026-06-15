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

    // Verify admin authentication
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Non autorisé');
    }

    const { data: adminCheck } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!adminCheck) {
      throw new Error('Accès administrateur requis');
    }

    // Monitor critical edge functions
    const functions = [
      'admin-operations',
      'admin-analytics',
      'notification-dispatcher',
      'auto-dispatch-system',
      'rental-moderation',
      'taxi-moderation',
      'lottery-system'
    ];

    const healthChecks = [];

    for (const funcName of functions) {
      try {
        const startTime = Date.now();
        
        // Simple health check - try to invoke with minimal params
        const { error } = await supabase.functions.invoke(funcName, {
          body: { action: 'health_check' }
        });

        const responseTime = Date.now() - startTime;

        healthChecks.push({
          function: funcName,
          status: error ? 'error' : 'healthy',
          response_time_ms: responseTime,
          error: error?.message || null,
          checked_at: new Date().toISOString()
        });

      } catch (error: any) {
        healthChecks.push({
          function: funcName,
          status: 'error',
          response_time_ms: null,
          error: (error as any).message,
          checked_at: new Date().toISOString()
        });
      }
    }

    // Calculate overall health
    const healthyCount = healthChecks.filter(c => c.status === 'healthy').length;
    const overallHealth = healthyCount / healthChecks.length;

    console.log(`🔍 Function monitor: ${healthyCount}/${healthChecks.length} healthy`);

    return new Response(
      JSON.stringify({
        success: true,
        overall_health: Math.round(overallHealth * 100),
        healthy_count: healthyCount,
        total_count: healthChecks.length,
        functions: healthChecks,
        checked_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error in function-monitor:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as any).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
