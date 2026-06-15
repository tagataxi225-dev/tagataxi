import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface FilterChip {
  id: string;
  label: string;
  count?: number;
}

interface ProductFiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  activeFilter: string;
  onFilterChange: (filterId: string) => void;
  filters: FilterChip[];
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  searchValue,
  onSearchChange,
  activeFilter,
  onFilterChange,
  filters
}) => {
  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher un produit..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {filters.map((filter) => {
          const isActive = activeFilter === filter.id;
          
          return (
            <motion.button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {filter.label}
              {filter.count !== undefined && (
                <Badge 
                  variant={isActive ? 'secondary' : 'outline'}
                  className="ml-1 text-xs"
                >
                  {filter.count}
                </Badge>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
