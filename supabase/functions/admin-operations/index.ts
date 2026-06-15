// Version: 2025-11-07T12:00:00Z - Admin functions deployment
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Verify admin role
    const { data: adminCheck } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!adminCheck) {
      throw new Error('Accès administrateur requis');
    }

    const { action, type } = await req.json();

    console.log('🔧 Admin operation:', { action, type, admin: user.id });

    let result: any = { success: true };

    if (type === 'security_maintenance') {
      switch (action) {
        case 'cleanup_old_notifications':
          // Nettoyer les notifications de plus de 30 jours lues
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const { count } = await supabase
            .from('admin_notifications')
            .delete()
            .eq('is_read', true)
            .lt('created_at', thirtyDaysAgo.toISOString());

          result.message = `${count || 0} notifications nettoyées`;
          break;

        case 'anonymize_old_location_data':
          // Appeler la fonction DB pour anonymiser les anciennes données
          const { data: anonymizeData, error: anonymizeError } = await supabase
            .rpc('anonymize_old_location_data', { days_old: 30 });

          if (anonymizeError) throw anonymizeError;

          result.message = `${anonymizeData || 0} anciennes positions anonymisées`;
          break;

        case 'refresh_security_stats':
          // Rafraîchir les statistiques de sécurité
          const { error: refreshError } = await supabase.rpc('refresh_security_stats');

          if (refreshError) throw refreshError;

          result.message = 'Statistiques de sécurité actualisées';
          break;

        case 'fix_invalid_coordinates':
          // Corriger les coordonnées invalides
          const { data: fixData, error: fixError } = await supabase
            .rpc('fix_invalid_coordinates');

          if (fixError) throw fixError;

          result.message = `${fixData || 0} coordonnées corrigées`;
          break;

        default:
          result.message = 'Action de maintenance exécutée';
      }

      // Logger l'action
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        activity_type: 'admin_maintenance',
        description: `Maintenance sécurité: ${action}`,
        metadata: { action, type }
      });
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('❌ Error in admin-operations:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as any).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
