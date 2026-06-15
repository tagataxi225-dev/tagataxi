import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { vehicle_id, vehicle_name, partner_name } = await req.json();

    console.log(`📢 Nouveau véhicule ajouté: ${vehicle_name} par ${partner_name}`);

    // Récupérer tous les admins
    const { data: admins, error: adminsError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (adminsError) throw adminsError;

    // Créer une notification pour chaque admin
    const notifications = admins.map(admin => ({
      user_id: admin.user_id,
      user_type: 'admin',
      title: '🚗 Nouveau véhicule à modérer',
      message: `${partner_name} a ajouté "${vehicle_name}" pour modération`,
      type: 'rental_moderation',
      priority: 'high',
      severity: 'info',
      data: { vehicle_id, vehicle_name, partner_name },
      is_read: false
    }));

    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notifError) throw notifError;

    // Logger l'activité
    await supabase.from('activity_logs').insert({
      activity_type: 'vehicle_submitted',
      description: `Véhicule "${vehicle_name}" soumis par ${partner_name}`,
      reference_id: vehicle_id,
      reference_type: 'rental_vehicle',
      metadata: { vehicle_name, partner_name, notification_count: admins.length }
    });

    console.log(`✅ ${admins.length} notification(s) admin envoyée(s)`);

    return new Response(
      JSON.stringify({ success: true, notifications_sent: admins.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('❌ Erreur notification admin:', error);
    return new Response(
      JSON.stringify({ error: (error as any).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});