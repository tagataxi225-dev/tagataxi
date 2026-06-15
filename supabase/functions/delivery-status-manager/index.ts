import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      orderId, 
      newStatus, 
      driverId, 
      locationCoordinates,
      deliveryProof,
      recipientSignature,
      driverNotes 
    } = await req.json()

    console.log(`📦 Updating delivery ${orderId} to status: ${newStatus}`)

    // Get current order details
    const { data: currentOrder, error: orderError } = await supabase
      .from('delivery_orders')
      .select('*, user_id')
      .eq('id', orderId)
      .single()

    if (orderError || !currentOrder) {
      throw new Error('Commande de livraison non trouvée')
    }

    const previousStatus = currentOrder.status
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }

    // Add timestamp fields based on status
    switch (newStatus) {
      case 'picked_up':
        updateData.picked_up_at = new Date().toISOString()
        break
      case 'in_transit':
        updateData.in_transit_at = new Date().toISOString()
        break
      case 'delivered':
        updateData.delivered_at = new Date().toISOString()
        updateData.delivery_time = new Date().toISOString()
        if (deliveryProof) updateData.delivery_proof = deliveryProof
        if (recipientSignature) updateData.recipient_signature = recipientSignature
        break
    }

    if (driverNotes) {
      updateData.driver_notes = driverNotes
    }

    // Update the delivery order
    const { error: updateError } = await supabase
      .from('delivery_orders')
      .update(updateData)
      .eq('id', orderId)

    if (updateError) {
      console.error('Error updating delivery order:', updateError)
      throw updateError
    }

    // Add status history entry
    const { error: historyError } = await supabase
      .from('delivery_status_history')
      .insert({
        delivery_order_id: orderId,
        status: newStatus,
        previous_status: previousStatus,
        changed_by: driverId,
        notes: driverNotes,
        location_coordinates: locationCoordinates,
        metadata: {
          delivery_proof: deliveryProof,
          recipient_signature: recipientSignature,
          timestamp: new Date().toISOString()
        }
      })

    if (historyError) {
      console.error('Error creating status history:', historyError)
    }

    // Create notifications for customer
    const statusMessages = {
      picked_up: 'Votre colis a été récupéré',
      in_transit: 'Votre colis est en cours de livraison',
      delivered: 'Votre colis a été livré avec succès'
    }

    const message = statusMessages[newStatus as keyof typeof statusMessages]
    if (message) {
      const { error: notificationError } = await supabase
        .from('delivery_notifications')
        .insert({
          user_id: currentOrder.user_id,
          delivery_order_id: orderId,
          notification_type: 'status_update',
          title: 'Mise à jour de votre livraison',
          message,
          metadata: {
            status: newStatus,
            driver_notes: driverNotes,
            location: locationCoordinates
          }
        })

      if (notificationError) {
        console.error('Error creating customer notification:', notificationError)
      }
    }

    // If delivered, DO NOT call complete-ride-with-commission here
    // The commission is now handled client-side by useUnifiedDeliveryQueue
    // This avoids duplicate/triple calls that cause ThrottlerException
    if (newStatus === 'delivered' && driverId) {
      console.log(`📦 Livraison terminée - Commission gérée côté client (useUnifiedDeliveryQueue)`)
      console.log(`⚠️ NE PAS appeler complete-ride-with-commission ici pour éviter duplication`)

      // Marquer chauffeur disponible
      const { error: availabilityError } = await supabase
        .from('driver_locations')
        .update({ is_available: true })
        .eq('driver_id', driverId)

      if (availabilityError) {
        console.error('Error updating driver availability:', availabilityError)
      }
    }

    console.log(`✅ Successfully updated delivery ${orderId} to ${newStatus}`)

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        newStatus,
        previousStatus,
        message: `Statut mis à jour: ${newStatus}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: unknown) {
    console.error('Delivery status update error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})