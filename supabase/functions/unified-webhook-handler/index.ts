import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to log webhook audit
async function logWebhookAudit(supabase: any, webhookType: string, payload: any, response: any, error?: string) {
  try {
    await supabase.rpc('log_webhook_audit', {
      p_webhook_type: webhookType,
      p_payload: payload,
      p_response: response,
      p_status: error ? 'error' : 'success',
      p_error_message: error || null
    });
  } catch (auditError) {
    console.error('Failed to log webhook audit:', auditError);
  }
}

// Helper function to send notifications via unified system
async function sendUnifiedNotification(supabase: any, data: any) {
  try {
    const { data: notification, error } = await supabase
      .from('unified_notifications')
      .insert({
        user_id: data.user_id,
        notification_type: data.type || 'general',
        title: data.title,
        message: data.message,
        channel: data.channel || 'push',
        priority: data.priority || 'normal',
        template_id: data.template_id,
        metadata: data.metadata || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create unified notification:', error);
      return false;
    }

    console.log('Unified notification created:', notification.id);
    return true;
  } catch (error: unknown) {
    console.error('Unified notification error:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestPayload = await req.json();
  const { webhook_type, ...data } = requestPayload;

  if (!webhook_type) {
    const errorResponse = { error: 'webhook_type is required' };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    let response: any = {};

    switch (webhook_type) {
      case 'push_notification':
        // Handle push notifications
        const notificationSent = await sendUnifiedNotification(supabase, {
          user_id: data.user_id,
          type: data.type,
          title: data.title,
          message: data.message,
          channel: 'push',
          priority: data.priority,
          metadata: data.data
        });

        response = {
          success: notificationSent,
          type: 'push_notification',
          notification_sent: notificationSent
        };
        break;

      case 'sms_notification':
        // Handle SMS notifications
        const smsSent = await sendUnifiedNotification(supabase, {
          user_id: data.user_id,
          type: data.type || 'sms',
          title: 'SMS Notification',
          message: data.message,
          channel: 'sms',
          priority: data.priority || 'normal',
          metadata: { phone_number: data.phone_number }
        });

        response = {
          success: smsSent,
          type: 'sms_notification',
          sms_sent: smsSent
        };
        break;

      case 'marketplace_notification':
        // Handle marketplace notifications
        let recipients: string[] = [];
        let notificationTitle = '';
        let notificationMessage = '';

        // Fetch order details if needed
        if (data.order_id) {
          const { data: order } = await supabase
            .from('marketplace_orders')
            .select(`
              *,
              marketplace_products (
                name,
                seller_id,
                profiles!marketplace_products_seller_id_fkey (
                  display_name,
                  user_id
                )
              ),
              profiles!marketplace_orders_buyer_id_fkey (
                display_name,
                user_id
              )
            `)
            .eq('id', data.order_id)
            .single();

          if (order) {
            switch (data.type) {
              case 'order_created':
                recipients = [order.marketplace_products.seller_id];
                notificationTitle = 'Nouvelle commande reçue';
                notificationMessage = `${order.profiles.display_name} a passé une commande pour ${order.marketplace_products.name}`;
                break;

              case 'order_confirmed':
                recipients = [order.buyer_id];
                notificationTitle = 'Commande confirmée';
                notificationMessage = `Votre commande pour ${order.marketplace_products.name} a été confirmée`;
                break;

              case 'order_delivered':
                recipients = [order.buyer_id];
                notificationTitle = 'Commande livrée';
                notificationMessage = `Votre commande pour ${order.marketplace_products.name} a été livrée`;
                break;
            }
          }
        }

        // Send notifications to all recipients
        const marketplaceResults = await Promise.all(
          recipients.map(recipient => 
            sendUnifiedNotification(supabase, {
              user_id: recipient,
              type: data.type,
              title: notificationTitle,
              message: notificationMessage,
              channel: 'push',
              priority: 'normal',
              metadata: { order_id: data.order_id }
            })
          )
        );

        response = {
          success: marketplaceResults.every(r => r),
          type: 'marketplace_notification',
          notifications_sent: marketplaceResults.filter(r => r).length,
          total_recipients: recipients.length
        };
        break;

      default:
        response = {
          success: false,
          error: `Unknown webhook type: ${webhook_type}`
        };
    }

    // Log audit
    await logWebhookAudit(supabase, webhook_type, requestPayload, response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Unified webhook error:', error);
    const errorResponse = {
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    };

    // Log error audit
    await logWebhookAudit(supabase, webhook_type, requestPayload, errorResponse, error instanceof Error ? error.message : 'Unknown error');

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});