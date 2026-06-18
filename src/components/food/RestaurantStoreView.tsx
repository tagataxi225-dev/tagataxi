import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Bell, Share2, ShoppingCart, MapPin, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FoodProductCard } from './FoodProductCard';
import { RestaurantPhotoGallery } from './RestaurantPhotoGallery';
import { RestaurantInfoSheet } from './RestaurantInfoSheet';
import { RestaurantMenuNav } from './RestaurantMenuNav';
import { RestaurantRatingDialog } from './RestaurantRatingDialog';
import { RestaurantReviewsSection } from './RestaurantReviewsSection';
import { RestaurantCheckoutBar } from './RestaurantCheckoutBar';
import { FoodBackToTop } from './FoodBackToTop';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurantFollow } from '@/hooks/useRestaurantFollow';
import { toast } from 'sonner';
import type { Restaurant, FoodProduct, FoodCartItem } from '@/types/food';
import { formatCurrency, getCurrencyByCity } from '@/utils/formatCurrency';

interface RestaurantStoreViewProps {
  restaurant: Restaurant;
  cart: FoodCartItem[];
  onAddToCart: (product: FoodProduct, quantity?: number, notes?: string) => void;
  onUpdateCartItem: (productId: string, quantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onProceedToCheckout: () => void;
  onBack: () => void;
}

export const RestaurantStoreView: React.FC<RestaurantStoreViewProps> = ({
  restaurant,
  cart,
  onAddToCart,
  onUpdateCartItem,
  onRemoveFromCart,
  onProceedToCheckout,
  onBack,
}) => {
  const { user } = useAuth();
  const { isFollowing, followersCount, loading: followLoading, toggleFollow } = useRestaurantFollow(restaurant.id);
  
  const [products, setProducts] = useState<FoodProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [canRateRestaurant, setCanRateRestaurant] = useState(false);
  const [hasRatedRestaurant, setHasRatedRestaurant] = useState(false);
  
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    averageRating: 0,
    ratingCount: 0,
  });

  useEffect(() => {
    loadRestaurantData();
    if (user) {
      checkRatingEligibility();
    }
  }, [restaurant.id, user]);

  const loadRestaurantData = async () => {
    try {
      setLoading(true);

      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('food_products')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('moderation_status', 'approved')
        .eq('is_available', true)
        .order('category', { ascending: true });

      if (productsError) throw productsError;
      setProducts(productsData || []);

      // Load stats
      const { count: productCount } = await supabase
        .from('food_products')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurant.id)
        .eq('moderation_status', 'approved');

      const { count: orderCount } = await supabase
        .from('food_orders')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurant.id)
        .eq('status', 'delivered');

      const { data: ratingsData } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('rated_user_id', restaurant.user_id || restaurant.id)
        .eq('rating_context', 'restaurant');

      const totalRatings = ratingsData?.length || 0;
      const avgRating = totalRatings > 0
        ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / totalRatings
        : 0;

      setStats({
        totalProducts: productCount || 0,
        totalOrders: orderCount || 0,
        averageRating: avgRating,
        ratingCount: totalRatings,
      });
    } catch (error) {
      console.error('Error loading restaurant data:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const checkRatingEligibility = async () => {
    if (!user) return;

    try {
      setCanRateRestaurant(true);

      const { data: existingRating } = await supabase
        .from('user_ratings')
        .select('id')
        .eq('rated_user_id', restaurant.user_id || restaurant.id)
        .eq('rater_user_id', user.id)
        .eq('rating_context', 'restaurant')
        .maybeSingle();

      setHasRatedRestaurant(!!existingRating);
    } catch (error) {
      console.error('Error checking rating eligibility:', error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: restaurant.restaurant_name,
        text: `Découvrez ${restaurant.restaurant_name} sur TAGA Food`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Lien copié !');
    }
  };

  const scrollToReviews = () => {
    document.getElementById('restaurant-reviews-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesCategory = !activeCategory || p.category === activeCategory;
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Get product images for gallery
  const productImages = products
    .filter(p => p.main_image_url)
    .map(p => p.main_image_url as string)
    .slice(0, 10);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="flex-1 bg-background pb-32">
      {/* Photo Gallery */}
      <RestaurantPhotoGallery
        bannerUrl={restaurant.banner_url}
        logoUrl={restaurant.logo_url}
        productImages={productImages}
        restaurantName={restaurant.restaurant_name}
      />

      {/* Restaurant Header */}
      <div className="relative px-4 pt-4">
        {/* Logo */}
        <motion.div
          className="absolute -top-10 left-4 z-20"
          initial={{ scale: 0, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className="w-20 h-20 rounded-2xl border-4 border-white bg-white overflow-hidden shadow-xl">
            {restaurant.logo_url ? (
              <img 
                src={`${restaurant.logo_url}?t=${restaurant.updated_at || Date.now()}`} 
                alt={restaurant.restaurant_name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-orange-500/20 flex items-center justify-center text-3xl font-bold text-primary">
                {restaurant.restaurant_name[0]}
              </div>
            )}
          </div>
        </motion.div>

        {/* Restaurant Info */}
        <div className="pt-12 text-left">
          <h1 className="text-2xl font-bold text-gray-900">{restaurant.restaurant_name}</h1>
          
          {/* Rating & Location */}
          <div className="flex items-center gap-3 flex-wrap mt-2 text-sm">
            <button 
              onClick={scrollToReviews}
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              {stats.ratingCount >= 5 ? (
                <>
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  <span className="font-semibold">{stats.averageRating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({stats.ratingCount} avis)</span>
                </>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-xs font-semibold">Nouveau</span>
              )}
            </button>
            
            {restaurant.city && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {restaurant.city}
                </span>
              </>
            )}
            
            {restaurant.average_preparation_time && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {restaurant.average_preparation_time} min
                </span>
              </>
            )}
          </div>

          {/* Actions: Rate / Follow / Share */}
          <div className="flex items-center gap-2 mt-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    style={{ touchAction: 'manipulation' }}
                    onClick={() => {
                      if (!user) {
                        toast.error('Connectez-vous pour noter');
                      } else {
                        setRatingDialogOpen(true);
                      }
                    }}
                  >
                    <Star className={`w-4 h-4 ${hasRatedRestaurant ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {!user ? 'Connectez-vous' : hasRatedRestaurant ? 'Modifier mon avis' : 'Donner mon avis'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              type="button"
              variant="outline"
              size="sm"
              style={{ touchAction: 'manipulation' }}
              onClick={toggleFollow}
              disabled={followLoading || !user}
            >
              <Bell className={`w-4 h-4 ${isFollowing ? 'fill-primary text-primary' : ''}`} />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              style={{ touchAction: 'manipulation' }}
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Cuisine Types */}
          {restaurant.cuisine_types && restaurant.cuisine_types.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
              {restaurant.cuisine_types.map((type) => (
                <Badge key={type} variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  {type}
                </Badge>
              ))}
            </div>
          )}

          {/* Info Sheet Button */}
          <div className="mt-4">
            <RestaurantInfoSheet restaurant={restaurant} />
          </div>
        </div>
      </div>

      {/* Cart Summary - Soft Modern */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-4 mt-6"
          >
            <Card className="p-3 bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm">{totalItems} article{totalItems > 1 ? 's' : ''}</div>
                    <div className="text-xs text-muted-foreground">dans votre panier</div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-foreground">{formatCurrency(totalAmount, getCurrencyByCity(restaurant.city || ''))}</div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu Navigation */}
      <div className="mt-6">
        <RestaurantMenuNav
          products={products}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Products Grid */}
      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-sm text-muted-foreground">Chargement du menu...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="text-6xl">🍽️</div>
            <div>
              <p className="text-muted-foreground text-lg font-semibold">
                {searchQuery ? 'Aucun plat trouvé' : 'Menu temporairement indisponible'}
              </p>
              {!searchQuery && (
                <p className="text-sm text-muted-foreground mt-2">
                  Ce restaurant n'a pas encore ajouté de plats
                </p>
              )}
            </div>
            {!searchQuery && (
              <Button onClick={loadRestaurantData} variant="outline" size="lg">
                <RefreshCw className="w-4 h-4 mr-2" />
                Recharger le menu
              </Button>
            )}
          </div>
        ) : (
          <AnimatePresence>
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <FoodProductCard
                  product={product}
                  cartQuantity={cart.find(item => item.id === product.id)?.quantity || 0}
                  onAddToCart={onAddToCart}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Reviews Section */}
      <div className="mt-8">
        <RestaurantReviewsSection
          restaurantId={restaurant.user_id || restaurant.id}
          averageRating={stats.averageRating}
          totalRatings={stats.ratingCount}
        />
      </div>

      {/* Rating Dialog */}
      <RestaurantRatingDialog
        open={ratingDialogOpen}
        onOpenChange={setRatingDialogOpen}
        restaurantId={restaurant.user_id || restaurant.id}
        restaurantName={restaurant.restaurant_name}
        restaurantLogo={restaurant.logo_url}
        onSuccess={() => {
          loadRestaurantData();
          checkRatingEligibility();
        }}
      />

      {/* Checkout Bar */}
      <div id="checkout-section">
        <RestaurantCheckoutBar
          cart={cart}
          restaurantName={restaurant.restaurant_name}
          onUpdateCart={onUpdateCartItem}
          onCheckout={onProceedToCheckout}
          currency={getCurrencyByCity(restaurant.city || '')}
        />
      </div>

      {/* Back to Top */}
      <FoodBackToTop />
    </div>
  );
};
