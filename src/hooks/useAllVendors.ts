import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Filters {
  search: string;
  minRating: number;
  minSales: number;
  verifiedOnly: boolean;
  shopType: 'all' | 'boutique' | 'supermarket';
}

interface Sort {
  field: string;
  direction: 'asc' | 'desc';
}

const defaultFilters: Filters = {
  search: '',
  minRating: 0,
  minSales: 0,
  verifiedOnly: false,
  shopType: 'all'
};

const ITEMS_PER_PAGE = 15;

export const useAllVendors = (city?: string) => {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [sort, setSort] = useState<Sort>({ field: 'average_rating', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['all-vendors', filters, sort, currentPage, city],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // Construction conditionnelle avec typage any pour éviter l'inférence TypeScript profonde
      let query: any = supabase.from('vendor_profiles').select('*', { count: 'exact' });
      
      // ✅ Filtrer par ville
      if (city) {
        query = query.eq('city', city);
      }
      
      if (filters.search) {
        query = query.ilike('shop_name', `%${filters.search}%`);
      }
      if (filters.minRating > 0) {
        query = query.gte('average_rating', filters.minRating);
      }
      if (filters.minSales > 0) {
        query = query.gte('total_sales', filters.minSales);
      }
      if (filters.verifiedOnly) {
        console.warn('[useAllVendors] is_verified filter skipped - column does not exist yet');
      }
      if (filters.shopType !== 'all') {
        query = query.eq('shop_type', filters.shopType);
      }
      
      query = query.order(sort.field, { ascending: sort.direction === 'asc' });
      query = query.range(from, to);

      const { data: vendors, error, count } = await query;
      
      // ✅ Fallback: si 0 résultat dans la ville, relancer sans filtre ville
      if (!error && (count === 0 || !vendors?.length) && city) {
        console.log(`[useAllVendors] 0 boutiques à ${city}, fallback toutes villes`);
        let fallbackQuery: any = supabase.from('vendor_profiles').select('*', { count: 'exact' });
        if (filters.search) fallbackQuery = fallbackQuery.ilike('shop_name', `%${filters.search}%`);
        if (filters.minRating > 0) fallbackQuery = fallbackQuery.gte('average_rating', filters.minRating);
        if (filters.minSales > 0) fallbackQuery = fallbackQuery.gte('total_sales', filters.minSales);
        if (filters.shopType !== 'all') fallbackQuery = fallbackQuery.eq('shop_type', filters.shopType);
        fallbackQuery = fallbackQuery.order(sort.field, { ascending: sort.direction === 'asc' });
        fallbackQuery = fallbackQuery.range(from, to);
        const fbResult = await fallbackQuery;
        if (!fbResult.error) {
          return processVendors(fbResult.data, fbResult.count);
        }
      }
      
      if (error) {
        console.error('[useAllVendors] Supabase error:', error);
        toast({
          title: "❌ Erreur de chargement",
          description: error.message || "Impossible de charger les boutiques",
          variant: "destructive"
        });
        throw error;
      }

      return processVendors(vendors, count);
      
      async function processVendors(vendorData: any[] | null, totalCount: number | null) {
        const vendorIds = (vendorData || []).map(v => v.user_id);
        const productsCount: Record<string, number> = {};
        
        if (vendorIds.length > 0) {
          const { data: productsData } = await supabase
            .from('marketplace_products')
            .select('seller_id')
            .in('seller_id', vendorIds);
          
          productsData?.forEach(p => {
            productsCount[p.seller_id] = (productsCount[p.seller_id] || 0) + 1;
          });
        }

        const vendorsWithCount = (vendorData || []).map(vendor => ({
          ...vendor,
          product_count: productsCount[vendor.user_id] || 0
        }));

        return {
          vendors: vendorsWithCount,
          totalCount: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / ITEMS_PER_PAGE)
        };
      }
    }
  });

  const updateFilters = (newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    setCurrentPage(1);
  };

  const updateSort = (newSort: Sort) => {
    setSort(newSort);
    setCurrentPage(1);
  };

  return {
    vendors: data?.vendors || [],
    totalCount: data?.totalCount || 0,
    totalPages: data?.totalPages || 0,
    currentPage,
    isLoading,
    filters,
    sort,
    updateFilters,
    resetFilters,
    updateSort,
    setCurrentPage
  };
};
