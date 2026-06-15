import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Lock, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Wallet,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { FoodEscrowIndicator, EscrowStatus } from './FoodEscrowIndicator';
import { FoodEscrowTimeline } from './FoodEscrowTimeline';

interface EscrowOrder {
  id: string;
  order_number: string;
  total_amount: number;
  escrow_status: EscrowStatus;
  order_status: string;
  created_at: string;
  confirmed_at?: string;
  delivered_at?: string;
  auto_release_at?: string;
  customer_name?: string;
  seller_amount?: number;
}

interface EscrowStats {
  totalPending: number;
  totalReleased: number;
  pendingCount: number;
  releasedCount: number;
  disputedCount: number;
}

export function RestaurantEscrowDashboard() {
  const [orders, setOrders] = useState<EscrowOrder[]>([]);
  const [stats, setStats] = useState<EscrowStats>({
    totalPending: 0,
    totalReleased: 0,
    pendingCount: 0,
    releasedCount: 0,
    disputedCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedOrder, setSelectedOrder] = useState<EscrowOrder | null>(null);
  const { toast } = useToast();

  const fetchEscrowData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get escrow transactions for this restaurant (seller)
      const { data: escrowData, error } = await supabase
        .from('escrow_transactions')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get corresponding food orders
      const orderIds = escrowData?.map(e => e.order_id).filter(Boolean) || [];
      
      let foodOrdersMap: Record<string, any> = {};
      if (orderIds.length > 0) {
        const { data: foodOrders } = await supabase
          .from('food_orders')
          .select('id, order_number, status, confirmed_at, delivered_at, customer_id')
          .in('id', orderIds);
        
        foodOrders?.forEach(order => {
          foodOrdersMap[order.id] = order;
        });
      }

      // Map escrow status
      const mapStatus = (status: string): EscrowStatus => {
        if (status === 'held' || status === 'pending') return 'held';
        if (status === 'released' || status === 'completed') return 'released';
        if (status === 'disputed') return 'disputed';
        if (status === 'refunded') return 'refunded';
        return 'pending';
      };

      const mappedOrders: EscrowOrder[] = (escrowData || []).map(escrow => {
        const foodOrder = foodOrdersMap[escrow.order_id] || {};
        return {
          id: escrow.id,
          order_number: foodOrder.order_number || escrow.order_id?.slice(0, 8) || 'N/A',
          total_amount: escrow.total_amount,
          escrow_status: mapStatus(escrow.status),
          order_status: foodOrder.status || 'unknown',
          created_at: escrow.created_at,
          confirmed_at: foodOrder.confirmed_at,
          delivered_at: foodOrder.delivered_at,
          auto_release_at: escrow.auto_release_at,
          seller_amount: escrow.seller_amount
        };
      });

      setOrders(mappedOrders);

      // Calculate stats
      const pending = mappedOrders.filter(o => o.escrow_status === 'held');
      const released = mappedOrders.filter(o => o.escrow_status === 'released');
      const disputed = mappedOrders.filter(o => o.escrow_status === 'disputed');

      setStats({
        totalPending: pending.reduce((sum, o) => sum + (o.seller_amount || o.total_amount), 0),
        totalReleased: released.reduce((sum, o) => sum + (o.seller_amount || o.total_amount), 0),
        pendingCount: pending.length,
        releasedCount: released.length,
        disputedCount: disputed.length
      });

    } catch (error) {
      console.error('Error fetching escrow data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données escrow",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscrowData();
  }, []);

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'pending') return order.escrow_status === 'held';
    if (activeTab === 'released') return order.escrow_status === 'released';
    if (activeTab === 'disputed') return order.escrow_status === 'disputed';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div whileHover={{ scale: 1.02 }}>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">En attente</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {stats.totalPending.toLocaleString()} <span className="text-sm font-normal">CDF</span>
                  </p>
                  <p className="text-xs text-blue-500 dark:text-blue-400">
                    {stats.pendingCount} commande(s)
                  </p>
                </div>
                <div className="p-3 bg-blue-200 dark:bg-blue-800/50 rounded-xl">
                  <Lock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }}>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">Libéré</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {stats.totalReleased.toLocaleString()} <span className="text-sm font-normal">CDF</span>
                  </p>
                  <p className="text-xs text-green-500 dark:text-green-400">
                    {stats.releasedCount} commande(s)
                  </p>
                </div>
                <div className="p-3 bg-green-200 dark:bg-green-800/50 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total reçu</p>
                  <p className="text-2xl font-bold text-primary">
                    {stats.totalReleased.toLocaleString()} <span className="text-sm font-normal">CDF</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Montant net après commission
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {stats.disputedCount > 0 && (
          <motion.div whileHover={{ scale: 1.02 }}>
            <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border-red-200 dark:border-red-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-destructive font-medium">Litiges</p>
                    <p className="text-2xl font-bold text-destructive">
                      {stats.disputedCount}
                    </p>
                    <p className="text-xs text-destructive/80">
                      À résoudre
                    </p>
                  </div>
                  <div className="p-3 bg-destructive/20 rounded-xl">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Gestion Escrow
              </CardTitle>
              <CardDescription>
                Suivi des paiements sécurisés de vos commandes
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchEscrowData}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="pending" className="gap-2">
                <Lock className="h-4 w-4" />
                En attente
                {stats.pendingCount > 0 && (
                  <Badge variant="secondary" className="ml-1">{stats.pendingCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="released" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Libérés
              </TabsTrigger>
              <TabsTrigger value="disputed" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                Litiges
                {stats.disputedCount > 0 && (
                  <Badge variant="destructive" className="ml-1">{stats.disputedCount}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[400px]">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Lock className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Aucune commande dans cette catégorie</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  <div className="space-y-3">
                    {filteredOrders.map((order, index) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card 
                          className={cn(
                            "cursor-pointer hover:shadow-md transition-all",
                            selectedOrder?.id === order.id && "ring-2 ring-primary"
                          )}
                          onClick={() => setSelectedOrder(
                            selectedOrder?.id === order.id ? null : order
                          )}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold">#{order.order_number}</span>
                                  {order.customer_name && (
                                    <span className="text-sm text-muted-foreground truncate">
                                      • {order.customer_name}
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {format(new Date(order.created_at), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                                </div>
                                {order.auto_release_at && order.escrow_status === 'held' && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                      Auto-libération {formatDistanceToNow(new Date(order.auto_release_at), { locale: fr, addSuffix: true })}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-right shrink-0">
                                <FoodEscrowIndicator
                                  status={order.escrow_status}
                                  amount={order.seller_amount || order.total_amount}
                                  autoReleaseAt={order.auto_release_at}
                                  compact
                                />
                                <p className="text-lg font-bold mt-1">
                                  {(order.seller_amount || order.total_amount).toLocaleString()} CDF
                                </p>
                              </div>
                            </div>

                            {/* Expanded Timeline */}
                            <AnimatePresence>
                              {selectedOrder?.id === order.id && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="pt-4 mt-4 border-t">
                                    <FoodEscrowTimeline
                                      orderStatus={order.order_status}
                                      escrowStatus={order.escrow_status}
                                      createdAt={order.created_at}
                                      confirmedAt={order.confirmed_at}
                                      deliveredAt={order.delivered_at}
                                      releasedAt={order.escrow_status === 'released' ? order.delivered_at : undefined}
                                    />
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </ScrollArea>
          </Tabs>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium mb-1">Comment fonctionne l'escrow ?</h4>
              <p className="text-sm text-muted-foreground">
                Les fonds sont sécurisés dès la commande et automatiquement libérés 48h après la livraison.
                En cas de litige, notre équipe intervient pour une résolution équitable.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
