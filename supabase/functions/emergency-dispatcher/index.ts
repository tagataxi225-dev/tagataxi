import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify user
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claims, error: authError } = await anonClient.auth.getClaims(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userId = claims.claims.sub as string;
    const { alert_id, location, emergency_contacts, trip_id, message } = await req.json();

    if (!alert_id) {
      return new Response(JSON.stringify({ error: 'alert_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 1. Update alert status to dispatched
    await supabase
      .from('emergency_alerts')
      .update({ status: 'dispatched' })
      .eq('id', alert_id);

    // 2. Create admin notification
    await supabase
      .from('admin_notifications')
      .insert({
        type: 'emergency_alert',
        title: '🚨 ALERTE D\'URGENCE',
        message: message || `Alerte de sécurité déclenchée par un utilisateur`,
        severity: 'error',
        data: { alert_id, user_id: userId, location, trip_id, emergency_contacts },
        is_read: false
      });

    // 3. Log activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        activity_type: 'emergency_alert',
        description: `Alerte d'urgence déclenchée${trip_id ? ` pendant le trajet ${trip_id}` : ''}`,
        reference_id: alert_id,
        reference_type: 'emergency_alert',
        metadata: { location, emergency_contacts }
      });

    console.log(`🚨 Emergency alert dispatched: ${alert_id} by user ${userId}`);

    return new Response(
      JSON.stringify({ success: true, alert_id, status: 'dispatched' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Emergency dispatcher error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
