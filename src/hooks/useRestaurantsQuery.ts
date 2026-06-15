import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Restaurant, FoodProduct } from '@/types/food';

export const useRestaurantsQuery = (city: string) => {
  const queryClient = useQueryClient();
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['restaurants', city],
    queryFn: async () => {
      const timestamp = Date.now();
      console.log(`[${timestamp}] 🔍 Fetching restaurants for:`, city.trim());
      
      // Query with city filter + verification_status
      const { data: cityData, error: cityError } = await supabase
        .from('restaurant_profiles')
        .select('*')
        .ilike('city', city.trim())
        .eq('is_active', true)
        .eq('verification_status', 'approved')
        .order('total_orders', { ascending: false, nullsFirst: false });
      
      if (cityError) {
        console.error('❌ Error fetching restaurants:', cityError);
        throw cityError;
      }
      
      // If city has results, return them
      if (cityData && cityData.length > 0) {
        console.log(`[${timestamp}] ✅ Fetched ${cityData.length} restaurants for ${city.trim()}`);
        return { restaurants: cityData as Restaurant[], isShowingAllCities: false };
      }
      
      // Fallback: fetch from ALL cities
      console.log(`[${timestamp}] ⚠️ No restaurants in ${city.trim()}, falling back to all cities`);
      const { data: allData, error: allError } = await supabase
        .from('restaurant_profiles')
        .select('*')
        .eq('is_active', true)
        .eq('verification_status', 'approved')
        .order('total_orders', { ascending: false, nullsFirst: false });
      
      if (allError) {
        console.error('❌ Error fetching all restaurants:', allError);
        throw allError;
      }
      
      console.log(`[${timestamp}] ✅ Fallback: fetched ${allData?.length || 0} restaurants from all cities`);
      return { restaurants: (allData || []) as Restaurant[], isShowingAllCities: true };
    },
    staleTime: 3 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 2,
  });
  
  const forceRefresh = () => {
    console.log('🔄 Force refreshing restaurants...');
    queryClient.invalidateQueries({ queryKey: ['restaurants', city] });
    refetch();
  };
  
  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('restaurant-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'restaurant_profiles',
      }, () => {
        console.log('🔄 Restaurant data changed, refreshing...');
        forceRefresh();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [city]);
  
  // Auto-retry after 5s if empty and no error (circuit breaker recovery)
  useEffect(() => {
    if (!isLoading && !error && data?.restaurants?.length === 0) {
      const timer = setTimeout(() => {
        console.log('🔄 Auto-retry: empty results, attempting refresh...');
        forceRefresh();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, error, data?.restaurants?.length]);
  
  // Function to fetch menu for a specific restaurant
  const fetchRestaurantMenu = async (restaurantId: string): Promise<FoodProduct[]> => {
    const { data, error } = await supabase
      .from('food_products')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_available', true)
      .eq('moderation_status', 'approved')
      .order('category', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching menu:', error);
      toast.error('Erreur de chargement du menu');
      throw error;
    }
    
    return (data || []) as FoodProduct[];
  };
  
  return {
    restaurants: data?.restaurants || [],
    isShowingAllCities: data?.isShowingAllCities || false,
    loading: isLoading,
    error,
    refetch: forceRefresh,
    fetchRestaurantMenu,
  };
};
