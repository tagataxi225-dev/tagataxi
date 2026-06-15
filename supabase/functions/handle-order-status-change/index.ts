import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { orderId, newStatus, metadata = {} } = await req.json()

    console.log(`Updating order ${orderId} to status: ${newStatus}`)

    // Préparer les données de mise à jour selon le nouveau statut
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }

    // Ajouter les timestamps spécifiques selon le statut
    switch (newStatus) {
      case 'confirmed':
        updateData.confirmed_at = new Date().toISOString()
        break
      case 'preparing':
        updateData.preparing_at = new Date().toISOString()
        break
      case 'ready_for_pickup':
        updateData.ready_for_pickup_at = new Date().toISOString()
        break
      case 'in_transit':
        updateData.in_transit_at = new Date().toISOString()
        if (metadata.driver_id) {
          // Assigner le livreur si fourni
          const { error: assignmentError } = await supabase
            .from('marketplace_delivery_assignments')
            .update({
              driver_id: metadata.driver_id,
              assignment_status: 'assigned'
            })
            .eq('order_id', orderId)
        }
        break
      case 'delivered':
        updateData.delivered_at = new Date().toISOString()
        if (metadata.driver_notes) {
          updateData.driver_notes = metadata.driver_notes
        }
        break
      case 'completed':
        updateData.completed_at = new Date().toISOString()
        updateData.payment_status = 'completed'
        break
      case 'cancelled':
      case 'rejected':
        // Gérer l'annulation/refus de commande
        updateData.payment_status = 'refunded'
        updateData.revenue_status = 'cancelled'
        if (metadata.rejection_reason) {
          updateData.vendor_rejection_reason = metadata.rejection_reason
        }
        if (newStatus === 'rejected') {
          updateData.vendor_confirmation_status = 'rejected'
        }
        console.log(`Order ${orderId} ${newStatus} with reason:`, metadata.rejection_reason || 'No reason provided')
        break
      default:
        console.warn(`Status ${newStatus} not specifically handled, updating status only`)
        break
    }

    // Calculer l'estimation de livraison
    if (['confirmed', 'preparing', 'ready_for_pickup', 'in_transit'].includes(newStatus)) {
      const { data: estimation } = await supabase
        .rpc('calculate_delivery_estimate', { order_id_param: orderId })
      
      if (estimation) {
        updateData.estimated_delivery_time = estimation
      }
    }

    // Mettre à jour la commande
    const { data: order, error: orderError } = await supabase
      .from('marketplace_orders')
      .update(updateData)
      .eq('id', orderId)
      .select(`
        *,
        marketplace_products!inner(title, seller_id),
        marketplace_delivery_assignments(*)
      `)
      .single()

    if (orderError) {
      throw new Error(`Failed to update order: ${orderError.message}`)
    }

    console.log(`Order ${orderId} updated successfully to ${newStatus}`)

    // Handle special actions based on status
    // Considérer comme "livraison" si delivery_method !== 'pickup' (inclut 'standard', 'delivery', etc.)
    const isDeliveryOrder = order.delivery_method !== 'pickup'

    if (newStatus === 'ready_for_pickup' && isDeliveryOrder) {
      // Auto-assign to an available driver for delivery orders
      try {
        console.log(`[handle-order-status-change] Order ${orderId} ready for delivery, triggering driver assignment...`)
        
        // Utiliser les coordonnées de pickup ou fallback sur delivery_coordinates
        const pickupCoords = order.pickup_coordinates || order.delivery_coordinates
        
        const { data: assignmentResult, error: assignmentError } = await supabase.functions.invoke('marketplace-driver-assignment', {
          body: { 
            orderId,
            action: 'assign',
            pickupCoordinates: pickupCoords,
            deliveryCoordinates: order.delivery_coordinates
          }
        })

        if (assignmentError) {
          console.error('Driver assignment error:', assignmentError)
        } else {
          console.log('Driver assignment result:', assignmentResult)
        }
      } catch (assignmentError) {
        console.error('Failed to assign driver:', assignmentError)
        // Don't fail the status update if driver assignment fails
      }
    }

    if (newStatus === 'completed') {
      // Release escrow payment
      const { error: escrowError } = await supabase
        .from('escrow_payments')
        .update({
          status: 'released',
          released_at: new Date().toISOString()
        })
        .eq('order_id', orderId)

      if (escrowError) {
        console.error('Failed to release escrow payment:', escrowError)
      } else {
        console.log('Escrow payment released successfully')
      }
    }

    // Create notifications based on status change
    const notificationTitle = getNotificationTitle(newStatus)
    const notificationMessage = getNotificationMessage(newStatus, order.delivery_method)

    if (notificationTitle && notificationMessage) {
      // Notify buyer
      const { error: buyerNotificationError } = await supabase
        .from('order_notifications')
        .insert({
          order_id: orderId,
          user_id: order.buyer_id,
          notification_type: getNotificationType(newStatus, 'buyer'),
          title: notificationTitle,
          message: notificationMessage,
          metadata: { 
            order_id: orderId, 
            status: newStatus,
            delivery_method: order.delivery_method
          }
        })

      if (buyerNotificationError) {
        console.error('Error creating buyer notification:', buyerNotificationError)
      }

      // Notify seller for certain statuses
      const sellerNotificationType = getNotificationType(newStatus, 'seller')
      if (sellerNotificationType) {
        const { error: sellerNotificationError } = await supabase
          .from('order_notifications')
          .insert({
            order_id: orderId,
            user_id: order.seller_id,
            notification_type: sellerNotificationType,
            title: getNotificationTitle(newStatus, 'seller'),
            message: getNotificationMessage(newStatus, order.delivery_method, 'seller'),
            metadata: { 
              order_id: orderId, 
              status: newStatus,
              delivery_method: order.delivery_method
            }
          })

        if (sellerNotificationError) {
          console.error('Error creating seller notification:', sellerNotificationError)
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        order,
        message: 'Order status updated successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('Error in handle-order-status-change:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})

function getNotificationTitle(status: string, recipient: 'buyer' | 'seller' = 'buyer'): string | null {
  const titles = {
    buyer: {
      'confirmed': 'Commande confirmée',
      'preparing': 'Commande en préparation', 
      'ready_for_pickup': 'Commande prête',
      'assigned_to_driver': 'Livreur assigné',
      'picked_up_by_driver': 'Commande récupérée',
      'in_transit': 'Commande en livraison',
      'delivered': 'Commande livrée',
      'completed': 'Commande terminée'
    },
    seller: {
      'completed': 'Paiement libéré'
    }
  }

  return titles[recipient][status as keyof typeof titles[typeof recipient]] || null
}

function getNotificationMessage(status: string, deliveryMethod: string, recipient: 'buyer' | 'seller' = 'buyer'): string | null {
  const messages = {
    buyer: {
      'confirmed': 'Votre commande a été confirmée par le vendeur',
      'preparing': 'Le vendeur prépare votre commande',
      'ready_for_pickup': deliveryMethod === 'pickup' 
        ? 'Votre commande est prête pour retrait en boutique'
        : 'Votre commande est prête et sera bientôt assignée à un livreur',
      'assigned_to_driver': 'Un livreur a été assigné à votre commande',
      'picked_up_by_driver': 'Le livreur a récupéré votre commande chez le vendeur',
      'in_transit': 'Votre commande est en route vers vous',
      'delivered': 'Votre commande a été livrée avec succès',
      'completed': 'Transaction terminée avec succès'
    },
    seller: {
      'completed': 'Le paiement de votre vente a été libéré'
    }
  }

  return messages[recipient][status as keyof typeof messages[typeof recipient]] || null
}

function getNotificationType(status: string, recipient: 'buyer' | 'seller'): string | null {
  const types = {
    buyer: {
      'confirmed': 'order_confirmed',
      'preparing': 'order_preparing',
      'ready_for_pickup': 'order_ready',
      'assigned_to_driver': 'order_assigned_to_driver',
      'picked_up_by_driver': 'order_picked_up',
      'in_transit': 'order_in_transit',
      'delivered': 'order_delivered',
      'completed': 'order_completed'
    },
    seller: {
      'completed': 'payment_released'
    }
  }

  return types[recipient][status as keyof typeof types[typeof recipient]] || null
}