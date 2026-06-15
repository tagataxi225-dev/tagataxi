import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, LayoutGrid, List } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OrderFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'kanban' | 'list';
  onViewModeChange: (mode: 'kanban' | 'list') => void;
  statusFilter: string | null;
  onStatusFilterChange: (status: string | null) => void;
  orderCounts: {
    pending: number;
    confirmed: number;
    preparing: number;
    ready: number;
  };
}

const STATUS_OPTIONS = [
  { id: 'pending', label: 'Nouveau', color: 'bg-blue-500' },
  { id: 'confirmed', label: 'Confirmé', color: 'bg-purple-500' },
  { id: 'preparing', label: 'Préparation', color: 'bg-orange-500' },
  { id: 'ready', label: 'Prêt', color: 'bg-green-500' },
];

export const OrderFilters = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  statusFilter,
  onStatusFilterChange,
  orderCounts
}: OrderFiltersProps) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-3">
      {/* Search and View Toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher #commande, téléphone..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => onSearchChange('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
        </Button>

        <div className="hidden sm:flex border rounded-lg p-1 gap-1">
          <Button
            variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8"
            onClick={() => onViewModeChange('kanban')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8"
            onClick={() => onViewModeChange('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Status Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 pb-2">
              <Badge
                variant={statusFilter === null ? 'default' : 'outline'}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => onStatusFilterChange(null)}
              >
                Tous
              </Badge>
              {STATUS_OPTIONS.map((status) => {
                const count = orderCounts[status.id as keyof typeof orderCounts] || 0;
                return (
                  <Badge
                    key={status.id}
                    variant={statusFilter === status.id ? 'default' : 'outline'}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => onStatusFilterChange(status.id)}
                  >
                    <span className={`w-2 h-2 rounded-full ${status.color} mr-1.5`} />
                    {status.label} ({count})
                  </Badge>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile View Toggle */}
      <div className="flex sm:hidden border rounded-lg p-1 gap-1">
        <Button
          variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
          size="sm"
          className="flex-1 h-9"
          onClick={() => onViewModeChange('kanban')}
        >
          <LayoutGrid className="h-4 w-4 mr-2" />
          Kanban
        </Button>
        <Button
          variant={viewMode === 'list' ? 'secondary' : 'ghost'}
          size="sm"
          className="flex-1 h-9"
          onClick={() => onViewModeChange('list')}
        >
          <List className="h-4 w-4 mr-2" />
          Liste
        </Button>
      </div>
    </div>
  );
};
