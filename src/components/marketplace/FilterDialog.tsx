import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';

interface FilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  onUpdateFilters: (filters: any) => void;
  onResetFilters: () => void;
  onApplyQuickFilter: (filter: string) => void;
  hasActiveFilters: boolean;
  filterStats: any;
}

export const FilterDialog: React.FC<FilterDialogProps> = ({
  isOpen,
  onClose,
  filters,
  onUpdateFilters,
  onResetFilters,
  onApplyQuickFilter,
  hasActiveFilters,
  filterStats
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Filtres
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Prix */}
          <div>
            <h3 className="font-medium mb-3">Prix (CDF)</h3>
            <Slider
              value={[filters.minPrice || 0, filters.maxPrice || 100000]}
              onValueChange={([min, max]) => 
                onUpdateFilters({ ...filters, minPrice: min, maxPrice: max })
              }
              max={100000}
              step={1000}
              className="mb-2"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{filters.minPrice || 0} CDF</span>
              <span>{filters.maxPrice || 100000} CDF</span>
            </div>
          </div>

          {/* Catégories */}
          <div>
            <h3 className="font-medium mb-3">Catégories</h3>
            <div className="space-y-2">
              {['electronics', 'fashion', 'home', 'sports', 'books'].map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={category}
                    checked={filters.categories?.includes(category)}
                    onCheckedChange={(checked) => {
                      const updatedCategories = checked
                        ? [...(filters.categories || []), category]
                        : (filters.categories || []).filter((c: string) => c !== category);
                      onUpdateFilters({ ...filters, categories: updatedCategories });
                    }}
                  />
                  <label htmlFor={category} className="text-sm capitalize">
                    {category}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onResetFilters} className="flex-1">
              Réinitialiser
            </Button>
            <Button onClick={onClose} className="flex-1">
              Appliquer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};