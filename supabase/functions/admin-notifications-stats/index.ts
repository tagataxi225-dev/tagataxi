// Version: 2025-11-07T12:00:00Z - Admin functions deployment
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface RecipientStatsRequest {
  target_type: string;
  city?: string;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Vérifier l'authentification
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Vérifier les permissions admin
    const { data: adminCheck } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!adminCheck) {
      throw new Error('Admin access required');
    }

    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    switch (action) {
      case 'recipient-count':
        return await handleRecipientCount(req, supabase);
      case 'notification-stats':
        return await handleNotificationStats(req, supabase);
      default:
        throw new Error('Invalid action');
    }

  } catch (error: any) {
    console.error('Error in admin-notifications-stats function:', error);
    return new Response(
      JSON.stringify({ error: (error as any).message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

async function handleRecipientCount(req: Request, supabase: any): Promise<Response> {
  const { target_type, city }: RecipientStatsRequest = await req.json();
  
  let count = 0;
  let details = {};

  try {
    switch (target_type) {
      case 'all_clients':
        const { count: clientCount } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);
        count = clientCount || 0;
        break;

      case 'all_drivers':
        const { count: driverCount } = await supabase
          .from('chauffeurs')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);
        count = driverCount || 0;
        break;

      case 'active_drivers':
        const { count: activeDriverCount } = await supabase
          .from('chauffeurs')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
          .in('verification_status', ['verified', 'approved']);
        count = activeDriverCount || 0;
        break;

      case 'verified_drivers':
        const { count: verifiedDriverCount } = await supabase
          .from('chauffeurs')
          .select('*', { count: 'exact', head: true })
          .eq('verification_status', 'verified')
          .eq('is_active', true);
        count = verifiedDriverCount || 0;
        break;

      case 'all_partners':
        const { count: partnerCount } = await supabase
          .from('partenaires')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);
        count = partnerCount || 0;
        break;

      case 'all_admins':
        const { count: adminCount } = await supabase
          .from('admins')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);
        count = adminCount || 0;
        break;

      case 'zone_users':
        const { count: zoneDriverCount } = await supabase
          .from('chauffeurs')
          .select('*', { count: 'exact', head: true })
          .contains('service_areas', [city || 'Kinshasa'])
          .eq('is_active', true);
        count = zoneDriverCount || 0;
        details = { city: city || 'Kinshasa' };
        break;

      default:
        throw new Error('Invalid target type');
    }

    return new Response(
      JSON.stringify({ 
        count,
        target_type,
        details,
        estimated_delivery_time: count > 100 ? '2-5 minutes' : 'Immédiat'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    throw new Error(`Failed to count recipients: ${(error as any).message}`);
  }
}

async function handleNotificationStats(req: Request, supabase: any): Promise<Response> {
  try {
    // Statistiques des derniers 30 jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentNotifications } = await supabase
      .from('admin_notifications')
      .select('status, total_recipients, successful_sends, failed_sends, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const stats = {
      total_sent: recentNotifications?.reduce((sum: number, n: any) => sum + (n.successful_sends || 0), 0) || 0,
      total_failed: recentNotifications?.reduce((sum: number, n: any) => sum + (n.failed_sends || 0), 0) || 0,
      total_notifications: recentNotifications?.length || 0,
      success_rate: 0,
      by_status: {
        sent: recentNotifications?.filter((n: any) => n.status === 'sent').length || 0,
        failed: recentNotifications?.filter((n: any) => n.status === 'failed').length || 0,
        pending: recentNotifications?.filter((n: any) => n.status === 'pending').length || 0,
        scheduled: recentNotifications?.filter((n: any) => n.status === 'scheduled').length || 0,
      }
    };

    // Calculer le taux de succès
    const totalAttempts = stats.total_sent + stats.total_failed;
    stats.success_rate = totalAttempts > 0 ? Math.round((stats.total_sent / totalAttempts) * 100) : 0;

    return new Response(
      JSON.stringify(stats),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    throw new Error(`Failed to get notification stats: ${(error as any).message}`);
  }
}

serve(handler);