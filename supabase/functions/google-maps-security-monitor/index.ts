import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SecurityLog {
  user_id: string | null;
  event_type: 'api_key_request' | 'suspicious_activity' | 'rate_limit_exceeded';
  metadata: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authentification requise
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Non authentifié');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Non authentifié');
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Analyser les patterns suspects
    const { data: recentLogs } = await supabase
      .from('security_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('event_type', 'google_maps_key_access')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // Dernière heure
      .order('created_at', { ascending: false });

    const requestsLastHour = recentLogs?.length || 0;
    const suspiciousActivity = requestsLastHour > 100; // Plus de 100 requêtes/heure

    // Log de sécurité
    const securityLog: SecurityLog = {
      user_id: user.id,
      event_type: suspiciousActivity ? 'suspicious_activity' : 'api_key_request',
      metadata: {
        requests_last_hour: requestsLastHour,
        endpoint: 'google-maps-key',
      },
      ip_address: ip,
      user_agent: userAgent,
    };

    // Enregistrer dans les logs de sécurité
    await supabase.from('security_logs').insert({
      user_id: user.id,
      event_type: securityLog.event_type,
      details: securityLog.metadata,
      ip_address: ip,
      user_agent: userAgent,
    });

    // Si activité suspecte, bloquer temporairement
    if (suspiciousActivity) {
      console.warn(`🚨 Activité suspecte détectée pour l'utilisateur ${user.id}: ${requestsLastHour} requêtes/heure`);
      
      return new Response(
        JSON.stringify({ 
          error: 'Trop de requêtes détectées. Veuillez réessayer plus tard.',
          retry_after: 3600 
        }),
        { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Récupérer les statistiques d'utilisation
    const { data: stats } = await supabase
      .from('security_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('event_type', 'google_maps_key_access')
      .gte('created_at', new Date(Date.now() - 86400000).toISOString()) // 24h
      .order('created_at', { ascending: false });

    console.log(`✅ Monitoring Google Maps - User: ${user.id}, Requests last hour: ${requestsLastHour}`);

    return new Response(
      JSON.stringify({
        status: 'ok',
        usage: {
          last_hour: requestsLastHour,
          last_24h: stats?.length || 0,
        },
        warnings: suspiciousActivity ? ['High usage detected'] : [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('❌ Erreur monitoring Google Maps:', error);
    return new Response(
      JSON.stringify({ error: (error as any).message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
