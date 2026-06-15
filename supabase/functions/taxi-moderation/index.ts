// Version: 2025-11-07T14:30:00Z - Taxi moderation proxy deployment
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ModerationPayload = {
  action: "approve" | "reject";
  vehicle_id: string;
  rejection_reason?: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized: missing token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Client avec anon key pour vérifier l'utilisateur et ses rôles
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized: invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const adminId = userRes.user.id;

    const { data: roles, error: rolesErr } = await supabase.rpc("get_user_roles", { _user_id: adminId });
    if (rolesErr) {
      console.error("get_user_roles error:", rolesErr);
      return new Response(JSON.stringify({ error: "Unable to verify roles" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const isAdmin = Array.isArray(roles) && roles.some((r: any) => r?.admin_role);

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as ModerationPayload;
    if (!body?.vehicle_id || !body?.action) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service role pour bypass RLS lors de la mise à jour
    const service = createClient(supabaseUrl, serviceKey);

    const updates: any = {
      moderator_id: adminId,
      moderated_at: new Date().toISOString(),
      rejection_reason: null,
    };

    if (body.action === "approve") {
      updates.moderation_status = "approved";
    } else {
      updates.moderation_status = "rejected";
      updates.rejection_reason = body.rejection_reason || "Non spécifié";
    }

    const { data: updated, error: upErr } = await service
      .from("partner_taxi_vehicles")
      .update(updates)
      .eq("id", body.vehicle_id)
      .select()
      .maybeSingle();

    if (upErr) {
      console.error("Update error:", upErr);
      return new Response(JSON.stringify({ error: "Update failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, vehicle: updated }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Unhandled error:", e);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});