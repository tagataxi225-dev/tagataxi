import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Non authentifié');
    }

    const { points_to_redeem, redeem_type } = await req.json();

    if (!points_to_redeem || points_to_redeem <= 0) {
      throw new Error('Montant de points invalide');
    }

    if (!['wallet', 'marketplace'].includes(redeem_type)) {
      throw new Error('Type de conversion invalide');
    }

    console.log('💰 Demande de conversion:', { user: user.id, points: points_to_redeem, type: redeem_type });

    // 1. Récupérer/Créer le compte de points
    let { data: loyaltyAccount, error: fetchError } = await supabase
      .from('user_loyalty_points')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (!loyaltyAccount) {
      const { data: newAccount, error: createError } = await supabase
        .from('user_loyalty_points')
        .insert({ user_id: user.id, points_balance: 0 })
        .select()
        .single();

      if (createError) throw createError;
      loyaltyAccount = newAccount;
    }

    // 2. Vérifier solde suffisant
    if (loyaltyAccount.points_balance < points_to_redeem) {
      throw new Error(`Solde insuffisant. Vous avez ${loyaltyAccount.points_balance} points.`);
    }

    // 3. Calculer la valeur en CDF (100 points = 1000 CDF)
    const cdf_value = (points_to_redeem / 100) * 1000;

    // 4. Mettre à jour le solde de points
    const { error: updateError } = await supabase
      .from('user_loyalty_points')
      .update({
        points_balance: loyaltyAccount.points_balance - points_to_redeem,
        points_spent_total: (loyaltyAccount.points_spent_total || 0) + points_to_redeem
      })
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    // 5. Enregistrer la transaction points
    const { error: transactionError } = await supabase
      .from('loyalty_points_transactions')
      .insert({
        user_id: user.id,
        transaction_type: redeem_type === 'wallet' ? 'converted_to_wallet' : 'used_marketplace',
        points_amount: -points_to_redeem,
        source_type: 'redemption',
        description: redeem_type === 'wallet' 
          ? `Conversion de ${points_to_redeem} points en ${cdf_value} CDF`
          : `Utilisation de ${points_to_redeem} points sur la marketplace`,
        metadata: {
          cdf_value,
          redeem_type,
          conversion_rate: '100 points = 1000 CDF'
        }
      });

    if (transactionError) throw transactionError;

    // 6. Si conversion wallet, créditer le wallet
    if (redeem_type === 'wallet') {
      // Récupérer/Créer le wallet
      let { data: wallet } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!wallet) {
        const { data: newWallet, error: walletCreateError } = await supabase
          .from('user_wallets')
          .insert({ user_id: user.id, balance: 0, currency: 'CDF' })
          .select()
          .single();

        if (walletCreateError) throw walletCreateError;
        wallet = newWallet;
      }

      // Créditer le wallet
      const { error: walletUpdateError } = await supabase
        .from('user_wallets')
        .update({ balance: (wallet.balance || 0) + cdf_value })
        .eq('user_id', user.id);

      if (walletUpdateError) throw walletUpdateError;

      // Enregistrer transaction wallet
      await supabase.from('wallet_transactions').insert({
        wallet_id: wallet.id,
        user_id: user.id,
        transaction_type: 'credit',
        amount: cdf_value,
        currency: 'CDF',
        description: `Conversion ${points_to_redeem} points de fidélité`,
        status: 'completed',
        metadata: { source: 'loyalty_points_redemption', points_redeemed: points_to_redeem }
      });
    }

    // 7. Logger l'activité
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      activity_type: 'loyalty_points_redeemed',
      description: redeem_type === 'wallet'
        ? `Conversion de ${points_to_redeem} points en ${cdf_value} CDF`
        : `Utilisation de ${points_to_redeem} points sur la marketplace`,
      metadata: {
        points_redeemed: points_to_redeem,
        cdf_value,
        redeem_type
      }
    });

    // 8. Récupérer le nouveau solde
    const { data: updatedAccount } = await supabase
      .from('user_loyalty_points')
      .select('*')
      .eq('user_id', user.id)
      .single();

    console.log('✅ Conversion réussie:', {
      points_redeemed: points_to_redeem,
      cdf_value,
      new_balance: updatedAccount?.points_balance
    });

    return new Response(
      JSON.stringify({
        success: true,
        points_redeemed: points_to_redeem,
        cdf_value,
        redeem_type,
        new_points_balance: updatedAccount?.points_balance,
        new_tier: updatedAccount?.tier
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('❌ Erreur conversion points:', error);
    return new Response(
      JSON.stringify({ error: (error as any).message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});