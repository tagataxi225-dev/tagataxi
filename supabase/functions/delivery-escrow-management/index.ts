import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface EscrowRequest {
  action: 'hold' | 'release' | 'refund';
  orderId: string;
  userId?: string;
  driverId?: string;
  vendorId?: string;
  amount?: number;
  releaseDelay?: number; // hours
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { action, orderId, userId, driverId, vendorId, amount, releaseDelay = 48 }: EscrowRequest = await req.json();

    if (!orderId) {
      throw new Error("Order ID is required");
    }

    switch (action) {
      case 'hold': {
        if (!userId || !amount) {
          throw new Error("User ID and amount are required for holding funds");
        }

        // Create escrow entry
        const autoReleaseAt = new Date();
        autoReleaseAt.setHours(autoReleaseAt.getHours() + releaseDelay);

        const { data: escrow, error: escrowError } = await supabaseClient
          .from('delivery_escrow')
          .insert({
            order_id: orderId,
            user_id: userId,
            driver_id: driverId,
            vendor_id: vendorId,
            amount: amount,
            status: 'held',
            auto_release_at: autoReleaseAt.toISOString(),
            metadata: { created_via: 'delivery_escrow_api' }
          })
          .select()
          .single();

        if (escrowError) throw escrowError;

        return new Response(
          JSON.stringify({
            success: true,
            escrow: escrow,
            message: `Fonds de ${amount} CDF bloqués avec succès`,
            autoReleaseAt: autoReleaseAt.toISOString()
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'release': {
        // Find escrow entry
        const { data: escrow, error: findError } = await supabaseClient
          .from('delivery_escrow')
          .select('*')
          .eq('order_id', orderId)
          .eq('status', 'held')
          .single();

        if (findError || !escrow) {
          throw new Error('Escrow entry not found or already processed');
        }

        // Release funds to vendor
        const { error: releaseError } = await supabaseClient
          .from('delivery_escrow')
          .update({
            status: 'released',
            released_at: new Date().toISOString()
          })
          .eq('id', escrow.id);

        if (releaseError) throw releaseError;

        // Create or update vendor earnings
        if (escrow.vendor_id) {
          const { error: earningsError } = await supabaseClient
            .from('vendor_earnings')
            .upsert({
              vendor_id: escrow.vendor_id,
              order_id: orderId,
              amount: escrow.amount,
              status: 'available',
              earnings_type: 'delivery_sale',
              confirmed_at: new Date().toISOString(),
              available_at: new Date().toISOString()
            });

          if (earningsError) console.error('Error creating vendor earnings:', earningsError);
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: `Fonds de ${escrow.amount} CDF libérés au vendeur`,
            releasedAmount: escrow.amount
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'refund': {
        // Find escrow entry
        const { data: escrow, error: findError } = await supabaseClient
          .from('delivery_escrow')
          .select('*')
          .eq('order_id', orderId)
          .eq('status', 'held')
          .single();

        if (findError || !escrow) {
          throw new Error('Escrow entry not found or already processed');
        }

        // Refund to customer
        const { error: refundError } = await supabaseClient
          .from('delivery_escrow')
          .update({
            status: 'refunded',
            refunded_at: new Date().toISOString()
          })
          .eq('id', escrow.id);

        if (refundError) throw refundError;

        // TODO: Implement actual wallet refund via wallet-topup function
        console.log(`Refunding ${escrow.amount} CDF to user ${escrow.user_id}`);

        return new Response(
          JSON.stringify({
            success: true,
            message: `Fonds de ${escrow.amount} CDF remboursés au client`,
            refundedAmount: escrow.amount
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        throw new Error('Invalid action. Use: hold, release, or refund');
    }

  } catch (error: unknown) {
    console.error('Delivery escrow error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Erreur lors de la gestion de l\'escrow'
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});