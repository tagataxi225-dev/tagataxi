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
import { UserFilters as UserFiltersType } from '@/hooks/useAdvancedUserManagement';
import { Search, Filter, X } from 'lucide-react';

interface UserFiltersProps {
  filters: UserFiltersType;
  onFiltersChange: (filters: Partial<UserFiltersType>) => void;
  loading: boolean;
}

export const UserFilters: React.FC<UserFiltersProps> = ({
  filters,
  onFiltersChange,
  loading,
}) => {
  const handleClearFilters = () => {
    onFiltersChange({
      search: '',
      userType: 'all',
      status: 'all',
      dateFrom: undefined,
      dateTo: undefined,
    });
  };

  const hasActiveFilters = 
    filters.search ||
    filters.userType !== 'all' ||
    filters.status !== 'all' ||
    filters.dateFrom ||
    filters.dateTo;

  return (
    <Card className="card-floating border-0">
      <CardContent className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[300px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email ou téléphone..."
                value={filters.search}
                onChange={(e) => onFiltersChange({ search: e.target.value })}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          {/* User Type Filter */}
          <Select
            value={filters.userType}
            onValueChange={(value) => onFiltersChange({ userType: value as any })}
            disabled={loading}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Type d'utilisateur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="client">Clients</SelectItem>
              <SelectItem value="driver">Chauffeurs</SelectItem>
              <SelectItem value="partner">Partenaires</SelectItem>
              <SelectItem value="admin">Administrateurs</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={filters.status}
            onValueChange={(value) => onFiltersChange({ status: value as any })}
            disabled={loading}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="inactive">Inactif</SelectItem>
              <SelectItem value="suspended">Suspendu</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
            </SelectContent>
          </Select>

          {/* Date From */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Du:</span>
            <Input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => onFiltersChange({ dateFrom: e.target.value || undefined })}
              className="w-[150px]"
              disabled={loading}
            />
          </div>

          {/* Date To */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Au:</span>
            <Input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => onFiltersChange({ dateTo: e.target.value || undefined })}
              className="w-[150px]"
              disabled={loading}
            />
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Effacer
            </Button>
          )}
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filtres rapides:</span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFiltersChange({ userType: 'driver', status: 'active' })}
            disabled={loading}
          >
            Chauffeurs actifs
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFiltersChange({ userType: 'client', dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] })}
            disabled={loading}
          >
            Nouveaux clients (7j)
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFiltersChange({ status: 'pending' })}
            disabled={loading}
          >
            En attente de validation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};