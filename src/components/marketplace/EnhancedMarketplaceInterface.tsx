import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Package, Store, User, Plus, ArrowLeft, ShoppingBag, ShoppingCart as CartIcon, ChevronRight, ShieldCheck, X, Smartphone, Laptop, Shirt, Home as HomeIcon, Trophy, Sparkles, LayoutGrid } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { EscrowDashboard } from './EscrowDashboard';
import Autoplay from 'embla-carousel-autoplay';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useChat } from '@/components/chat/ChatProvider';
import { cn } from '@/lib/utils';

// Components modernes
import { ModernMarketplaceHeader } from './ModernMarketplaceHeader';
import { ModernProductCard } from './ModernProductCard';
import { OptimizedProductCard } from './OptimizedProductCard';
// ProductQuickView remplacé par ProductDetailSheet
import { ModernProductGrid } from './ModernProductGrid';
import { FloatingCartIndicator } from './FloatingCartIndicator';
import { useAddToCartFeedback } from './AddToCartFeedback';
import { CategoryScrollBar } from './CategoryScrollBar';
import { QuickFiltersBar } from './QuickFiltersBar';
import { ResponsiveGrid } from '../ui/responsive-grid';

import { KwendaShopHeader } from './KwendaShopHeader';
import { TopProductsSection } from './TopProductsSection';
import { AiShopperProductCard } from './AiShopperProductCard';
import { useProductPromotions } from '@/hooks/useProductPromotions';
import { AllMarketplaceProductsView } from './AllMarketplaceProductsView';
import { AllVendorsView } from './AllVendorsView';
import { VendorCard } from './VendorCard';
import { SupermarketCard } from './SupermarketCard';

// Anciens composants (conservés pour compatibilité)
import { ProductGrid } from './ProductGrid';
import { UnifiedShoppingCart } from './cart/UnifiedShoppingCart';
import { ProductDetailSheet } from './ProductDetailSheet';
import { VendorStoreView } from './VendorStoreView';
import { ClientEscrowDashboard } from '../escrow/ClientEscrowDashboard';
import { HorizontalProductScroll } from './HorizontalProductScroll';
import { WalletBalance } from './WalletBalance';
import { DeliveryCalculator } from './DeliveryCalculator';
import { OrderTracker } from './OrderTracker';
import { AdvancedOrderTracker } from './AdvancedOrderTracker';
import { AdvancedFilters } from './AdvancedFilters';
import { DeliveryFeeApprovalDialog } from './DeliveryFeeApprovalDialog';
import { MessagesTab } from './MessagesTab';

// Hooks
import { useMarketplaceOrders } from '@/hooks/useMarketplaceOrders';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useSmartGeolocation } from '@/hooks/useSmartGeolocation';
import { useUserVerification } from '@/hooks/useUserVerification';
import { useWallet } from '@/hooks/useWallet';
import { useUniversalChat } from '@/hooks/useUniversalChat';
import { useCart } from '@/context/CartContext';
import { useProductFavorites } from '@/hooks/useProductFavorites';
import { useTopVendors } from '@/hooks/useTopVendors';

// Utiliser les types unifiés de marketplace.ts
import { MarketplaceProduct, CartItem as MarketplaceCartItem, HorizontalProduct, productToCartItem } from '@/types/marketplace';

// Alias pour rétro-compatibilité
type Product = MarketplaceProduct;
type CartItem = MarketplaceCartItem;

// Interfaces déplacées vers src/types/marketplace.ts

// Boutiques populaires — avatars circulaires en scroll horizontal (style "stories")
const PopularVendorsCarousel: React.FC<{
  vendors: any[];
  onVisit: (id: string) => void;
  onViewAll: () => void;
  onStoryOpen: (vendor: any) => void;
}> = ({ vendors, onVisit, onViewAll, onStoryOpen }) => {
  return (
    <section className="py-3 space-y-2">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-1.5">
          <Store className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Shop</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewAll}
          className="text-primary hover:text-primary/80 font-medium text-xs h-7 px-2"
        >
          Voir tout
          <ChevronRight className="h-3 w-3 ml-0.5" />
        </Button>
      </div>

      <div className="flex overflow-x-auto gap-4 px-4 hide-scrollbar">
        {vendors.map((vendor) => {
          const videoUrl = (vendor as any).videoUrl || (vendor as any).video_url;
          return (
            <button
              key={vendor.user_id}
              type="button"
              onClick={() => (videoUrl ? onStoryOpen(vendor) : onVisit(vendor.user_id))}
              className="flex flex-col items-center w-20 shrink-0 active:scale-95 transition-transform"
              style={{ touchAction: 'manipulation' }}
            >
              {vendor.shop_logo_url || vendor.shop_banner_url ? (
                <img
                  src={vendor.shop_logo_url || vendor.shop_banner_url}
                  alt={vendor.shop_name}
                  className={cn(
                    'w-16 h-16 rounded-full object-cover',
                    videoUrl ? 'border-[3px] border-red-500' : 'border-[3px] border-gray-200'
                  )}
                  loading="lazy"
                />
              ) : (
                <div
                  className={cn(
                    'w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center',
                    videoUrl ? 'border-[3px] border-red-500' : 'border-[3px] border-gray-200'
                  )}
                >
                  <Store className="w-6 h-6 text-gray-300" />
                </div>
              )}
              <span className="text-xs text-center truncate max-w-[72px] mt-1.5 text-gray-700">
                {vendor.shop_name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
interface EnhancedMarketplaceInterfaceProps {
  onNavigate: (path: string) => void;
}

export const EnhancedMarketplaceInterface: React.FC<EnhancedMarketplaceInterfaceProps> = ({ onNavigate }) => {
  return <EnhancedMarketplaceContent onNavigate={onNavigate} />;
};

const EnhancedMarketplaceContent: React.FC<EnhancedMarketplaceInterfaceProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, formatCurrency } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const geolocation = useGeolocation();
  const { currentCity } = useSmartGeolocation();
  const [selectedCity, setSelectedCity] = useState('Kinshasa');
  const locationLoading = geolocation.loading;
  const coordinates = geolocation.latitude && geolocation.longitude ? { lat: geolocation.latitude, lng: geolocation.longitude } : null;
  const { orders, loading: ordersLoading, refetch: refetchOrders } = useMarketplaceOrders();
  const { verification } = useUserVerification();
  const { wallet } = useWallet();
  const { createOrFindConversation, conversations } = useUniversalChat();
  const { openChat } = useChat();

  useEffect(() => {
    const marketCities = ['Kinshasa', 'Lubumbashi', 'Kolwezi'];
    if (currentCity?.name && marketCities.includes(currentCity.name)) {
      setSelectedCity(currentCity.name);
    } else {
      setSelectedCity('');
    }
  }, [currentCity?.name]);
  
  // Calcul des messages non lus marketplace
  const marketplaceUnreadCount = React.useMemo(() => {
    return conversations
      .filter(conv => conv.context_type === 'marketplace')
      .reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
  }, [conversations]);
  const { calculateDiscount, getOriginalPrice } = useProductPromotions();
  const { vendors: topVendors, loading: vendorsLoading } = useTopVendors(10, selectedCity);
  
  // State management
  const [currentTab, setCurrentTab] = useState<'shop' | 'supermarket' | 'orders' | 'escrow'>('shop');
  const [activeStory, setActiveStory] = useState<any>(null);
  const [vendorsWithVideo, setVendorsWithVideo] = useState<any[]>([]);

  // Enrich top vendors with their first product video_url (for story ring indicator)
  useEffect(() => {
    if (topVendors.length === 0) {
      setVendorsWithVideo([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const userIds = topVendors.map(v => v.user_id);
      const { data: products } = await supabase
        .from('marketplace_products')
        .select('seller_id, video_url')
        .in('seller_id', userIds)
        .not('video_url', 'is', null);

      if (cancelled) return;

      const videoBySeller = new Map<string, string>();
      (products ?? []).forEach((p: any) => {
        if (!videoBySeller.has(p.seller_id) && p.video_url) {
          videoBySeller.set(p.seller_id, p.video_url);
        }
      });

      setVendorsWithVideo(
        topVendors.map(v => ({
          ...v,
          videoUrl: videoBySeller.get(v.user_id) ?? null,
        }))
      );
    })();
    return () => { cancelled = true; };
  }, [topVendors]);
  const [viewMode, setViewMode] = useState<'home' | 'all-products' | 'all-vendors'>('home');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [shopSortBy, setShopSortBy] = useState('popularity');
  const { favorites, toggleFavorite, isFavorite, loading: favoritesLoading } = useProductFavorites(user?.id);

  // Détecter retour depuis l'espace vendeur
  useEffect(() => {
    if (location.state?.returnFromVendor) {
      setCurrentTab('shop');
      window.history.replaceState({}, document.title);
    }
  }, [location]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Utiliser le panier global du CartContext
  const { 
    cartItems, 
    addToCart: addToCartGlobal,
    removeFromCart: removeFromCartGlobal,
    updateQuantity: updateQuantityGlobal,
    clearCart: clearCartGlobal 
  } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDetailsOpen, setIsProductDetailsOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  
  // Quick View state supprimé - utilisation de selectedProduct/isProductDetailsOpen
  // Feedback visuel
  const { showFeedback } = useAddToCartFeedback({ onOpenCart: () => setIsCartOpen(true) });
  
  // Delivery fee approval
  const [pendingFeeOrder, setPendingFeeOrder] = useState<any | null>(null);
  const [isFeeDialogOpen, setIsFeeDialogOpen] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<any>(null);
  
  // Filters
  const [filters, setFilters] = useState({
    searchQuery: '',
    selectedCategory: 'all',
    priceRange: [0, 5000000] as [number, number],
    minRating: 0,
    conditions: [] as string[],
    maxDistance: 50,
    availability: 'all' as 'all' | 'available' | 'unavailable',
    sortBy: 'popularity',
    showOnlyFavorites: false,
  });
  
  
  // ✅ État de connexion
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Hooks supprimés - duplication nettoyée

  // Check for pending fee approval orders - STRICT BUYER_ID FILTER
  useEffect(() => {
    if (orders && orders.length > 0 && user?.id) {
      // Only show orders where the current user is the buyer
      const pendingApproval = orders.find(o => 
        o.status === 'pending_buyer_approval' && 
        !o.delivery_fee_approved_by_buyer &&
        o.buyer_id === user.id // Critical: filter by buyer_id
      );
      if (pendingApproval && pendingApproval.id !== pendingFeeOrder?.id) {
        setPendingFeeOrder(pendingApproval);
        setIsFeeDialogOpen(true);
      }
    }
  }, [orders, user?.id]);

  // ✅ Détection de connexion en ligne/hors ligne
  useEffect(() => {
    const handleOnline = () => {
      console.log('✅ [Marketplace] Connexion rétablie');
      setIsOnline(true);
      loadProducts(); // Reload automatique quand la connexion revient
    };
    
    const handleOffline = () => {
      console.warn('❌ [Marketplace] Connexion perdue');
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ✅ Fonction de chargement stabilisée avec useCallback
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 [Marketplace] Chargement des produits...');
      console.log('🌐 [Marketplace] Online:', navigator.onLine);
      console.log('👤 [Marketplace] User:', user?.id || 'anonymous');
      
      const startTime = performance.now();
      
      // ✅ Filtrer par ville sélectionnée
      let query = supabase
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
        .eq('status', 'active')
        .eq('moderation_status', 'approved')
        .order('popularity_score', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (selectedCity) { query = query.eq('vendor_profiles.city', selectedCity); }

      const { data, error } = await query;

      const endTime = performance.now();
      console.log(`⏱️ [Marketplace] Query took ${(endTime - startTime).toFixed(0)}ms`);

      if (error) {
        console.error('❌ [Marketplace] Supabase error:', error);
        throw error;
      }

      // ✅ Fallback: si 0 résultat dans la ville, relancer sans filtre ville
      let finalData = data;
      if ((!data || data.length === 0) && selectedCity) {
        console.log(`[Marketplace] 0 produits à ${selectedCity}, fallback toutes villes`);
        const { data: allData, error: allError } = await supabase
          .from('marketplace_products')
          .select(`
            *,
            vendor_profiles(
              shop_name,
              shop_logo_url,
              average_rating,
              total_sales,
              follower_count
            )
          `)
          .eq('status', 'active')
          .eq('moderation_status', 'approved')
          .order('popularity_score', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false });
        if (!allError) finalData = allData;
      }

      console.log(`✅ [Marketplace] ${finalData?.length || 0} produits chargés (ville: ${selectedCity})`);

      if (!finalData || finalData.length === 0) {
        console.warn('⚠️ [Marketplace] Aucun produit trouvé');
        setProducts([]);
        setLoading(false);
        return;
      }

      // Normalisation des images
      const normalizeProductImages = (images: any): string[] => {
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

      const transformedProducts = finalData.map(product => {
        const specsObj = product.specifications && typeof product.specifications === 'object' 
          ? product.specifications as Record<string, any>
          : {};
        
        const normalizedImages = normalizeProductImages(product.images);
        const fallbackImage = '/placeholder.svg';

        const cleanedImages = normalizedImages.filter(img =>
          img && img.startsWith('http') && !img.includes('placehold.co')
        );
        
        return {
          id: product.id,
          title: product.title,
          price: product.price,
          images: cleanedImages,
          image: cleanedImages[0] || fallbackImage,
          category: product.category,
          condition: product.condition || 'new',
          description: product.description || '',
          seller_id: product.seller_id,
          seller: { 
            display_name: (product.vendor_profiles as any)?.shop_name || 'Boutique Tembea'
          },
          sellerLogo: (product.vendor_profiles as any)?.shop_logo_url,
          sellerRating: (product.vendor_profiles as any)?.average_rating || 0,
          sellerTotalSales: (product.vendor_profiles as any)?.total_sales || 0,
          sellerFollowers: (product.vendor_profiles as any)?.follower_count || 0,
          location: product.location || 'Kinshasa',
          coordinates: product.coordinates && typeof product.coordinates === 'object' 
            ? product.coordinates as { lat: number; lng: number }
            : undefined,
          inStock: (product.stock_count || 0) > 0,
          stockCount: product.stock_count || 0,
          rating: product.rating_average || 0,
          reviews: product.rating_count || 0,
          brand: product.brand,
          specifications: specsObj,
          viewCount: product.view_count || 0,
          salesCount: product.sales_count || 0,
          popularityScore: product.popularity_score || 0,
          moderation_status: product.moderation_status || 'pending',
          created_at: product.created_at,
          video_url: product.video_url || undefined,
        };
      });

      // ✅ Produits déjà filtrés par ville, tri par popularité uniquement
      const sortedProducts = transformedProducts.sort((a, b) => {
        return (b.popularityScore || 0) - (a.popularityScore || 0);
      });

      setProducts(sortedProducts);
      console.log(`✅ [Marketplace] ${sortedProducts.length} produits (ville: ${selectedCity})`);
      if (sortedProducts.length > 0) {
        console.log('📦 [Marketplace] Premier produit transformé:', sortedProducts[0]);
      }
    } catch (error) {
      console.error('💥 [Marketplace] CRITICAL ERROR:', error);
      setProducts([]);
      
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les produits. Vérifiez votre connexion.",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast, selectedCity]);

  // ✅ Chargement initial avec gestion des erreurs et rechargement forcé
  useEffect(() => {
    console.log('🚀 [Marketplace] MONTAGE COMPOSANT');
    console.log('📊 [Marketplace] État initial:', {
      productsCount: products.length,
      loading,
      isOnline,
      userConnected: !!user
    });
    
    let mounted = true;
    
    const executeLoad = async () => {
      if (!mounted) return;
      
      console.log('📦 [Marketplace] Démarrage chargement initial...');
      
      try {
        await loadProducts();
        console.log('✅ [Marketplace] Chargement initial terminé');
      } catch (err) {
        console.error('💥 [Marketplace] Erreur chargement initial:', err);
        
        // Retry après 2s si échec
        if (mounted) {
          console.log('🔄 [Marketplace] Retry dans 2s...');
          setTimeout(() => {
            if (mounted) loadProducts();
          }, 2000);
        }
      }
    };
    
    executeLoad();
    
    // Force reload si toujours vide après 5s
    const forceTimer = setTimeout(() => {
      if (mounted && products.length === 0 && !loading) {
        console.warn('⚠️ [Marketplace] FORCE RELOAD - Toujours vide après 5s');
        loadProducts();
      }
    }, 5000);
    
    return () => {
      console.log('🧹 [Marketplace] DÉMONTAGE COMPOSANT');
      mounted = false;
      clearTimeout(forceTimer);
    };
  }, [loadProducts]);

  // ✅ Gérer la navigation vers l'onglet Messages via URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    
    if (tab === 'messages') {
      // Messages tab removed — ignore this param
      window.history.replaceState({}, '', '/marketplace');
    }
  }, []);

  // loadProducts moved above before useEffect

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Filter management functions
  const handleUpdateFilter = <K extends keyof typeof filters>(
    key: K, 
    value: typeof filters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      selectedCategory: 'all',
      priceRange: [0, 5000000],
      minRating: 0,
      conditions: [],
      maxDistance: 50,
      availability: 'all',
      sortBy: 'popularity',
      showOnlyFavorites: false,
    });
  };

  const handleApplyQuickFilter = (preset: string) => {
    switch (preset) {
      case 'nearby':
        handleUpdateFilter('maxDistance', 5);
        break;
      case 'cheap':
        handleUpdateFilter('priceRange', [0, 50000]);
        handleUpdateFilter('sortBy', 'price_low');
        break;
      case 'premium':
        handleUpdateFilter('minRating', 4.5);
        handleUpdateFilter('sortBy', 'rating');
        break;
      case 'new':
        handleUpdateFilter('conditions', ['new']);
        break;
      case 'deals':
        handleUpdateFilter('priceRange', [0, 100000]);
        break;
    }
  };

  // Calculate filter stats
  const hasActiveFilters = 
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < 5000000 ||
    filters.minRating > 0 ||
    filters.conditions.length > 0 ||
    filters.maxDistance < 50 ||
    filters.availability !== 'all' ||
    filters.showOnlyFavorites;

  const activeFiltersCount = [
    filters.priceRange[0] > 0 || filters.priceRange[1] < 5000000,
    filters.minRating > 0,
    filters.conditions.length > 0,
    filters.maxDistance < 50,
    filters.availability !== 'all',
    filters.showOnlyFavorites,
  ].filter(Boolean).length;

  const calculateAveragePrice = (prods: Product[]) => {
    if (prods.length === 0) return 0;
    return prods.reduce((sum, p) => sum + p.price, 0) / prods.length;
  };

  // Filter products
  console.log('🔍 [Marketplace] Début filtrage:', { productsCount: products.length, filters });
  
  const filteredProducts = products.filter(product => {
    // Category filter
    const categoryMatch = filters.selectedCategory === 'all' || product.category === filters.selectedCategory;
    if (!categoryMatch) return false;

    // Search filter (from filters state + legacy searchQuery)
    const query = filters.searchQuery || searchQuery;
    if (query && !product.title.toLowerCase().includes(query.toLowerCase())) {
      return false;
    }

    // Price filter
    if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
      return false;
    }

    // Rating filter
    if (filters.minRating > 0 && product.rating < filters.minRating) {
      return false;
    }

    // Condition filter
    if (filters.conditions.length > 0 && !filters.conditions.includes(product.condition)) {
      return false;
    }

    // Availability filter
    if (filters.availability === 'available' && !product.inStock) {
      return false;
    }
    if (filters.availability === 'unavailable' && product.inStock) {
      return false;
    }

    // Distance filter avec validation
    if (filters.maxDistance < 50 && coordinates) {
      try {
        if (product.coordinates && 
            typeof product.coordinates.lat === 'number' && 
            typeof product.coordinates.lng === 'number') {
          const distance = calculateDistance(
            coordinates.lat, coordinates.lng,
            product.coordinates.lat, product.coordinates.lng
          );
          if (distance > filters.maxDistance) {
            return false;
          }
        }
      } catch (error) {
        console.warn('[EnhancedMarketplace] Distance calculation error:', error);
        // Ne pas exclure le produit si erreur de calcul
      }
    }

    // Favorites filter
    if (filters.showOnlyFavorites && !isFavorite(product.id)) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    // Apply sorting
    switch (filters.sortBy) {
      case 'price_low':
        return a.price - b.price;
      case 'price_high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'distance':
        if (coordinates && a.coordinates && b.coordinates) {
          const distA = calculateDistance(coordinates.lat, coordinates.lng, a.coordinates.lat, a.coordinates.lng);
          const distB = calculateDistance(coordinates.lat, coordinates.lng, b.coordinates.lat, b.coordinates.lng);
          return distA - distB;
        }
        return 0;
      case 'newest':
        return b.id.localeCompare(a.id);
      case 'popularity':
      default:
        return (b.rating * b.reviews) - (a.rating * a.reviews);
    }
  });

  console.log('✅ [Marketplace] Produits filtrés:', filteredProducts.length);
  if (filteredProducts.length > 0) {
    console.log('📦 [Marketplace] Premier produit filtré:', filteredProducts[0]);
  }

  // Wrapper pour addToCart - feedback sur bouton uniquement (style Tembea Food)
  const addToCart = (product: Product, quantity: number = 1) => {
    console.log('🛒 [Marketplace] Ajout au panier:', product.title);
    addToCartGlobal(product);

    // Vibration douce
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }

    // Animation bounce sur le badge panier uniquement
    const cartIcon = document.querySelector('[data-cart-button]');
    if (cartIcon) {
      cartIcon.classList.add('animate-bounce');
      setTimeout(() => cartIcon.classList.remove('animate-bounce'), 400);
    }
    
    // PAS DE TOAST - le feedback est sur le bouton AnimatedAddToCartButton
  };

  // Connecter les fonctions au CartContext
  const updateCartQuantity = (productId: string, quantity: number) => {
    console.log('[EnhancedMarketplace] Updating quantity:', productId, quantity);
    updateQuantityGlobal(productId, quantity);
  };

  const removeFromCart = (productId: string) => {
    console.log('[EnhancedMarketplace] Removing item:', productId);
    removeFromCartGlobal(productId);
  };

  const handleCheckout = async () => {
    // Le panier est géré par CartContext maintenant
    // Il sera vidé automatiquement après checkout
    
    // Rafraîchir les commandes
    refetchOrders();
    
    // Toast de confirmation
    toast({
      title: "✅ Commande validée",
      description: "Vos commandes ont été créées avec succès",
    });
  };

  // ✅ Séparation produits supermarché vs boutiques classiques
  const supermarketVendorIds = new Set(
    topVendors.filter(v => v.shop_type === 'supermarket').map(v => v.user_id)
  );
  const groceryProducts = filteredProducts.filter(p => supermarketVendorIds.has(p.seller_id)).slice(0, 10);
  const shopProducts = filteredProducts.filter(p => !supermarketVendorIds.has(p.seller_id));

  const sortedShopProducts = [...shopProducts].sort((a, b) => {
    switch (shopSortBy) {
      case 'price_low': return a.price - b.price;
      case 'price_high': return b.price - a.price;
      case 'rating': return (b.rating || 0) - (a.rating || 0);
      case 'newest': return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      case 'popularity':
      default: return (b.popularityScore || 0) - (a.popularityScore || 0);
    }
  }).slice(0, 12);

  // ✅ Les top vendeurs sont maintenant chargés via useTopVendors avec les vraies données de la DB

  // Gestion des favoris avec persistance
  const handleToggleFavorite = async (productId: string) => {
    await toggleFavorite(productId);
  };

  const convertToHorizontalProduct = (product: Product): HorizontalProduct => ({
    id: product.id,
    name: product.title,
    price: product.price,
    image: product.image,
    rating: product.rating || 0,
    reviewCount: product.reviews || 0,
    category: product.category,
    seller: product.seller?.display_name || 'Vendeur',
    sellerId: product.seller_id,
    isAvailable: product.inStock,
    location: product.coordinates,
  });

  const calculatePopularityScore = (product: Product) => {
    const views = product.viewCount || 0;
    const sales = product.salesCount || 0;
    const rating = product.rating || 0;
    return (views * 0.3) + (sales * 0.5) + (rating * 20);
  };

  // Helper unifié pour ajouter au panier depuis n'importe quel format
  const handleAddToCartUnified = (item: Product | HorizontalProduct | any) => {
    // Si c'est déjà un Product (MarketplaceProduct)
    if ('title' in item && 'inStock' in item) {
      addToCart(item as Product);
      return;
    }
    
    // Si c'est un HorizontalProduct, retrouver l'original
    const originalProduct = filteredProducts.find(p => p.id === item.id);
    if (originalProduct) {
      addToCart(originalProduct);
      return;
    }
    
    // Fallback : construire un Product minimal
    addToCart({
      id: item.id,
      title: item.name || item.title,
      price: item.price,
      image: item.image,
      images: [item.image],
      category: item.category || 'general',
      condition: 'new',
      seller_id: item.sellerId || item.seller_id,
      seller: { display_name: item.seller || 'Vendeur' },
      location: 'Kinshasa',
      inStock: item.isAvailable ?? item.inStock ?? true,
      stockCount: 1,
      rating: item.rating || 0,
      reviews: item.reviewCount || 0,
      moderation_status: 'approved',
      description: ''
    } as Product);
  };

  const handlePromoClick = (action: string) => {
    switch (action) {
      case 'electronics':
        // Filtrer catégorie électronique
        setFilters(prev => ({ ...prev, selectedCategory: 'electronics' }));
        // Scroll vers les produits
        setTimeout(() => {
          document.querySelector('[data-section="all-products"]')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        toast({
          title: "🎉 Promo électronique activée",
          description: "Code TECH30 : -30% sur tous les produits électroniques",
        });
        break;
        
      case 'free_delivery':
        // Afficher un message expliquant la livraison gratuite
        toast({
          title: "🚀 Livraison gratuite",
          description: "Pour toute commande supérieure à 50 000 CDF, profitez de la livraison gratuite !",
          duration: 5000,
        });
        // Filtrer produits >50k
        setFilters(prev => ({ ...prev, priceRange: [50000, 2000000] }));
        setTimeout(() => {
          document.querySelector('[data-section="all-products"]')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        break;
        
      case 'new_vendors':
        // Trier par date de création (nouveaux produits)
        setFilters(prev => ({ ...prev, sortBy: 'newest' }));
        setTimeout(() => {
          document.querySelector('[data-section="all-products"]')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        toast({
          title: "💎 Nouveaux vendeurs",
          description: "Découvrez les derniers produits de nos nouveaux partenaires",
        });
        break;
        
      case 'become_vendor':
        // Rediriger vers l'espace vendeur
        onNavigate('/app/vendeur-request');
        break;
        
      default:
        console.log('Action non gérée:', action);
    }
  };

  const renderShopTab = () => {
    if (!selectedCity) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <MapPin className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Choisissez votre ville</h3>
          <p className="text-sm text-gray-500 mb-6">Disponible dans ces villes</p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            {['Kinshasa', 'Lubumbashi', 'Kolwezi'].map(c => (
              <button key={c} onClick={() => setSelectedCity(c)}
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] active:scale-[0.98] transition-all">
                <MapPin className="w-5 h-5 text-red-500" />
                <span className="font-semibold text-gray-900">{c}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }
    if (viewMode === 'all-products') {
      return (
        <AllMarketplaceProductsView
          onBack={() => setViewMode('home')}
          onAddToCart={(product) => addToCart(product, 1)}
          onViewDetails={(product) => navigate(`/marketplace/product/${product.id}`)}
          onVisitShop={(id) => navigate(`/marketplace/shop/${id}`)}
          cartItemsCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
          onCartClick={() => setIsCartOpen(true)}
          selectedCity={selectedCity}
        />
      );
    }

    if (viewMode === 'all-vendors') {
      return (
        <AllVendorsView
          onBack={() => setViewMode('home')}
          onSelectVendor={(id) => navigate(`/marketplace/shop/${id}`)}
          selectedCity={selectedCity}
        />
      );
    }

    const shopCategoryChips = [
      { id: 'phones', Icon: Smartphone, label: 'Phone' },
      { id: 'computers', Icon: Laptop, label: 'Tech' },
      { id: 'fashion', Icon: Shirt, label: 'Mode' },
      { id: 'home', Icon: HomeIcon, label: 'Maison' },
      { id: 'sports', Icon: Trophy, label: 'Sport' },
      { id: 'beauty', Icon: Sparkles, label: 'Beauté' },
      { id: 'other', Icon: Package, label: 'Autre' },
    ];

    return (
    <div className="space-y-3">

      {/* Category chips — bento grid 5 cellules */}
      <div className="grid grid-cols-5 gap-2 px-4 py-3" role="group" aria-label="Catégories">
        {shopCategoryChips.slice(0, 4).map((cat) => {
          const active = filters.selectedCategory === cat.id;
          const Icon = cat.Icon;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() =>
                setFilters(prev => ({
                  ...prev,
                  selectedCategory: active ? 'all' : cat.id,
                }))
              }
              className={cn(
                'bg-gray-100 dark:bg-muted rounded-2xl flex flex-col items-center justify-center h-16 gap-1 transition-all duration-200 active:scale-95',
                active && 'bg-red-600 dark:bg-red-600'
              )}
              style={{ touchAction: 'manipulation' }}
              aria-pressed={active}
              aria-label={`Filtrer par ${cat.label}`}
            >
              <Icon
                className={cn(
                  'w-5 h-5',
                  active ? 'text-white' : 'text-foreground'
                )}
                aria-hidden="true"
              />
              <span
                className={cn(
                  'text-[11px] font-medium truncate px-1',
                  active ? 'text-white' : 'text-foreground'
                )}
              >
                {cat.label}
              </span>
            </button>
          );
        })}

        {/* Voir tout */}
        <button
          type="button"
          onClick={() => setShowAllCategories(true)}
          className="bg-red-50 dark:bg-red-950/30 rounded-2xl flex flex-col items-center justify-center h-16 gap-1 transition-all duration-200 active:scale-95"
          style={{ touchAction: 'manipulation' }}
          aria-label="Voir toutes les catégories"
        >
          <LayoutGrid className="w-5 h-5 text-red-600 dark:text-red-400" aria-hidden="true" />
          <span className="text-[11px] font-medium truncate px-1 text-red-600 dark:text-red-400">
            Voir tout
          </span>
        </button>
      </div>

      {/* Dialog — toutes les catégories */}
      <Dialog open={showAllCategories} onOpenChange={setShowAllCategories}>
        <DialogContent className="max-w-[92vw] sm:max-w-md p-0 gap-0 overflow-hidden rounded-3xl border-0 bg-background shadow-2xl [&>button]:hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <DialogTitle className="text-lg font-bold">Catégories</DialogTitle>
            <button
              type="button"
              onClick={() => setShowAllCategories(false)}
              className="w-9 h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground active:scale-90 transition-all"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <DialogDescription className="sr-only">
            Sélectionnez une catégorie pour filtrer les produits.
          </DialogDescription>
          <div className="grid grid-cols-3 gap-3 px-5 pb-5">
            {shopCategoryChips.map((cat) => {
              const active = filters.selectedCategory === cat.id;
              const Icon = cat.Icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setFilters(prev => ({
                      ...prev,
                      selectedCategory: active ? 'all' : cat.id,
                    }));
                    setShowAllCategories(false);
                  }}
                  className={cn(
                    'bg-gray-100 dark:bg-muted rounded-2xl flex flex-col items-center justify-center h-20 gap-1.5 transition-all duration-200 active:scale-95',
                    active && 'bg-red-600 dark:bg-red-600'
                  )}
                  style={{ touchAction: 'manipulation' }}
                  aria-pressed={active}
                >
                  <Icon
                    className={cn('w-6 h-6', active ? 'text-white' : 'text-foreground')}
                    aria-hidden="true"
                  />
                  <span
                    className={cn(
                      'text-xs font-medium truncate px-1',
                      active ? 'text-white' : 'text-foreground'
                    )}
                  >
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* LOADING INDICATOR - Visible pendant le chargement */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16" role="status" aria-live="polite">
          <div
            className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full mb-4 motion-safe:animate-spin"
            aria-hidden="true"
          />
          <p className="text-muted-foreground font-medium">Chargement des produits...</p>
          <p className="text-xs text-muted-foreground mt-2">
            Si ça prend trop de temps, actualisez la page
          </p>
        </div>
      )}

      {/* EMPTY STATE - Aucun produit disponible */}
      {!loading && filteredProducts.length === 0 && (
        <motion.div 
          className="text-center py-16 px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="max-w-md mx-auto">
            <div className="mb-6 relative">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center">
                <ShoppingBag className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-3">Aucun produit disponible</h3>
            <p className="text-muted-foreground mb-6">
              La marketplace est en cours de préparation. 
              Revenez bientôt pour découvrir nos produits !
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => {
                  console.log('🔄 [Marketplace] Rechargement manuel déclenché');
                  handleResetFilters();
                  setLoading(true);
                  loadProducts();
                }}
                variant="default"
              >
                Actualiser
              </Button>
              <Button 
                onClick={() => {
                  console.log('🔄 [Marketplace] HARD RELOAD');
                  window.location.reload();
                }}
                variant="outline"
              >
                Recharger la page
              </Button>
              <Button 
                onClick={() => onNavigate('/vendeur/inscription')}
                variant="outline"
              >
                Devenir vendeur
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* DEBUG: Fallback si filtres trop restrictifs */}
      {!loading && products.length > 0 && filteredProducts.length === 0 && (
        <motion.div 
          className="text-center py-12 px-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg mx-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h3 className="text-xl font-bold mb-2">🔍 Aucun produit ne correspond aux filtres</h3>
          <p className="text-muted-foreground mb-4">
            {products.length} produits chargés, mais aucun ne correspond à vos critères.
          </p>
          <Button onClick={handleResetFilters} variant="default">
            Réinitialiser les filtres
          </Button>
        </motion.div>
      )}

      {/* SHOP — avatars circulaires en stories */}
      {!vendorsLoading && vendorsWithVideo.filter(v => v.shop_type !== 'supermarket').length > 0 && (
        <PopularVendorsCarousel
          vendors={vendorsWithVideo.filter(v => v.shop_type !== 'supermarket').slice(0, 8)}
          onVisit={(id) => navigate(`/marketplace/shop/${id}`)}
          onViewAll={() => setViewMode('all-vendors')}
          onStoryOpen={setActiveStory}
        />
      )}

      {/* 🛒 SUPERMARCHÉS - Section dédiée */}
      {!vendorsLoading && topVendors.filter(v => v.shop_type === 'supermarket').length > 0 && (
        <section className="px-4 py-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CartIcon className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-semibold">Supermarchés</h2>
              <span className="text-xs text-muted-foreground ml-1">· Vos courses livrées</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setViewMode('all-vendors')}
              className="text-emerald-600 hover:text-emerald-700 font-semibold text-xs h-7 px-2"
            >
              Voir tout
              <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </Button>
          </div>
          
          <div className="overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
            <motion.div className="flex gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              {topVendors.filter(v => v.shop_type === 'supermarket').slice(0, 6).map((vendor, idx) => (
                <div key={vendor.user_id} className="basis-[280px] flex-shrink-0">
                  <SupermarketCard
                    vendor={vendor}
                    onVisit={(id) => navigate(`/marketplace/shop/${id}`)}
                    index={idx}
                  />
                </div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* 🛒 COURSES DU JOUR - Produits de supermarchés */}
      {!loading && groceryProducts.length > 0 && (
        <section className="px-4 py-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CartIcon className="h-5 w-5 text-emerald-600" />
              Courses du jour
            </h2>
          </div>
          <div className="overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
            <div className="flex gap-3">
              {groceryProducts.slice(0, 10).map((product) => {
                const discount = calculateDiscount(product);
                const originalPrice = discount > 0 ? getOriginalPrice(product.price, discount) : undefined;
                return (
                  <div key={product.id} className="basis-[200px] flex-shrink-0">
                    <AiShopperProductCard
                      product={{
                        id: product.id,
                        title: product.title,
                        price: product.price,
                        originalPrice,
                        discount,
                        image: product.image,
                        seller: product.seller,
                        seller_id: product.seller_id,
                        inStock: product.inStock,
                        stockCount: product.stockCount,
                        rating: product.rating,
                        reviews: product.reviews,
                        created_at: product.created_at,
                        video_url: product.video_url
                      }}
                      cartQuantity={cartItems.find(item => item.id === product.id)?.quantity || 0}
                      onAddToCart={() => addToCart(product, 1)}
                      onQuickView={() => {
                        setSelectedProduct(product);
                        setIsProductDetailsOpen(true);
                      }}
                      onToggleFavorite={() => handleToggleFavorite(product.id)}
                      onVisitShop={(vendorId) => navigate(`/marketplace/shop/${vendorId}`)}
                      isFavorite={!favoritesLoading && isFavorite(product.id)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 🎯 POUR VOUS - Grille produits boutiques avec tri */}
      {!loading && sortedShopProducts.length > 0 && (
        <section className="px-4 py-3 space-y-4" data-section="all-products">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              Pour vous
            </h2>
            <select 
              value={shopSortBy} 
              onChange={(e) => setShopSortBy(e.target.value)}
              className="h-8 text-xs border rounded-md px-2 bg-background dark:bg-card dark:border-border text-foreground"
            >
              <option value="popularity">Popularité</option>
              <option value="price_low">Prix ↑</option>
              <option value="price_high">Prix ↓</option>
              <option value="rating">Notes</option>
              <option value="newest">Récents</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {sortedShopProducts.map(product => {
              if (!product.id || !product.title || !product.image || !product.seller?.display_name) return null;
              
              const discount = calculateDiscount(product);
              const originalPrice = discount > 0 ? getOriginalPrice(product.price, discount) : undefined;
              
              return (
                <AiShopperProductCard
                  key={product.id}
                  product={{
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    originalPrice,
                    discount,
                    image: product.image,
                    seller: product.seller,
                    seller_id: product.seller_id,
                    inStock: product.inStock,
                    stockCount: product.stockCount,
                    rating: product.rating,
                    reviews: product.reviews,
                    created_at: product.created_at,
                    video_url: product.video_url
                  }}
                  cartQuantity={cartItems.find(item => item.id === product.id)?.quantity || 0}
                  onAddToCart={() => addToCart(product, 1)}
                  onQuickView={() => {
                    setSelectedProduct(product);
                    setIsProductDetailsOpen(true);
                  }}
                  onToggleFavorite={() => handleToggleFavorite(product.id)}
                  onVisitShop={(vendorId) => navigate(`/marketplace/shop/${vendorId}`)}
                  isFavorite={isFavorite(product.id)}
                />
              );
            })}
          </div>

          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              onClick={() => setViewMode('all-products')}
              className="w-full max-w-xs"
            >
              Voir tous les produits
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </section>
      )}

      {/* Version */}
      <p className="text-center text-[10px] text-neutral-300 py-4">shop-v2.0-clean</p>
    </div>
    );
  };

  return (
    <div className="flex-1 bg-background">
      {/* Tembea Shop Header — masqué dans les sous-vues */}
      {viewMode === 'home' && (
        <KwendaShopHeader
          cartItemsCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
          onBack={() => onNavigate('/client')}
          onCartClick={() => setIsCartOpen(true)}
          selectedCity={selectedCity}
          onCityChange={setSelectedCity}
        />
      )}
      
      {/* ✅ Bandeau d'alerte hors ligne */}
      {!isOnline && (
        <div className="sticky top-0 z-50 bg-destructive text-destructive-foreground px-4 py-2 text-center text-sm font-medium">
          ⚠️ Vous êtes hors ligne. Vérifiez votre connexion internet.
        </div>
      )}
      
      {/* Data attribute pour animations de feedback */}
      <div data-cart-button style={{ display: 'none' }} />

      {/* Content */}
      <div className="px-0 pt-2 pb-24">

        {/* ── Tab Bar — segmented control ── */}
        <div
          className="bg-gray-100 dark:bg-muted rounded-2xl p-1 mx-4 mb-2 flex"
          role="tablist"
          aria-label="Sections de la boutique"
        >
          {([
            { id: 'shop', label: 'Boutique', Icon: ShoppingBag },
            { id: 'supermarket', label: 'Market', Icon: Store },
            { id: 'orders', label: 'Commandes', Icon: Package },
            { id: 'escrow', label: 'Escrow', Icon: ShieldCheck },
          ] as const).map(({ id, label, Icon }) => {
            const active = currentTab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setCurrentTab(id)}
                style={{ touchAction: 'manipulation' }}
                className={cn(
                  'flex-1 rounded-xl py-2.5 flex flex-col items-center gap-0.5 text-xs font-medium min-h-[48px] transition-all duration-200',
                  active
                    ? 'bg-white shadow-sm text-red-600 dark:bg-background'
                    : 'text-gray-500 dark:text-muted-foreground',
                )}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Tab Content ── */}
        {currentTab === 'shop' && (
          <div className="mt-0">
            {renderShopTab()}
          </div>
        )}
        {currentTab === 'supermarket' && (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Supermarché</h2>
            <p className="text-muted-foreground">Produits de supermarché à venir</p>
          </div>
        )}
        {currentTab === 'orders' && (
          <div className="mt-4">
            <AdvancedOrderTracker />
          </div>
        )}
        {currentTab === 'escrow' && (
          <div className="mt-4">
            <EscrowDashboard />
          </div>
        )}

      </div>

      {/* Vendor story overlay */}
      {activeStory && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 py-4" style={{ paddingTop: 'max(env(safe-area-inset-top, 16px), 16px)' }}>
            <div className="flex items-center gap-3 min-w-0">
              {activeStory.shop_logo_url && (
                <img
                  src={activeStory.shop_logo_url}
                  alt={activeStory.shop_name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-white/30"
                />
              )}
              <span className="text-white font-semibold text-sm truncate">{activeStory.shop_name}</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveStory(null)}
              aria-label="Fermer"
              className="w-11 h-11 rounded-full bg-white/10 active:bg-white/20 flex items-center justify-center"
              style={{ touchAction: 'manipulation' }}
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <video
              src={(activeStory as any).videoUrl || (activeStory as any).video_url}
              autoPlay
              loop
              playsInline
              className="max-w-full max-h-full"
            />
          </div>
          <div className="px-4 pb-6" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 24px), 24px)' }}>
            <button
              type="button"
              onClick={() => {
                const id = activeStory.user_id;
                setActiveStory(null);
                navigate(`/marketplace/shop/${id}`);
              }}
              className="w-full py-3.5 rounded-2xl bg-red-500 active:bg-red-600 text-white font-bold text-sm transition-colors"
              style={{ touchAction: 'manipulation' }}
            >
              Visiter la boutique
            </button>
          </div>
        </div>
      )}

      {/* Unified Shopping Cart (Sprint 1) */}
      <UnifiedShoppingCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        userCoordinates={coordinates}
      />

      {/* ProductQuickView supprimé - remplacé par ProductDetailSheet ci-dessous */}

      {/* Product Details Sheet - Style Tembea Food harmonisé */}
      {selectedProduct && (
        <ProductDetailSheet
          open={isProductDetailsOpen}
          onOpenChange={(open) => {
            if (!open) {
              setIsProductDetailsOpen(false);
              setSelectedProduct(null);
            }
          }}
          product={{
            id: selectedProduct.id,
            name: selectedProduct.title,
            price: selectedProduct.price,
            image: selectedProduct.image,
            images: selectedProduct.images,
            description: selectedProduct.description,
            rating: selectedProduct.rating,
            reviewCount: selectedProduct.reviews,
            seller: selectedProduct.seller.display_name,
            sellerId: selectedProduct.seller_id,
            isAvailable: selectedProduct.inStock,
            stockCount: selectedProduct.stockCount,
            condition: selectedProduct.condition,
            location: selectedProduct.location,
            videoUrl: selectedProduct.video_url,
          }}
          onAddToCart={(qty, notes) => {
            if (selectedProduct) {
              for (let i = 0; i < qty; i++) {
                addToCart(selectedProduct);
              }
            }
          }}
          onSellerClick={() => {
            setIsProductDetailsOpen(false);
            setSelectedProduct(null);
            setSelectedVendorId(selectedProduct.seller_id);
          }}
        />
      )}

      {/* Vendor Store View */}
      {selectedVendorId && (
        <VendorStoreView
          vendorId={selectedVendorId}
          onClose={() => setSelectedVendorId(null)}
          onAddToCart={(product) => {
            // Find the original product and add to cart
            const originalProduct = products.find(p => p.id === product.id);
            if (originalProduct) addToCart(originalProduct);
          }}
          onViewDetails={(product) => {
            const originalProduct = products.find(p => p.id === product.id);
            if (originalProduct) {
              setSelectedProduct(originalProduct);
              setIsProductDetailsOpen(true);
              setSelectedVendorId(null);
            }
          }}
          userLocation={coordinates}
        />
      )}

      {/* Delivery Fee Approval Dialog */}
      {pendingFeeOrder && (
        <DeliveryFeeApprovalDialog
          order={pendingFeeOrder}
          open={isFeeDialogOpen}
          onOpenChange={setIsFeeDialogOpen}
          onApproved={() => {
            setIsFeeDialogOpen(false);
            setPendingFeeOrder(null);
            refetchOrders();
            toast({ title: "✅ Paiement confirmé", description: "Votre commande sera bientôt livrée" });
          }}
          onOpenChat={async () => {
            try {
              const conversation = await createOrFindConversation(
                'marketplace',
                pendingFeeOrder.seller_id,
                pendingFeeOrder.product_id,
                `Chat - Commande #${pendingFeeOrder.id.slice(0, 8)}`
              );
              if (conversation) {
                setIsFeeDialogOpen(false);
                openChat({
                  contextType: 'marketplace',
                  contextId: pendingFeeOrder.product_id,
                  participantId: pendingFeeOrder.seller_id,
                  title: `Chat - Commande #${pendingFeeOrder.id.slice(0, 8)}`
                });
              }
            } catch (error: any) {
              toast({ title: "Erreur", description: error.message || "Impossible d'ouvrir le chat", variant: "destructive" });
            }
          }}
        />
      )}

      {/* Advanced Filters Panel */}
      <AdvancedFilters
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        filters={filters}
        onUpdateFilter={handleUpdateFilter}
        onResetFilters={handleResetFilters}
        onApplyQuickFilter={handleApplyQuickFilter}
        hasActiveFilters={hasActiveFilters}
        filterStats={{
          totalProducts: products.length,
          filteredCount: filteredProducts.length,
          averagePrice: calculateAveragePrice(filteredProducts),
        }}
      />

    </div>
  );
};

export default EnhancedMarketplaceInterface;
