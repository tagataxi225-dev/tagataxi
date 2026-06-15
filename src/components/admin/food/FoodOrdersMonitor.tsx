import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RefreshCw, MoreVertical, Eye, Phone, XCircle, Check, Clock, CheckCircle, Truck } from 'lucide-react';
import { useAdminFoodOrders } from '@/hooks/admin/useAdminFoodOrders';

export const FoodOrdersMonitor = () => {
  const { orders, loading, fetchOrders, cancelOrder } = useAdminFoodOrders();
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchOrders(filterStatus);
  }, [filterStatus]);

  const filteredOrders = orders.filter(order => 
    filterStatus === 'all' || order.status === filterStatus
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'secondary', label: 'En attente', icon: Clock },
      confirmed: { variant: 'default', label: 'Confirmée', icon: Check },
      preparing: { variant: 'default', label: 'En préparation', icon: Clock },
      ready: { variant: 'default', label: 'Prête', icon: CheckCircle },
      picked_up: { variant: 'default', label: 'Récupérée', icon: Truck },
      delivered: { variant: 'default', label: 'Livrée', icon: CheckCircle },
      cancelled: { variant: 'destructive', label: 'Annulée', icon: XCircle },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Commandes en temps réel</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="animate-pulse">
              {filteredOrders.length} actives
            </Badge>
            <Button variant="outline" size="sm" onClick={() => fetchOrders(filterStatus)}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={filterStatus} onValueChange={setFilterStatus}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="pending">En attente</TabsTrigger>
            <TabsTrigger value="preparing">Préparation</TabsTrigger>
            <TabsTrigger value="picked_up">En livraison</TabsTrigger>
            <TabsTrigger value="delivered">Terminées</TabsTrigger>
          </TabsList>
        </Tabs>

        <ScrollArea className="h-[600px]">
          {loading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune commande trouvée
            </div>
          ) : (
            filteredOrders.map((order) => (
              <Card key={order.id} className="mb-3">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg">#{order.order_number}</span>
                        {getStatusBadge(order.status)}
                      </div>

                      <div className="mt-2 space-y-1">
                        <p className="text-sm font-medium">{order.restaurant?.restaurant_name || 'Restaurant'}</p>
                        <p className="text-sm text-muted-foreground">
                          {Array.isArray(order.items) ? order.items.length : 0} article(s) • {formatPrice(order.total_amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Client: {order.customer?.display_name || 'Client'} • {order.delivery_phone}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir détails
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Phone className="h-4 w-4 mr-2" />
                          Contacter restaurant
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Phone className="h-4 w-4 mr-2" />
                          Contacter client
                        </DropdownMenuItem>
                        {order.status !== 'cancelled' && (
                          <DropdownMenuItem 
                            onClick={() => cancelOrder(order.id, 'Annulation administrative')}
                            className="text-destructive"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Annuler commande
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
