import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, X, Filter, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface SubscriptionFiltersState {
  search: string;
  status: string;
  serviceType: string;
  plan: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  expirationRange: string;
  paymentMethod: string;
}

interface SubscriptionFiltersProps {
  filters: SubscriptionFiltersState;
  onFiltersChange: (filters: Partial<SubscriptionFiltersState>) => void;
  availablePlans?: Array<{ id: string; name: string }>;
  className?: string;
}

export const SubscriptionFilters: React.FC<SubscriptionFiltersProps> = ({
  filters,
  onFiltersChange,
  availablePlans = [],
  className
}) => {
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'search' || key === 'dateFrom' || key === 'dateTo') return false;
    return value && value !== 'all';
  });

  const handleReset = () => {
    onFiltersChange({
      search: '',
      status: 'all',
      serviceType: 'all',
      plan: 'all',
      dateFrom: undefined,
      dateTo: undefined,
      expirationRange: 'all',
      paymentMethod: 'all'
    });
  };

  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Filtres Avancés</h3>
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  Actifs
                </Badge>
              )}
            </div>
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleReset}
                className="h-8 gap-2"
              >
                <RotateCcw className="h-3 w-3" />
                Réinitialiser
              </Button>
            )}
          </div>

          {/* Filtres Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => onFiltersChange({ status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">✅ Actif</SelectItem>
                  <SelectItem value="expired">⏰ Expiré</SelectItem>
                  <SelectItem value="cancelled">❌ Annulé</SelectItem>
                  <SelectItem value="pending">⏳ En attente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceType">Type de Service</Label>
              <Select
                value={filters.serviceType}
                onValueChange={(value) => onFiltersChange({ serviceType: value })}
              >
                <SelectTrigger id="serviceType">
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="transport">🚗 Taxi</SelectItem>
                  <SelectItem value="delivery">🚚 Livraison</SelectItem>
                  <SelectItem value="both">🚗🚚 Les deux</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">Plan d'Abonnement</Label>
              <Select
                value={filters.plan}
                onValueChange={(value) => onFiltersChange({ plan: value })}
              >
                <SelectTrigger id="plan">
                  <SelectValue placeholder="Tous les plans" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les plans</SelectItem>
                  {availablePlans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filtres Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expirationRange">Expiration</Label>
              <Select
                value={filters.expirationRange}
                onValueChange={(value) => onFiltersChange({ expirationRange: value })}
              >
                <SelectTrigger id="expirationRange">
                  <SelectValue placeholder="Toutes les dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les dates</SelectItem>
                  <SelectItem value="week">📅 Dans 7 jours</SelectItem>
                  <SelectItem value="month">📅 Dans 30 jours</SelectItem>
                  <SelectItem value="expired">⏰ Déjà expiré</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Méthode de Paiement</Label>
              <Select
                value={filters.paymentMethod}
                onValueChange={(value) => onFiltersChange({ paymentMethod: value })}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Toutes les méthodes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les méthodes</SelectItem>
                  <SelectItem value="mobile_money">📱 Mobile Money</SelectItem>
                  <SelectItem value="card">💳 Carte bancaire</SelectItem>
                  <SelectItem value="cash">💵 Espèces</SelectItem>
                  <SelectItem value="wallet">👛 Portefeuille</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Période de Création</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !filters.dateFrom && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateFrom ? (
                        format(filters.dateFrom, 'dd/MM/yyyy', { locale: fr })
                      ) : (
                        'De...'
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateFrom}
                      onSelect={(date) => onFiltersChange({ dateFrom: date })}
                      initialFocus
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !filters.dateTo && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateTo ? (
                        format(filters.dateTo, 'dd/MM/yyyy', { locale: fr })
                      ) : (
                        'À...'
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateTo}
                      onSelect={(date) => onFiltersChange({ dateTo: date })}
                      initialFocus
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {filters.status !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Statut: {filters.status}
                  <button
                    onClick={() => onFiltersChange({ status: 'all' })}
                    className="ml-1 hover:bg-background/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.serviceType !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Service: {filters.serviceType}
                  <button
                    onClick={() => onFiltersChange({ serviceType: 'all' })}
                    className="ml-1 hover:bg-background/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.plan !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Plan: {availablePlans.find(p => p.id === filters.plan)?.name || filters.plan}
                  <button
                    onClick={() => onFiltersChange({ plan: 'all' })}
                    className="ml-1 hover:bg-background/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};