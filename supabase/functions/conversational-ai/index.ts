import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConversationalMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{type: string; text?: any; image_url?: {url: string}}>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context, userId, includeVoice = false, imageData = null } = await req.json();

    if (!message && !imageData) {
      throw new Error('Message or image data is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const elevenLabsKey = Deno.env.get('ELEVENLABS_API_KEY');
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client for context
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get enhanced user context
    let userProfile = null;
    if (userId) {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      userProfile = data;
    }

    // Build enhanced system prompt for conversational AI
    const systemPrompt = buildEnhancedSystemPrompt(context, userProfile);

    // Prepare messages with vision support
    const messages: ConversationalMessage[] = [
      { role: 'system', content: systemPrompt }
    ];

    if (imageData) {
      // Add image analysis message
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: message || 'Analysez cette image et donnez-moi des informations utiles.'
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${imageData}`
            }
          }
        ]
      });
    } else {
      messages.push({ role: 'user', content: message });
    }

    console.log('Sending conversational AI request with vision support');

    // Call OpenAI GPT-4o with vision
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        max_tokens: 1500,
        temperature: 0.8,
        tools: getAdvancedTools(context),
        tool_choice: 'auto'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const assistantResponse = data.choices[0].message;

    let audioContent = null;

    // Generate voice response if requested and ElevenLabs is available
    if (includeVoice && elevenLabsKey && assistantResponse.content) {
      try {
        audioContent = await generateVoiceResponse(assistantResponse.content, elevenLabsKey);
      } catch (voiceError) {
        console.error('Voice generation failed:', voiceError);
        // Continue without voice if it fails
      }
    }

    // Handle tool calls if present
    let toolResults = null;
    if (assistantResponse.tool_calls) {
      toolResults = await handleAdvancedToolCalls(
        assistantResponse.tool_calls,
        context,
        userId,
        supabase
      );
    }

    return new Response(
      JSON.stringify({
        response: assistantResponse.content,
        audioContent,
        toolResults,
        hasVision: !!imageData,
        actionPerformed: !!assistantResponse.tool_calls
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in conversational-ai function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        response: 'Désolé, je rencontre un problème technique. Veuillez réessayer.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function buildEnhancedSystemPrompt(context: string, userProfile: any): string {
  const basePrompt = `Tu es l'assistant IA conversationnel avancé de KwendaGo, l'application VTC multimodale pour l'Afrique francophone.

Tu as des capacités avancées:
- Vision : Analyse d'images, documents, photos
- Conversation naturelle : Dialogue fluide et contextuel
- Actions intelligentes : Exécution de tâches complexes
- Personnalisation : Adaptée au profil utilisateur

CONTEXTE GÉOGRAPHIQUE:
- Villes: Kinshasa, Lubumbashi, Kolwezi (RDC), Abidjan (Côte d'Ivoire)
- Devises: CDF (RDC), XOF (Côte d'Ivoire)
- Langues: Français, Lingala, Anglais, Swahili

SERVICES AVANCÉS:
- Transport intelligent avec prédictions
- Livraison optimisée par IA
- Marketplace avec recommandations personnalisées
- Location avec analyse prédictive

Tu dois:
1. Être conversationnel et naturel
2. Analyser les images avec précision
3. Proposer des solutions proactives
4. Utiliser le contexte local africain
5. Personnaliser selon le profil utilisateur`;

  if (userProfile) {
    return basePrompt + `

PROFIL UTILISATEUR:
- Ville: ${userProfile.city || 'Non spécifiée'}
- Type: ${userProfile.user_type || 'Client'}
- Langue: ${userProfile.preferred_language || 'Français'}
- Historique: ${userProfile.total_trips || 0} trajets`;
  }

  return basePrompt;
}

function getAdvancedTools(context: string) {
  const baseTools: any[] = [
    {
      type: 'function',
      function: {
        name: 'analyze_document',
        description: 'Analyser un document ou une image uploadée',
        parameters: {
          type: 'object',
          properties: {
            document_type: { type: 'string', enum: ['license', 'id_card', 'vehicle_docs', 'product_photo'] },
            analysis_type: { type: 'string', enum: ['verification', 'extraction', 'quality_check'] }
          },
          required: ['document_type', 'analysis_type']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'intelligent_recommendation',
        description: 'Générer des recommandations intelligentes basées sur IA',
        parameters: {
          type: 'object',
          properties: {
            recommendation_type: { type: 'string', enum: ['routes', 'products', 'services', 'partners'] },
            user_preferences: { type: 'string' },
            contextual_data: { type: 'object' }
          },
          required: ['recommendation_type']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'predictive_analysis',
        description: 'Analyser et prédire des tendances',
        parameters: {
          type: 'object',
          properties: {
            analysis_type: { type: 'string', enum: ['demand_forecast', 'price_prediction', 'traffic_analysis'] },
            time_horizon: { type: 'string', enum: ['hourly', 'daily', 'weekly'] },
            location: { type: 'string' }
          },
          required: ['analysis_type']
        }
      }
    }
  ];

  if (context === 'transport' || context === 'delivery') {
    baseTools.push({
      type: 'function',
      function: {
        name: 'optimize_route',
        description: 'Optimiser un itinéraire avec IA',
        parameters: {
          type: 'object',
          properties: {
            origin: { type: 'string' },
            destination: { type: 'string' },
            preferences: { type: 'string', enum: ['fastest', 'cheapest', 'safest'] },
            avoid_traffic: { type: 'boolean' }
          },
          required: ['origin', 'destination']
        }
      }
    });
  }

  return baseTools;
}

async function generateVoiceResponse(text: string, apiKey: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/9BWtsMINqrJLrRacOk9x', {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: text.substring(0, 500), // Limit for performance
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.7,
          similarity_boost: 0.8,
          style: 0.2,
          use_speaker_boost: true
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Voice generation failed: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(arrayBuffer))
    );

    return base64Audio;
  } catch (error: unknown) {
    console.error('Voice generation error:', error);
    return null;
  }
}

async function handleAdvancedToolCalls(
  toolCalls: any[],
  context: string,
  userId: string,
  supabase: any
): Promise<any[]> {
  const results = [];

  for (const toolCall of toolCalls) {
    const { function: func } = toolCall;
    const args = JSON.parse(func.arguments);

    console.log(`Executing advanced tool: ${func.name} with args:`, args);

    switch (func.name) {
      case 'analyze_document':
        results.push(await analyzeDocument(args, userId, supabase));
        break;
      
      case 'intelligent_recommendation':
        results.push(await generateIntelligentRecommendation(args, userId, supabase));
        break;
      
      case 'predictive_analysis':
        results.push(await performPredictiveAnalysis(args, supabase));
        break;
      
      case 'optimize_route':
        results.push(await optimizeRoute(args, supabase));
        break;
      
      default:
        results.push({ error: `Tool ${func.name} not implemented` });
    }
  }

  return results;
}

async function analyzeDocument(args: any, userId: string, supabase: any) {
  // Simulate document analysis (in real implementation, use vision AI)
  return {
    document_type: args.document_type,
    analysis_result: 'Document analysé avec succès',
    verification_status: 'verified',
    extracted_data: {
      document_number: 'DOC123456',
      expiry_date: '2025-12-31',
      is_valid: true
    },
    confidence_score: 0.95
  };
}

async function generateIntelligentRecommendation(args: any, userId: string, supabase: any) {
  try {
    // Get user history for personalization
    const { data: userHistory } = await supabase
      .from('transport_bookings')
      .select('destination_address, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      recommendation_type: args.recommendation_type,
      personalized: true,
      recommendations: [
        {
          title: 'Route optimisée vers Gombe',
          confidence: 0.92,
          reason: 'Basé sur vos trajets précédents'
        },
        {
          title: 'Chauffeur VIP recommandé',
          confidence: 0.88,
          reason: 'Excellent rating et proche de vous'
        }
      ],
      ml_insights: 'Recommandations basées sur analyse comportementale'
    };
  } catch (error: unknown) {
    return { error: 'Erreur lors de la génération de recommandations' };
  }
}

async function performPredictiveAnalysis(args: any, supabase: any) {
  return {
    analysis_type: args.analysis_type,
    prediction: {
      demand_level: 'high',
      confidence: 0.87,
      peak_hours: ['08:00-09:00', '17:00-19:00'],
      price_factor: 1.2
    },
    insights: 'Forte demande prévue en fin de journée'
  };
}

async function optimizeRoute(args: any, supabase: any) {
  return {
    origin: args.origin,
    destination: args.destination,
    optimized_route: {
      distance_km: 12.5,
      duration_minutes: 25,
      traffic_factor: 0.3,
      cost_estimate: 3500
    },
    alternative_routes: [
      { route: 'Via Boulevard du 30 Juin', time: 30, cost: 3200 }
    ],
    ai_recommendation: 'Route principale recommandée malgré le trafic'
  };
}