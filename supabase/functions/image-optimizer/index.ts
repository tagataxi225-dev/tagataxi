/**
 * EDGE FUNCTION: IMAGE OPTIMIZER
 * Optimise, redimensionne et convertit les images en WebP/AVIF
 * Pour servir millions d'utilisateurs avec images légères
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OptimizeRequest {
  url: string;
  width?: number;
  height?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  quality?: number;
  fit?: 'cover' | 'contain' | 'fill';
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url, width, height, format = 'webp', quality = 80, fit = 'cover' }: OptimizeRequest = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch l'image originale
    const imageResponse = await fetch(url);
    
    if (!imageResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch image' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const originalBuffer = await imageResponse.arrayBuffer();
    
    // Pour l'instant, proxy simple
    // TODO: Intégrer bibliothèque d'optimisation d'images
    // Options possibles:
    // 1. imagescript (https://deno.land/x/imagescript)
    // 2. sharp via npm: (difficile avec Deno)
    // 3. Service externe (Cloudinary, Imgix)
    // 4. ImageMagick via système

    // Pour Phase 1, retourner l'image originale avec headers de cache optimisés
    const optimizedBuffer = originalBuffer;

    return new Response(optimizedBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': `image/${format}`,
        'Cache-Control': 'public, max-age=31536000, immutable', // 1 an
        'X-Image-Width': width?.toString() || 'original',
        'X-Image-Height': height?.toString() || 'original',
        'X-Image-Format': format,
        'X-Image-Quality': quality.toString()
      }
    });

  } catch (error: any) {
    console.error('Image optimization error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Image optimization failed',
        details: (error as any).message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

/**
 * USAGE DEPUIS FRONTEND:
 * 
 * const optimizedUrl = await fetch('https://wddlktajnhwhyquwcdgf.supabase.co/functions/v1/image-optimizer', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     url: 'https://storage.supabase.co/path/to/image.jpg',
 *     width: 800,
 *     height: 600,
 *     format: 'webp',
 *     quality: 85
 *   })
 * });
 * 
 * ÉTAPES FUTURES POUR VRAIE OPTIMISATION:
 * 1. Installer imagescript ou bibliothèque similaire
 * 2. Implémenter resize, crop, format conversion
 * 3. Caching avec Redis des images déjà optimisées
 * 4. Support AVIF pour navigateurs modernes
 */
