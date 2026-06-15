import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const { orderId, orderType, driverId } = await req.json()

    if (!orderId || !orderType || !driverId) {
      throw new Error('Missing required fields: orderId, orderType, driverId')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get pending compensations for this order
    const { data: compensations, error: fetchError } = await supabase
      .from('promo_driver_compensations')
      .select('*')
      .eq('order_id', orderId)
      .eq('order_type', orderType)
      .eq('driver_id', driverId)
      .eq('status', 'pending')

    if (fetchError) {
      console.error('Error fetching compensations:', fetchError)
      throw fetchError
    }

    if (!compensations || compensations.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No pending compensations found',
          credited: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let totalRidesCredited = 0
    const results = []

    for (const compensation of compensations) {
      try {
        // Check if driver has an active subscription
        const { data: subscription, error: subError } = await supabase
          .from('driver_subscriptions')
          .select('*')
          .eq('driver_id', driverId)
          .eq('status', 'active')
          .gte('end_date', new Date().toISOString())
          .order('end_date', { ascending: false })
          .limit(1)
          .maybeSingle()

        let creditResult
        let compensationType = 'bonus_rides'

        if (subscription && !subError) {
          // Driver has active subscription - credit rides directly
          const { error: updateError } = await supabase
            .from('driver_subscriptions')
            .update({
              rides_remaining: subscription.rides_remaining + compensation.rides_credited
            })
            .eq('id', subscription.id)

          if (updateError) {
            console.error('Error updating subscription:', updateError)
            throw updateError
          }

          compensationType = 'rides_credit'
          creditResult = {
            subscription_id: subscription.id,
            new_rides_remaining: subscription.rides_remaining + compensation.rides_credited
          }

          console.log(`Credited ${compensation.rides_credited} rides to subscription ${subscription.id}`)
        } else {
          // No active subscription - credit to bonus rides
          const { data: bonusResult, error: bonusError } = await supabase
            .rpc('credit_driver_bonus_rides', {
              p_driver_id: driverId,
              p_rides_amount: compensation.rides_credited
            })

          if (bonusError) {
            console.error('Error crediting bonus rides:', bonusError)
            throw bonusError
          }

          creditResult = bonusResult
          console.log(`Credited ${compensation.rides_credited} bonus rides for driver ${driverId}`)
        }

        // Update compensation status
        const { error: updateCompError } = await supabase
          .from('promo_driver_compensations')
          .update({
            status: 'credited',
            credited_at: new Date().toISOString(),
            compensation_type: compensationType,
            metadata: {
              ...compensation.metadata,
              credit_result: creditResult,
              credited_by: 'system'
            }
          })
          .eq('id', compensation.id)

        if (updateCompError) {
          console.error('Error updating compensation:', updateCompError)
          throw updateCompError
        }

        // Log activity
        await supabase
          .from('activity_logs')
          .insert({
            user_id: driverId,
            activity_type: 'promo_compensation_credited',
            description: `Reçu ${compensation.rides_credited} course(s) gratuite(s) grâce à une promo client`,
            metadata: {
              compensation_id: compensation.id,
              order_id: orderId,
              order_type: orderType,
              rides_credited: compensation.rides_credited,
              compensation_type: compensationType
            }
          })

        totalRidesCredited += compensation.rides_credited
        results.push({
          compensation_id: compensation.id,
          rides_credited: compensation.rides_credited,
          compensation_type: compensationType,
          success: true
        })

      } catch (error: unknown) {
        console.error(`Error processing compensation ${compensation.id}:`, error)
        
        // Mark as failed
        await supabase
          .from('promo_driver_compensations')
          .update({
            status: 'failed',
            metadata: {
              ...compensation.metadata,
              error_message: error instanceof Error ? error.message : 'Unknown error',
              failed_at: new Date().toISOString()
            }
          })
          .eq('id', compensation.id)

        results.push({
          compensation_id: compensation.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    console.log(`Credited total of ${totalRidesCredited} rides to driver ${driverId}`)

    return new Response(
      JSON.stringify({
        success: true,
        credited: totalRidesCredited,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('Error in credit-promo-driver-compensation:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
