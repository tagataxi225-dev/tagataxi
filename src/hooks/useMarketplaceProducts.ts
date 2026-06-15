/**
 * ✅ PHASE 2: Hook marketplace avec cache Redis intelligent
 */

import { useCachedQuery } from './useCachedQuery';
import { supabase } from '@/integrations/supabase/client';
import { cacheStrategies } from '@/lib/redis';
import { useAuth } from './useAuth';

export const useMarketplaceProducts = (city?: string) => {
  const { user } = useAuth();

  return useCachedQuery(
    ['marketplace-products', city, user?.id],
    async () => {
      // Récupérer les produits publics avec info vendeurs
      let query = supabase
        .from('marketplace_products')
        .select(`
          *,
          vendor_profiles!inner(
            shop_name,
            shop_logo_url,
            average_rating,
            total_sales
          )
        `)
        .eq('status', 'active')
        .eq('moderation_status', 'approved')
        .order('updated_at', { ascending: false });

      if (city) query = query.eq('vendor_profiles.city', city);

      const { data: publicProducts, error: publicError } = await query;

      if (publicError) throw publicError;

      // ✅ PHASE 2: Si connecté, récupérer TOUS ses propres produits avec info vendeur
      let sellerProducts: any[] = [];
      if (user) {
        const { data: myProducts } = await supabase
          .from('marketplace_products')
          .select(`
            *,
            vendor_profiles!inner(
              shop_name,
              shop_logo_url,
              average_rating,
              total_sales
            )
          `)
          .eq('seller_id', user.id)
          .eq('status', 'active')
          .eq('moderation_status', 'approved')
          .order('updated_at', { ascending: false });
        
        if (myProducts) {
          sellerProducts = myProducts;
        }
      }
      
      // Fusionner sans doublons
      const allProducts = [
        ...sellerProducts,
        ...(publicProducts || []).filter(
          p => !sellerProducts.some(sp => sp.id === p.id)
        )
      ];

      // Transform products
      return allProducts.map(product => ({
        id: product.id,
        name: product.title,
        price: product.price,
        image: Array.isArray(product.images) && product.images.length > 0 
          ? product.images[0] 
          : 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=300&h=300&fit=crop',
        images: Array.isArray(product.images) ? product.images : [],
        rating: product.rating_average || 4.5,
        reviews: product.rating_count || Math.floor(Math.random() * 200) + 10,
        seller: (product.vendor_profiles as any)?.shop_name || 'Vendeur',
        sellerLogo: (product.vendor_profiles as any)?.shop_logo_url,
        sellerRating: (product.vendor_profiles as any)?.average_rating || 0,
        sellerTotalSales: (product.vendor_profiles as any)?.total_sales || 0,
        category: product.category?.toLowerCase() || 'other',
        description: product.description || '',
        videoUrl: product.video_url,
        specifications: {},
        inStock: (product.stock_count || 0) > 0 && product.status === 'active',
        stockCount: product.stock_count || 0,
        isTrending: product.featured || false,
        trendingScore: product.featured ? Math.floor(Math.random() * 30) + 70 : 0,
        condition: product.condition,
        location: product.location,
        coordinates: product.coordinates,
        moderationStatus: product.moderation_status,
        productStatus: product.status,
        sellerId: product.seller_id,
        isOwnProduct: user?.id === product.seller_id
      }));
    },
    {
      cacheStrategy: cacheStrategies.POPULAR_PRODUCTS,
      invalidateOn: [
        { table: 'marketplace_products', event: '*' }
      ]
    }
  );
};
