import { useState, useEffect } from 'react';
import { useFoodClientOrders, FoodOrder } from '@/hooks/useFoodClientOrders';
import { FoodOrderCard } from '@/components/food/FoodOrderCard';
import { FoodDeliveryFeeApprovalDialog } from '@/components/food/FoodDeliveryFeeApprovalDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingBag, PackageCheck, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FoodFooterNav } from '@/components/food/FoodFooterNav';
import { FoodBackToTop } from '@/components/food/FoodBackToTop';
import { useAuth } from '@/hooks/useAuth';

export default function FoodOrders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeOrders, completedOrders, cancelledOrders, isLoading, cancelOrder, isCancelling, refetch } = useFoodClientOrders();
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'cancelled'>('active');
  const [pendingApprovalOrder, setPendingApprovalOrder] = useState<FoodOrder | null>(null);

  // Détecter les commandes en attente d'approbation de frais de livraison
  useEffect(() => {
    if (!user?.id) return;
    
    const pending = activeOrders.find(o => 
      (o.status === 'pending_delivery_approval' || o.delivery_payment_status === 'pending_approval') &&
      o.client_id === user.id
    );
    
    if (pending && (!pendingApprovalOrder || pending.id !== pendingApprovalOrder.id)) {
      setPendingApprovalOrder(pending);
    }
  }, [activeOrders, user?.id, pendingApprovalOrder]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background pb-24">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="container max-w-2xl mx-auto px-4 py-4">
            <Skeleton className="h-8 w-48" />
          </div>
        </div>
        <div className="container max-w-2xl mx-auto px-4 py-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const renderEmptyState = (icon: React.ReactNode, title: string, description: string) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-12 text-center"
    >
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6">{description}</p>
      <Button onClick={() => navigate('/food')} className="gap-2">
        <ShoppingBag className="w-4 h-4" />
        Commander maintenant
      </Button>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/food')}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Mes Commandes</h1>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="active" className="gap-2">
                <PackageCheck className="w-4 h-4" />
                En cours ({activeOrders.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-2">
                <PackageCheck className="w-4 h-4" />
                Livrées ({completedOrders.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="gap-2">
                <XCircle className="w-4 h-4" />
                Annulées ({cancelledOrders.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <Tabs value={activeTab}>
          {/* Active Orders */}
          <TabsContent value="active" className="space-y-4 mt-0">
            {activeOrders.length === 0 ? (
              renderEmptyState(
                '📦',
                'Aucune commande en cours',
                'Vos commandes actives apparaîtront ici'
              )
            ) : (
              activeOrders.map((order) => (
                <FoodOrderCard
                  key={order.id}
                  order={order}
                  onCancel={(id, reason) => cancelOrder({ orderId: id, reason })}
                  isCancelling={isCancelling}
                />
              ))
            )}
          </TabsContent>

          {/* Completed Orders */}
          <TabsContent value="completed" className="space-y-4 mt-0">
            {completedOrders.length === 0 ? (
              renderEmptyState(
                '✨',
                'Aucune commande livrée',
                'Vos commandes terminées s\'afficheront ici'
              )
            ) : (
              completedOrders.map((order) => (
                <FoodOrderCard key={order.id} order={order} />
              ))
            )}
          </TabsContent>

          {/* Cancelled Orders */}
          <TabsContent value="cancelled" className="space-y-4 mt-0">
            {cancelledOrders.length === 0 ? (
              renderEmptyState(
                '🎉',
                'Aucune commande annulée',
                'Parfait ! Vous n\'avez pas de commandes annulées'
              )
            ) : (
              cancelledOrders.map((order) => (
                <FoodOrderCard key={order.id} order={order} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Dialog d'approbation des frais de livraison */}
      {pendingApprovalOrder && (
        <FoodDeliveryFeeApprovalDialog
          order={{
            id: pendingApprovalOrder.id,
            status: 'pending_delivery_approval',
            customer_id: pendingApprovalOrder.client_id,
            total_amount: pendingApprovalOrder.total_amount,
            delivery_fee: pendingApprovalOrder.delivery_fee,
            restaurant: { name: pendingApprovalOrder.restaurant_name || 'Restaurant' },
            items: pendingApprovalOrder.items
          }}
          open={!!pendingApprovalOrder}
          onOpenChange={(open) => {
            if (!open) setPendingApprovalOrder(null);
          }}
          onApproved={() => {
            setPendingApprovalOrder(null);
            refetch();
          }}
        />
      )}
      
      <FoodBackToTop />
      <FoodFooterNav />
    </div>
  );
}
