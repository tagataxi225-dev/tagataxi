import React from 'react';
import { MapPin, Search, SlidersHorizontal, Car } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ModernRentalHeaderProps {
  userLocation: string;
  setUserLocation: (city: string) => void;
  availableCities: string[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onFilterClick?: () => void;
  activeFiltersCount?: number;
}

export const ModernRentalHeader: React.FC<ModernRentalHeaderProps> = ({
  userLocation,
  setUserLocation,
  availableCities,
  searchTerm,
  setSearchTerm,
  onFilterClick,
  activeFiltersCount = 0,
}) => {
  return (
    <div className="sticky top-0 z-40">
      <div className="bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-3 space-y-2">
          {/* Row 1: Logo + City Selector */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary p-1.5 rounded-lg">
                <Car className="h-5 w-5" />
              </div>

              {/* City Selector sobre */}
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <Select value={userLocation} onValueChange={setUserLocation}>
                  <SelectTrigger className="w-auto border-0 shadow-none font-semibold text-base h-auto p-0 hover:text-primary transition-colors bg-transparent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCities.map(city => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter button */}
            <Button 
              variant={activeFiltersCount > 0 ? 'default' : 'outline'}
              size="icon"
              className="rounded-lg relative"
              onClick={onFilterClick}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {activeFiltersCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Row 2: Search bar sobre */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher véhicule, marque, agence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 rounded-lg bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
