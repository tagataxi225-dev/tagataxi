import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface CommissionRequest {
  booking_id?: string;
  delivery_id?: string;
  amount: number;
  service_type: 'transport' | 'delivery';
  driver_id: string;
  user_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { booking_id, delivery_id, amount, service_type, driver_id, user_id }: CommissionRequest = await req.json();

    if (!amount || amount <= 0) {
      throw new Error('Montant invalide');
    }

    if (!['transport', 'delivery'].includes(service_type)) {
      throw new Error('Type de service invalide');
    }

    if (!driver_id || !user_id) {
      throw new Error('IDs utilisateur et chauffeur requis');
    }

    // Get commission settings
    const { data: commissionSettings, error: settingsError } = await supabaseService
      .from('commission_settings')
      .select('*')
      .eq('service_type', service_type)
      .eq('is_active', true)
      .single();

    if (settingsError || !commissionSettings) {
      throw new Error('Configuration des commissions non trouvée');
    }

    // Calculate commission amounts
    const adminAmount = (amount * commissionSettings.admin_rate) / 100;
    const driverAmount = (amount * commissionSettings.driver_rate) / 100;
    const platformAmount = (amount * commissionSettings.platform_rate) / 100;

    // Optional partner commission (capped at 2.5% of total, taken from driver's portion)
    const { data: partnerLink } = await supabaseService
      .from('partner_drivers')
      .select('partner_id, commission_rate, status')
      .eq('driver_id', driver_id)
      .eq('status', 'active')
      .single();

    let partnerId: string | null = null;
    let partnerRate = 0;
    if (partnerLink?.partner_id) {
      partnerId = partnerLink.partner_id as string;
      const rawRate = Number(partnerLink.commission_rate ?? 0);
      partnerRate = Math.min(rawRate, 2.5);
    }

    const partnerAmount = partnerId ? (amount * partnerRate) / 100 : 0;
    const driverNetAmount = driverAmount - partnerAmount;

    console.log(`Commission calculation for ${service_type}:`, {
      totalAmount: amount,
      adminAmount,
      driverAmount,
      partnerAmount,
      driverNetAmount,
      platformAmount,
      rates: {
        admin: commissionSettings.admin_rate,
        driver: commissionSettings.driver_rate,
        partner: partnerRate,
        platform: commissionSettings.platform_rate
      }
    });

    // Start transaction processing
    const transactionId = `comm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get user and driver wallets
    const { data: userWallet } = await supabaseService
      .from('user_wallets')
      .select('*')
      .eq('user_id', user_id)
      .single();

    const { data: driverWallet } = await supabaseService
      .from('user_wallets')
      .select('*')
      .eq('user_id', driver_id)
      .single();

    // Optional partner wallet
    let partnerWallet: any = null;
    if (partnerId) {
      const { data: pw } = await supabaseService
        .from('user_wallets')
        .select('*')
        .eq('user_id', partnerId)
        .single();
      partnerWallet = pw;
    }

    if (!userWallet) {
      throw new Error('Portefeuille utilisateur non trouvé');
    }

    if (!driverWallet) {
      throw new Error('Portefeuille chauffeur non trouvé');
    }

    // Check if user has sufficient balance
    if (userWallet.balance < amount) {
      throw new Error('Solde insuffisant');
    }

    // Process payments atomically
    const userNewBalance = userWallet.balance - amount;
    const driverNewBalance = driverWallet.balance + (typeof driverNetAmount === 'number' ? driverNetAmount : driverAmount);
    const partnerNewBalance = (typeof partnerAmount === 'number' && partnerAmount > 0 && typeof (partnerWallet?.balance) === 'number')
      ? partnerWallet.balance + partnerAmount
      : undefined;
    // Update user wallet (debit total amount)
    const { error: userWalletError } = await supabaseService
      .from('user_wallets')
      .update({ 
        balance: userNewBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user_id);

    if (userWalletError) {
      throw new Error(`Erreur wallet utilisateur: ${userWalletError.message}`);
    }

    // Update driver wallet (credit driver portion, net after partner commission)
    const { error: driverWalletError } = await supabaseService
      .from('user_wallets')
      .update({ 
        balance: driverNewBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', driver_id);

    if (driverWalletError) {
      throw new Error(`Erreur wallet chauffeur: ${driverWalletError.message}`);
    }

    // Update partner wallet (credit partner commission) if applicable
    if (partnerWallet && partnerAmount > 0 && typeof partnerNewBalance === 'number') {
      const { error: partnerWalletError } = await supabaseService
        .from('user_wallets')
        .update({
          balance: partnerNewBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', partnerWallet.id);

      if (partnerWalletError) {
        console.warn('Erreur wallet partenaire:', partnerWalletError.message);
      }
    }
    // Record wallet transactions
    const walletTransactions: any[] = [
      // User payment debit
      {
        wallet_id: userWallet.id,
        user_id: user_id,
        transaction_type: 'debit',
        amount: amount,
        currency: 'CDF',
        description: `Paiement ${service_type === 'transport' ? 'course' : 'livraison'}`,
        reference_id: booking_id || delivery_id,
        reference_type: service_type,
        status: 'completed',
        balance_before: userWallet.balance,
        balance_after: userNewBalance
      },
      // Driver earnings credit (net)
      {
        wallet_id: driverWallet.id,
        user_id: driver_id,
        transaction_type: 'credit',
        amount: typeof driverNetAmount === 'number' ? driverNetAmount : driverAmount,
        currency: 'CDF',
        description: `Gains ${service_type === 'transport' ? 'course' : 'livraison'} (net après commission partenaire)`,
        reference_id: booking_id || delivery_id,
        reference_type: service_type,
        status: 'completed',
        balance_before: driverWallet.balance,
        balance_after: driverNewBalance
      }
    ];

    if (partnerWallet && partnerAmount > 0) {
      walletTransactions.push({
        wallet_id: partnerWallet.id,
        user_id: partnerId,
        transaction_type: 'credit',
        amount: partnerAmount,
        currency: 'CDF',
        description: `Commission partenaire ${service_type === 'transport' ? 'course' : 'livraison'}`,
        reference_id: booking_id || delivery_id,
        reference_type: service_type,
        status: 'completed',
        balance_before: partnerWallet.balance,
        balance_after: partnerNewBalance
      });
    }

    for (const transaction of walletTransactions) {
      await supabaseService
        .from('wallet_transactions')
        .insert(transaction);
    }

    // Log activities
    const activities: any[] = [
      // User payment
      {
        user_id: user_id,
        activity_type: 'payment',
        description: `Paiement ${service_type === 'transport' ? 'course' : 'livraison'}: ${amount} CDF`,
        amount: amount,
        currency: 'CDF',
        reference_id: booking_id || delivery_id,
        reference_type: service_type,
        metadata: {
          transaction_id: transactionId,
          commission_breakdown: { 
            total_amount: amount,
            admin_amount: adminAmount, 
            driver_amount_gross: driverAmount, 
            partner_amount: partnerAmount, 
            driver_amount_net: driverNetAmount, 
            platform_amount: platformAmount 
          },
          service_details: { service_type, booking_id, delivery_id }
        }
      },
      // Driver earnings (net)
      {
        user_id: driver_id,
        activity_type: 'payment',
        description: `Gains ${service_type === 'transport' ? 'course' : 'livraison'} (net): ${typeof driverNetAmount === 'number' ? driverNetAmount : driverAmount} CDF`,
        amount: typeof driverNetAmount === 'number' ? driverNetAmount : driverAmount,
        currency: 'CDF',
        reference_id: booking_id || delivery_id,
        reference_type: service_type,
        metadata: {
          transaction_id: transactionId,
          commission_breakdown: {
            total_amount: amount,
            driver_amount_gross: driverAmount,
            partner_amount: partnerAmount,
            driver_amount_net: typeof driverNetAmount === 'number' ? driverNetAmount : driverAmount,
            admin_amount: adminAmount,
            platform_amount: platformAmount
          },
          commission_rates: { 
            driver: commissionSettings.driver_rate, 
            partner: partnerRate,
            admin: commissionSettings.admin_rate,
            platform: commissionSettings.platform_rate
          },
          service_details: { service_type, booking_id, delivery_id }
        }
      }
    ];

    if (partnerWallet && partnerAmount > 0) {
      activities.push({
        user_id: partnerId,
        activity_type: 'payment',
        description: `Commission partenaire ${service_type === 'transport' ? 'course' : 'livraison'}: ${partnerAmount} CDF`,
        amount: partnerAmount,
        currency: 'CDF',
        reference_id: booking_id || delivery_id,
        reference_type: service_type,
        metadata: {
          transaction_id: transactionId,
          commission_rate: partnerRate
        }
      });
    }

    for (const activity of activities) {
      await supabaseService
        .from('activity_logs')
        .insert(activity);
    }

    // Update booking/delivery status
    if (booking_id) {
      await supabaseService
        .from('transport_bookings')
        .update({ 
          status: 'completed',
          actual_price: amount
        })
        .eq('id', booking_id);
    }

    if (delivery_id) {
      await supabaseService
        .from('delivery_orders')
        .update({ 
          status: 'completed',
          actual_price: amount
        })
        .eq('id', delivery_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        transaction_id: transactionId,
        commission_breakdown: {
          total_amount: amount,
          driver_amount_gross: driverAmount,
          partner_amount: partnerAmount,
          driver_amount_net: typeof driverNetAmount === 'number' ? driverNetAmount : driverAmount,
          admin_amount: adminAmount,
          platform_amount: platformAmount
        },
        new_balances: {
          user_balance: userNewBalance,
          driver_balance: driverNewBalance,
          ...(partnerNewBalance !== undefined ? { partner_balance: partnerNewBalance } : {})
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Commission processing error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as any).message || 'Erreur traitement commission'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});