import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface NotificationRequest {
  partner_id: string;
  action_type: 'new_request' | 'approved' | 'rejected' | 'activated' | 'deactivated';
  partner_data?: any;
  admin_notes?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { partner_id, action_type, partner_data, admin_notes }: NotificationRequest = await req.json();

    console.log('Processing partner notification:', { partner_id, action_type });

    // Get partner details
    const { data: partner, error: partnerError } = await supabaseClient
      .from('partenaires')
      .select('*')
      .eq('id', partner_id)
      .single();

    if (partnerError) {
      throw new Error(`Failed to fetch partner: ${partnerError.message}`);
    }

    // Prepare notification data based on action type
    let notification_title = '';
    let notification_message = '';
    let notification_type = 'partner_update';
    let severity = 'info';

    switch (action_type) {
      case 'new_request':
        notification_title = 'Nouvelle demande de partenaire';
        notification_message = `${partner.company_name} a soumis une demande de partenariat`;
        notification_type = 'partner_request';
        severity = 'info';
        break;
      
      case 'approved':
        notification_title = 'Partenaire approuvé';
        notification_message = `${partner.company_name} a été approuvé comme partenaire`;
        severity = 'success';
        break;
      
      case 'rejected':
        notification_title = 'Partenaire rejeté';
        notification_message = `La demande de ${partner.company_name} a été rejetée`;
        severity = 'warning';
        break;
      
      case 'activated':
        notification_title = 'Partenaire activé';
        notification_message = `${partner.company_name} a été activé`;
        severity = 'success';
        break;
      
      case 'deactivated':
        notification_title = 'Partenaire désactivé';
        notification_message = `${partner.company_name} a été désactivé`;
        severity = 'warning';
        break;
    }

    // Create admin notification
    const { error: notificationError } = await supabaseClient
      .from('admin_notifications')
      .insert({
        type: notification_type,
        title: notification_title,
        message: notification_message,
        severity,
        data: {
          partner_id: partner.id,
          company_name: partner.company_name,
          business_type: partner.business_type,
          action_type,
          admin_notes,
          timestamp: new Date().toISOString()
        }
      });

    if (notificationError) {
      throw new Error(`Failed to create notification: ${notificationError.message}`);
    }

    // Send push notifications to active admins
    const { data: admins, error: adminsError } = await supabaseClient
      .from('admins')
      .select('user_id')
      .eq('is_active', true);

    if (adminsError) {
      console.error('Failed to fetch admins:', adminsError.message);
    } else {
      // Create push notifications for each admin
      const pushNotifications = admins.map(admin => ({
        user_id: admin.user_id,
        title: notification_title,
        body: notification_message,
        data: {
          type: 'partner_notification',
          partner_id: partner.id,
          action_type
        },
        category: 'partner_management',
        priority: action_type === 'new_request' ? 'high' : 'normal'
      }));

      if (pushNotifications.length > 0) {
        const { error: pushError } = await supabaseClient
          .from('push_notifications')
          .insert(pushNotifications);

        if (pushError) {
          console.error('Failed to create push notifications:', pushError.message);
        } else {
          console.log(`Created ${pushNotifications.length} push notifications`);
        }
      }
    }

    // Log the activity
    const { error: logError } = await supabaseClient
      .from('activity_logs')
      .insert({
        activity_type: 'partner_notification',
        description: `Notification sent for partner ${action_type}`,
        metadata: {
          partner_id: partner.id,
          company_name: partner.company_name,
          action_type,
          notification_type,
          severity
        }
      });

    if (logError) {
      console.error('Failed to log activity:', logError.message);
    }

    const response = {
      success: true,
      message: 'Partner notification sent successfully',
      notification_type,
      partner_id: partner.id,
      company_name: partner.company_name
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: unknown) {
    console.error('Error in partner-notifications function:', error);
    
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