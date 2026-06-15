import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface NotificationRequest {
  type: 'driver_assignment' | 'order_update' | 'broadcast' | 'emergency';
  recipients: string[]; // User IDs or 'all'
  title: string;
  body: string;
  data?: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  send_immediately?: boolean;
  scheduled_for?: string;
}

interface NotificationQueue {
  id?: string;
  type: string;
  recipients: string[];
  title: string;
  body: string;
  data: Record<string, any>;
  priority: string;
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'retry';
  retry_count: number;
  max_retries: number;
  scheduled_for?: string;
  sent_at?: string;
  error_message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    switch (action) {
      case 'send':
        return await handleSendNotification(req, supabase);
      case 'process-queue':
        return await handleProcessQueue(req, supabase);
      case 'status':
        return await handleGetStatus(req, supabase);
      case 'retry-failed':
        return await handleRetryFailed(req, supabase);
      default:
        return await handleSendNotification(req, supabase);
    }
  } catch (error: unknown) {
    console.error('Error in notification-dispatcher:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

async function handleSendNotification(req: Request, supabase: any): Promise<Response> {
  const { type, recipients, title, body, data = {}, priority = 'normal', send_immediately = true, scheduled_for }: NotificationRequest = await req.json();

  console.log(`📱 Notification request: ${type} to ${recipients.length} recipients`);

  // Expand recipients if needed
  let expandedRecipients = recipients;
  if (recipients.includes('all_drivers')) {
    const { data: drivers } = await supabase
      .from('chauffeurs')
      .select('user_id')
      .eq('is_active', true);
    
    expandedRecipients = [...recipients.filter(r => r !== 'all_drivers'), ...drivers.map((d: any) => d.user_id)];
  }

  if (recipients.includes('all_clients')) {
    const { data: clients } = await supabase
      .from('clients')
      .select('user_id')
      .eq('is_active', true);
    
    expandedRecipients = [...expandedRecipients.filter(r => r !== 'all_clients'), ...clients.map((c: any) => c.user_id)];
  }

  // Create notification queue entries
  const queueEntries: any[] = expandedRecipients.map(userId => ({
    type,
    recipients: [userId],
    title,
    body,
    data: { ...data, user_id: userId },
    priority,
    status: send_immediately ? 'pending' : 'scheduled',
    retry_count: 0,
    max_retries: priority === 'urgent' ? 5 : 3,
    scheduled_for: scheduled_for || (send_immediately ? new Date().toISOString() : undefined)
  }));

  // Insert into queue
  const { data: queuedNotifications, error: queueError } = await supabase
    .from('push_notification_queue')
    .insert(queueEntries)
    .select();

  if (queueError) {
    console.error('Error queuing notifications:', queueError);
    return new Response(
      JSON.stringify({ success: false, error: queueError.message }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  // Process immediately if requested
  if (send_immediately) {
    const processResult = await processNotificationQueue(supabase, queuedNotifications.map((n: any) => n.id));
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        queued: queuedNotifications.length,
        processed: processResult.processed,
        failed: processResult.failed,
        queue_ids: queuedNotifications.map((n: any) => n.id)
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      queued: queuedNotifications.length,
      queue_ids: queuedNotifications.map((n: any) => n.id)
    }),
    { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

async function handleProcessQueue(req: Request, supabase: any): Promise<Response> {
  console.log('🔄 Processing notification queue...');
  
  const result = await processNotificationQueue(supabase);
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      processed: result.processed,
      failed: result.failed,
      retried: result.retried
    }),
    { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

async function processNotificationQueue(supabase: any, specificIds?: string[]) {
  let query = supabase
    .from('push_notification_queue')
    .select('*')
    .in('status', ['pending', 'retry'])
    .lte('scheduled_for', new Date().toISOString())
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(100);

  if (specificIds) {
    query = query.in('id', specificIds);
  }

  const { data: pendingNotifications, error } = await query;

  if (error || !pendingNotifications) {
    console.error('Error fetching pending notifications:', error);
    return { processed: 0, failed: 0, retried: 0 };
  }

  console.log(`📋 Processing ${pendingNotifications.length} notifications`);

  let processed = 0;
  let failed = 0;
  let retried = 0;

  for (const notification of pendingNotifications) {
    try {
      // Mark as processing
      await supabase
        .from('push_notification_queue')
        .update({ status: 'processing' })
        .eq('id', notification.id);

      // Get user's push tokens
      const { data: tokens } = await supabase
        .from('push_notification_tokens')
        .select('token, platform')
        .eq('user_id', notification.recipients[0])
        .eq('is_active', true);

      if (!tokens || tokens.length === 0) {
        console.log(`⚠️ No push tokens for user ${notification.recipients[0]}`);
        
        // Mark as failed - no tokens
        await supabase
          .from('push_notification_queue')
          .update({ 
            status: 'failed',
            error_message: 'No active push tokens found',
            processed_at: new Date().toISOString()
          })
          .eq('id', notification.id);
        
        failed++;
        continue;
      }

      // Simulate successful send (replace with actual FCM/APNS logic)
      await supabase
        .from('push_notification_queue')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString(),
          processed_at: new Date().toISOString()
        })
        .eq('id', notification.id);
      
      processed++;
      console.log(`📤 Notification sent successfully: ${notification.title}`);

    } catch (error: unknown) {
      console.error(`❌ Error processing notification ${notification.id}:`, error);
      
      await supabase
        .from('push_notification_queue')
        .update({ 
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          processed_at: new Date().toISOString()
        })
        .eq('id', notification.id);
      
      failed++;
    }
  }

  return { processed, failed, retried };
}

async function handleGetStatus(req: Request, supabase: any): Promise<Response> {
  const { data: stats } = await supabase
    .from('push_notification_queue')
    .select('status')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  const statusCounts = (stats || []).reduce((acc: any, item: any) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});

  return new Response(
    JSON.stringify({ 
      success: true, 
      stats: statusCounts,
      total: stats?.length || 0
    }),
    { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

async function handleRetryFailed(req: Request, supabase: any): Promise<Response> {
  const { data: failedNotifications } = await supabase
    .from('push_notification_queue')
    .update({ 
      status: 'retry',
      retry_count: 0,
      scheduled_for: new Date().toISOString()
    })
    .eq('status', 'failed')
    .eq('retry_count', 0) // Only retry ones that haven't been retried yet
    .select();

  const result = await processNotificationQueue(supabase, failedNotifications?.map((n: any) => n.id) || []);

  return new Response(
    JSON.stringify({ 
      success: true, 
      retried: failedNotifications?.length || 0,
      result
    }),
    { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

serve(handler);