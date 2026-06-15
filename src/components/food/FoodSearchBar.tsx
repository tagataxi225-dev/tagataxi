import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency, getCurrencyByCity } from '@/utils/formatCurrency';

interface SearchResult {
  type: 'dish' | 'restaurant';
  id: string;
  name: string;
  image?: string;
  price?: number;
  rating?: number;
  restaurant_name?: string;
}

interface FoodSearchBarProps {
  city: string;
}

export const FoodSearchBar: React.FC<FoodSearchBarProps> = ({ city }) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const searchFood = async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        // Recherche plats
        const { data: dishes } = await supabase
          .from('food_products')
          .select(`
            id,
            name,
            main_image_url,
            price,
            restaurant_profiles!inner(restaurant_name, city, is_active, verification_status)
          `)
          .eq('restaurant_profiles.is_active', true)
          .eq('restaurant_profiles.verification_status', 'approved')
          .eq('is_available', true)
          .ilike('name', `%${debouncedSearch}%`)
          .limit(5);

        // Recherche restaurants
        const { data: restaurants } = await supabase
          .from('restaurant_profiles')
          .select('id, restaurant_name, logo_url, rating_average')
          .eq('is_active', true)
          .eq('verification_status', 'approved')
          .ilike('restaurant_name', `%${debouncedSearch}%`)
          .limit(5);

        const dishResults: SearchResult[] = (dishes || []).map((d: any) => ({
          type: 'dish' as const,
          id: d.id,
          name: d.name,
          image: d.main_image_url,
          price: d.price,
          restaurant_name: d.restaurant_profiles?.restaurant_name
        }));

        const restaurantResults: SearchResult[] = (restaurants || []).map(r => ({
          type: 'restaurant' as const,
          id: r.id,
          name: r.restaurant_name,
          image: r.logo_url,
          rating: r.rating_average
        }));

        setResults([...dishResults, ...restaurantResults]);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    searchFood();
  }, [debouncedSearch, city]);

  const handleResultClick = (result: SearchResult) => {
    setOpen(false);
    setSearchTerm('');
    // Navigation vers le détail (à implémenter)
  };

  return (
    <>
      {/* Bouton recherche mobile */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* Input recherche desktop */}
      <div className="hidden md:block relative max-w-md w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Que veux-tu manger aujourd'hui ? 🍽️"
          className="pl-10 pr-4 bg-background/90 dark:bg-card/90 backdrop-blur-sm border-border/50"
          onClick={() => setOpen(true)}
          readOnly
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-muted rounded border border-border/50">
          ⌘K
        </kbd>
      </div>

      {/* Dialog résultats */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden p-0">
          <DialogHeader className="p-4 pb-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un plat ou un restaurant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
                autoFocus
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[60vh] p-4">
            {loading && (
              <div className="text-center py-8 text-muted-foreground">
                Recherche en cours...
              </div>
            )}

            {!loading && results.length === 0 && searchTerm.length >= 2 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-muted-foreground">
                  Aucun résultat pour "{searchTerm}"
                </p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="space-y-4">
                {results.filter(r => r.type === 'dish').length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                      Plats ({results.filter(r => r.type === 'dish').length})
                    </h3>
                    <div className="space-y-2">
                      {results.filter(r => r.type === 'dish').map(result => (
                        <button
                          key={result.id}
                          onClick={() => handleResultClick(result)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                        >
                          {result.image && (
                            <img
                              src={result.image}
                              alt={result.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{result.name}</p>
                            {result.restaurant_name && (
                              <p className="text-sm text-muted-foreground truncate">
                                {result.restaurant_name}
                              </p>
                            )}
                          </div>
                          {result.price && (
                            <div className="text-primary font-semibold whitespace-nowrap">
                              {formatCurrency(result.price, getCurrencyByCity(city))}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {results.filter(r => r.type === 'restaurant').length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                      Restaurants ({results.filter(r => r.type === 'restaurant').length})
                    </h3>
                    <div className="space-y-2">
                      {results.filter(r => r.type === 'restaurant').map(result => (
                        <button
                          key={result.id}
                          onClick={() => handleResultClick(result)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                        >
                          {result.image && (
                            <img
                              src={result.image}
                              alt={result.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{result.name}</p>
                            {result.rating && (
                              <p className="text-sm text-muted-foreground">
                                ⭐ {result.rating.toFixed(1)}
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!searchTerm && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Commence à taper pour rechercher...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
