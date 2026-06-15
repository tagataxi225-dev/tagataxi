import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface RequestBody {
  orderId: string;
  vendorId: string;
  action: 'self_assign' | 'check_timeout' | 'admin_notification';
  metadata?: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { orderId, vendorId, action, metadata }: RequestBody = await req.json();

    console.log(`Processing vendor self-delivery action: ${action} for order ${orderId}`);

    switch (action) {
      case 'self_assign':
        return await handleSelfAssign(supabase, orderId, vendorId, metadata);
      
      case 'check_timeout':
        return await handleDriverTimeout(supabase, orderId);
      
      case 'admin_notification':
        return await handleAdminNotification(supabase, orderId, metadata);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error: unknown) {
    console.error('Error in vendor-self-delivery:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function handleSelfAssign(supabase: any, orderId: string, vendorId: string, metadata: any = {}) {
  console.log(`Vendor ${vendorId} self-assigning delivery for order ${orderId}`);

  // Get order details
  const { data: order, error: orderError } = await supabase
    .from('marketplace_orders')
    .select('*, marketplace_products(title)')
    .eq('id', orderId)
    .eq('seller_id', vendorId)
    .single();

  if (orderError) {
    throw new Error(`Failed to fetch order: ${orderError.message}`);
  }

  if (!order) {
    throw new Error('Order not found or unauthorized');
  }

  if (order.status !== 'ready' && order.status !== 'ready_for_pickup') {
    throw new Error(`Cannot self-assign delivery for order with status: ${order.status}`);
  }

  // Create or update delivery assignment for vendor
  const { error: assignmentError } = await supabase
    .from('marketplace_delivery_assignments')
    .upsert({
      order_id: orderId,
      driver_id: vendorId,
      driver_type: 'vendor',
      status: 'assigned',
      assigned_at: new Date().toISOString(),
      vendor_self_delivery: true,
      estimated_pickup_time: metadata.estimatedPickupTime || new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
      notes: metadata.notes || 'Livraison effectuée par le vendeur'
    });

  if (assignmentError) {
    throw new Error(`Failed to create delivery assignment: ${assignmentError.message}`);
  }

  // Update order status
  const { error: updateError } = await supabase
    .from('marketplace_orders')
    .update({
      status: 'assigned_to_driver',
      driver_assigned_at: new Date().toISOString(),
      assigned_driver_type: 'vendor'
    })
    .eq('id', orderId);

  if (updateError) {
    throw new Error(`Failed to update order status: ${updateError.message}`);
  }

  // Create notification for buyer
  const { error: notificationError } = await supabase
    .from('notifications')
    .insert({
      user_id: order.buyer_id,
      title: 'Vendeur assigné pour la livraison',
      message: `Le vendeur va livrer votre commande "${order.marketplace_products?.title || 'Produit'}" personnellement.`,
      type: 'marketplace_delivery_assigned',
      related_id: orderId,
      data: {
        order_id: orderId,
        driver_type: 'vendor',
        vendor_delivery: true
      }
    });

  if (notificationError) {
    console.error('Failed to create buyer notification:', notificationError);
  }

  // Create admin notification for tracking
  const { error: adminNotificationError } = await supabase
    .from('admin_notifications')
    .insert({
      type: 'vendor_self_delivery',
      title: 'Auto-livraison vendeur',
      message: `Le vendeur a pris en charge la livraison de la commande ${orderId}`,
      severity: 'info',
      data: {
        order_id: orderId,
        vendor_id: vendorId,
        action: 'self_assigned',
        timestamp: new Date().toISOString()
      },
      created_at: new Date().toISOString()
    });

  if (adminNotificationError) {
    console.error('Failed to create admin notification:', adminNotificationError);
  }

  console.log(`Successfully assigned vendor ${vendorId} for self-delivery of order ${orderId}`);

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Vous avez été assigné pour livrer cette commande',
      assignment: {
        order_id: orderId,
        driver_type: 'vendor',
        assigned_at: new Date().toISOString()
      }
    }),
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

async function handleDriverTimeout(supabase: any, orderId: string) {
  console.log(`Checking driver timeout for order ${orderId}`);

  // Get order and assignment details
  const { data: order, error: orderError } = await supabase
    .from('marketplace_orders')
    .select(`
      *,
      marketplace_delivery_assignments(*)
    `)
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    throw new Error('Order not found');
  }

  // Check if order has been waiting for driver assignment too long
  const readyAt = new Date(order.ready_at || order.created_at);
  const now = new Date();
  const waitTimeMinutes = (now.getTime() - readyAt.getTime()) / (1000 * 60);

  const TIMEOUT_MINUTES = 15; // 15 minutes timeout

  if (waitTimeMinutes > TIMEOUT_MINUTES && order.status === 'ready') {
    // Create admin alert for timeout
    const { error: alertError } = await supabase
      .from('admin_notifications')
      .insert({
        type: 'driver_assignment_timeout',
        title: 'Timeout assignation chauffeur',
        message: `Commande ${orderId} en attente de chauffeur depuis ${Math.round(waitTimeMinutes)} minutes`,
        severity: 'warning',
        data: {
          order_id: orderId,
          wait_time_minutes: waitTimeMinutes,
          timeout_threshold: TIMEOUT_MINUTES,
          suggested_action: 'vendor_self_delivery'
        },
        created_at: new Date().toISOString()
      });

    if (alertError) {
      console.error('Failed to create timeout alert:', alertError);
    }

    return new Response(
      JSON.stringify({
        timeout: true,
        waitTimeMinutes,
        suggested_action: 'vendor_self_delivery',
        message: `Aucun chauffeur disponible depuis ${Math.round(waitTimeMinutes)} minutes. Voulez-vous livrer vous-même ?`
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  return new Response(
    JSON.stringify({
      timeout: false,
      waitTimeMinutes,
      message: 'En attente d\'assignation de chauffeur'
    }),
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

async function handleAdminNotification(supabase: any, orderId: string, metadata: any = {}) {
  console.log(`Creating admin notification for order ${orderId}`);

  const { error: notificationError } = await supabase
    .from('admin_notifications')
    .insert({
      type: metadata.type || 'marketplace_order_issue',
      title: metadata.title || 'Problème de commande marketplace',
      message: metadata.message || `Problème détecté sur commande ${orderId}`,
      severity: metadata.severity || 'info',
      data: {
        order_id: orderId,
        ...metadata.data
      },
      created_at: new Date().toISOString()
    });

  if (notificationError) {
    throw new Error(`Failed to create admin notification: ${notificationError.message}`);
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Admin notification created successfully'
    }),
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}