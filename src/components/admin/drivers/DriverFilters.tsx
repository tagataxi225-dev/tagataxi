import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';
import { DriverFilters as DriverFiltersType } from '@/hooks/useDriverManagement';

interface DriverFiltersProps {
  filters: DriverFiltersType;
  onFiltersChange: (filters: Partial<DriverFiltersType>) => void;
  loading: boolean;
}

export const DriverFilters: React.FC<DriverFiltersProps> = ({
  filters,
  onFiltersChange,
  loading,
}) => {
  const handleClearFilters = () => {
    onFiltersChange({
      search: '',
      status: 'all',
      serviceType: 'all',
      verificationStatus: 'all',
      dateFrom: undefined,
      dateTo: undefined,
    });
  };

  const hasActiveFilters = filters.search || 
    filters.status !== 'all' || 
    filters.serviceType !== 'all' || 
    filters.verificationStatus !== 'all' ||
    filters.dateFrom || 
    filters.dateTo;

  return (
    <Card className="card-floating border-0">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtres</span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Effacer
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ search: e.target.value })}
              className="pl-9"
              disabled={loading}
            />
          </div>

          {/* Status Filter */}
          <Select
            value={filters.status}
            onValueChange={(value) => onFiltersChange({ status: value as any })}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="online">En ligne</SelectItem>
              <SelectItem value="offline">Hors ligne</SelectItem>
              <SelectItem value="available">Disponible</SelectItem>
              <SelectItem value="busy">Occupé</SelectItem>
            </SelectContent>
          </Select>

          {/* Service Type Filter */}
          <Select
            value={filters.serviceType}
            onValueChange={(value) => onFiltersChange({ serviceType: value })}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Type de service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les services</SelectItem>
              <SelectItem value="taxi">Taxi</SelectItem>
              <SelectItem value="delivery">Livraison</SelectItem>
              <SelectItem value="moto">Moto-taxi</SelectItem>
              <SelectItem value="bus">Bus</SelectItem>
            </SelectContent>
          </Select>

          {/* Verification Status Filter */}
          <Select
            value={filters.verificationStatus}
            onValueChange={(value) => onFiltersChange({ verificationStatus: value })}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Vérification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="verified">Vérifié</SelectItem>
              <SelectItem value="rejected">Rejeté</SelectItem>
            </SelectContent>
          </Select>

          {/* Date From */}
          <Input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => onFiltersChange({ dateFrom: e.target.value || undefined })}
            disabled={loading}
            placeholder="Date de début"
          />

          {/* Date To */}
          <Input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => onFiltersChange({ dateTo: e.target.value || undefined })}
            disabled={loading}
            placeholder="Date de fin"
          />
        </div>
      </CardContent>
    </Card>
  );
};