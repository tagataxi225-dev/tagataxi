import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  event_type: 'driver_pending' | 'partner_pending' | 'product_reported' | 'marketplace_product_pending' | 
              'food_product_pending' | 'restaurant_pending' | 'vehicle_pending' | 'withdrawal_requested' | 
              'ticket_urgent' | 'order_issue';
  entity_id: string;
  entity_type: string;
  title: string;
  message: string;
  severity?: 'info' | 'warning' | 'error' | 'success';
  metadata?: any;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

// Mapping des événements aux permissions requises
const EVENT_PERMISSIONS_MAP: Record<string, string[]> = {
  'driver_pending': ['drivers_validate', 'drivers_read'],
  'partner_pending': ['partners_validate', 'partners_read'],
  'product_reported': ['marketplace_moderate', 'moderate_content'],
  'marketplace_product_pending': ['marketplace_moderate', 'marketplace_read'],
  'food_product_pending': ['food_moderate', 'food_read'],
  'restaurant_pending': ['food_validate', 'food_read'],
  'vehicle_pending': ['rental_moderate', 'rental_read'],
  'withdrawal_requested': ['finance_read', 'finance_manage'],
  'ticket_urgent': ['support_read', 'support_manage'],
  'order_issue': ['orders_read', 'orders_manage']
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      event_type, 
      entity_id, 
      entity_type, 
      title, 
      message, 
      severity = 'info',
      metadata = {},
      priority = 'normal'
    }: NotificationRequest = await req.json();

    console.log('Processing admin notification dispatch:', { event_type, entity_id, entity_type });

    // Récupérer les permissions nécessaires pour cet événement
    const requiredPermissions = EVENT_PERMISSIONS_MAP[event_type] || [];
    
    if (requiredPermissions.length === 0) {
      console.warn(`No permissions mapped for event type: ${event_type}`);
    }

    // Trouver tous les admins qui ont au moins une des permissions requises
    const { data: adminsWithPermissions, error: permissionsError } = await supabaseClient
      .rpc('get_admins_with_permissions', { 
        permission_names: requiredPermissions 
      });

    if (permissionsError) {
      console.error('Error fetching admins with permissions:', permissionsError);
      // Fallback: notifier tous les admins actifs
      const { data: allAdmins } = await supabaseClient
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin', 'super_admin'])
        .eq('is_active', true);
      
      if (allAdmins && allAdmins.length > 0) {
        await notifyAdmins(supabaseClient, allAdmins.map(a => a.user_id), {
          event_type,
          entity_id,
          entity_type,
          title,
          message,
          severity,
          metadata,
          priority
        });
      }
    } else if (adminsWithPermissions && adminsWithPermissions.length > 0) {
      console.log(`Found ${adminsWithPermissions.length} admins with required permissions`);
      
      await notifyAdmins(supabaseClient, adminsWithPermissions, {
        event_type,
        entity_id,
        entity_type,
        title,
        message,
        severity,
        metadata,
        priority
      });
    } else {
      console.log('No admins found with required permissions, notifying super admins');
      
      // Si aucun admin avec les permissions spécifiques, notifier les super admins
      const { data: superAdmins } = await supabaseClient
        .from('user_roles')
        .select('user_id')
        .eq('admin_role', 'super_admin')
        .eq('is_active', true);
      
      if (superAdmins && superAdmins.length > 0) {
        await notifyAdmins(supabaseClient, superAdmins.map(a => a.user_id), {
          event_type,
          entity_id,
          entity_type,
          title,
          message,
          severity,
          metadata,
          priority
        });
      }
    }

    // Créer une notification système globale
    const { error: systemNotifError } = await supabaseClient
      .from('admin_notifications')
      .insert({
        type: event_type,
        title,
        message,
        severity,
        data: {
          entity_id,
          entity_type,
          event_type,
          priority,
          ...metadata,
          timestamp: new Date().toISOString()
        }
      });

    if (systemNotifError) {
      console.error('Failed to create system notification:', systemNotifError);
    }

    // Logger l'activité
    await supabaseClient
      .from('activity_logs')
      .insert({
        activity_type: 'admin_notification_dispatch',
        description: `Dispatched notification for ${event_type}`,
        metadata: {
          event_type,
          entity_id,
          entity_type,
          title,
          severity,
          priority
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notifications dispatched successfully',
        event_type,
        entity_id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: unknown) {
    console.error('Error in admin-role-notification-dispatcher:', error);
    
    return new Response(
      JSON.stringify({
        error: true,
        message: (error as Error).message || 'An unexpected error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function notifyAdmins(
  supabaseClient: any,
  adminUserIds: string[],
  notificationData: {
    event_type: string;
    entity_id: string;
    entity_type: string;
    title: string;
    message: string;
    severity: string;
    metadata: any;
    priority: string;
  }
) {
  const { event_type, entity_id, entity_type, title, message, severity, metadata, priority } = notificationData;

  // Créer des notifications individuelles pour chaque admin
  const notifications = adminUserIds.map(userId => ({
    user_id: userId,
    notification_type: event_type,
    title,
    message,
    priority,
    category: `admin_${severity}`,
    data: {
      entity_id,
      entity_type,
      event_type,
      severity,
      ...metadata,
      timestamp: new Date().toISOString()
    },
    is_read: false
  }));

  const { error: notifError } = await supabaseClient
    .from('unified_notifications')
    .insert(notifications);

  if (notifError) {
    console.error('Failed to create individual notifications:', notifError);
  } else {
    console.log(`Created ${notifications.length} individual notifications`);
  }

  // Créer des push notifications pour admins actifs (priorité high/urgent seulement)
  if (priority === 'high' || priority === 'urgent') {
    const pushNotifications = adminUserIds.map(userId => ({
      user_id: userId,
      title,
      body: message,
      data: {
        type: 'admin_alert',
        event_type,
        entity_id,
        entity_type,
        priority
      },
      category: 'admin_management',
      priority
    }));

    const { error: pushError } = await supabaseClient
      .from('push_notifications')
      .insert(pushNotifications);

    if (pushError) {
      console.error('Failed to create push notifications:', pushError);
    } else {
      console.log(`Created ${pushNotifications.length} push notifications`);
    }
  }
}
