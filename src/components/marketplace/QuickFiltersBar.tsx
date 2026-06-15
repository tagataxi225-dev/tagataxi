import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Filter, MapPin, TrendingDown, Sparkles, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuickFiltersBarProps {
  onQuickFilter: (filterId: string) => void;
  onOpenAdvancedFilters: () => void;
  activeFiltersCount?: number;
}

export const QuickFiltersBar = ({
  onQuickFilter,
  onOpenAdvancedFilters,
  activeFiltersCount = 0
}: QuickFiltersBarProps) => {
  const { t } = useLanguage();
  
  const QUICK_FILTERS = [
    { id: 'nearby', label: `📍 ${t('marketplace.filter_nearby')}`, icon: MapPin },
    { id: 'deals', label: `💰 ${t('marketplace.filter_deals')}`, icon: TrendingDown },
    { id: 'new', label: `✨ ${t('marketplace.filter_new')}`, icon: Sparkles },
    { id: 'premium', label: `⭐ ${t('marketplace.filter_best_rated')}`, icon: Star }
  ];
  
  return (
    <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto">
      <span className="text-xs font-medium text-muted-foreground mr-2 whitespace-nowrap">
        {t('marketplace.filters_quick')}:
      </span>
      
      {QUICK_FILTERS.map(filter => (
        <Badge
          key={filter.id}
          variant="outline"
          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all whitespace-nowrap"
          onClick={() => onQuickFilter(filter.id)}
        >
          {filter.label}
        </Badge>
      ))}
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onOpenAdvancedFilters}
        className="ml-auto whitespace-nowrap"
      >
        <Filter className="h-4 w-4 mr-2" />
        {t('marketplace.filters_advanced')}
        {activeFiltersCount > 0 && (
          <Badge variant="destructive" className="ml-2">
            {activeFiltersCount}
          </Badge>
        )}
      </Button>
    </div>
  );
};
