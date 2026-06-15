// Version: 2025-11-07T12:00:00Z - Admin functions deployment
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface VerificationRequest {
  user_id: string;
  action: 'approve' | 'reject' | 'request_info';
  phone_verified?: boolean;
  identity_verified?: boolean;
  verification_level?: string;
  admin_notes?: string;
  rejection_reason?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get admin user from JWT
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Non authentifié');
    }

    console.log('Admin user:', user.id);

    // Verify admin status
    const { data: adminData, error: adminError } = await supabaseClient
      .from('admins')
      .select('id, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminData) {
      throw new Error('Accès refusé: Privilèges admin requis');
    }

    console.log('Admin verified:', adminData.id);

    const body: VerificationRequest = await req.json();
    const { user_id, action, phone_verified, identity_verified, verification_level, admin_notes, rejection_reason } = body;

    console.log('Processing verification action:', { user_id, action });

    // Update verification status based on action
    let verification_status = 'pending_review';
    let updateData: any = {
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (action === 'approve') {
      verification_status = 'approved';
      updateData = {
        ...updateData,
        verification_status,
        phone_verified: phone_verified ?? true,
        identity_verified: identity_verified ?? true,
        verification_level: verification_level || 'full',
        admin_notes,
        verified_at: new Date().toISOString()
      };
    } else if (action === 'reject') {
      verification_status = 'rejected';
      updateData = {
        ...updateData,
        verification_status,
        admin_notes: rejection_reason || admin_notes,
        rejection_reason
      };
    } else if (action === 'request_info') {
      verification_status = 'additional_info_required';
      updateData = {
        ...updateData,
        verification_status,
        admin_notes
      };
    }

    // Update user_verification table
    const { data: verificationData, error: verificationError } = await supabaseClient
      .from('user_verification')
      .update(updateData)
      .eq('user_id', user_id)
      .select()
      .single();

    if (verificationError) {
      console.error('Verification update error:', verificationError);
      throw verificationError;
    }

    console.log('Verification updated:', verificationData);

    // Log admin action
    await supabaseClient.from('activity_logs').insert({
      user_id: user.id,
      activity_type: `admin_verification_${action}`,
      description: `Admin ${action} verification for user ${user_id}`,
      metadata: {
        target_user_id: user_id,
        action,
        verification_status,
        admin_notes
      }
    });

    // Send notification to user
    const notificationMessages = {
      approve: '✅ Votre compte a été vérifié! Vous pouvez maintenant vendre sur la marketplace.',
      reject: `❌ Votre demande de vérification a été rejetée. Raison: ${rejection_reason || 'Non spécifiée'}`,
      request_info: '⚠️ Des informations supplémentaires sont requises pour votre vérification.'
    };

    await supabaseClient.from('delivery_notifications').insert({
      user_id: user_id,
      title: action === 'approve' ? 'Compte vérifié' : 
             action === 'reject' ? 'Vérification rejetée' : 
             'Informations supplémentaires requises',
      message: notificationMessages[action],
      notification_type: 'account_verification',
      metadata: {
        verification_status,
        admin_notes,
        rejection_reason
      }
    });

    console.log('Notification sent to user:', user_id);

    return new Response(
      JSON.stringify({
        success: true,
        action,
        verification_status,
        message: `Vérification ${action} avec succès`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as any).message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});