import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Helper : crediter un wallet user (user_wallets) + tracer
async function creditWallet(supabase: any, userId: string, amount: number, currency: string, type: string, description: string, metadata: any) {
  if (amount <= 0) return;
  const { data: wallet } = await supabase
    .from('user_wallets').select('balance').eq('user_id', userId).maybeSingle();
  if (wallet) {
    await supabase.from('user_wallets')
      .update({ balance: (wallet.balance || 0) + amount, updated_at: new Date().toISOString() })
      .eq('user_id', userId).select();
  } else {
    await supabase.from('user_wallets').insert({ user_id: userId, balance: amount, currency });
  }
  await supabase.from('wallet_transactions').insert({
    user_id: userId, amount, transaction_type: type, description, status: 'completed', metadata,
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authorization requise");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Token invalide");

    const { booking_id, cancelled_by, reason } = await req.json();
    if (!booking_id) throw new Error("booking_id requis");
    if (cancelled_by !== 'client' && cancelled_by !== 'partner') {
      throw new Error("cancelled_by doit etre 'client' ou 'partner'");
    }

    // Charger la reservation
    const { data: booking, error: bErr } = await supabase
      .from('rental_bookings')
      .select('id, total_amount, vehicle_id, user_id, status, payment_status, deposit_amount, deposit_paid, currency')
      .eq('id', booking_id)
      .single();
    if (bErr || !booking) throw new Error("Reservation introuvable");

    // Securite : uniquement avant la prise
    if (['in_progress', 'completed'].includes(booking.status)) {
      throw new Error("Impossible d'annuler apres la prise du vehicule (gestion manuelle)");
    }
    // Anti-double
    if (['cancelled', 'rejected', 'refunded'].includes(booking.status) || booking.payment_status === 'refunded') {
      throw new Error("Reservation deja annulee/remboursee");
    }

    // Recuperer partenaire via vehicule
    const { data: vehicle } = await supabase
      .from('rental_vehicles').select('partner_id').eq('id', booking.vehicle_id).single();
    const partnerId = vehicle?.partner_id;
    let partnerUserId: string | null = null;
    if (partnerId) {
      const { data: partner } = await supabase
        .from('partenaires').select('user_id').eq('id', partnerId).single();
      partnerUserId = partner?.user_id ?? null;
    }

    const currency = booking.currency || 'CDF';
    const totalAmount = Number(booking.total_amount);
    const depositAmount = Number(booking.deposit_amount || 0);
    // Montant reellement paye par le client
    const paidAmount = booking.payment_status === 'paid' ? totalAmount : (booking.deposit_paid ? depositAmount : 0);

    let clientRefund = 0;
    let partnerPayout = 0;
    let commissionAmount = 0;

    if (cancelled_by === 'partner') {
      // Remboursement integral du client, rien au partenaire
      clientRefund = paidAmount;
    } else {
      // Annulation client : acompte retenu (avec commission), reste rembourse
      const { data: settings } = await supabase
        .from('commission_settings').select('admin_rate')
        .eq('service_type', 'rental').eq('is_active', true).single();
      const commissionRate = Number(settings?.admin_rate ?? 10);

      const heldDeposit = Math.min(depositAmount, paidAmount); // ne pas retenir plus que paye
      commissionAmount = Math.round(heldDeposit * commissionRate / 100);
      partnerPayout = heldDeposit - commissionAmount;
      clientRefund = paidAmount - heldDeposit;
    }

    // Crediter le client (remboursement)
    if (clientRefund > 0 && booking.user_id) {
      await creditWallet(supabase, booking.user_id, clientRefund, currency,
        'rental_refund', `Remboursement annulation location ${booking_id.substring(0,8)}`,
        { booking_id, cancelled_by });
    }

    // Crediter le partenaire (acompte retenu net commission, cas client uniquement)
    if (partnerPayout > 0 && partnerUserId) {
      await creditWallet(supabase, partnerUserId, partnerPayout, currency,
        'rental_cancellation_fee', `Indemnite annulation client - location ${booking_id.substring(0,8)}`,
        { booking_id, commission_amount: commissionAmount });
      // Tracabilite commission
      await supabase.from('rental_commissions').insert({
        booking_id, partner_id: partnerId, partner_user_id: partnerUserId,
        total_amount: depositAmount, commission_rate: Number((commissionAmount / Math.max(depositAmount,1) * 100).toFixed(2)),
        commission_amount: commissionAmount, partner_amount: partnerPayout,
        trigger_event: 'cancellation', currency,
      });
    }

    // Mettre a jour la reservation
    await supabase.from('rental_bookings').update({
      status: 'cancelled',
      payment_status: 'refunded',
      cancellation_reason: reason || `Annule par ${cancelled_by}`,
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', booking_id);

    return new Response(
      JSON.stringify({
        success: true,
        cancelled_by,
        client_refund: clientRefund,
        partner_payout: partnerPayout,
        commission_amount: commissionAmount,
        message: `Annulation traitee. Remboursement client: ${clientRefund} ${currency}.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error('rental-cancellation error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
