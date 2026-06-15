import React from 'react';
import { useMarketplaceOrders } from '@/hooks/useMarketplaceOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Clock, CheckCircle, Package, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const ClientEscrowDashboard: React.FC = () => {
  const { orders, loading, refetch } = useMarketplaceOrders();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Filtrer les commandes avec escrow actif
  const escrowOrders = orders?.filter(o => 
    ['pending', 'preparing', 'ready_for_pickup', 'in_transit', 'delivered'].includes(o.status) &&
    o.status !== 'completed'
  ) || [];

  // Calculer le total en escrow
  const totalEscrow = escrowOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const handleCompleteOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('marketplace_orders')
        .update({ status: 'completed' })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: '✅ Réception validée',
        description: 'Les fonds ont été libérés au vendeur',
      });

      refetch();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'En attente', variant: 'secondary' },
      preparing: { label: 'En préparation', variant: 'default' },
      ready_for_pickup: { label: 'Prêt', variant: 'default' },
      in_transit: { label: 'En transit', variant: 'default' },
      delivered: { label: 'Livré', variant: 'outline' },
    };

    const config = statusConfig[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header avec total escrow */}
      <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-3 bg-primary/20 rounded-full">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Fonds en Séquestre</h2>
              <p className="text-sm text-muted-foreground font-normal">Protégés jusqu'à validation</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-primary">
              {totalEscrow.toLocaleString()}
            </span>
            <span className="text-xl text-muted-foreground">CDF</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {escrowOrders.length} commande{escrowOrders.length > 1 ? 's' : ''} en protection
          </p>
        </CardContent>
      </Card>

      {/* Liste des commandes avec escrow */}
      {escrowOrders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun fonds en séquestre</h3>
            <p className="text-muted-foreground mb-6">
              Vos fonds seront protégés automatiquement lors de vos achats
            </p>
            <Button onClick={() => navigate('/marketplace')}>
              Découvrir le marketplace
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {escrowOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{order.product?.title || 'Produit'}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(order.status)}
                      <span className="text-sm text-muted-foreground">
                        Commande #{order.id.slice(0, 8)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-primary">
                      {order.total_amount?.toLocaleString()} CDF
                    </p>
                    <p className="text-xs text-muted-foreground">En protection</p>
                  </div>
                </div>

                {/* Timer de livraison estimé */}
                {order.status === 'in_transit' && (
                  <div className="p-3 bg-primary/10 rounded-lg mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-medium">Livraison estimée :</span>
                      <span>Aujourd'hui, avant 18h00</span>
                    </div>
                  </div>
                )}

                {/* Message d'alerte si livré */}
                {order.status === 'delivered' && (
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg mb-4 border border-orange-200 dark:border-orange-800">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-orange-900 dark:text-orange-200 text-sm">
                          Produit livré - Validation requise
                        </p>
                        <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                          Veuillez confirmer la réception pour libérer les fonds au vendeur
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {order.status === 'delivered' ? (
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleCompleteOrder(order.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Valider la réception
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => navigate(`/marketplace?tab=orders`)}
                    >
                      Suivre ma commande
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
