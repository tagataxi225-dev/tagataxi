import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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

    const { booking_id } = await req.json();
    if (!booking_id) throw new Error("booking_id requis");

    // 1. Charger la reservation (le partenaire se recupere via le vehicule)
    const { data: booking, error: bErr } = await supabase
      .from('rental_bookings')
      .select('id, total_amount, vehicle_id, status, payment_status, currency')
      .eq('id', booking_id)
      .single();
    if (bErr || !booking) throw new Error("Reservation introuvable");

    // 2. Securite : la reservation doit etre integralement payee
    if (booking.payment_status !== 'paid') {
      throw new Error("Le client doit payer la totalite avant la prise du vehicule");
    }

    // 3. Anti-double-versement
    const { data: existing } = await supabase
      .from('rental_commissions')
      .select('id')
      .eq('booking_id', booking_id)
      .eq('trigger_event', 'pickup')
      .maybeSingle();
    if (existing) {
      throw new Error("Le versement a deja ete effectue pour cette reservation");
    }

    // 4. Recuperer le partner_id via le vehicule
    const { data: vehicle, error: vErr } = await supabase
      .from('rental_vehicles')
      .select('partner_id')
      .eq('id', booking.vehicle_id)
      .single();
    if (vErr || !vehicle?.partner_id) throw new Error("Vehicule ou partenaire introuvable");
    const partnerId = vehicle.partner_id;

    // 5. Recuperer le user_id du partenaire
    const { data: partner, error: pErr } = await supabase
      .from('partenaires')
      .select('user_id')
      .eq('id', partnerId)
      .single();
    if (pErr || !partner?.user_id) throw new Error("Partenaire introuvable");
    const partnerUserId = partner.user_id;

    // 6. Securite : l'appelant doit etre le partenaire de cette reservation
    if (user.id !== partnerUserId) {
      throw new Error("Seul le partenaire proprietaire peut confirmer la prise");
    }

    // 7. Lire le taux de commission rental
    const { data: settings } = await supabase
      .from('commission_settings')
      .select('admin_rate')
      .eq('service_type', 'rental')
      .eq('is_active', true)
      .single();
    const commissionRate = Number(settings?.admin_rate ?? 10);

    const totalAmount = Number(booking.total_amount);
    const commissionAmount = Math.round(totalAmount * commissionRate / 100);
    const partnerAmount = totalAmount - commissionAmount;
    const currency = booking.currency || 'CDF';

    // 8. Crediter le partenaire via partner_commission_tracking
    //    (c'est la table que le systeme de demande de retrait additionne)
    //    commission_amount = montant net que le partenaire peut retirer (partnerAmount)
    const { error: trackErr } = await supabase
      .from('partner_commission_tracking')
      .insert({
        partner_id: partnerId,
        driver_id: partnerUserId, // non utilise en location (colonne NOT NULL)
        booking_id,
        service_type: 'rental',
        commission_rate: 100 - commissionRate, // part partenaire en %
        commission_amount: partnerAmount,
        booking_amount: totalAmount,
        currency,
      });
    if (trackErr) throw new Error("Echec enregistrement gains partenaire: " + trackErr.message);

    // 9. Enregistrer la commission plateforme (tracabilite)
    await supabase.from('rental_commissions').insert({
      booking_id,
      partner_id: partnerId,
      partner_user_id: partnerUserId,
      total_amount: totalAmount,
      commission_rate: commissionRate,
      commission_amount: commissionAmount,
      partner_amount: partnerAmount,
      trigger_event: 'pickup',
      currency,
    });

    // 10. Passer la reservation en in_progress
    await supabase
      .from('rental_bookings')
      .update({ status: 'in_progress', picked_up_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', booking_id);

    return new Response(
      JSON.stringify({
        success: true,
        total_amount: totalAmount,
        commission_amount: commissionAmount,
        partner_amount: partnerAmount,
        message: `Prise confirmee. ${partnerAmount} ${currency} credites au partenaire (commission ${commissionRate}%).`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error('rental-pickup-payout error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
