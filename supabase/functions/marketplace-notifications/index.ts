import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { type, orderId, userId, message } = await req.json()

    console.log(`Processing notification: ${type} for order ${orderId}`)

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from('marketplace_orders')
      .select(`
        *,
        marketplace_products!inner(title),
        buyer:profiles!marketplace_orders_buyer_id_fkey(display_name),
        seller:profiles!marketplace_orders_seller_id_fkey(display_name)
      `)
      .eq('id', orderId)
      .single()

    if (orderError) {
      throw new Error(`Failed to fetch order: ${orderError.message}`)
    }

    // Determine notification recipients and content
    let recipients: string[] = []
    let notificationTitle = ''
    let notificationBody = ''

    switch (type) {
      case 'order_created':
        recipients = [order.seller_id]
        notificationTitle = 'Nouvelle commande'
        notificationBody = `${order.buyer.display_name} a commandé ${order.marketplace_products.title}`
        break

      case 'order_confirmed':
        recipients = [order.buyer_id]
        notificationTitle = 'Commande confirmée'
        notificationBody = `Votre commande de ${order.marketplace_products.title} a été confirmée`
        break

      case 'order_delivered':
        recipients = [order.buyer_id]
        notificationTitle = 'Commande livrée'
        notificationBody = `Votre commande de ${order.marketplace_products.title} a été livrée`
        break

      case 'order_completed':
        recipients = [order.seller_id]
        notificationTitle = 'Commande terminée'
        notificationBody = `La commande de ${order.marketplace_products.title} a été terminée`
        break

      case 'order_cancelled':
        recipients = [order.buyer_id === userId ? order.seller_id : order.buyer_id]
        notificationTitle = 'Commande annulée'
        notificationBody = `La commande de ${order.marketplace_products.title} a été annulée`
        break

      case 'new_message':
        // Get conversation details with product info
        const { data: conversation } = await supabaseClient
          .from('conversations')
          .select(`
            buyer_id, 
            seller_id,
            product:marketplace_products(title)
          `)
          .eq('id', message.conversation_id)
          .single()

        if (conversation) {
          const recipientId = conversation.buyer_id === userId 
            ? conversation.seller_id 
            : conversation.buyer_id
          
          recipients = [recipientId]
          notificationTitle = 'Nouveau message'
          notificationBody = `Vous avez reçu un message concernant "${conversation.product.title}"`

          // Create in-app notification
          await supabaseClient.from('delivery_notifications').insert({
            user_id: recipientId,
            notification_type: 'new_marketplace_message',
            title: notificationTitle,
            message: message.content.substring(0, 100),
            metadata: {
              conversation_id: message.conversation_id,
              product_id: conversation.product_id,
              sender_id: userId
            }
          })
        }
        break

      default:
        throw new Error(`Unknown notification type: ${type}`)
    }

    // Send notifications to recipients
    for (const recipientId of recipients) {
      // In a real implementation, you would send push notifications here
      // For now, we'll just log the notification
      console.log(`Sending notification to ${recipientId}:`, {
        title: notificationTitle,
        body: notificationBody,
        data: {
          type,
          orderId,
          conversationId: message?.conversation_id
        }
      })

      // You could integrate with services like:
      // - Firebase Cloud Messaging (FCM)
      // - OneSignal
      // - Pusher
      // - WebPush

      // Example FCM integration (commented out):
      /*
      const fcmServerKey = Deno.env.get('FCM_SERVER_KEY')
      if (fcmServerKey) {
        // Get user's FCM token from user_settings or separate table
        const { data: userToken } = await supabaseClient
          .from('user_push_tokens')
          .select('fcm_token')
          .eq('user_id', recipientId)
          .single()

        if (userToken?.fcm_token) {
          const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
              'Authorization': `key=${fcmServerKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: userToken.fcm_token,
              notification: {
                title: notificationTitle,
                body: notificationBody,
              },
              data: {
                type,
                orderId,
                conversationId: message?.conversation_id
              }
            })
          })

          if (!fcmResponse.ok) {
            console.error('Failed to send FCM notification:', await fcmResponse.text())
          }
        }
      }
      */
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationsSent: recipients.length,
        recipients 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error: unknown) {
    console.error('Error in marketplace-notifications:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})