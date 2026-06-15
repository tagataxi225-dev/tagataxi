import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SimilarVendor {
  user_id: string;
  shop_name: string;
  shop_logo_url?: string;
  shop_banner_url?: string;
  shop_description?: string;
  average_rating: number;
  total_sales: number;
  follower_count: number;
  product_count: number;
  main_category?: string;
  created_at: string;
  relevance_score?: number;
}

export const useSimilarVendors = (currentVendorId: string, limit: number = 8) => {
  return useQuery({
    queryKey: ['similar-vendors', currentVendorId, limit],
    queryFn: async (): Promise<SimilarVendor[]> => {
      try {
        // 1. Get current vendor's main categories
        const { data: currentProducts } = await supabase
          .from('marketplace_products')
          .select('category')
          .eq('seller_id', currentVendorId)
          .eq('status', 'active');

        if (!currentProducts || currentProducts.length === 0) {
          return [];
        }

        // Find most frequent category
        const categoryCounts = currentProducts.reduce((acc: Record<string, number>, product) => {
          const category = product.category || 'Autre';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {});

        const mainCategory = Object.entries(categoryCounts)
          .sort(([, a], [, b]) => b - a)[0]?.[0];

        // 2. Get current vendor's rating for comparison
        const { data: currentVendor } = await supabase
          .from('vendor_profiles')
          .select('average_rating')
          .eq('user_id', currentVendorId)
          .single();

        const currentRating = currentVendor?.average_rating || 0;

        // 3. Find other active vendors
        const { data: allVendors } = await supabase
          .from('vendor_profiles')
          .select(`
            user_id,
            shop_name,
            shop_logo_url,
            shop_banner_url,
            shop_description,
            average_rating,
            total_sales,
            follower_count,
            created_at
          `)
          .neq('user_id', currentVendorId)
          .gte('total_sales', 0)
          .order('total_sales', { ascending: false })
          .limit(50); // Get more to filter and score

        if (!allVendors || allVendors.length === 0) {
          return [];
        }

        // 4. Get product counts and categories for each vendor
        const vendorsWithDetails = await Promise.all(
          allVendors.map(async (vendor) => {
            const { data: products } = await supabase
              .from('marketplace_products')
              .select('category')
              .eq('seller_id', vendor.user_id)
              .eq('status', 'active');

            const productCount = products?.length || 0;
            
            // Find vendor's main category
            const vendorCategories = products?.reduce((acc: Record<string, number>, p) => {
              const cat = p.category || 'Autre';
              acc[cat] = (acc[cat] || 0) + 1;
              return acc;
            }, {}) || {};

            const vendorMainCategory = Object.entries(vendorCategories)
              .sort(([, a], [, b]) => b - a)[0]?.[0];

            return {
              ...vendor,
              product_count: productCount,
              main_category: vendorMainCategory,
            };
          })
        );

        // 5. Score and sort by relevance
        const scoredVendors = vendorsWithDetails.map((vendor) => {
          let score = 0;

          // Same main category = +10 points
          if (vendor.main_category === mainCategory) {
            score += 10;
          }

          // Similar rating (±0.5 stars) = +5 points
          if (Math.abs(vendor.average_rating - currentRating) <= 0.5) {
            score += 5;
          }

          // Popular vendor (>50 sales) = +3 points
          if (vendor.total_sales > 50) {
            score += 3;
          }

          // Active vendor (>5 products) = +2 points
          if (vendor.product_count > 5) {
            score += 2;
          }

          // High rating (>4.5) = +2 points
          if (vendor.average_rating >= 4.5) {
            score += 2;
          }

          return {
            ...vendor,
            relevance_score: score,
          };
        });

        // Sort by relevance score and limit
        return scoredVendors
          .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
          .slice(0, limit);

      } catch (error) {
        console.error('Error fetching similar vendors:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    enabled: !!currentVendorId,
  });
};

// Helper to determine badge type
export const getBadgeType = (vendor: SimilarVendor, currentMainCategory?: string): 'top' | 'new' | 'similar' | undefined => {
  // Top vendor: >100 sales AND rating >4.5
  if (vendor.total_sales > 100 && vendor.average_rating >= 4.5) {
    return 'top';
  }

  // New vendor: created less than 30 days ago
  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(vendor.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceCreation < 30) {
    return 'new';
  }

  // Similar category
  if (vendor.main_category === currentMainCategory) {
    return 'similar';
  }

  return undefined;
};
