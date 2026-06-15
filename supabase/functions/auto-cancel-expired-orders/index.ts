import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

    const now = new Date();
    const expirationTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago

    console.log('Starting auto-cancellation process...');

    // Auto-cancel expired transport bookings
    const { data: expiredBookings, error: bookingsError } = await supabaseClient
      .from('transport_bookings')
      .select('id, user_id, driver_id, status, estimated_price, actual_price, created_at')
      .in('status', ['pending', 'confirmed'])
      .lt('created_at', expirationTime.toISOString())
      .is('driver_id', null);

    if (bookingsError) {
      console.error('Error fetching expired bookings:', bookingsError);
    } else if (expiredBookings && expiredBookings.length > 0) {
      console.log(`Found ${expiredBookings.length} expired transport bookings`);

      for (const booking of expiredBookings) {
        // Update booking status
        const { error: updateError } = await supabaseClient
          .from('transport_bookings')
          .update({
            status: 'cancelled',
            cancelled_at: now.toISOString(),
            cancelled_by: booking.user_id
          })
          .eq('id', booking.id);

        if (updateError) {
          console.error(`Error updating booking ${booking.id}:`, updateError);
          continue;
        }

        // Log cancellation
        const { error: logError } = await supabaseClient
          .from('cancellation_history')
          .insert({
            reference_id: booking.id,
            reference_type: 'transport',
            cancelled_by: booking.user_id,
            cancellation_type: 'auto_timeout',
            reason: 'Commande automatiquement annulée après 30 minutes sans chauffeur assigné',
            status_at_cancellation: booking.status,
            financial_impact: {
              refund_amount: booking.estimated_price || 0,
              currency: 'CDF',
              refund_status: 'not_applicable'
            },
            metadata: {
              auto_cancelled: true,
              original_created_at: booking.created_at,
              timeout_minutes: 30
            }
          });

        if (logError) {
          console.error(`Error logging cancellation for booking ${booking.id}:`, logError);
        }

        // Create notification for user
        await supabaseClient
          .from('push_notifications')
          .insert({
            user_id: booking.user_id,
            title: 'Commande annulée automatiquement',
            message: 'Votre commande de transport a été annulée automatiquement car aucun chauffeur n\'était disponible.',
            data: {
              type: 'booking_auto_cancelled',
              booking_id: booking.id
            }
          });
      }
    }

    // Auto-cancel expired delivery orders
    const { data: expiredDeliveries, error: deliveriesError } = await supabaseClient
      .from('delivery_orders')
      .select('id, user_id, driver_id, status, estimated_price, actual_price, created_at')
      .in('status', ['pending', 'confirmed'])
      .lt('created_at', expirationTime.toISOString())
      .is('driver_id', null);

    if (deliveriesError) {
      console.error('Error fetching expired deliveries:', deliveriesError);
    } else if (expiredDeliveries && expiredDeliveries.length > 0) {
      console.log(`Found ${expiredDeliveries.length} expired delivery orders`);

      for (const delivery of expiredDeliveries) {
        // Update delivery status
        const { error: updateError } = await supabaseClient
          .from('delivery_orders')
          .update({
            status: 'cancelled',
            cancelled_at: now.toISOString(),
            cancelled_by: delivery.user_id
          })
          .eq('id', delivery.id);

        if (updateError) {
          console.error(`Error updating delivery ${delivery.id}:`, updateError);
          continue;
        }

        // Log cancellation
        const { error: logError } = await supabaseClient
          .from('cancellation_history')
          .insert({
            reference_id: delivery.id,
            reference_type: 'delivery',
            cancelled_by: delivery.user_id,
            cancellation_type: 'auto_timeout',
            reason: 'Commande de livraison automatiquement annulée après 30 minutes sans livreur assigné',
            status_at_cancellation: delivery.status,
            financial_impact: {
              refund_amount: delivery.estimated_price || 0,
              currency: 'CDF',
              refund_status: 'not_applicable'
            },
            metadata: {
              auto_cancelled: true,
              original_created_at: delivery.created_at,
              timeout_minutes: 30
            }
          });

        if (logError) {
          console.error(`Error logging cancellation for delivery ${delivery.id}:`, logError);
        }

        // Create notification for user
        await supabaseClient
          .from('push_notifications')
          .insert({
            user_id: delivery.user_id,
            title: 'Livraison annulée automatiquement',
            message: 'Votre commande de livraison a été annulée automatiquement car aucun livreur n\'était disponible.',
            data: {
              type: 'delivery_auto_cancelled',
              delivery_id: delivery.id
            }
          });
      }
    }

    // Auto-cancel expired marketplace orders (after 24 hours if not confirmed)
    const marketplaceExpirationTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    const { data: expiredMarketplace, error: marketplaceError } = await supabaseClient
      .from('marketplace_orders')
      .select('id, buyer_id, seller_id, status, total_amount, created_at')
      .eq('status', 'pending')
      .lt('created_at', marketplaceExpirationTime.toISOString());

    if (marketplaceError) {
      console.error('Error fetching expired marketplace orders:', marketplaceError);
    } else if (expiredMarketplace && expiredMarketplace.length > 0) {
      console.log(`Found ${expiredMarketplace.length} expired marketplace orders`);

      for (const order of expiredMarketplace) {
        // Update order status
        const { error: updateError } = await supabaseClient
          .from('marketplace_orders')
          .update({
            status: 'cancelled',
            cancelled_at: now.toISOString(),
            cancellation_reason: 'Commande expirée - non confirmée après 24h'
          })
          .eq('id', order.id);

        if (updateError) {
          console.error(`Error updating marketplace order ${order.id}:`, updateError);
          continue;
        }

        // Log cancellation
        const { error: logError } = await supabaseClient
          .from('cancellation_history')
          .insert({
            reference_id: order.id,
            reference_type: 'marketplace',
            cancelled_by: order.buyer_id,
            cancellation_type: 'auto_timeout',
            reason: 'Commande marketplace automatiquement annulée après 24 heures sans confirmation',
            status_at_cancellation: 'pending',
            financial_impact: {
              refund_amount: order.total_amount || 0,
              currency: 'CDF',
              refund_status: 'pending'
            },
            metadata: {
              auto_cancelled: true,
              original_created_at: order.created_at,
              timeout_hours: 24
            }
          });

        if (logError) {
          console.error(`Error logging cancellation for marketplace order ${order.id}:`, logError);
        }

        // Notify both buyer and seller
        await supabaseClient
          .from('push_notifications')
          .insert([
            {
              user_id: order.buyer_id,
              title: 'Commande annulée',
              message: 'Votre commande a été annulée automatiquement car elle n\'a pas été confirmée dans les 24h.',
              data: {
                type: 'marketplace_auto_cancelled',
                order_id: order.id
              }
            },
            {
              user_id: order.seller_id,
              title: 'Commande annulée',
              message: 'Une commande a été annulée automatiquement car elle n\'a pas été confirmée dans les 24h.',
              data: {
                type: 'marketplace_auto_cancelled',
                order_id: order.id
              }
            }
          ]);
      }
    }

    const totalCancelled = 
      (expiredBookings?.length || 0) + 
      (expiredDeliveries?.length || 0) + 
      (expiredMarketplace?.length || 0);

    console.log(`Auto-cancellation completed. Total cancelled: ${totalCancelled}`);

    return new Response(
      JSON.stringify({
        success: true,
        cancelled: {
          transport: expiredBookings?.length || 0,
          delivery: expiredDeliveries?.length || 0,
          marketplace: expiredMarketplace?.length || 0,
          total: totalCancelled
        },
        timestamp: now.toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: unknown) {
    console.error('Error in auto-cancel function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as any).message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
