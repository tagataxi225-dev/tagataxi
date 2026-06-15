import { useState, useMemo, useCallback } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  seller: string;
  sellerId: string;
  rating: number;
  reviewCount: number;
  location?: {
    lat: number;
    lng: number;
  };
  isAvailable: boolean;
  condition?: 'new' | 'used' | 'refurbished';
  isPopular?: boolean;
  isNew?: boolean;
  isPremium?: boolean;
  tags?: string[];
}

interface FilterState {
  searchQuery: string;
  selectedCategory: string;
  priceRange: [number, number];
  minRating: number;
  conditions: string[];
  maxDistance: number;
  availability: 'all' | 'available' | 'unavailable';
  sortBy: 'popularity' | 'price_low' | 'price_high' | 'rating' | 'distance' | 'newest';
  showOnlyFavorites: boolean;
}

interface UseMarketplaceFiltersProps {
  products: Product[];
  userLocation?: { lat: number; lng: number };
  favoriteIds?: string[];
}

export const useMarketplaceFilters = ({ 
  products, 
  userLocation, 
  favoriteIds = [] 
}: UseMarketplaceFiltersProps) => {
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedCategory: 'all',
    priceRange: [0, 2000000], // 0 to 2M CDF
    minRating: 0,
    conditions: [],
    maxDistance: 50, // 50km max
    availability: 'all',
    sortBy: 'popularity',
    showOnlyFavorites: false,
  });

  const calculateDistance = useCallback((
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.seller.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (filters.selectedCategory !== 'all') {
      filtered = filtered.filter(product => 
        product.category.toLowerCase() === filters.selectedCategory.toLowerCase()
      );
    }

    // Price range filter
    filtered = filtered.filter(product =>
      product.price >= filters.priceRange[0] && 
      product.price <= filters.priceRange[1]
    );

    // Rating filter
    if (filters.minRating > 0) {
      filtered = filtered.filter(product => product.rating >= filters.minRating);
    }

    // Condition filter
    if (filters.conditions.length > 0) {
      filtered = filtered.filter(product =>
        !product.condition || filters.conditions.includes(product.condition)
      );
    }

    // Distance filter
    if (userLocation && filters.maxDistance < 50) {
      filtered = filtered.filter(product => {
        if (!product.location) return true; // Include products without location
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          product.location.lat,
          product.location.lng
        );
        return distance <= filters.maxDistance;
      });
    }

    // Availability filter
    if (filters.availability !== 'all') {
      const isAvailable = filters.availability === 'available';
      filtered = filtered.filter(product => product.isAvailable === isAvailable);
    }

    // Favorites filter
    if (filters.showOnlyFavorites) {
      filtered = filtered.filter(product => favoriteIds.includes(product.id));
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price_low':
          return a.price - b.price;
        case 'price_high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'distance':
          if (!userLocation) return 0;
          const distanceA = a.location ? calculateDistance(
            userLocation.lat, userLocation.lng, a.location.lat, a.location.lng
          ) : Infinity;
          const distanceB = b.location ? calculateDistance(
            userLocation.lat, userLocation.lng, b.location.lat, b.location.lng
          ) : Infinity;
          return distanceA - distanceB;
        case 'newest':
          // Prioritize new products
          if (a.isNew && !b.isNew) return -1;
          if (!a.isNew && b.isNew) return 1;
          return 0;
        case 'popularity':
        default:
          // Popularity score based on reviews, rating, and special badges
          const popularityA = (a.reviewCount * 0.3) + (a.rating * 0.4) + 
                             (a.isPopular ? 50 : 0) + (a.isPremium ? 30 : 0);
          const popularityB = (b.reviewCount * 0.3) + (b.rating * 0.4) + 
                             (b.isPopular ? 50 : 0) + (b.isPremium ? 30 : 0);
          return popularityB - popularityA;
      }
    });

    return filtered;
  }, [products, filters, userLocation, favoriteIds, calculateDistance]);

  const updateFilter = useCallback(<K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      searchQuery: '',
      selectedCategory: 'all',
      priceRange: [0, 2000000],
      minRating: 0,
      conditions: [],
      maxDistance: 50,
      availability: 'all',
      sortBy: 'popularity',
      showOnlyFavorites: false,
    });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return filters.searchQuery !== '' ||
           filters.selectedCategory !== 'all' ||
           filters.priceRange[0] !== 0 ||
           filters.priceRange[1] !== 2000000 ||
           filters.minRating !== 0 ||
           filters.conditions.length > 0 ||
           filters.maxDistance !== 50 ||
           filters.availability !== 'all' ||
           filters.showOnlyFavorites;
  }, [filters]);

  // Quick filter presets
  const applyQuickFilter = useCallback((preset: string) => {
    switch (preset) {
      case 'nearby':
        updateFilters({ maxDistance: 5, sortBy: 'distance' });
        break;
      case 'cheap':
        updateFilters({ priceRange: [0, 50000], sortBy: 'price_low' });
        break;
      case 'premium':
        updateFilters({ minRating: 4.5, sortBy: 'rating' });
        break;
      case 'new':
        updateFilters({ conditions: ['new'], sortBy: 'newest' });
        break;
      case 'deals':
        updateFilters({ 
          priceRange: [0, 500000], 
          minRating: 4.0,
          sortBy: 'price_low' 
        });
        break;
      default:
        resetFilters();
    }
  }, [updateFilters, resetFilters]);

  // Get filter statistics
  const filterStats = useMemo(() => {
    return {
      totalProducts: products.length,
      filteredCount: filteredProducts.length,
      averagePrice: filteredProducts.length > 0 
        ? filteredProducts.reduce((sum, p) => sum + p.price, 0) / filteredProducts.length 
        : 0,
      categoryDistribution: filteredProducts.reduce((acc, p) => {
        acc[p.category] = (acc[p.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }, [products, filteredProducts]);

  return {
    filters,
    filteredProducts,
    updateFilter,
    updateFilters,
    resetFilters,
    hasActiveFilters,
    applyQuickFilter,
    filterStats,
  };
};