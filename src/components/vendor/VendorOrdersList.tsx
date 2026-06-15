import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useVendorOrders } from '@/hooks/useVendorOrders';
import { VendorOrderValidationPanel } from '@/components/marketplace/VendorOrderValidationPanel';
import { VendorOrderManagementInterface } from '@/components/marketplace/VendorOrderManagementInterface';
import { VendorEscrowSummary } from '@/components/vendor/VendorEscrowSummary';
import { Package, CheckCircle, Clock, Truck, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StaggerContainer, StaggerItem } from './animations';

interface VendorOrdersListProps {
  onRefresh?: () => void;
}

const tabContentVariants = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 10 }
};

export const VendorOrdersList = ({ onRefresh }: VendorOrdersListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { 
    pendingOrders, 
    loading: pendingLoading, 
    confirmOrder, 
    rejectOrder,
    loadPendingOrders 
  } = useVendorOrders();

  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTabKey, setActiveTabKey] = useState('pending');

  const loadActiveAndCompletedOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data: vendorProducts, error: productsError } = await supabase
        .from('marketplace_products')
        .select('id, title, images, price')
        .eq('seller_id', user.id);

      if (productsError) throw productsError;

      if (!vendorProducts || vendorProducts.length === 0) {
        setActiveOrders([]);
        setCompletedOrders([]);
        return;
      }

      const vendorProductIds = vendorProducts.map(p => p.id);

      // Inclure 'assigned_to_driver' et 'picked_up_by_driver' dans les statuts actifs
      const { data: active, error: activeError } = await supabase
        .from('marketplace_orders')
        .select('*')
        .in('product_id', vendorProductIds)
        .in('status', ['confirmed', 'preparing', 'ready_for_pickup', 'assigned_to_driver', 'picked_up_by_driver', 'in_transit'])
        .order('created_at', { ascending: false });

      if (activeError) throw activeError;

      const { data: completed, error: completedError } = await supabase
        .from('marketplace_orders')
        .select('*')
        .in('product_id', vendorProductIds)
        .in('status', ['completed', 'delivered'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (completedError) throw completedError;

      const allOrders = [...(active || []), ...(completed || [])];
      const buyerIds = [...new Set(allOrders.map(o => o.buyer_id).filter(Boolean))];
      
      let buyersMap: Record<string, { display_name: string; phone_number: string }> = {};
      if (buyerIds.length > 0) {
        const { data: buyers } = await supabase
          .from('clients')
          .select('user_id, display_name, phone_number')
          .in('user_id', buyerIds);
        
        if (buyers) {
          buyersMap = buyers.reduce((acc, b) => {
            acc[b.user_id] = { display_name: b.display_name, phone_number: b.phone_number };
            return acc;
          }, {} as Record<string, { display_name: string; phone_number: string }>);
        }
      }

      const enrichOrders = (orders: any[]) => 
        orders.map(order => ({
          ...order,
          product: vendorProducts.find(p => p.id === order.product_id),
          buyer: buyersMap[order.buyer_id] || null
        }));

      setActiveOrders(enrichOrders(active || []));
      setCompletedOrders(enrichOrders(completed || []));
    } catch (error: any) {
      console.error('Error loading orders:', error);
      
      const errorMessage = error.message?.includes('permission')
        ? "Vous n'avez pas les permissions nécessaires"
        : error.message?.includes('network')
        ? "Problème de connexion réseau"
        : "Impossible de charger les commandes";
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadPendingOrders();
      loadActiveAndCompletedOrders();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('vendor-orders-all')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'marketplace_orders',
          filter: `seller_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Order updated:', payload);
          
          loadPendingOrders();
          loadActiveAndCompletedOrders();
          onRefresh?.();
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: "🎉 Nouvelle commande !",
              description: "Vous avez reçu une nouvelle commande"
            });
          } else if (payload.eventType === 'UPDATE') {
            const newStatus = (payload.new as any).status;
            if (newStatus === 'confirmed') {
              toast({
                title: "✅ Commande confirmée",
                description: "Votre validation a été enregistrée"
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleOrderComplete = async (orderId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('marketplace_orders')
        .update({ 
          status: 'completed', 
          completed_at: new Date().toISOString() 
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      const { error: releaseError } = await supabase.functions.invoke('release-escrow-payment', {
        body: { orderId }
      });

      if (releaseError) {
        console.error('Escrow release error:', releaseError);
        toast({ 
          title: "Attention", 
          description: "Commande terminée mais erreur lors de la libération du paiement" 
        });
      } else {
        toast({ 
          title: "✅ Commande terminée", 
          description: "Le paiement a été libéré sur votre wallet vendeur" 
        });
      }

      loadPendingOrders();
      loadActiveAndCompletedOrders();
      onRefresh?.();
    } catch (error) {
      console.error('Error completing order:', error);
      toast({ 
        title: "Erreur", 
        description: "Impossible de terminer la commande", 
        variant: "destructive" 
      });
    }
  };

  const exportToCSV = () => {
    try {
      const allOrders = [...pendingOrders, ...activeOrders, ...completedOrders];
      const csvData = allOrders.map(order => ({
        'ID Commande': order.id,
        'Produit': order.product?.title || 'N/A',
        'Client': order.buyer_phone || 'N/A',
        'Quantité': order.quantity,
        'Montant': order.total_amount,
        'Statut': order.status,
        'Date': new Date(order.created_at).toLocaleDateString('fr-FR')
      }));

      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(h => row[h as keyof typeof row]).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `commandes_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast({
        title: "✅ Export réussi",
        description: "Le fichier CSV a été téléchargé"
      });
    } catch (error) {
      console.error('Error exporting:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'exporter les commandes",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { className: string; label: string; icon: any }> = {
      'pending': { className: 'gap-1 border border-amber-300 text-amber-700 bg-amber-50', label: 'En attente', icon: Clock },
      'awaiting_vendor_confirmation': { className: 'gap-1 border border-amber-300 text-amber-700 bg-amber-50', label: 'À valider', icon: Clock },
      'confirmed': { className: 'gap-1 border border-amber-300 text-amber-700 bg-amber-50', label: 'Confirmée', icon: CheckCircle },
      'preparing': { className: 'gap-1 bg-blue-500 text-white border-transparent hover:bg-blue-500/80', label: 'En préparation', icon: Package },
      'ready_for_pickup': { className: 'gap-1 bg-blue-500 text-white border-transparent hover:bg-blue-500/80', label: 'Prête', icon: Package },
      'assigned_to_driver': { className: 'gap-1 bg-blue-500 text-white border-transparent hover:bg-blue-500/80', label: 'Livreur assigné', icon: Truck },
      'picked_up_by_driver': { className: 'gap-1 bg-blue-500 text-white border-transparent hover:bg-blue-500/80', label: 'Récupérée', icon: Truck },
      'in_transit': { className: 'gap-1 bg-blue-500 text-white border-transparent hover:bg-blue-500/80', label: 'En livraison', icon: Truck },
      'delivered': { className: 'gap-1 bg-emerald-500 text-white border-transparent hover:bg-emerald-500/80', label: 'Livrée', icon: CheckCircle },
      'completed': { className: 'gap-1 bg-emerald-500 text-white border-transparent hover:bg-emerald-500/80', label: 'Terminée', icon: CheckCircle }
    };

    const config = configs[status] || { className: 'gap-1', label: status, icon: Clock };
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading || pendingLoading) {
    return (
      <div className="space-y-4">
        {/* Tabs Skeleton avec animation */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-2 border-b pb-2"
        >
          {[1, 2, 3].map(i => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="h-10 w-32 bg-gradient-to-r from-muted via-muted/50 to-muted rounded animate-pulse" 
            />
          ))}
        </motion.div>
        
        {/* Orders Grid Skeleton */}
        <StaggerContainer className="space-y-4" staggerDelay={0.08}>
          {[1, 2, 3].map(i => (
            <StaggerItem key={i}>
              <Card className="overflow-hidden">
                <CardHeader>
                  <div className="flex justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="h-5 w-3/4 bg-muted/60 rounded animate-pulse" />
                      <div className="h-4 w-1/2 bg-muted/60 rounded animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-6 w-20 bg-muted/60 rounded animate-pulse" />
                      <div className="h-3 w-16 bg-muted/60 rounded animate-pulse" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-10 w-full bg-muted/60 rounded animate-pulse" />
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    );
  }

  const totalOrders = pendingOrders.length + activeOrders.length + completedOrders.length;

  return (
    <div className="space-y-4">
      {/* Résumé financier escrow avec animation */}
      {totalOrders > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <VendorEscrowSummary />
        </motion.div>
      )}
      
      {/* Export Button avec animation */}
      {totalOrders > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex justify-end"
        >
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportToCSV}
            className="transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </motion.div>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs 
          defaultValue="pending" 
          className="space-y-4"
          onValueChange={setActiveTabKey}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="relative">
              À traiter
              {pendingOrders.length > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  <Badge 
                    variant="destructive" 
                    className="ml-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center animate-pulse"
                  >
                    {pendingOrders.length > 99 ? '99+' : pendingOrders.length}
                  </Badge>
                </motion.div>
              )}
            </TabsTrigger>
            <TabsTrigger value="active">
              En cours ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Terminées ({completedOrders.length})
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="pending" key="pending">
              <motion.div
                variants={tabContentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.25 }}
              >
                <VendorOrderValidationPanel 
                  orders={pendingOrders} 
                  onRefresh={() => {
                    loadPendingOrders();
                    loadActiveAndCompletedOrders();
                    onRefresh?.();
                  }} 
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="active" key="active">
              <motion.div
                variants={tabContentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.25 }}
              >
                <StaggerContainer className="space-y-4" staggerDelay={0.06}>
                  {activeOrders.length === 0 ? (
                    <StaggerItem>
                      <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Aucune commande en cours</p>
                        </CardContent>
                      </Card>
                    </StaggerItem>
                  ) : (
                    activeOrders.map((order) => (
                      <StaggerItem key={order.id}>
                        <VendorOrderManagementInterface 
                          order={order}
                          onStatusUpdate={() => {
                            loadPendingOrders();
                            loadActiveAndCompletedOrders();
                            onRefresh?.();
                          }}
                        />
                      </StaggerItem>
                    ))
                  )}
                </StaggerContainer>
              </motion.div>
            </TabsContent>

            <TabsContent value="completed" key="completed">
              <motion.div
                variants={tabContentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.25 }}
              >
                <StaggerContainer className="space-y-4" staggerDelay={0.06}>
                  {completedOrders.length === 0 ? (
                    <StaggerItem>
                      <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                          <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Aucune commande terminée</p>
                        </CardContent>
                      </Card>
                    </StaggerItem>
                  ) : (
                    completedOrders.map((order) => (
                      <StaggerItem key={order.id}>
                        <motion.div 
                          whileHover={{ scale: 1.01 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <Card>
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <CardTitle className="text-base flex items-center gap-2">
                                    {order.product?.title || 'Produit'}
                                    {getStatusBadge(order.status)}
                                  </CardTitle>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Client: {order.buyer?.display_name || 'Non renseigné'}
                                    {order.buyer_phone && ` • ${order.buyer_phone}`} • Qté: {order.quantity}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-green-600">{order.total_amount.toLocaleString()} CDF</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(order.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </CardHeader>
                          </Card>
                        </motion.div>
                      </StaggerItem>
                    ))
                  )}
                </StaggerContainer>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </motion.div>
    </div>
  );
};
