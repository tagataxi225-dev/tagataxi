import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, X, Calendar } from 'lucide-react';
import { BookingFilters as BookingFiltersType } from '@/hooks/useBookingManagement';
import { Card, CardContent } from '@/components/ui/card';

interface BookingFiltersProps {
  filters: BookingFiltersType;
  onFiltersChange: (filters: Partial<BookingFiltersType>) => void;
  loading?: boolean;
}

export const BookingFilters: React.FC<BookingFiltersProps> = ({
  filters,
  onFiltersChange,
  loading,
}) => {
  const handleClearFilters = () => {
    onFiltersChange({
      search: '',
      status: 'all',
      vehicleType: 'all',
      city: 'all',
      dateFrom: undefined,
      dateTo: undefined,
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.status !== 'all' ||
    filters.vehicleType !== 'all' ||
    filters.city !== 'all' ||
    filters.dateFrom ||
    filters.dateTo;

  return (
    <Card className="card-floating border-0">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher (départ, destination...)"
              value={filters.search}
              onChange={(e) => onFiltersChange({ search: e.target.value })}
              className="pl-10"
              disabled={loading}
            />
          </div>

          {/* Status Filter */}
          <Select
            value={filters.status}
            onValueChange={(value) => onFiltersChange({ status: value as any })}
            disabled={loading}
          >
            <SelectTrigger className="w-full lg:w-[180px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="confirmed">Confirmé</SelectItem>
              <SelectItem value="driver_assigned">Chauffeur assigné</SelectItem>
              <SelectItem value="in_progress">En cours</SelectItem>
              <SelectItem value="completed">Complété</SelectItem>
              <SelectItem value="cancelled">Annulé</SelectItem>
            </SelectContent>
          </Select>

          {/* Vehicle Type Filter */}
          <Select
            value={filters.vehicleType}
            onValueChange={(value) => onFiltersChange({ vehicleType: value })}
            disabled={loading}
          >
            <SelectTrigger className="w-full lg:w-[180px]">
              <SelectValue placeholder="Type véhicule" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="taxi_standard">Taxi Standard</SelectItem>
              <SelectItem value="taxi_premium">Taxi Premium</SelectItem>
              <SelectItem value="moto">Moto</SelectItem>
              <SelectItem value="taxi_bus">Taxi Bus</SelectItem>
              <SelectItem value="vtc">VTC</SelectItem>
            </SelectContent>
          </Select>

          {/* City Filter */}
          <Select
            value={filters.city}
            onValueChange={(value) => onFiltersChange({ city: value })}
            disabled={loading}
          >
            <SelectTrigger className="w-full lg:w-[180px]">
              <SelectValue placeholder="Ville" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les villes</SelectItem>
              <SelectItem value="kinshasa">Kinshasa</SelectItem>
              <SelectItem value="lubumbashi">Lubumbashi</SelectItem>
              <SelectItem value="kolwezi">Kolwezi</SelectItem>
            </SelectContent>
          </Select>

          {/* Date From */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => onFiltersChange({ dateFrom: e.target.value || undefined })}
              className="pl-10 w-full lg:w-[160px]"
              disabled={loading}
              placeholder="Date début"
            />
          </div>

          {/* Date To */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => onFiltersChange({ dateTo: e.target.value || undefined })}
              className="pl-10 w-full lg:w-[160px]"
              disabled={loading}
              placeholder="Date fin"
            />
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleClearFilters}
              className="shrink-0"
              disabled={loading}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
