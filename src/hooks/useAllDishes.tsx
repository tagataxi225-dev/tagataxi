import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { FoodProduct } from '@/types/food';

interface PopularDish extends FoodProduct {
  restaurant_name?: string;
  restaurant_logo_url?: string;
  restaurant_city?: string;
}

interface DishFilters {
  search: string;
  categories: string[];
  priceRange: [number, number];
  restaurantId?: string;
  availableOnly: boolean;
}

interface SortOption {
  field: 'created_at' | 'price' | 'name';
  direction: 'asc' | 'desc';
}

const ITEMS_PER_PAGE = 20;

const buildDishQuery = (city: string | null, filters: DishFilters, sort: SortOption, from: number, to: number) => {
  let query = supabase
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
    `, { count: 'exact' })
    .eq('restaurant_profiles.is_active', true)
    .eq('restaurant_profiles.verification_status', 'approved')
    .eq('moderation_status', 'approved');

  if (city) {
    query = query.eq('restaurant_profiles.city', city);
  }

  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }
  if (filters.categories.length > 0) {
    query = query.in('category', filters.categories);
  }
  if (filters.priceRange) {
    query = query.gte('price', filters.priceRange[0]).lte('price', filters.priceRange[1]);
  }
  if (filters.restaurantId) {
    query = query.eq('restaurant_id', filters.restaurantId);
  }
  if (filters.availableOnly) {
    query = query.eq('is_available', true);
  }

  query = query.order(sort.field, { ascending: sort.direction === 'asc' });
  query = query.range(from, to);

  return query;
};

const mapDishes = (data: any[]): PopularDish[] =>
  data.map((item: any) => ({
    id: item.id,
    restaurant_id: item.restaurant_id,
    name: item.name,
    description: item.description,
    price: item.price,
    main_image_url: item.main_image_url,
    category: item.category,
    is_available: item.is_available,
    moderation_status: item.moderation_status,
    restaurant_name: item.restaurant_profiles?.restaurant_name,
    restaurant_logo_url: item.restaurant_profiles?.logo_url,
    restaurant_city: item.restaurant_profiles?.city,
  }));

export const useAllDishes = (city: string) => {
  const [filters, setFilters] = useState<DishFilters>({
    search: '',
    categories: [],
    priceRange: [0, 50000],
    availableOnly: true
  });
  
  const [sort, setSort] = useState<SortOption>({ field: 'created_at', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['all-dishes', city, filters, sort, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // Try with city filter first
      const { data: cityData, error: cityError, count: cityCount } = await buildDishQuery(city, filters, sort, from, to);
      if (cityError) throw cityError;

      if ((cityCount || 0) > 0) {
        return {
          dishes: mapDishes(cityData || []),
          totalCount: cityCount || 0,
          totalPages: Math.ceil((cityCount || 0) / ITEMS_PER_PAGE),
          isShowingAllCities: false,
        };
      }

      // Fallback: all cities
      const { data: allData, error: allError, count: allCount } = await buildDishQuery(null, filters, sort, from, to);
      if (allError) throw allError;

      return {
        dishes: mapDishes(allData || []),
        totalCount: allCount || 0,
        totalPages: Math.ceil((allCount || 0) / ITEMS_PER_PAGE),
        isShowingAllCities: true,
      };
    },
    staleTime: 3 * 60 * 1000,
  });

  const updateFilters = useCallback((newFilters: Partial<DishFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      categories: [],
      priceRange: [0, 50000],
      availableOnly: true
    });
    setCurrentPage(1);
  }, []);

  const updateSort = useCallback((newSort: SortOption) => {
    setSort(newSort);
    setCurrentPage(1);
  }, []);

  return {
    dishes: data?.dishes || [],
    totalCount: data?.totalCount || 0,
    totalPages: data?.totalPages || 0,
    isShowingAllCities: data?.isShowingAllCities || false,
    currentPage,
    isLoading,
    error,
    filters,
    sort,
    updateFilters,
    resetFilters,
    updateSort,
    setCurrentPage,
    refetch
  };
};
