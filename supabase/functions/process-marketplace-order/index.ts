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

    const { orderId } = await req.json()

    console.log(`Processing marketplace order ${orderId}`)

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from('marketplace_orders')
      .select(`
        *,
        marketplace_products!inner(title, seller_id),
        escrow_payments!inner(*)
      `)
      .eq('id', orderId)
      .single()

    if (orderError) {
      throw new Error(`Failed to fetch order: ${orderError.message}`)
    }

    // Check if this is a delivery order
    if (order.delivery_method !== 'pickup') {
      // Create delivery assignment for internal drivers
      const { data: assignment, error: assignmentError } = await supabaseClient
        .from('marketplace_delivery_assignments')
        .insert({
          order_id: orderId,
          pickup_location: `Vendeur: ${order.marketplace_products.title}`,
          delivery_location: order.delivery_address,
          pickup_coordinates: order.pickup_coordinates,
          delivery_coordinates: order.delivery_coordinates,
          assignment_status: 'pending',
          delivery_fee: calculateDeliveryFee(order.delivery_coordinates)
        })
        .select()
        .single()

      if (assignmentError) {
        console.error('Failed to create delivery assignment:', assignmentError)
      } else {
        console.log('Created delivery assignment:', assignment.id)

        // Notify available drivers via real-time channel
        await notifyAvailableDrivers(supabaseClient, assignment)

        // Find available drivers in the area using driver_locations
        const { data: availableDrivers, error: driversError } = await supabaseClient
          .from('driver_locations')
          .select(`
            driver_id,
            latitude,
            longitude,
            profiles!driver_locations_driver_id_fkey(display_name, user_id)
          `)
          .eq('is_online', true)
          .eq('is_available', true)
          .limit(10)

        if (!driversError && availableDrivers?.length > 0) {
          // Calculate distances and sort by proximity
          const driversWithDistance = availableDrivers
            .map(driver => ({
              ...driver,
              distance: calculateDistance(
                driver.latitude,
                driver.longitude,
                order.pickup_coordinates?.lat || 0,
                order.pickup_coordinates?.lng || 0
              )
            }))
            .sort((a, b) => a.distance - b.distance)

          // Notify top 3 closest drivers
          const topDrivers = driversWithDistance.slice(0, 3)
          console.log(`Notifying ${topDrivers.length} nearby drivers`)

          // Send notifications to drivers (would implement push notifications here)
          for (const driver of topDrivers) {
            console.log(`Notified driver ${(driver as any).profiles?.display_name} (${driver.distance.toFixed(2)}km away)`)
          }
        }
      }
    }

    // Calculate and distribute commissions
    const totalAmount = order.total_amount
    const commissionData = await calculateCommissions(totalAmount, order, supabaseClient)

    // Record commission transactions
    for (const commission of commissionData) {
      await supabaseClient
        .from('wallet_transactions')
        .insert({
          user_id: commission.user_id,
          wallet_id: commission.wallet_id,
          transaction_type: 'commission',
          amount: commission.amount,
          currency: 'CDF',
          description: `Commission - Commande ${orderId}`,
          reference_id: orderId,
          reference_type: 'marketplace_order',
          balance_before: commission.balance_before,
          balance_after: commission.balance_after
        })
    }

    // Update order status
    await supabaseClient
      .from('marketplace_orders')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        orderId,
        commissions: commissionData.length,
        deliveryAssigned: order.delivery_method !== 'pickup'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error: unknown) {
    console.error('Error in process-marketplace-order:', error)
    
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

function calculateDeliveryFee(coordinates: any): number {
  // Simple distance-based calculation
  // In a real implementation, you'd use proper geolocation services
  return 5000; // 5000 FC base fee
}

async function calculateCommissions(totalAmount: number, order: any, supabaseClient: any): Promise<any[]> {
  // Lire les taux depuis commission_settings (service_type = 'marketplace')
  const { data: settings } = await supabaseClient
    .from('commission_settings')
    .select('admin_rate, driver_rate, platform_rate')
    .eq('service_type', 'marketplace')
    .eq('is_active', true)
    .single();

  // Fallback sur les valeurs historiques si pas de config (zero regression)
  const platformPct = Number(settings?.admin_rate ?? 5);   // commission plateforme Tembea
  const deliveryPct = Number(settings?.driver_rate ?? 15);  // commission livreur

  const isDelivery = order.delivery_method !== 'pickup';

  // La plateforme prend sa part ; le livreur prend la sienne uniquement en livraison ;
  // le vendeur recoit le reste (la somme fait toujours 100%).
  const platformRate = platformPct / 100;
  const deliveryRate = isDelivery ? (deliveryPct / 100) : 0;
  const sellerRate = 1 - platformRate - deliveryRate;

  const platformCommission = totalAmount * platformRate;
  const sellerAmount = totalAmount * sellerRate;

  // ✅ CRÉDITER LE WALLET VENDEUR (vendor_wallets)
  try {
    // Récupérer ou créer le wallet vendeur
    let { data: vendorWallet, error: walletError } = await supabaseClient
      .from('vendor_wallets')
      .select('*')
      .eq('vendor_id', order.seller_id)
      .eq('currency', 'CDF')
      .single();

    if (walletError && walletError.code === 'PGRST116') {
      // Créer le wallet s'il n'existe pas
      const { data: newWallet, error: createError } = await supabaseClient
        .from('vendor_wallets')
        .insert({
          vendor_id: order.seller_id,
          balance: sellerAmount,
          currency: 'CDF',
          total_earned: sellerAmount,
          total_withdrawn: 0,
          is_active: true
        })
        .select()
        .single();

      if (createError) {
        console.error('Erreur création wallet vendeur:', createError);
      } else {
        vendorWallet = newWallet;
        console.log(`Wallet vendeur créé avec ${sellerAmount} CDF`);
      }
    } else if (!walletError && vendorWallet) {
      // Mettre à jour le wallet existant
      const newBalance = (vendorWallet.balance || 0) + sellerAmount;
      const newTotalEarned = (vendorWallet.total_earned || 0) + sellerAmount;
      
      const { error: updateError } = await supabaseClient
        .from('vendor_wallets')
        .update({
          balance: newBalance,
          total_earned: newTotalEarned,
          updated_at: new Date().toISOString()
        })
        .eq('id', vendorWallet.id);

      if (updateError) {
        console.error('Erreur mise à jour wallet vendeur:', updateError);
      } else {
        console.log(`Wallet vendeur crédité: +${sellerAmount} CDF (nouveau solde: ${newBalance} CDF)`);
      }
    }

    // Enregistrer la transaction dans vendor_wallet_transactions
    if (vendorWallet) {
      const { error: txError } = await supabaseClient
        .from('vendor_wallet_transactions')
        .insert({
          vendor_id: order.seller_id,
          wallet_id: vendorWallet.id,
          transaction_type: 'sale_credit',
          amount: sellerAmount,
          currency: 'CDF',
          description: `Vente - Commande #${order.id.substring(0, 8)}`,
          reference_id: order.id,
          reference_type: 'marketplace_order',
          status: 'completed',
          balance_before: vendorWallet.balance || 0,
          balance_after: (vendorWallet.balance || 0) + sellerAmount
        });

      if (txError) {
        console.error('Erreur enregistrement transaction vendeur:', txError);
      }
    }
  } catch (error: unknown) {
    console.error('Erreur crédit wallet vendeur:', error);
  }

  const commissions = [
    {
      user_id: 'system',
      wallet_id: 'platform',
      amount: platformCommission,
      balance_before: 0,
      balance_after: platformCommission,
      type: 'platform_commission'
    },
    {
      user_id: order.seller_id,
      wallet_id: order.seller_id,
      amount: sellerAmount,
      balance_before: 0,
      balance_after: sellerAmount,
      type: 'seller_payment'
    }
  ];

  // Add delivery driver commission if delivery order
  if (order.delivery_method !== 'pickup') {
    const deliveryCommission = totalAmount * deliveryRate;
    commissions.push({
      user_id: 'delivery_pool', // Will be assigned to actual driver later
      wallet_id: 'delivery_pool',
      amount: deliveryCommission,
      balance_before: 0,
      balance_after: deliveryCommission,
      type: 'delivery_commission'
    });
  }

  return commissions;
}

async function notifyAvailableDrivers(supabaseClient: any, assignment: any) {
  // Send real-time notification to drivers channel
  const channel = supabaseClient.channel('driver-notifications');
  
  await channel.send({
    type: 'broadcast',
    event: 'new_delivery',
    payload: {
      assignment_id: assignment.id,
      pickup_location: assignment.pickup_location,
      delivery_location: assignment.delivery_location,
      delivery_fee: assignment.delivery_fee,
      created_at: assignment.created_at
    }
  });

  console.log('Sent real-time notification to drivers');
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}