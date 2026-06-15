import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FoodPromoItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  discount_percentage: number | null;
  main_image_url: string | null;
  category: string;
  restaurant_id: string;
  restaurant_name: string;
  restaurant_city: string;
  restaurant_logo: string | null;
  preparation_time: number | null;
}

export const useFoodPromos = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['food-promos'],
    queryFn: async (): Promise<FoodPromoItem[]> => {
      const { data, error } = await supabase
        .from('food_products')
        .select('id, name, description, price, original_price, discount_percentage, main_image_url, category, restaurant_id, preparation_time, restaurant_profiles!inner(restaurant_name, city, logo_url)')
        .gt('discount_percentage', 0)
        .eq('is_available', true)
        .order('discount_percentage', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        original_price: item.original_price,
        discount_percentage: item.discount_percentage,
        main_image_url: item.main_image_url,
        category: item.category,
        restaurant_id: item.restaurant_id,
        preparation_time: item.preparation_time,
        restaurant_name: item.restaurant_profiles?.restaurant_name || 'Restaurant',
        restaurant_city: item.restaurant_profiles?.city || '',
        restaurant_logo: item.restaurant_profiles?.logo_url,
      }));
    },
    staleTime: 60 * 1000,
  });

  return {
    promos: data || [],
    loading: isLoading,
    isEmpty: !isLoading && (!data || data.length === 0),
  };
};
