import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDriverOrderHistory } from '@/hooks/useDriverOrderHistory';
import { OrderHistoryCard } from './OrderHistoryCard';
import { History, Search, Filter, Download } from 'lucide-react';
import { toast } from 'sonner';

export const DriverOrderHistory: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState<'all' | 'transport' | 'delivery'>('all');
  const [periodFilter, setPeriodFilter] = useState<'today' | 'week' | 'month' | 'all'>('month');

  const { data: orders, isLoading } = useDriverOrderHistory({ 
    serviceType: serviceFilter === 'all' ? undefined : serviceFilter,
    period: periodFilter 
  });

  const filteredOrders = orders?.filter(order => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.id.toLowerCase().includes(query) ||
      order.pickup_location?.toLowerCase().includes(query) ||
      order.destination_location?.toLowerCase().includes(query)
    );
  });

  const handleExport = () => {
    toast.info('Export CSV - Bientôt disponible');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des courses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barre de recherche */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par ID, lieu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon" onClick={handleExport}>
              <Download className="h-4 w-4" />
            </Button>
          </div>

          {/* Filtres */}
          <div className="flex gap-2">
            <Select value={serviceFilter} onValueChange={(v: any) => setServiceFilter(v)}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les services</SelectItem>
                <SelectItem value="transport">VTC uniquement</SelectItem>
                <SelectItem value="delivery">Livraison uniquement</SelectItem>
              </SelectContent>
            </Select>

            <Select value={periodFilter} onValueChange={(v: any) => setPeriodFilter(v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="all">Tout l'historique</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Statistiques rapides */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold">{filteredOrders?.length || 0}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Complétées</p>
              <p className="text-lg font-bold text-green-600">
                {filteredOrders?.filter(o => o.status === 'completed' || o.status === 'delivered').length || 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Annulées</p>
              <p className="text-lg font-bold text-red-600">
                {filteredOrders?.filter(o => o.status === 'cancelled').length || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des courses */}
      <div className="space-y-3">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Chargement...
            </CardContent>
          </Card>
        ) : filteredOrders && filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <OrderHistoryCard key={order.id} order={order} />
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Aucune course trouvée
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DriverOrderHistory;
