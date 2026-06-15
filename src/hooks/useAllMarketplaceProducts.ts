import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { MarketplaceProduct } from '@/types/marketplace';

interface Filters {
  search: string;
  categories: string[];
  priceRange: [number, number];
  conditions: string[];
  minRating: number;
  maxDistance: number;
  availableOnly: boolean;
  shopType: string;
}

interface Sort {
  field: string;
  direction: 'asc' | 'desc';
}

const defaultFilters: Filters = {
  search: '',
  categories: [],
  priceRange: [0, 2000000],
  conditions: [],
  minRating: 0,
  maxDistance: 50,
  availableOnly: false,
  shopType: 'all'
};

const ITEMS_PER_PAGE = 20;

export const useAllMarketplaceProducts = (city?: string) => {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [sort, setSort] = useState<Sort>({ field: 'popularity_score', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['all-marketplace-products', filters, sort, currentPage, city],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('marketplace_products')
        .select(`
          *,
          vendor_profiles!inner(
            shop_name,
            shop_logo_url,
            average_rating,
            total_sales,
            shop_type
          )
        `, { count: 'exact' })
        .eq('status', 'active')
        .eq('moderation_status', 'approved');

      // ✅ Filtrer par ville
      if (city) {
        query = query.eq('location', city);
      }

      // Appliquer filtres
      if (filters.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }
      if (filters.categories.length > 0) {
        query = query.in('category', filters.categories);
      }
      if (filters.conditions.length > 0) {
        query = query.in('condition', filters.conditions);
      }
      if (filters.priceRange[0] > 0 || filters.priceRange[1] < 2000000) {
        query = query.gte('price', filters.priceRange[0]).lte('price', filters.priceRange[1]);
      }
      if (filters.minRating > 0) {
        query = query.gte('rating_average', filters.minRating);
      }
      if (filters.availableOnly) {
        query = query.gt('stock_count', 0);
      }
      if (filters.shopType !== 'all') {
        query = query.eq('vendor_profiles.shop_type', filters.shopType);
      }

      // Tri
      const isAscending = sort.direction === 'asc';
      query = query.order(sort.field, { ascending: isAscending });
      query = query.order('updated_at', { ascending: false });
      
      query = query.range(from, to);

      const { data, error, count } = await query;
      
      // ✅ Fallback: si 0 résultat dans la ville, relancer sans filtre ville
      if (!error && (count === 0 || !data?.length) && city) {
        console.log(`[useAllMarketplaceProducts] 0 produits à ${city}, fallback toutes villes`);
        let fallbackQuery = supabase
          .from('marketplace_products')
          .select(`*, vendor_profiles!inner(shop_name, shop_logo_url, average_rating, total_sales, shop_type)`, { count: 'exact' })
          .eq('status', 'active')
          .eq('moderation_status', 'approved');
        if (filters.search) fallbackQuery = fallbackQuery.ilike('title', `%${filters.search}%`);
        if (filters.categories.length > 0) fallbackQuery = fallbackQuery.in('category', filters.categories);
        if (filters.conditions.length > 0) fallbackQuery = fallbackQuery.in('condition', filters.conditions);
        if (filters.priceRange[0] > 0 || filters.priceRange[1] < 2000000) {
          fallbackQuery = fallbackQuery.gte('price', filters.priceRange[0]).lte('price', filters.priceRange[1]);
        }
        if (filters.minRating > 0) fallbackQuery = fallbackQuery.gte('rating_average', filters.minRating);
        if (filters.availableOnly) fallbackQuery = fallbackQuery.gt('stock_count', 0);
        if (filters.shopType !== 'all') fallbackQuery = fallbackQuery.eq('vendor_profiles.shop_type', filters.shopType);
        fallbackQuery = fallbackQuery.order(sort.field, { ascending: sort.direction === 'asc' });
        fallbackQuery = fallbackQuery.order('updated_at', { ascending: false });
        fallbackQuery = fallbackQuery.range(from, to);
        const fallbackResult = await fallbackQuery;
        if (!fallbackResult.error) {
          return processProducts(fallbackResult.data, fallbackResult.count);
        }
      }
      
      if (error) throw error;
      return processProducts(data, count);

      function processProducts(rawData: any[] | null, totalCount: number | null) {
        // Normaliser images
        const normalizeImages = (images: any): string[] => {
          if (!images) return [];
          if (Array.isArray(images)) return images.filter(Boolean);
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

        const products: MarketplaceProduct[] = (rawData || []).map(product => {
          const normalizedImages = normalizeImages(product.images);
          return {
            id: product.id,
            title: product.title,
            description: product.description || '',
            price: product.price,
            images: normalizedImages,
            image: normalizedImages[0] || 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=300',
            category: product.category,
            condition: product.condition || 'new',
            seller_id: product.seller_id,
            seller: { 
              display_name: (product.vendor_profiles as any)?.shop_name || 'Vendeur'
            },
            location: product.location || 'Kinshasa',
            coordinates: product.coordinates as any,
            inStock: (product.stock_count || 0) > 0,
            stockCount: product.stock_count || 0,
            rating: product.rating_average || 0,
            reviews: product.rating_count || 0,
            brand: product.brand,
            specifications: product.specifications as any,
            viewCount: product.view_count || 0,
            salesCount: product.sales_count || 0,
            popularityScore: product.popularity_score || 0,
            moderation_status: product.moderation_status || 'pending',
            created_at: product.created_at,
            shop_type: (product.vendor_profiles as any)?.shop_type || 'boutique'
          };
        });

        return {
          products,
          totalCount: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / ITEMS_PER_PAGE)
        };
      }
    },
    staleTime: 10 * 60 * 1000, // ✅ 10 minutes au lieu de 30s
    gcTime: 30 * 60 * 1000 // ✅ 30 minutes au lieu de 60s
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
    products: data?.products || [],
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
