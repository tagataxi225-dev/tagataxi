import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Restaurant, FoodProduct } from '@/types/food';

export const useRestaurants = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRestaurants = async (city: string) => {
    setLoading(true);
    try {
      console.log('🍽️ [useRestaurants] Fetching restaurants for city:', city);
      
      const { data, error } = await supabase
        .from('restaurant_profiles')
        .select('*')
        .eq('city', city)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Fallback: if no results for city, fetch all cities
      if (!data || data.length === 0) {
        console.log('⚠️ [useRestaurants] No restaurants in', city, '— falling back to all cities');
        const { data: allData, error: allError } = await supabase
          .from('restaurant_profiles')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        
        if (allError) throw allError;
        
        const mapped = (allData || []).map(r => ({
          ...r,
          phone_number: r.phone_number || '',
        })) as Restaurant[];
        
        setRestaurants(mapped);
        return mapped;
      }

      const mapped = (data || []).map(r => ({
        ...r,
        phone_number: r.phone_number || '',
      })) as Restaurant[];
      
      setRestaurants(mapped);
      return mapped;
    } catch (error) {
      console.error('❌ Error fetching restaurants:', error);
      setRestaurants([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurantMenu = async (restaurantId: string): Promise<FoodProduct[]> => {
    try {
      const { data, error } = await supabase
        .from('food_products')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_available', true)
        .eq('moderation_status', 'approved')
        .order('category', { ascending: true });

      if (error) throw error;
      return (data || []) as FoodProduct[];
    } catch (error) {
      console.error('Error fetching menu:', error);
      return [];
    }
  };

  return {
    restaurants,
    loading,
    fetchRestaurants,
    fetchRestaurantMenu,
  };
};
