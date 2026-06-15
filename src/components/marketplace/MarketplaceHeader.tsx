import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  Search, 
  Filter, 
  ShoppingCart, 
  Heart, 
  MapPin,
  Mic,
  X
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { cn } from '@/lib/utils';

interface MarketplaceHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFilterClick: () => void;
  onCartClick: () => void;
  onFavoritesClick: () => void;
  hasActiveFilters: boolean;
  className?: string;
}

export const MarketplaceHeader: React.FC<MarketplaceHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onFilterClick,
  onCartClick,
  onFavoritesClick,
  hasActiveFilters,
  className
}) => {
  const { cartCount } = useCart();
  const { favoriteCount } = useFavorites();
  const { latitude, longitude, currentCity, isRealGPS } = useGeolocation();
  
  const [isListening, setIsListening] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const suggestions = [
    'Samsung Galaxy',
    'iPhone',
    'Robe africaine',
    'Riz jasmin',
    'MacBook',
    'Chaussures Nike'
  ].filter(suggestion => 
    suggestion.toLowerCase().includes(searchQuery.toLowerCase()) && 
    searchQuery.length > 0
  );

  const formatLocation = () => {
    const cityName = typeof currentCity === 'string' ? currentCity : currentCity?.name || 'Position non détectée';
    if (latitude && longitude) {
      return `${cityName} • ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
    return cityName;
  };

  return (
    <div className={cn("sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b", className)}>
      <div className="container mx-auto px-4 py-4">
        {/* Location Display */}
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
           <span>{formatLocation()}</span>
          {isRealGPS && (
            <Badge variant="secondary" className="text-xs">
              GPS
            </Badge>
          )}
        </div>

        {/* Search and Actions */}
        <div className="flex gap-3">
          {/* Search Bar */}
          <div className="flex-1 relative" ref={searchInputRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Rechercher produits, marques, vendeurs..."
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setShowSuggestions(e.target.value.length > 0);
                }}
                onFocus={() => setShowSuggestions(searchQuery.length > 0)}
                className="pl-11 pr-12 h-12 text-base bg-muted/50 border-muted-foreground/20"
              />
              
              {searchQuery && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => {
                    onSearchChange('');
                    setShowSuggestions(false);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-lg mt-2 shadow-lg z-50">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
                    onClick={() => {
                      onSearchChange(suggestion);
                      setShowSuggestions(false);
                    }}
                  >
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Button */}
          <Button
            variant="outline"
            size="lg"
            className="h-12 px-4 relative"
            onClick={onFilterClick}
          >
            <Filter className="w-5 h-5" />
            {hasActiveFilters && (
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                !
              </div>
            )}
          </Button>

          {/* Favorites Button */}
          <Button
            variant="outline"
            size="lg"
            className="h-12 px-4 relative"
            onClick={onFavoritesClick}
          >
            <Heart className="w-5 h-5" />
            {favoriteCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {favoriteCount > 99 ? '99+' : favoriteCount}
              </Badge>
            )}
          </Button>

          {/* Cart Button */}
          <Button
            variant="default"
            size="lg"
            className="h-12 px-4 relative"
            onClick={onCartClick}
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 text-white">
                {cartCount > 99 ? '99+' : cartCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};