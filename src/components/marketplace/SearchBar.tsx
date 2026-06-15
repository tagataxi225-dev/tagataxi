import React, { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: () => void;
  filters: {
    priceRange: [number, number];
    inStockOnly: boolean;
    freeShipping: boolean;
  };
  onFiltersChange: (filters: any) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  onSearch,
  filters,
  onFiltersChange,
}) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Synchroniser avec les props
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(localSearch);
    onSearch();
  };

  const handleClear = () => {
    setLocalSearch('');
    onSearchChange('');
  };

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/20">
      <div className="p-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Rechercher des produits..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-10 pr-10 h-10 text-sm bg-card/50 border-border/40 focus:border-primary/60 transition-all rounded-xl shadow-sm"
            />
            {localSearch && (
              <Button
                type="button"
                onClick={handleClear}
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted/50"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <Button 
            type="submit" 
            size="sm"
            className="h-10 px-4 bg-primary hover:bg-primary/90 text-white font-medium touch-manipulation rounded-xl shadow-sm"
          >
            <Search className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline text-sm">Rechercher</span>
          </Button>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 w-10 p-0 border-border/40 hover:bg-muted/50 touch-manipulation rounded-xl shadow-sm">
                <SlidersHorizontal className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filtres</SheetTitle>
                <SheetDescription>
                  Affinez votre recherche avec ces filtres
                </SheetDescription>
              </SheetHeader>
              
              <div className="space-y-6 mt-6">
                <div>
                  <Label className="text-sm font-medium">Prix (FC)</Label>
                  <div className="mt-2">
                    <Slider
                      value={filters.priceRange}
                      onValueChange={(value) => 
                        onFiltersChange({ ...filters, priceRange: value })
                      }
                      max={500000}
                      min={0}
                      step={1000}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>{filters.priceRange[0].toLocaleString()} CDF</span>
                      <span>{filters.priceRange[1].toLocaleString()} CDF</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="in-stock">En stock seulement</Label>
                  <Switch
                    id="in-stock"
                    checked={filters.inStockOnly}
                    onCheckedChange={(checked) =>
                      onFiltersChange({ ...filters, inStockOnly: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="free-shipping">Livraison gratuite</Label>
                  <Switch
                    id="free-shipping"
                    checked={filters.freeShipping}
                    onCheckedChange={(checked) =>
                      onFiltersChange({ ...filters, freeShipping: checked })
                    }
                  />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </form>
      </div>
    </div>
  );
};