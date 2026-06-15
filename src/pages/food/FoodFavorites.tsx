import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Heart, Star, Clock, Plus, Store, UtensilsCrossed } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFavorites } from '@/context/FavoritesContext';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { FoodFooterNav } from '@/components/food/FoodFooterNav';
import { FoodBackToTop } from '@/components/food/FoodBackToTop';
import { formatCurrency } from '@/lib/utils';

export default function FoodFavorites() {
  const navigate = useNavigate();
  const { favoriteItems, removeFromFavorites, loading } = useFavorites();
  const [activeTab, setActiveTab] = useState<'restaurants' | 'dishes'>('restaurants');

  const restaurantFavorites = favoriteItems.filter(item => 
    !item.category || item.category === 'restaurant'
  );
  
  const dishFavorites = favoriteItems.filter(item => 
    item.category && item.category !== 'restaurant'
  );

  const handleRemoveFavorite = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    removeFromFavorites(id);
    toast.success(`${name} retiré des favoris`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="sticky top-0 z-10 bg-background/98 backdrop-blur-md border-b border-border/40">
          <div className="container max-w-2xl mx-auto px-4 py-4">
            <Skeleton className="h-8 w-48" />
          </div>
        </div>
        <div className="container max-w-2xl mx-auto px-4 py-6 space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const renderEmptyState = (icon: string, title: string, description: string) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-12 text-center"
    >
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6">{description}</p>
      <Button onClick={() => navigate('/food')} variant="outline" className="gap-2 rounded-full">
        Découvrir des restaurants
      </Button>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/98 backdrop-blur-xl border-b border-border/40 shadow-sm">
        <div className="container max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/food')}
              className="rounded-full h-9 w-9"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold text-foreground">Mes Favoris</h1>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="w-full grid grid-cols-2 h-10 bg-muted/50 rounded-xl p-1">
              <TabsTrigger value="restaurants" className="gap-2 rounded-lg text-xs font-medium data-[state=active]:shadow-sm">
                <Store className="w-3.5 h-3.5" />
                Restaurants
                {restaurantFavorites.length > 0 && (
                  <span className="ml-1 bg-primary/15 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {restaurantFavorites.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="dishes" className="gap-2 rounded-lg text-xs font-medium data-[state=active]:shadow-sm">
                <UtensilsCrossed className="w-3.5 h-3.5" />
                Plats
                {dishFavorites.length > 0 && (
                  <span className="ml-1 bg-primary/15 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {dishFavorites.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-2xl mx-auto px-4 py-4">
        <Tabs value={activeTab}>
          {/* Restaurants Tab */}
          <TabsContent value="restaurants" className="space-y-3 mt-0">
            {restaurantFavorites.length === 0 ? (
              renderEmptyState(
                '🍽️',
                'Aucun restaurant favori',
                'Ajoutez des restaurants à vos favoris pour les retrouver facilement'
              )
            ) : (
              <AnimatePresence>
                {restaurantFavorites.map((restaurant, index) => (
                  <motion.div
                    key={restaurant.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.25, delay: index * 0.05 }}
                  >
                    <div 
                      className="flex gap-3.5 p-3 bg-card rounded-2xl border border-border/40 shadow-sm hover:shadow-md transition-all cursor-pointer"
                      onClick={() => navigate(`/food?restaurant=${restaurant.id}`)}
                    >
                      {/* Image */}
                      <div className="relative w-28 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                        <img
                          src={restaurant.image || '/placeholder-food.jpg'}
                          alt={restaurant.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-foreground text-[15px] leading-tight line-clamp-1">
                              {restaurant.name}
                            </h3>
                            <motion.button
                              whileTap={{ scale: 0.75 }}
                              onClick={(e) => handleRemoveFavorite(e, restaurant.id, restaurant.name)}
                              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-destructive/10 transition-colors"
                            >
                              <Heart className="w-4 h-4 fill-destructive text-destructive" />
                            </motion.button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {restaurant.seller || restaurant.name}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {restaurant.rating > 0 && (
                            <span className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span className="font-medium text-foreground">{restaurant.rating.toFixed(1)}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            25-35 min
                          </span>
                          {restaurant.category && restaurant.category !== 'restaurant' && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                              {restaurant.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </TabsContent>

          {/* Dishes Tab */}
          <TabsContent value="dishes" className="space-y-3 mt-0">
            {dishFavorites.length === 0 ? (
              renderEmptyState(
                '🍜',
                'Aucun plat favori',
                'Marquez vos plats préférés pour les commander rapidement'
              )
            ) : (
              <AnimatePresence>
                {dishFavorites.map((dish, index) => (
                  <motion.div
                    key={dish.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.25, delay: index * 0.05 }}
                  >
                    <div className="flex gap-3.5 p-3 bg-card rounded-2xl border border-border/40 shadow-sm hover:shadow-md transition-all">
                      {/* Image */}
                      <div className="relative w-28 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                        <img
                          src={dish.image || '/placeholder-food.jpg'}
                          alt={dish.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-foreground text-[15px] leading-tight line-clamp-1">
                              {dish.name}
                            </h3>
                            <motion.button
                              whileTap={{ scale: 0.75 }}
                              onClick={(e) => handleRemoveFavorite(e, dish.id, dish.name)}
                              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-destructive/10 transition-colors"
                            >
                              <Heart className="w-4 h-4 fill-destructive text-destructive" />
                            </motion.button>
                          </div>

                          {/* Restaurant name (dynamic) */}
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Store className="w-3 h-3" />
                            <span className="line-clamp-1">{dish.seller || 'Restaurant'}</span>
                          </p>

                          {/* Category badge */}
                          {dish.category && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal mt-1.5">
                              {dish.category}
                            </Badge>
                          )}
                        </div>

                        {/* Price + Add */}
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-baseline gap-1.5">
                            {dish.originalPrice && dish.originalPrice > dish.price && (
                              <span className="text-xs text-muted-foreground line-through">
                                {formatCurrency(dish.originalPrice, 'CDF')}
                              </span>
                            )}
                            <span className="text-sm font-bold text-foreground">
                              {formatCurrency(dish.price, 'CDF')}
                            </span>
                          </div>
                          <Button 
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.success(`${dish.name} ajouté au panier`);
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <FoodBackToTop />
      <FoodFooterNav />
    </div>
  );
}
