import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Store, ShoppingCart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FilterDrawer } from '@/components/ui/FilterDrawer';
import { FilterBadge } from '@/components/ui/FilterBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { PaginationControls } from '@/components/common/PaginationControls';
import { VendorCard } from './VendorCard';
import { SupermarketCard } from './SupermarketCard';
import { useAllVendors } from '@/hooks/useAllVendors';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebounce } from '@/hooks/useDebounce';

interface AllVendorsViewProps {
  onBack: () => void;
  onSelectVendor: (vendorId: string) => void;
  selectedCity?: string;
}

const typeOptions = [
  { value: 'all' as const, label: 'Tous' },
  { value: 'boutique' as const, label: 'Boutiques' },
  { value: 'supermarket' as const, label: 'Supermarchés' },
];

export const AllVendorsView: React.FC<AllVendorsViewProps> = ({
  onBack,
  onSelectVendor,
  selectedCity
}) => {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const {
    vendors,
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
  } = useAllVendors(selectedCity);

  React.useEffect(() => {
    updateFilters({ search: debouncedSearch });
  }, [debouncedSearch]);

  const activeFiltersCount = [
    filters.minRating > 0,
    filters.minSales > 0,
    filters.verifiedOnly
  ].filter(Boolean).length;

  const getActiveFilterBadges = () => {
    const badges: Array<{ label: string; onRemove: () => void }> = [];
    if (filters.minRating > 0) {
      badges.push({ label: `⭐ ${filters.minRating}+`, onRemove: () => updateFilters({ minRating: 0 }) });
    }
    if (filters.minSales > 0) {
      badges.push({ label: `${filters.minSales}+ ventes`, onRemove: () => updateFilters({ minSales: 0 }) });
    }
    if (filters.verifiedOnly) {
      badges.push({ label: 'Vérifié', onRemove: () => updateFilters({ verifiedOnly: false }) });
    }
    return badges;
  };

  return (
    <div className="flex-1 bg-background">
      {/* Unified sticky header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/40">
        <div className="px-4 pt-3 pb-2.5 space-y-2.5">
          {/* Row 1: Back + Title + Count */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-base font-semibold flex-1">Boutiques</h1>
            <span className="text-xs text-muted-foreground">{totalCount} résultats</span>
          </div>

          {/* Row 2: Type chips */}
          <div className="flex gap-1.5">
            {typeOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => updateFilters({ shopType: opt.value })}
                className={`px-3.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  filters.shopType === opt.value
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Row 3: Search + Filter icon */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-8 h-8 text-sm bg-muted/50 border-0 rounded-lg"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Note minimum</Label>
                <Select value={filters.minRating.toString()} onValueChange={(v) => updateFilters({ minRating: parseFloat(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Toutes les notes</SelectItem>
                    <SelectItem value="3">⭐ 3+</SelectItem>
                    <SelectItem value="4">⭐ 4+</SelectItem>
                    <SelectItem value="4.5">⭐ 4.5+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Ventes minimum</Label>
                <Select value={filters.minSales.toString()} onValueChange={(v) => updateFilters({ minSales: parseInt(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Toutes</SelectItem>
                    <SelectItem value="10">10+</SelectItem>
                    <SelectItem value="50">50+</SelectItem>
                    <SelectItem value="100">100+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="verified" checked={filters.verifiedOnly} onCheckedChange={(c) => updateFilters({ verifiedOnly: c as boolean })} />
                <Label htmlFor="verified" className="text-sm cursor-pointer">Vérifiées uniquement</Label>
              </div>
            </FilterDrawer>
          </div>
        </div>
      </div>

      {/* Active filter badges */}
      {activeFiltersCount > 0 && (
        <div className="flex gap-1.5 flex-wrap px-4 pt-2">
          <AnimatePresence>
            {getActiveFilterBadges().map((badge, i) => (
              <FilterBadge key={`${badge.label}-${i}`} label={badge.label} onRemove={badge.onRemove} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Sort inline */}
      <div className="flex items-center justify-end px-4 pt-2 pb-1">
        <Select
          value={`${sort.field}-${sort.direction}`}
          onValueChange={(value) => {
            const [field, direction] = value.split('-');
            updateSort({ field, direction: direction as 'asc' | 'desc' });
          }}
        >
          <SelectTrigger className="w-auto h-7 text-xs border-0 bg-transparent gap-1 px-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="average_rating-desc">Meilleures notes</SelectItem>
            <SelectItem value="total_sales-desc">Plus de ventes</SelectItem>
            <SelectItem value="created_at-desc">Plus récents</SelectItem>
            <SelectItem value="shop_name-asc">A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      <div className="px-4 pb-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[88px] rounded-xl" />
            ))}
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-20">
            <Store className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">Aucune boutique trouvée</p>
            <button onClick={resetFilters} className="text-xs text-primary mt-2 hover:underline">
              Réinitialiser
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 mb-6">
              {vendors.map((vendor, index) => (
                vendor.shop_type === 'supermarket' ? (
                  <SupermarketCard key={vendor.user_id} vendor={vendor} onVisit={onSelectVendor} index={index} />
                ) : (
                  <VendorCard key={vendor.user_id} vendor={vendor} onVisit={onSelectVendor} index={index} />
                )
              ))}
            </div>
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
                itemName="boutiques"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};
