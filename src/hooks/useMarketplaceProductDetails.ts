import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MarketplaceProduct } from '@/types/marketplace';

export const useMarketplaceProductDetails = (productId: string) => {
  return useQuery({
    queryKey: ['marketplace-product-details', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_products')
        .select(`
          *,
          vendor_profiles!inner(
            shop_name,
            shop_logo_url,
            average_rating,
            total_sales,
            follower_count
          )
        `)
        .eq('id', productId)
        .single();
        
      if (error) throw error;
      
      // Normaliser les images
      const normalizeImages = (images: any): string[] => {
        if (!images) return [];
        if (Array.isArray(images)) {
          return images.map(img => typeof img === 'string' ? img : String(img)).filter(Boolean);
        }
        if (typeof images === 'string') {
          try {
            const parsed = JSON.parse(images);
            return Array.isArray(parsed) ? parsed : [images];
          } catch {
            return [images];
          }
        }
        return [];
      };

      const normalizedImages = normalizeImages(data.images);
      const vendor = data.vendor_profiles as any;

      // Count vendor's approved products
      const { count: vendorProductCount } = await supabase
        .from('marketplace_products')
        .select('id', { count: 'exact', head: true })
        .eq('seller_id', data.seller_id)
        .eq('moderation_status', 'approved');

      const transformedProduct: MarketplaceProduct = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        price: data.price,
        images: normalizedImages,
        image: normalizedImages[0] || '/placeholder.svg',
        category: data.category,
        condition: data.condition,
        seller_id: data.seller_id,
        seller: {
          display_name: vendor?.shop_name || 'Vendeur'
        },
        location: data.location,
        coordinates: data.coordinates as any,
        inStock: (data.stock_count || 0) > 0,
        stockCount: data.stock_count || 0,
        rating: data.rating_average || 0,
        reviews: data.rating_count || 0,
        brand: data.brand,
        specifications: (data.specifications as any) || {},
        viewCount: data.view_count || 0,
        salesCount: data.sales_count || 0,
        popularityScore: data.popularity_score || 0,
        moderation_status: data.moderation_status,
        status: data.status,
        // Champs produits digitaux
        is_digital: data.is_digital || false,
        digital_file_url: data.digital_file_url,
        digital_file_name: data.digital_file_name,
        digital_file_size: data.digital_file_size,
        digital_download_limit: data.digital_download_limit || 5,
        digital_file_type: data.digital_file_type,
        video_url: data.video_url || undefined
      };
      
      // Ajouter vendor comme propriété additionnelle
      (transformedProduct as any).vendor = {
        shop_name: vendor?.shop_name || 'Vendeur',
        shop_logo_url: vendor?.shop_logo_url,
        average_rating: vendor?.average_rating || 0,
        total_sales: vendor?.total_sales || 0,
        follower_count: vendor?.follower_count || 0,
        product_count: vendorProductCount || 0
      };

      return transformedProduct;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false
  });
};

export const useSimilarProducts = (productId: string, category: string, sellerId: string) => {
  return useQuery({
    queryKey: ['similar-products', productId, category, sellerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_products')
        .select(`
          *,
          vendor_profiles!inner(
            shop_name,
            shop_logo_url,
            average_rating
          )
        `)
        .eq('status', 'active')
        .eq('moderation_status', 'approved')
        .neq('id', productId)
        .or(`category.eq.${category},seller_id.eq.${sellerId}`)
        .order('popularity_score', { ascending: false, nullsFirst: false })
        .limit(10);
        
      if (error) throw error;
      
      // Normaliser les données
      const normalizeImages = (images: any): string[] => {
        if (!images) return [];
        if (Array.isArray(images)) {
          return images.map(img => typeof img === 'string' ? img : String(img)).filter(Boolean);
        }
        if (typeof images === 'string') {
          try {
            const parsed = JSON.parse(images);
            return Array.isArray(parsed) ? parsed : [images];
          } catch {
            return [images];
          }
        }
        return [];
      };

      return (data || []).map(product => ({
        id: product.id,
        title: product.title,
        price: product.price,
        images: normalizeImages(product.images),
        rating_average: product.rating_average,
        stock_quantity: product.stock_count
      }));
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!productId
  });
};
