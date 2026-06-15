import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Grid, List, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OptimizedProductCard } from './OptimizedProductCard';
import { MarketplaceProduct } from '@/types/marketplace';

type Product = MarketplaceProduct;

interface ModernProductGridProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  cartItems?: any[];
  userLocation?: { lat: number; lng: number };
  loading?: boolean;
  emptyMessage?: string;
}

export const ModernProductGrid = ({
  products,
  onProductClick,
  onQuickView,
  onAddToCart,
  cartItems = [],
  userLocation,
  loading = false,
  emptyMessage = 'Aucun produit trouvé'
}: ModernProductGridProps) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [displayCount, setDisplayCount] = useState(20);

  // Charger la préférence depuis localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('marketplace-view-mode') as 'grid' | 'list' | null;
    if (savedMode) setViewMode(savedMode);
  }, []);

  // Sauvegarder la préférence
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('marketplace-view-mode', mode);
  };

  // Obtenir la quantité dans le panier pour un produit
  const getCartQuantity = (productId: string) => {
    const item = cartItems.find(i => i.id === productId || i.product_id === productId);
    return item?.quantity || 0;
  };

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 500 &&
        displayCount < products.length &&
        !loading
      ) {
        setDisplayCount(prev => Math.min(prev + 20, products.length));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [displayCount, products.length, loading]);

  // Reset display count when products change
  useEffect(() => {
    setDisplayCount(20);
  }, [products]);

  const displayedProducts = products.slice(0, displayCount);

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Chargement des produits...</p>
        </div>
      </div>
    );
  }

  if (products.length === 0 && !loading) {
    return (
      <div className="text-center py-20">
        <p className="text-lg text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toggle vue grille/liste */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {products.length} produit{products.length > 1 ? 's' : ''}
          {displayCount < products.length && ` (${displayCount} affichés)`}
        </p>
        <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
          <Button
            size="sm"
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            onClick={() => handleViewModeChange('grid')}
            className="h-8 px-3"
          >
            <Grid className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">Grille</span>
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            onClick={() => handleViewModeChange('list')}
            className="h-8 px-3"
          >
            <List className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">Liste</span>
          </Button>
        </div>
      </div>

      {/* Grid/List des produits */}
      <AnimatePresence mode="popLayout">
        <motion.div
          layout
          className={cn(
            'transition-all duration-300',
            viewMode === 'grid'
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4'
              : 'flex flex-col gap-3'
          )}
        >
          {displayedProducts.map((product, index) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: index * 0.02 }}
            >
              <OptimizedProductCard
                product={product}
                variant={viewMode}
                onQuickView={onQuickView}
                onViewDetails={onProductClick}
                onBuyNow={onAddToCart}
                cartQuantity={getCartQuantity(product.id)}
                showSeller={true}
                showDistance={viewMode === 'list'}
                userLocation={userLocation}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Loader infinite scroll */}
      {displayCount < products.length && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-8"
        >
          <div className="text-center space-y-2">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Chargement...</p>
          </div>
        </motion.div>
      )}

      {/* Fin du catalogue */}
      {displayCount >= products.length && products.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <p className="text-sm text-muted-foreground">
            ✓ Tous les produits affichés ({products.length})
          </p>
        </motion.div>
      )}
    </div>
  );
};
