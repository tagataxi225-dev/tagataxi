import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, X, UtensilsCrossed, Wine, CakeSlice, Coffee, Salad, Soup, Pizza, Drumstick } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { FoodProduct } from '@/types/food';

interface RestaurantMenuNavProps {
  products: FoodProduct[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

// Map category names to Lucide icons
const getCategoryIcon = (category: string) => {
  const lower = category.toLowerCase();
  if (lower.includes('boisson') || lower.includes('drink')) return Wine;
  if (lower.includes('dessert') || lower.includes('sucré') || lower.includes('gâteau')) return CakeSlice;
  if (lower.includes('café') || lower.includes('coffee')) return Coffee;
  if (lower.includes('salade') || lower.includes('légume')) return Salad;
  if (lower.includes('soupe') || lower.includes('soup')) return Soup;
  if (lower.includes('pizza')) return Pizza;
  if (lower.includes('poulet') || lower.includes('grillade') || lower.includes('viande')) return Drumstick;
  return UtensilsCrossed;
};

export const RestaurantMenuNav: React.FC<RestaurantMenuNavProps> = ({
  products,
  activeCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get unique categories with counts
  const categories = products.reduce((acc, product) => {
    const category = product.category || 'Autres';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryList = Object.entries(categories).sort((a, b) => b[1] - a[1]);

  // Handle sticky behavior
  useEffect(() => {
    const handleScroll = () => {
      if (navRef.current) {
        const rect = navRef.current.getBoundingClientRect();
        setIsSticky(rect.top <= 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  return (
    <div
      ref={navRef}
      className={`sticky top-0 z-30 bg-background/95 backdrop-blur-xl transition-all border-b border-border/40 ${
        isSticky ? 'shadow-sm' : ''
      }`}
    >
      <div className="px-4 py-3">
        {/* Search Bar (Expanded) */}
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 mb-3"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Rechercher un plat..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 pr-9 bg-muted/40 border-border/40 rounded-xl"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsSearchOpen(false);
                onSearchChange('');
              }}
              className="text-muted-foreground"
            >
              Annuler
            </Button>
          </motion.div>
        )}

        {/* Category Tabs & Search Toggle */}
        <div className="flex items-center gap-2">
          <ScrollArea className="flex-1">
            <div className="flex gap-2 pb-1">
              {/* All Category */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onCategoryChange('')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap transition-all text-sm font-medium ${
                  activeCategory === ''
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted border border-border/40'
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>Tout</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeCategory === '' 
                    ? 'bg-primary-foreground/20' 
                    : 'bg-background/80'
                }`}>
                  {products.length}
                </span>
              </motion.button>

              {/* Category Buttons */}
              {categoryList.map(([category, count]) => {
                const Icon = getCategoryIcon(category);
                return (
                  <motion.button
                    key={category}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onCategoryChange(category)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap transition-all text-sm font-medium ${
                      activeCategory === category
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted border border-border/40'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{category}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      activeCategory === category 
                        ? 'bg-primary-foreground/20' 
                        : 'bg-background/80'
                    }`}>
                      {count}
                    </span>
                  </motion.button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" className="h-1" />
          </ScrollArea>

          {/* Search Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={`flex-shrink-0 rounded-full w-10 h-10 ${
              isSearchOpen 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted/60 text-muted-foreground hover:bg-muted border border-border/40'
            }`}
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
