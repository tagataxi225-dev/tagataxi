import { useState } from 'react';
import { useVendorSalesHistory } from '@/hooks/useVendorSalesHistory';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Download, TrendingUp, DollarSign, Package, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const VendorSalesHistory = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');

  const { sales, loading, totalRevenue, totalSales } = useVendorSalesHistory();

  const filteredSales = sales?.filter(sale => {
    const matchesSearch = sale.product_title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Historique des Ventes</h2>
        <p className="text-muted-foreground">
          Consultez toutes vos transactions et commissions
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Revenu Total</p>
              <p className="text-xl font-bold">{totalRevenue?.toLocaleString() || 0} CDF</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ventes Totales</p>
              <p className="text-xl font-bold">{totalSales || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Panier Moyen</p>
              <p className="text-xl font-bold">
                {totalSales ? Math.round(totalRevenue / totalSales).toLocaleString() : 0} CDF
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="completed">Livré</SelectItem>
              <SelectItem value="pending">En cours</SelectItem>
              <SelectItem value="cancelled">Annulé</SelectItem>
            </SelectContent>
          </Select>

          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes périodes</SelectItem>
              <SelectItem value="today">Aujourd'hui</SelectItem>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </Card>

      {/* Sales List */}
      <div className="space-y-3">
        {filteredSales && filteredSales.length > 0 ? (
          filteredSales.map((sale) => (
            <Card key={sale.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{sale.product_title}</h3>
                    <Badge variant={
                      sale.status === 'completed' ? 'default' :
                      sale.status === 'pending' ? 'secondary' : 'destructive'
                    }>
                      {sale.status === 'completed' ? 'Livré' :
                       sale.status === 'pending' ? 'En cours' : 'Annulé'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {sale.created_at && format(new Date(sale.created_at), 'dd MMM yyyy', { locale: fr })}
                    </span>
                    <span>Qté: {sale.quantity}</span>
                    <span>Client: {sale.buyer_name || 'Non renseigné'}</span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold">{sale.total_amount?.toLocaleString()} CDF</p>
                  <p className="text-sm text-muted-foreground">
                    Commission: {sale.commission?.toLocaleString() || 0} CDF
                  </p>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Aucune vente trouvée</h3>
            <p className="text-sm text-muted-foreground">
              Vos ventes apparaîtront ici une fois que vous aurez des commandes
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};
