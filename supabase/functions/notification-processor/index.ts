import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Process pending notifications from unified_notifications table
async function processPendingNotifications(supabase: any) {
  try {
    // Get pending notifications
    const { data: notifications, error } = await supabase
      .from('unified_notifications')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50); // Process 50 at a time

    if (error) {
      console.error('Error fetching notifications:', error);
      return;
    }

    console.log(`Processing ${notifications.length} pending notifications`);

    for (const notification of notifications) {
      await processNotification(supabase, notification);
    }

  } catch (error: unknown) {
    console.error('Error processing notifications:', error);
  }
}

// Process individual notification
async function processNotification(supabase: any, notification: any) {
  try {
    let success = false;

    switch (notification.channel) {
      case 'push':
        success = await sendPushNotification(supabase, notification);
        break;
      case 'sms':
        success = await sendSMSNotification(supabase, notification);
        break;
      case 'email':
        success = await sendEmailNotification(supabase, notification);
        break;
      default:
        console.warn(`Unknown notification channel: ${notification.channel}`);
    }

    // Update notification status
    await supabase
      .from('unified_notifications')
      .update({
        status: success ? 'sent' : 'failed',
        sent_at: success ? new Date().toISOString() : null,
        error_message: success ? null : 'Failed to send notification'
      })
      .eq('id', notification.id);

    console.log(`Notification ${notification.id} ${success ? 'sent' : 'failed'}`);

  } catch (error: unknown) {
    console.error(`Error processing notification ${notification.id}:`, error);
    
    // Mark as failed
    await supabase
      .from('unified_notifications')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      })
      .eq('id', notification.id);
  }
}

// Send push notification
async function sendPushNotification(supabase: any, notification: any) {
  try {
    // Get user's FCM token
    const { data: profile } = await supabase
      .from('profiles')
      .select('fcm_token')
      .eq('user_id', notification.user_id)
      .single();

    if (!profile?.fcm_token) {
      console.log(`No FCM token for user ${notification.user_id}`);
      
      // Send via Supabase Realtime as fallback
      await supabase
        .channel(`notifications:${notification.user_id}`)
        .send({
          type: 'broadcast',
          event: 'new_notification',
          payload: {
            id: notification.id,
            title: notification.title,
            message: notification.message,
            type: notification.notification_type,
            priority: notification.priority,
            data: notification.metadata,
            timestamp: new Date().toISOString()
          }
        });

      return true; // Realtime sent successfully
    }

    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');
    if (!fcmServerKey) {
      console.warn('FCM_SERVER_KEY not configured, using Realtime only');
      
      // Fallback to Realtime
      await supabase
        .channel(`notifications:${notification.user_id}`)
        .send({
          type: 'broadcast',
          event: 'new_notification',
          payload: {
            id: notification.id,
            title: notification.title,
            message: notification.message,
            type: notification.notification_type,
            priority: notification.priority,
            data: notification.metadata,
            timestamp: new Date().toISOString()
          }
        });

      return true;
    }

    // Send via FCM
    const fcmPayload = {
      to: profile.fcm_token,
      notification: {
        title: notification.title,
        body: notification.message,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: notification.notification_type
      },
      data: {
        notification_id: notification.id,
        type: notification.notification_type,
        priority: notification.priority,
        ...notification.metadata
      }
    };

    const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${fcmServerKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fcmPayload),
    });

    const fcmResult = await fcmResponse.json();
    console.log('FCM result:', fcmResult);

    return fcmResult.success === 1;

  } catch (error: unknown) {
    console.error('Push notification error:', error);
    return false;
  }
}

// Send SMS notification
async function sendSMSNotification(supabase: any, notification: any) {
  try {
    const phoneNumber = notification.metadata?.phone_number;
    if (!phoneNumber) {
      console.error('No phone number provided for SMS notification');
      return false;
    }

    // Call SMS edge function
    const { data, error } = await supabase.functions.invoke('send-sms-notification', {
      body: {
        phone_number: phoneNumber,
        message: notification.message,
        type: notification.notification_type
      }
    });

    if (error) {
      console.error('SMS function error:', error);
      return false;
    }

    return data?.success || false;

  } catch (error: unknown) {
    console.error('SMS notification error:', error);
    return false;
  }
}

// Send email notification (placeholder)
async function sendEmailNotification(supabase: any, notification: any) {
  try {
    // TODO: Implement email sending logic
    console.log('Email notification not implemented yet');
    return false;
  } catch (error: unknown) {
    console.error('Email notification error:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Process pending notifications
    await processPendingNotifications(supabase);

    return new Response(JSON.stringify({
      success: true,
      message: 'Notification processing completed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Notification processor error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});