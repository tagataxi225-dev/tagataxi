import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CommissionDeductionRequest {
  bookingId: string;
  driverId: string;
  commissionAmount: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { bookingId, driverId, commissionAmount } = await req.json() as CommissionDeductionRequest;

    console.log(`💸 Déduction commission différée pour booking ${bookingId}`);
    console.log(`👤 Chauffeur: ${driverId}, Montant: ${commissionAmount} CDF`);

    // 1. Vérifier que la course est terminée
    const { data: booking, error: bookingError } = await supabase
      .from('transport_bookings')
      .select('status, commission_deferred, driver_id')
      .eq('id', bookingId)
      .single();

    if (bookingError) {
      console.error('❌ Erreur récupération booking:', bookingError);
      throw bookingError;
    }

    if (booking.status !== 'completed') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'La course doit être terminée avant de déduire la commission' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!booking.commission_deferred) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Cette course ne nécessite pas de déduction différée' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // 2. Créer l'enregistrement de commission différée
    const { data: deferredCommission, error: deferredError } = await supabase
      .from('deferred_commissions')
      .insert([{
        driver_id: driverId,
        booking_id: bookingId,
        commission_amount: commissionAmount,
        status: 'pending'
      }])
      .select()
      .single();

    if (deferredError) {
      console.error('❌ Erreur création deferred_commission:', deferredError);
      throw deferredError;
    }

    console.log(`✅ Commission différée créée: ${deferredCommission.id}`);

    // 3. Vérifier le wallet du chauffeur
    const { data: wallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('balance')
      .eq('user_id', driverId)
      .single();

    if (walletError) {
      console.warn('⚠️ Wallet non trouvé pour le chauffeur');
    }

    const currentBalance = wallet?.balance || 0;

    // 4. Si le wallet a suffisamment de fonds, déduire immédiatement
    if (currentBalance >= commissionAmount) {
      console.log(`💰 Solde suffisant (${currentBalance} CDF), déduction immédiate`);

      // Créer transaction de débit
      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert([{
          wallet_id: wallet!.id,
          user_id: driverId,
          amount: commissionAmount,
          transaction_type: 'debit',
          description: `Commission course #${bookingId.slice(0, 8)}`,
          status: 'completed',
          metadata: {
            bookingId,
            deferred_commission_id: deferredCommission.id,
            commission_type: 'deferred'
          }
        }]);

      if (transactionError) {
        console.error('❌ Erreur transaction:', transactionError);
        throw transactionError;
      }

      // Mettre à jour le wallet
      const { error: updateWalletError } = await supabase
        .from('user_wallets')
        .update({ 
          balance: currentBalance - commissionAmount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', driverId);

      if (updateWalletError) {
        console.error('❌ Erreur mise à jour wallet:', updateWalletError);
        throw updateWalletError;
      }

      // Marquer la commission comme déduite
      await supabase
        .from('deferred_commissions')
        .update({ 
          status: 'deducted',
          deducted_at: new Date().toISOString()
        })
        .eq('id', deferredCommission.id);

      console.log(`✅ Commission déduite avec succès`);

      return new Response(
        JSON.stringify({
          success: true,
          deducted: true,
          message: 'Commission déduite immédiatement',
          remainingBalance: currentBalance - commissionAmount
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // 5. Fonds insuffisants, garder en pending
      console.log(`⏳ Solde insuffisant (${currentBalance} CDF < ${commissionAmount} CDF), reste en pending`);

      // Créer notification pour le chauffeur
      await supabase
        .from('push_notifications')
        .insert([{
          user_id: driverId,
          title: '💳 Commission en attente',
          message: `Une commission de ${commissionAmount.toFixed(0)} CDF sera déduite lors de votre prochain rechargement.`,
          notification_type: 'commission_pending',
          metadata: {
            commissionAmount,
            bookingId,
            deferred_commission_id: deferredCommission.id
          }
        }]);

      return new Response(
        JSON.stringify({
          success: true,
          deducted: false,
          message: 'Commission en attente de fonds suffisants',
          currentBalance,
          requiredAmount: commissionAmount
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: unknown) {
    console.error('❌ Erreur déduction commission:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
