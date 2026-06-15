import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, SlidersHorizontal, X, ChevronUp, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FilterDrawer } from '@/components/ui/FilterDrawer';
import { FilterBadge } from '@/components/ui/FilterBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { PaginationControls } from '@/components/common/PaginationControls';
import { AiShopperProductCard } from './AiShopperProductCard';
import { useAllMarketplaceProducts } from '@/hooks/useAllMarketplaceProducts';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import type { MarketplaceProduct } from '@/types/marketplace';

const SHOP_TYPES = [
  { value: 'all', label: 'Tous' },
  { value: 'boutique', label: 'Boutiques' },
  { value: 'supermarket', label: 'Supermarchés' }
];

interface AllMarketplaceProductsViewProps {
  onBack: () => void;
  onAddToCart: (product: MarketplaceProduct) => void;
  onViewDetails: (product: MarketplaceProduct) => void;
  onVisitShop: (vendorId: string) => void;
  cartItemsCount?: number;
  onCartClick?: () => void;
  selectedCity?: string;
}

const CATEGORIES = [
  { value: 'electronics', label: 'Électronique' },
  { value: 'fashion', label: 'Mode & Vêtements' },
  { value: 'home', label: 'Maison & Jardin' },
  { value: 'beauty', label: 'Beauté & Santé' },
  { value: 'sports', label: 'Sports & Loisirs' },
  { value: 'books', label: 'Livres & Médias' },
  { value: 'toys', label: 'Jouets & Enfants' },
  { value: 'other', label: 'Autres' }
];

const CONDITIONS = [
  { value: 'new', label: 'Neuf' },
  { value: 'like_new', label: 'Comme neuf' },
  { value: 'used', label: 'Occasion' },
  { value: 'refurbished', label: 'Reconditionné' }
];

export const AllMarketplaceProductsView: React.FC<AllMarketplaceProductsViewProps> = ({
  onBack,
  onAddToCart,
  onViewDetails,
  onVisitShop,
  cartItemsCount = 0,
  onCartClick,
  selectedCity
}) => {
  const { formatCurrency } = useLanguage();
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<MarketplaceProduct | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Scroll-to-top: écoute le conteneur scrollable parent (.content-scrollable)
  useEffect(() => {
    const container = document.querySelector('.content-scrollable');
    if (!container) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setShowScrollTop(container.scrollTop > 200);
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    const container = document.querySelector('.content-scrollable');
    if (!container) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    container.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
  }, []);

  const {
    products,
    totalCount,
    totalPages,
    currentPage,
    isLoading,
    filters,
    sort,
    updateFilters,
    resetFilters,
    updateSort,
    setCurrentPage
  } = useAllMarketplaceProducts(selectedCity);

  // Synchroniser recherche
  React.useEffect(() => {
    updateFilters({ search: debouncedSearch });
  }, [debouncedSearch]);

  const handleToggleFavorite = (productId: string) => {
    setFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    updateFilters({ categories: newCategories });
  };

  const handleConditionToggle = (condition: string) => {
    const newConditions = filters.conditions.includes(condition)
      ? filters.conditions.filter(c => c !== condition)
      : [...filters.conditions, condition];
    updateFilters({ conditions: newConditions });
  };

  const activeFiltersCount = [
    filters.categories.length > 0,
    filters.priceRange[0] > 0 || filters.priceRange[1] < 2000000,
    filters.conditions.length > 0,
    filters.minRating > 0,
    filters.availableOnly
  ].filter(Boolean).length;

  const getActiveFilterBadges = () => {
    const badges: Array<{ label: string; onRemove: () => void }> = [];
    
    filters.categories.forEach(cat => {
      const category = CATEGORIES.find(c => c.value === cat);
      if (category) {
        badges.push({
          label: category.label,
          onRemove: () => handleCategoryToggle(cat)
        });
      }
    });

    filters.conditions.forEach(cond => {
      const condition = CONDITIONS.find(c => c.value === cond);
      if (condition) {
        badges.push({
          label: condition.label,
          onRemove: () => handleConditionToggle(cond)
        });
      }
    });

    if (filters.minRating > 0) {
      badges.push({
        label: `⭐ ${filters.minRating}+`,
        onRemove: () => updateFilters({ minRating: 0 })
      });
    }

    if (filters.availableOnly) {
      badges.push({
        label: 'Disponible uniquement',
        onRemove: () => updateFilters({ availableOnly: false })
      });
    }

    return badges;
  };

  return (
    <div className="flex-1 bg-background">
      {/* Header Sticky — compact & premium */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/40">
        <div className="px-4 pt-3 pb-2.5 space-y-2.5">
          {/* Ligne 1: Retour + Titre + Compteur + Panier */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 -ml-1" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="flex-1 text-base font-semibold leading-tight truncate">
              Tous les produits
            </h1>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{totalCount} résultats</span>
            {onCartClick && (
              <button className="relative h-8 w-8 flex items-center justify-center rounded-full bg-muted/40 transition-colors hover:bg-muted" onClick={onCartClick}>
                <ShoppingCart className="h-4 w-4" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center px-0.5">
                    {cartItemsCount > 99 ? '99+' : cartItemsCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Ligne 2: Chips pill style */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {SHOP_TYPES.map(type => (
              <button
                key={type.value}
                className={cn(
                  "rounded-full px-3.5 py-1 text-xs font-semibold transition-all whitespace-nowrap",
                  filters.shopType === type.value
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                )}
                onClick={() => updateFilters({ shopType: type.value })}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Ligne 3: Recherche + Filtres intégrés */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-8 pr-8 h-8 text-xs rounded-lg bg-muted/50 border-0 focus:bg-muted/60 focus-visible:ring-1"
              />
              {searchInput && (
                <button
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchInput('')}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <FilterDrawer
              activeFiltersCount={activeFiltersCount}
              onReset={resetFilters}
              open={isFilterOpen}
              onOpenChange={setIsFilterOpen}
            >
              {/* Catégories */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Catégories</Label>
                <div className="space-y-2">
                  {CATEGORIES.map(category => (
                    <div key={category.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={category.value}
                        checked={filters.categories.includes(category.value)}
                        onCheckedChange={() => handleCategoryToggle(category.value)}
                      />
                      <Label htmlFor={category.value} className="text-sm cursor-pointer">
                        {category.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prix */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Prix</Label>
                <div className="space-y-2">
                  <Slider
                    min={0}
                    max={2000000}
                    step={10000}
                    value={filters.priceRange}
                    onValueChange={(value) => updateFilters({ priceRange: value as [number, number] })}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(filters.priceRange[0])}</span>
                    <span>{formatCurrency(filters.priceRange[1])}</span>
                  </div>
                </div>
              </div>

              {/* Condition */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">État</Label>
                <div className="space-y-2">
                  {CONDITIONS.map(condition => (
                    <div key={condition.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={condition.value}
                        checked={filters.conditions.includes(condition.value)}
                        onCheckedChange={() => handleConditionToggle(condition.value)}
                      />
                      <Label htmlFor={condition.value} className="text-sm cursor-pointer">
                        {condition.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Note minimum */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Note minimum</Label>
                <Select 
                  value={filters.minRating.toString()} 
                  onValueChange={(value) => updateFilters({ minRating: parseFloat(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Toutes les notes</SelectItem>
                    <SelectItem value="3">⭐ 3+</SelectItem>
                    <SelectItem value="4">⭐ 4+</SelectItem>
                    <SelectItem value="4.5">⭐ 4.5+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Disponibilité */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="available"
                  checked={filters.availableOnly}
                  onCheckedChange={(checked) => updateFilters({ availableOnly: checked as boolean })}
                />
                <Label htmlFor="available" className="text-sm cursor-pointer">
                  Disponible uniquement
                </Label>
              </div>
            </FilterDrawer>
          </div>
        </div>
      </div>

      {/* Barre résultats + tri — séparateur visuel clair */}
      <div className="px-4 pt-3 pb-2 space-y-2 border-b border-border/10">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {products.length} résultat{products.length > 1 ? 's' : ''}
          </span>
          <Select 
            value={`${sort.field}-${sort.direction}`}
            onValueChange={(value) => {
              const [field, direction] = value.split('-');
              updateSort({ field, direction: direction as 'asc' | 'desc' });
            }}
          >
            <SelectTrigger className="w-[150px] h-8 text-xs rounded-lg bg-card border-border/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border shadow-lg z-50">
              <SelectItem value="popularity_score-desc">Popularité</SelectItem>
              <SelectItem value="price-asc">Prix croissant</SelectItem>
              <SelectItem value="price-desc">Prix décroissant</SelectItem>
              <SelectItem value="rating_average-desc">Meilleures notes</SelectItem>
              <SelectItem value="created_at-desc">Plus récents</SelectItem>
              <SelectItem value="title-asc">A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters Badges */}
        {activeFiltersCount > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            <AnimatePresence>
              {getActiveFilterBadges().map((badge, index) => (
                <FilterBadge
                  key={`${badge.label}-${index}`}
                  label={badge.label}
                  onRemove={badge.onRemove}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Grille de produits */}
      <div className="px-3.5 pb-6 pt-3">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Aucun produit trouvé</p>
            <Button onClick={resetFilters} variant="outline" className="mt-4">
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3.5 mb-6">
              {products.map(product => (
                <AiShopperProductCard
                  key={product.id}
                  product={{
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    image: product.image,
                    seller: product.seller || { display_name: 'Vendeur' },
                    seller_id: product.seller_id,
                    inStock: product.inStock,
                    stockCount: product.stockCount,
                    video_url: product.video_url
                  }}
                  onAddToCart={() => onAddToCart(product)}
                  onQuickView={() => onViewDetails(product)}
                  onToggleFavorite={() => handleToggleFavorite(product.id)}
                  onVisitShop={onVisitShop}
                  isFavorite={favorites.includes(product.id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                hasNextPage={currentPage < totalPages}
                hasPreviousPage={currentPage > 1}
                onPageChange={setCurrentPage}
                onNextPage={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                onPreviousPage={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                itemName="produits"
              />
            )}
          </>
        )}
      </div>
      {/* Scroll to Top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToTop}
            className="fixed bottom-20 right-4 z-40 h-10 w-10 rounded-full flex items-center justify-center
              bg-background border border-border shadow-md
              hover:bg-muted active:scale-95 transition-colors"
            aria-label="Retour en haut"
          >
            <ChevronUp className="h-5 w-5 text-primary" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
