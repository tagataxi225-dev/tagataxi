import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin authentication
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Non autorisé');
    }

    const { data: adminCheck } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .eq('is_active', true)
      .single();

    if (!adminCheck) {
      throw new Error('Accès administrateur requis');
    }

    const { partner_id, action, reason } = await req.json();

    console.log('📧 Partner validation notification:', { partner_id, action });

    // Get partner details
    const { data: partner } = await supabase
      .from('partenaires')
      .select('user_id, company_name, email, phone_number')
      .eq('id', partner_id)
      .single();

    if (!partner) {
      throw new Error('Partenaire non trouvé');
    }

    let notificationTitle = '';
    let notificationMessage = '';

    // Note: L'action reçue est 'approved' pour le statut DB 'verified' (compatibilité)
    if (action === 'approved') {
      notificationTitle = '✅ Votre compte partenaire a été approuvé';
      notificationMessage = `Félicitations ! Votre compte partenaire "${partner.company_name}" a été validé. Vous pouvez maintenant accéder à toutes les fonctionnalités.`;
    } else if (action === 'rejected') {
      notificationTitle = '❌ Votre compte partenaire a été rejeté';
      notificationMessage = `Votre demande de partenariat pour "${partner.company_name}" a été rejetée. Raison: ${reason || 'Non spécifiée'}`;
    } else if (action === 'suspended') {
      notificationTitle = '⚠️ Votre compte partenaire a été suspendu';
      notificationMessage = `Votre compte partenaire "${partner.company_name}" a été temporairement suspendu. Raison: ${reason || 'Non spécifiée'}`;
    }

    // Create notification
    await supabase.from('user_notifications').insert({
      user_id: partner.user_id,
      title: notificationTitle,
      content: notificationMessage,
      priority: action === 'approved' ? 'high' : 'normal',
      category: 'partner_management',
      metadata: {
        partner_id,
        action,
        reason,
        validated_by: user.id,
        validated_at: new Date().toISOString()
      }
    });

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: partner.user_id,
      activity_type: 'partner_validation',
      description: `Partenaire ${action}: ${partner.company_name}`,
      metadata: {
        partner_id,
        action,
        reason,
        admin_id: user.id
      }
    });

    console.log(`✅ Partner validation notification sent to ${partner.user_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notification envoyée',
        partner: {
          id: partner_id,
          company_name: partner.company_name
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error in partner-validation-notification:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as any).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
