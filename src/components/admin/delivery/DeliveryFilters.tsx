import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X, Filter } from 'lucide-react';
import { DeliveryFilters as DeliveryFiltersType } from '@/hooks/useDeliveryManagement';

interface DeliveryFiltersProps {
  filters: DeliveryFiltersType;
  onFiltersChange: (filters: Partial<DeliveryFiltersType>) => void;
}

export const DeliveryFilters: React.FC<DeliveryFiltersProps> = ({ filters, onFiltersChange }) => {
  const hasActiveFilters = 
    filters.search || 
    filters.status !== 'all' || 
    filters.deliveryType !== 'all' || 
    filters.city !== 'all' ||
    filters.dateFrom ||
    filters.dateTo;

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: 'all',
      deliveryType: 'all',
      city: 'all',
      dateFrom: undefined,
      dateTo: undefined,
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-card rounded-lg border border-border/50">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Filter className="h-4 w-4" />
        Filtres
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher (expéditeur, destinataire, adresse...)"
            value={filters.search}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            className="pl-9"
          />
        </div>

        <Select value={filters.status} onValueChange={(value) => onFiltersChange({ status: value as any })}>
          <SelectTrigger>
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="confirmed">Confirmée</SelectItem>
            <SelectItem value="driver_assigned">Livreur assigné</SelectItem>
            <SelectItem value="picked_up">Récupérée</SelectItem>
            <SelectItem value="in_transit">En transit</SelectItem>
            <SelectItem value="delivered">Livrée</SelectItem>
            <SelectItem value="cancelled">Annulée</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.deliveryType} onValueChange={(value) => onFiltersChange({ deliveryType: value as any })}>
          <SelectTrigger>
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous types</SelectItem>
            <SelectItem value="flash">Flash (Moto)</SelectItem>
            <SelectItem value="flex">Flex (Camionnette)</SelectItem>
            <SelectItem value="maxicharge">MaxiCharge (Camion)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.city} onValueChange={(value) => onFiltersChange({ city: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Ville" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les villes</SelectItem>
            <SelectItem value="kinshasa">Kinshasa</SelectItem>
            <SelectItem value="lubumbashi">Lubumbashi</SelectItem>
            <SelectItem value="kolwezi">Kolwezi</SelectItem>
            <SelectItem value="abidjan">Abidjan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Du:</span>
          <Input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => onFiltersChange({ dateFrom: e.target.value || undefined })}
            className="w-auto"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Au:</span>
          <Input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => onFiltersChange({ dateTo: e.target.value || undefined })}
            className="w-auto"
          />
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            <X className="h-4 w-4 mr-1" />
            Effacer les filtres
          </Button>
        )}
      </div>
    </div>
  );
};
