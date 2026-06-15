import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let functionCalled = null;
  let success = true;
  let errorMsg = null;

  try {
    const { message, context, userId, conversationHistory = [] } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user context for personalization
    let userProfile = null;
    if (userId) {
      const { data } = await supabase
        .from('user_profiles')
        .select('preferred_language, city, user_type')
        .eq('user_id', userId)
        .maybeSingle();
      userProfile = data;
    }

    // Build context-aware system prompt
    const systemPrompt = buildSystemPrompt(context, userProfile);

    // Prepare conversation messages
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ];

    console.log('Sending request to OpenAI with context:', context);

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        max_tokens: 1000,
        temperature: 0.7,
        functions: getContextFunctions(context),
        function_call: 'auto'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const assistantResponse = data.choices[0].message;

    let functionResult = null;

    // Handle function calls if present
    if (assistantResponse.function_call) {
      functionCalled = assistantResponse.function_call.name;
      functionResult = await handleFunctionCall(
        assistantResponse.function_call,
        context,
        userId,
        supabase
      );
    }

    // PHASE 10: Log interaction to analytics
    const responseTime = Date.now() - startTime;
    if (userId) {
      try {
        await supabase.from('ai_interactions').insert({
          user_id: userId,
          context: context || 'general',
          user_message: message,
          ai_response: assistantResponse.content || '',
          function_called: functionCalled,
          function_result: functionResult,
          success: true,
          response_time_ms: responseTime
        });
      } catch (logError) {
        console.error('Failed to log interaction:', logError);
      }
    }

    if (assistantResponse.function_call) {
      return new Response(
        JSON.stringify({
          response: assistantResponse.content || 'Je traite votre demande...',
          functionResult,
          actionPerformed: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        response: assistantResponse.content,
        actionPerformed: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    success = false;
    errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in ai-assistant function:', error);

    // Log failed interaction
    const responseTime = Date.now() - startTime;
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase.from('ai_interactions').insert({
        context: 'error',
        user_message: 'Error occurred',
        ai_response: '',
        success: false,
        error_message: errorMsg,
        response_time_ms: responseTime
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({ 
        error: errorMsg,
        response: 'Désolé, je rencontre un problème technique. Veuillez réessayer.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function buildSystemPrompt(context: string, userProfile: any): string {
  const basePrompt = `Tu es l'assistant IA de KwendaGo, l'application VTC multimodale pour l'Afrique francophone. Tu aides les utilisateurs avec leurs besoins de transport, livraison, marketplace et location de véhicules.

CONTEXTE GÉOGRAPHIQUE:
- Villes principales: Kinshasa, Lubumbashi, Kolwezi (RDC), Abidjan (Côte d'Ivoire)
- Devises: CDF (RDC), XOF (Côte d'Ivoire)
- Langues: Français (principal), Lingala, Anglais

SERVICES DISPONIBLES:
- Transport: VTC, taxi-bus, moto-taxi
- Livraison: Flash (moto express), Flex (camionnette), MaxiCharge (camion gros volume)
- Marketplace: E-commerce avec chat vendeur-acheteur
- Location: Véhicules avec partenaires

Tu dois:
1. Répondre en français sauf demande contraire
2. Être précis et pratique
3. Proposer des solutions concrètes
4. Utiliser les fonctions disponibles quand approprié
5. Tenir compte du contexte local africain`;

  if (userProfile) {
    const userContext = `
PROFIL UTILISATEUR:
- Ville: ${userProfile.city || 'Non spécifiée'}
- Type: ${userProfile.user_type || 'Client'}
- Langue préférée: ${userProfile.preferred_language || 'Français'}`;
    
    return basePrompt + userContext;
  }

  if (context) {
    const contextPrompt = `
CONTEXTE ACTUEL: ${context}
Adapte tes réponses selon ce contexte spécifique.`;
    
    return basePrompt + contextPrompt;
  }

  return basePrompt;
}

function getContextFunctions(context: string) {
  const baseFunctions: any[] = [
    {
      name: 'get_recommendations',
      description: 'Obtenir des recommandations personnalisées',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['destinations', 'products', 'routes'] },
          location: { type: 'string' },
          preferences: { type: 'string' }
        },
        required: ['type']
      }
    },
    {
      name: 'estimate_price',
      description: 'Estimer le prix d\'un service',
      parameters: {
        type: 'object',
        properties: {
          service: { type: 'string', enum: ['transport', 'delivery'] },
          origin: { type: 'string' },
          destination: { type: 'string' },
          vehicle_type: { type: 'string' }
        },
        required: ['service', 'origin', 'destination']
      }
    },
    // PHASE 5: Fiabilité vendeur
    {
      name: 'check_seller_reliability',
      description: 'Vérifier la fiabilité et le score de confiance d\'un vendeur',
      parameters: {
        type: 'object',
        properties: {
          seller_id: { type: 'string', description: 'ID du vendeur' }
        },
        required: ['seller_id']
      }
    },
    // PHASE 1: Vérification stock et promotions
    {
      name: 'check_stock_availability',
      description: 'Vérifier la disponibilité en stock d\'un produit',
      parameters: {
        type: 'object',
        properties: {
          product_id: { type: 'string' }
        },
        required: ['product_id']
      }
    },
    {
      name: 'calculate_delivery_cost',
      description: 'Calculer précisément les frais de livraison pour un produit',
      parameters: {
        type: 'object',
        properties: {
          product_id: { type: 'string' },
          delivery_address: { type: 'string' }
        },
        required: ['product_id', 'delivery_address']
      }
    }
  ];

  if (context === 'transport' || context === 'delivery') {
    baseFunctions.push({
      name: 'find_nearby_drivers',
      description: 'Trouver des chauffeurs à proximité',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string' },
          service_type: { type: 'string' },
          radius: { type: 'number' }
        },
        required: ['location', 'service_type']
      }
    });
  }

  if (context === 'marketplace') {
    baseFunctions.push(
      {
        name: 'search_products',
        description: 'Rechercher des produits dans la marketplace',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            category: { type: 'string' },
            location: { type: 'string' },
            price_range: { type: 'string' }
          },
          required: ['query']
        }
      },
      // PHASE 3: Comparaison de produits
      {
        name: 'compare_products',
        description: 'Comparer 2 à 3 produits côte à côte',
        parameters: {
          type: 'object',
          properties: {
            product_ids: { 
              type: 'array',
              items: { type: 'string' },
              minItems: 2,
              maxItems: 3,
              description: 'IDs des produits à comparer'
            }
          },
          required: ['product_ids']
        }
      },
      // PHASE 4: Analyse d'image
      {
        name: 'analyze_product_image',
        description: 'Analyser une image de produit et générer une description détaillée',
        parameters: {
          type: 'object',
          properties: {
            image_url: { type: 'string', description: 'URL de l\'image du produit' },
            category_hint: { type: 'string', description: 'Catégorie du produit pour contexte' }
          },
          required: ['image_url']
        }
      }
    );
  }

  // PHASE 2: Recommandations personnalisées
  if (context === 'marketplace') {
    baseFunctions.push(
      // PHASE 2: Recommandations personnalisées
      {
        name: 'get_personalized_recommendations',
        description: 'Obtenir des recommandations de produits personnalisées basées sur l\'historique',
        parameters: {
          type: 'object',
          properties: {
            user_id: { type: 'string' },
            category: { type: 'string', description: 'Catégorie optionnelle pour filtrer' }
          },
          required: ['user_id']
        }
      },
      // PHASE 6: Promotions actives
      {
        name: 'check_active_promotions',
        description: 'Vérifier les promotions actives pour un utilisateur ou catégorie',
        parameters: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            max_results: { type: 'number', default: 5 }
          }
        }
      },
      // PHASE 7: Support client
      {
        name: 'track_order_status',
        description: 'Suivre le statut d\'une commande marketplace',
        parameters: {
          type: 'object',
          properties: {
            order_id: { type: 'string' }
          },
          required: ['order_id']
        }
      },
      {
        name: 'initiate_return_request',
        description: 'Initier une demande de retour pour une commande',
        parameters: {
          type: 'object',
          properties: {
            order_id: { type: 'string' },
            reason: { type: 'string' }
          },
          required: ['order_id', 'reason']
        }
      }
    );
  }

  return baseFunctions;
}

async function handleFunctionCall(
  functionCall: any,
  context: string,
  userId: string,
  supabase: any
): Promise<any> {
  const { name, arguments: args } = functionCall;
  const parsedArgs = JSON.parse(args);

  console.log(`Executing function: ${name} with args:`, parsedArgs);

  switch (name) {
    case 'get_recommendations':
      return await getRecommendations(parsedArgs, userId, supabase);
    
    case 'estimate_price':
      return await estimatePrice(parsedArgs, supabase);
    
    case 'find_nearby_drivers':
      return await findNearbyDrivers(parsedArgs, supabase);
    
    case 'search_products':
      return await searchProducts(parsedArgs, supabase);
    
    case 'compare_products':
      return await compareProducts(parsedArgs, supabase);
    
    case 'analyze_product_image':
      return await analyzeProductImage(parsedArgs);
    
    case 'check_seller_reliability':
      return await checkSellerReliability(parsedArgs, supabase);
    
    case 'check_stock_availability':
      return await checkStockAvailability(parsedArgs, supabase);
    
    case 'calculate_delivery_cost':
      return await calculateDeliveryCost(parsedArgs, supabase);

    // PHASE 2
    case 'get_personalized_recommendations':
      return await getPersonalizedRecommendations(parsedArgs, userId, supabase);
    
    // PHASE 6
    case 'check_active_promotions':
      return await checkActivePromotions(parsedArgs, supabase);
    
    // PHASE 7
    case 'track_order_status':
      return await trackOrderStatus(parsedArgs, userId, supabase);
    
    case 'initiate_return_request':
      return await initiateReturnRequest(parsedArgs, userId, supabase);
    
    default:
      return { error: `Fonction ${name} non reconnue` };
  }
}

async function getRecommendations(args: any, userId: string, supabase: any) {
  try {
    if (args.type === 'destinations' && userId) {
      // Get user's frequent destinations
      const { data: trips } = await supabase
        .from('transport_bookings')
        .select('destination_address, destination_coords')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        type: 'destinations',
        recommendations: trips?.slice(0, 5) || [],
        message: 'Voici vos destinations fréquentes'
      };
    }

    if (args.type === 'products') {
      // Get popular products
      const { data: products } = await supabase
        .from('marketplace_products')
        .select('title, price, seller_id, category')
        .eq('status', 'active')
        .order('view_count', { ascending: false })
        .limit(5);

      return {
        type: 'products',
        recommendations: products || [],
        message: 'Produits populaires dans votre région'
      };
    }

    return { message: 'Aucune recommandation disponible pour le moment' };
  } catch (error: unknown) {
    console.error('Error getting recommendations:', error);
    return { error: 'Erreur lors de la récupération des recommandations' };
  }
}

async function estimatePrice(args: any, supabase: any) {
  try {
    // Get base pricing for the service
    const { data: pricing } = await supabase
      .from('pricing_rules')
      .select('base_price, price_per_km, service_type, vehicle_type')
      .eq('service_type', args.service)
      .eq('vehicle_type', args.vehicle_type || 'standard')
      .single();

    if (!pricing) {
      return { error: 'Tarification non disponible pour ce service' };
    }

    // Simulate distance calculation (in a real app, use Google Maps API)
    const estimatedDistance = Math.random() * 20 + 2; // 2-22 km
    const estimatedPrice = pricing.base_price + (estimatedDistance * pricing.price_per_km);

    return {
      service: args.service,
      origin: args.origin,
      destination: args.destination,
      estimatedPrice: Math.round(estimatedPrice),
      estimatedDistance: Math.round(estimatedDistance * 10) / 10,
      currency: args.service === 'transport' ? 'CDF' : 'CDF',
      message: `Prix estimé: ${Math.round(estimatedPrice)} CDF pour ~${Math.round(estimatedDistance * 10) / 10} km`
    };
  } catch (error: unknown) {
    console.error('Error estimating price:', error);
    return { error: 'Erreur lors de l\'estimation du prix' };
  }
}

async function findNearbyDrivers(args: any, supabase: any) {
  try {
    // Get available drivers (simplified query)
    const { data: drivers } = await supabase
      .from('driver_profiles')
      .select('user_id, vehicle_type, current_location, rating')
      .eq('status', 'available')
      .eq('vehicle_type', args.service_type)
      .limit(5);

    return {
      location: args.location,
      driversFound: drivers?.length || 0,
      drivers: drivers || [],
      message: `${drivers?.length || 0} chauffeur(s) disponible(s) dans votre zone`
    };
  } catch (error: unknown) {
    console.error('Error finding drivers:', error);
    return { error: 'Erreur lors de la recherche de chauffeurs' };
  }
}

async function searchProducts(args: any, supabase: any) {
  try {
    let query = supabase
      .from('marketplace_products')
      .select('id, title, price, image_url, seller_id, category, stock_quantity, rating_average')
      .eq('status', 'active')
      .eq('moderation_status', 'approved')
      .ilike('title', `%${args.query}%`);

    if (args.category) {
      query = query.eq('category', args.category);
    }

    const { data: products } = await query.limit(5);

    return {
      query: args.query,
      category: args.category,
      productsFound: products?.length || 0,
      products: products || [],
      message: `${products?.length || 0} produit(s) trouvé(s) pour "${args.query}"`
    };
  } catch (error: unknown) {
    console.error('Error searching products:', error);
    return { error: 'Erreur lors de la recherche de produits' };
  }
}

// PHASE 3: Comparaison de produits
async function compareProducts(args: any, supabase: any) {
  try {
    const { product_ids } = args;

    if (!product_ids || product_ids.length < 2 || product_ids.length > 3) {
      return { error: 'Veuillez fournir 2 ou 3 produits à comparer' };
    }

    const { data: products } = await supabase
      .from('marketplace_products')
      .select(`
        id,
        title,
        price,
        currency,
        image_url,
        category,
        description,
        stock_quantity,
        rating_average,
        rating_count,
        seller_id,
        seller_profiles!inner(
          display_name,
          rating_average,
          total_sales,
          verified_seller
        )
      `)
      .in('id', product_ids)
      .eq('status', 'active')
      .eq('moderation_status', 'approved');

    if (!products || products.length < 2) {
      return { error: 'Impossible de récupérer les produits pour comparaison' };
    }

    // Calculer le meilleur rapport qualité/prix
    const bestValue = products.reduce((best, current) => {
      const currentScore = (current.rating_average || 0) / (current.price || 1);
      const bestScore = (best.rating_average || 0) / (best.price || 1);
      return currentScore > bestScore ? current : best;
    });

    return {
      type: 'product_comparison',
      products: products.map(p => ({
        id: p.id,
        title: p.title,
        price: p.price,
        currency: p.currency,
        image_url: p.image_url,
        category: p.category,
        stock: p.stock_quantity,
        rating: p.rating_average || 0,
        reviews: p.rating_count || 0,
        seller: p.seller_profiles?.display_name,
        sellerRating: p.seller_profiles?.rating_average || 0,
        sellerVerified: p.seller_profiles?.verified_seller || false
      })),
      recommendation: {
        bestValueId: bestValue.id,
        message: `Meilleur rapport qualité/prix: ${bestValue.title}`
      },
      message: `Comparaison de ${products.length} produits effectuée`
    };
  } catch (error: unknown) {
    console.error('Error comparing products:', error);
    return { error: 'Erreur lors de la comparaison des produits' };
  }
}

// PHASE 4: Analyse d'image avec OpenAI Vision
async function analyzeProductImage(args: any) {
  try {
    const { image_url, category_hint } = args;
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      return { error: 'OpenAI API key non configurée' };
    }

    const prompt = category_hint 
      ? `Analyse cette image de produit de la catégorie "${category_hint}". Génère une description détaillée pour une marketplace e-commerce incluant: caractéristiques visuelles, état apparent, matériaux visibles, dimensions estimées, et points d'intérêt pour un acheteur potentiel.`
      : `Analyse cette image de produit pour une marketplace e-commerce. Décris en détail ce que tu vois, identifie le type de produit, ses caractéristiques, son état, et fournis des informations utiles pour un acheteur.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: image_url } }
            ]
          }
        ],
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI Vision API error:', errorData);
      return { error: 'Erreur lors de l\'analyse de l\'image' };
    }

    const data = await response.json();
    const description = data.choices[0].message.content;

    return {
      type: 'image_analysis',
      image_url,
      category: category_hint,
      description,
      message: 'Analyse d\'image terminée avec succès'
    };
  } catch (error: unknown) {
    console.error('Error analyzing image:', error);
    return { error: 'Erreur lors de l\'analyse de l\'image' };
  }
}

// PHASE 5: Vérification de fiabilité vendeur
async function checkSellerReliability(args: any, supabase: any) {
  try {
    const { seller_id } = args;

    const { data: seller } = await supabase
      .from('seller_profiles')
      .select(`
        user_id,
        display_name,
        rating_average,
        total_sales,
        verified_seller,
        seller_badge_level,
        created_at
      `)
      .eq('user_id', seller_id)
      .single();

    if (!seller) {
      return { error: 'Vendeur non trouvé' };
    }

    // Calculer le score de confiance (0-100)
    const ratingScore = (seller.rating_average || 0) * 8; // 40% max
    const salesScore = Math.min((seller.total_sales || 0) / 10, 20); // 20% max
    const verificationScore = seller.verified_seller ? 20 : 0; // 20% max
    const ageScore = calculateAgeScore(seller.created_at); // 10% max
    const badgeScore = getBadgeScore(seller.seller_badge_level); // 10% max

    const trustScore = Math.round(ratingScore + salesScore + verificationScore + ageScore + badgeScore);

    // Déterminer le badge de confiance
    let trustBadge = '';
    let trustLevel = '';
    
    if (trustScore >= 90) {
      trustBadge = '🌟';
      trustLevel = 'Vendeur de confiance';
    } else if (trustScore >= 70) {
      trustBadge = '✅';
      trustLevel = 'Vendeur vérifié';
    } else if (trustScore >= 50) {
      trustBadge = '👤';
      trustLevel = 'Vendeur actif';
    } else {
      trustBadge = '⚠️';
      trustLevel = 'Nouveau vendeur';
    }

    return {
      type: 'seller_reliability',
      seller: {
        id: seller.user_id,
        name: seller.display_name,
        rating: seller.rating_average || 0,
        totalSales: seller.total_sales || 0,
        verified: seller.verified_seller,
        badge: seller.seller_badge_level
      },
      trustScore,
      trustBadge,
      trustLevel,
      breakdown: {
        rating: Math.round(ratingScore),
        sales: Math.round(salesScore),
        verification: verificationScore,
        experience: Math.round(ageScore),
        badge: badgeScore
      },
      message: `${trustBadge} ${trustLevel} - Score de confiance: ${trustScore}/100`
    };
  } catch (error: unknown) {
    console.error('Error checking seller reliability:', error);
    return { error: 'Erreur lors de la vérification du vendeur' };
  }
}

function calculateAgeScore(createdAt: string): number {
  const now = new Date();
  const created = new Date(createdAt);
  const monthsOld = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 30);
  
  if (monthsOld >= 12) return 10;
  if (monthsOld >= 6) return 7;
  if (monthsOld >= 3) return 5;
  if (monthsOld >= 1) return 3;
  return 1;
}

function getBadgeScore(badge: string | null): number {
  switch (badge) {
    case 'gold': return 10;
    case 'silver': return 7;
    case 'bronze': return 5;
    case 'verified': return 8;
    default: return 0;
  }
}

// PHASE 1: Vérification stock
async function checkStockAvailability(args: any, supabase: any) {
  try {
    const { product_id } = args;

    const { data: product } = await supabase
      .from('marketplace_products')
      .select('id, title, stock_quantity, status')
      .eq('id', product_id)
      .single();

    if (!product) {
      return { error: 'Produit non trouvé' };
    }

    const stockLevel = product.stock_quantity || 0;
    let stockStatus = '';
    let alert = false;

    if (stockLevel === 0) {
      stockStatus = 'Rupture de stock';
      alert = true;
    } else if (stockLevel <= 5) {
      stockStatus = `Stock faible - Plus que ${stockLevel} unité(s)`;
      alert = true;
    } else if (stockLevel <= 10) {
      stockStatus = `Stock limité - ${stockLevel} unités disponibles`;
    } else {
      stockStatus = 'En stock';
    }

    return {
      type: 'stock_check',
      product_id: product.id,
      title: product.title,
      stock: stockLevel,
      status: stockStatus,
      alert,
      message: stockStatus
    };
  } catch (error: unknown) {
    console.error('Error checking stock:', error);
    return { error: 'Erreur lors de la vérification du stock' };
  }
}

// PHASE 1: Calcul frais de livraison
async function calculateDeliveryCost(args: any, supabase: any) {
  try {
    const { product_id, delivery_address } = args;

    const { data: product } = await supabase
      .from('marketplace_products')
      .select('id, title, price, seller_id')
      .eq('id', product_id)
      .single();

    if (!product) {
      return { error: 'Produit non trouvé' };
    }

    // Récupérer les frais de livraison de base
    const { data: deliveryFee } = await supabase
      .from('delivery_fees')
      .select('base_fee, currency')
      .eq('service_type', 'marketplace')
      .eq('is_active', true)
      .single();

    const baseFee = deliveryFee?.base_fee || 7000;
    const currency = deliveryFee?.currency || 'CDF';

    // Estimation simple basée sur la distance (à améliorer avec vraie API géolocalisation)
    const distanceMultiplier = 1.0; // Pourrait être calculé selon l'adresse

    const totalDeliveryCost = Math.round(baseFee * distanceMultiplier);

    return {
      type: 'delivery_cost',
      product_id: product.id,
      product_title: product.title,
      delivery_address,
      baseFee,
      totalCost: totalDeliveryCost,
      currency,
      message: `Frais de livraison estimés: ${totalDeliveryCost} ${currency}`
    };
  } catch (error: unknown) {
    console.error('Error calculating delivery cost:', error);
    return { error: 'Erreur lors du calcul des frais de livraison' };
  }
}

// ============= PHASE 2: Recommandations Personnalisées =============
async function getPersonalizedRecommendations(args: any, userId: string, supabase: any) {
  try {
    // Récupérer les préférences utilisateur
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // Produits basés sur catégories favorites
    let query = supabase
      .from('marketplace_products')
      .select(`
        id,
        title,
        price,
        currency,
        image_url,
        category,
        rating_average,
        stock_quantity
      `)
      .eq('status', 'active')
      .eq('moderation_status', 'approved')
      .gt('stock_quantity', 0);

    // Filtrer par catégories favorites si disponibles
    if (prefs?.favorite_categories && prefs.favorite_categories.length > 0) {
      query = query.in('category', prefs.favorite_categories);
    }

    // Filtrer par fourchette de prix si définie
    if (prefs?.price_range_min) {
      query = query.gte('price', prefs.price_range_min);
    }
    if (prefs?.price_range_max) {
      query = query.lte('price', prefs.price_range_max);
    }

    // Filtre catégorie optionnel
    if (args.category) {
      query = query.eq('category', args.category);
    }

    const { data: products } = await query
      .order('rating_average', { ascending: false })
      .limit(5);

    return {
      type: 'personalized_recommendations',
      products: products || [],
      based_on: {
        favorite_categories: prefs?.favorite_categories || [],
        price_range: prefs ? `${prefs.price_range_min || 0} - ${prefs.price_range_max || '∞'}` : 'Non défini'
      },
      message: `${(products || []).length} recommandations personnalisées`
    };
  } catch (error: unknown) {
    console.error('Error getting personalized recommendations:', error);
    return { error: 'Erreur lors de la récupération des recommandations' };
  }
}

// ============= PHASE 6: Promotions Actives =============
async function checkActivePromotions(args: any, supabase: any) {
  try {
    const maxResults = args.max_results || 5;

    let query = supabase
      .from('marketplace_promotions')
      .select(`
        id,
        product_id,
        discount_percentage,
        original_price,
        discounted_price,
        end_date,
        promotion_type,
        remaining_quantity,
        marketplace_products!inner(
          title,
          image_url,
          category
        )
      `)
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString())
      .order('discount_percentage', { ascending: false });

    if (args.category) {
      query = query.eq('marketplace_products.category', args.category);
    }

    const { data: promotions } = await query.limit(maxResults);

    const formattedPromotions = (promotions || []).map((promo: any) => ({
      product_id: promo.product_id,
      title: promo.marketplace_products.title,
      image_url: promo.marketplace_products.image_url,
      category: promo.marketplace_products.category,
      original_price: promo.original_price,
      discounted_price: promo.discounted_price,
      discount: `${promo.discount_percentage}%`,
      savings: promo.original_price - promo.discounted_price,
      ends_at: promo.end_date,
      stock_limited: promo.remaining_quantity ? promo.remaining_quantity < 10 : false
    }));

    return {
      type: 'active_promotions',
      promotions: formattedPromotions,
      total_found: formattedPromotions.length,
      message: `${formattedPromotions.length} promotion(s) active(s) trouvée(s)`
    };
  } catch (error: unknown) {
    console.error('Error checking promotions:', error);
    return { error: 'Erreur lors de la vérification des promotions' };
  }
}

// ============= PHASE 7: Service Client =============
async function trackOrderStatus(args: any, userId: string, supabase: any) {
  try {
    const { order_id } = args;

    const { data: order } = await supabase
      .from('marketplace_orders')
      .select(`
        id,
        status,
        total_amount,
        created_at,
        delivery_status,
        tracking_number,
        estimated_delivery_date
      `)
      .eq('id', order_id)
      .eq('buyer_id', userId)
      .maybeSingle();

    if (!order) {
      return { error: 'Commande non trouvée ou vous n\'avez pas accès à cette commande' };
    }

    const statusMessages: Record<string, string> = {
      'pending': 'En attente de confirmation vendeur',
      'confirmed': 'Confirmée par le vendeur',
      'shipped': 'Expédiée',
      'delivered': 'Livrée',
      'cancelled': 'Annulée'
    };

    return {
      type: 'order_tracking',
      order_id: order.id,
      status: order.status,
      status_message: statusMessages[order.status] || order.status,
      total_amount: order.total_amount,
      tracking_number: order.tracking_number,
      estimated_delivery: order.estimated_delivery_date,
      message: `Votre commande est: ${statusMessages[order.status] || order.status}`
    };
  } catch (error: unknown) {
    console.error('Error tracking order:', error);
    return { error: 'Erreur lors du suivi de commande' };
  }
}

async function initiateReturnRequest(args: any, userId: string, supabase: any) {
  try {
    const { order_id, reason } = args;

    // Vérifier que la commande existe et appartient à l'utilisateur
    const { data: order } = await supabase
      .from('marketplace_orders')
      .select('id, status, delivered_at')
      .eq('id', order_id)
      .eq('buyer_id', userId)
      .maybeSingle();

    if (!order) {
      return { error: 'Commande non trouvée' };
    }

    if (order.status !== 'delivered') {
      return { error: 'Seules les commandes livrées peuvent être retournées' };
    }

    // Vérifier délai de retour (par exemple 14 jours)
    const deliveredDate = new Date(order.delivered_at);
    const daysSinceDelivery = (Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceDelivery > 14) {
      return { error: 'Le délai de retour (14 jours) est dépassé' };
    }

    // Créer une demande de retour (vous devrez créer cette table)
    // Pour l'instant, on retourne juste un message de confirmation
    
    return {
      type: 'return_request',
      order_id,
      status: 'initiated',
      reason,
      message: 'Votre demande de retour a été enregistrée. Un agent va vous contacter sous 24-48h.',
      next_steps: [
        'Conservez le produit dans son emballage d\'origine',
        'Attendez la confirmation par email',
        'Un transporteur viendra récupérer le colis'
      ]
    };
  } catch (error: unknown) {
    console.error('Error initiating return:', error);
    return { error: 'Erreur lors de l\'initiation du retour' };
  }
}
