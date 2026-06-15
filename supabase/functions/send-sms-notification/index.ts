import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { phone_number, message, type = 'general' } = await req.json();
    
    if (!phone_number || !message) {
      return new Response(JSON.stringify({ 
        error: 'phone_number and message are required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Sending SMS to: ${phone_number}`);

    // Pour la RDC et Côte d'Ivoire, nous pourrions intégrer avec:
    // - Orange Money API pour SMS
    // - MTN Mobile Money API
    // - Twilio pour fallback international
    
    // Pour le moment, on simule l'envoi SMS
    const smsResult = {
      success: true,
      message_id: `sms_${Date.now()}`,
      provider: 'simulated',
      cost: 0,
      delivery_status: 'pending'
    };

    // Log l'envoi pour debug
    console.log(`SMS envoyé: ${message} vers ${phone_number}`);

    return new Response(JSON.stringify({
      success: true,
      message_id: smsResult.message_id,
      provider: smsResult.provider,
      status: 'sent'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Send SMS error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});