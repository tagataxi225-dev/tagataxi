import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { MARKETPLACE_CATEGORIES } from '@/config/marketplaceCategories';

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  productCounts?: Record<string, number>;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ 
  selectedCategory, 
  onCategoryChange,
  productCounts = {}
}) => {
  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/20">
      <div className="flex overflow-x-auto gap-2 p-3 scrollbar-hide">
        {MARKETPLACE_CATEGORIES.map((category) => {
          const Icon = category.icon;
          const count = productCounts[category.id] || 0;
          const isSelected = selectedCategory === category.id;
          
          return (
            <Button
              key={category.id}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl min-h-9 px-3 touch-manipulation transition-all duration-200 ${
                isSelected 
                  ? 'bg-primary text-white shadow-sm scale-[1.02] border-0' 
                  : 'bg-card/50 hover:bg-muted/60 border-border/30 hover:border-border/50'
              }`}
              onClick={() => onCategoryChange(category.id)}
            >
              {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
              <span className="font-medium text-sm">{category.name}</span>
              {count > 0 && category.id !== 'all' && (
                <Badge variant="secondary" className="ml-1 text-xs h-4 px-1.5 bg-primary/15 text-primary border-0 rounded-md">
                  {count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
};