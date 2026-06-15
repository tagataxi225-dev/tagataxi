import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { FoodProduct } from '@/types/food';

interface PopularDish extends FoodProduct {
  restaurant_name?: string;
  restaurant_logo_url?: string;
  restaurant_id: string;
}

export const usePopularDishes = (city: string, limit: number = 12) => {
  return useQuery({
    queryKey: ['popular-dishes', city, limit],
    queryFn: async () => {
      const mapDishes = (data: any[]): PopularDish[] =>
        (data || []).map((item: any) => ({
          id: item.id,
          restaurant_id: item.restaurant_id,
          name: item.name,
          description: item.description,
          price: item.price,
          main_image_url: item.main_image_url,
          video_url: item.video_url,
          category: item.category,
          is_available: item.is_available,
          moderation_status: item.moderation_status,
          restaurant_name: item.restaurant_profiles?.restaurant_name,
          restaurant_logo_url: item.restaurant_profiles?.logo_url
        }));

      // Try with city filter first
      const { data, error } = await supabase
        .from('food_products')
        .select(`
          *,
          restaurant_profiles!inner (
            restaurant_name,
            logo_url,
            city,
            is_active,
            verification_status
          )
        `)
        .eq('restaurant_profiles.city', city)
        .eq('restaurant_profiles.is_active', true)
        .eq('restaurant_profiles.verification_status', 'approved')
        .eq('is_available', true)
        .eq('moderation_status', 'approved')
        .order('total_orders', { ascending: false, nullsFirst: false })
        .order('rating_average', { ascending: false, nullsFirst: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching popular dishes:', error);
        throw error;
      }

      if (data && data.length > 0) {
        return mapDishes(data);
      }

      // Fallback: all cities
      console.log('⚠️ No popular dishes in', city, '— falling back to all cities');
      const { data: allData, error: allError } = await supabase
        .from('food_products')
        .select(`
          *,
          restaurant_profiles!inner (
            restaurant_name,
            logo_url,
            city,
            is_active,
            verification_status
          )
        `)
        .eq('restaurant_profiles.is_active', true)
        .eq('restaurant_profiles.verification_status', 'approved')
        .eq('is_available', true)
        .eq('moderation_status', 'approved')
        .order('total_orders', { ascending: false, nullsFirst: false })
        .order('rating_average', { ascending: false, nullsFirst: false })
        .limit(limit);

      if (allError) throw allError;
      return mapDishes(allData || []);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
