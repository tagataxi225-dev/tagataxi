import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  MessageSquare,
  MapPin,
  Phone,
  Star
} from 'lucide-react';
import { useMarketplaceOrders } from '@/hooks/useMarketplaceOrders';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { formatDistance } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { RatingDialog } from '@/components/rating/RatingDialog';

interface OrderManagementProps {
  isOpen?: boolean;
  onClose?: () => void;
  onStartChat?: (productId: string, sellerId: string) => void;
}

export const OrderManagement: React.FC<OrderManagementProps> = ({ 
  isOpen, 
  onClose, 
  onStartChat 
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    orders, 
    loading, 
    confirmOrder, 
    markAsDelivered, 
    completeOrder, 
    cancelOrder 
  } = useMarketplaceOrders();
  
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [ratingOrderData, setRatingOrderData] = useState<any>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'delivered': return 'bg-green-500';
      case 'completed': return 'bg-emerald-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'confirmed': return Package;
      case 'delivered': return Truck;
      case 'completed': return CheckCircle;
      case 'cancelled': return XCircle;
      default: return Package;
    }
  };

  const handleConfirmOrder = async (orderId: string) => {
    try {
      await confirmOrder(orderId);
      toast({
        title: t('marketplace.orderConfirmed'),
        description: t('marketplace.orderConfirmedDesc'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('marketplace.orderConfirmError'),
        variant: 'destructive',
      });
    }
  };

  const handleMarkDelivered = async (orderId: string) => {
    try {
      await markAsDelivered(orderId);
      toast({
        title: t('marketplace.orderDelivered'),
        description: t('marketplace.orderDeliveredDesc'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('marketplace.orderDeliveredError'),
        variant: 'destructive',
      });
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    try {
      await completeOrder(orderId);
      toast({
        title: t('marketplace.orderCompleted'),
        description: t('marketplace.orderCompletedDesc'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('marketplace.orderCompletedError'),
        variant: 'destructive',
      });
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    
    try {
      await cancelOrder(selectedOrder, cancelReason);
      toast({
        title: t('marketplace.orderCancelled'),
        description: t('marketplace.orderCancelledDesc'),
      });
      setShowCancelDialog(false);
      setCancelReason('');
      setSelectedOrder(null);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('marketplace.orderCancelError'),
        variant: 'destructive',
      });
    }
  };

  const buyerOrders = orders.filter(order => order.buyer_id === user?.id);
  const sellerOrders = orders.filter(order => order.seller_id === user?.id);

  const OrderCard = ({ order, isSeller = false }: { order: any; isSeller?: boolean }) => {
    const StatusIcon = getStatusIcon(order.status);
    const otherParty = isSeller ? order.buyer : order.seller;

    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${getStatusColor(order.status)}`}>
                <StatusIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">{order.product?.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {formatDistance(new Date(order.created_at), new Date(), {
                    addSuffix: true,
                    locale: fr
                  })}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="capitalize">
              {t(`marketplace.status.${order.status}`)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Product Info */}
            <div className="flex items-center gap-3">
              {order.product?.images?.[0] && (
                <img
                  src={order.product.images[0]}
                  alt={order.product.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  {t('marketplace.quantity')}: {order.quantity}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('marketplace.unitPrice')}: {order.unit_price.toLocaleString()} CDF
                </p>
                <p className="font-semibold">
                  {t('marketplace.total')}: {order.total_amount.toLocaleString()} CDF
                </p>
              </div>
            </div>

            {/* Other Party Info */}
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Avatar className="h-10 w-10">
                {otherParty?.avatar_url ? (
                  <img
                    src={otherParty.avatar_url}
                    alt={otherParty.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-semibold">
                    {otherParty?.display_name?.[0]?.toUpperCase()}
                  </div>
                )}
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{otherParty?.display_name}</p>
                <p className="text-sm text-muted-foreground">
                  {isSeller ? t('marketplace.buyer') : t('marketplace.seller')}
                </p>
              </div>
              {otherParty?.phone_number && (
                <Button variant="outline" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Delivery Info */}
            {order.delivery_address && (
              <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t('marketplace.deliveryAddress')}</p>
                  <p className="text-sm text-muted-foreground">{order.delivery_address}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('marketplace.deliveryMethod')}: {t(`marketplace.delivery.${order.delivery_method}`)}
                  </p>
                </div>
              </div>
            )}

            {/* Payment Status */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">{t('marketplace.paymentStatus')}</span>
              <Badge variant={order.payment_status === 'completed' ? 'default' : 'secondary'}>
                {t(`marketplace.payment.${order.payment_status}`)}
              </Badge>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2">
              {onStartChat && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStartChat(order.product_id, isSeller ? order.buyer_id : order.seller_id)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {t('marketplace.chat')}
                </Button>
              )}

              {/* Seller Actions */}
              {isSeller && order.status === 'pending' && (
                <Button
                  size="sm"
                  onClick={() => handleConfirmOrder(order.id)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t('marketplace.confirmOrder')}
                </Button>
              )}

              {isSeller && order.status === 'confirmed' && (
                <Button
                  size="sm"
                  onClick={() => handleMarkDelivered(order.id)}
                >
                  <Truck className="h-4 w-4 mr-2" />
                  {t('marketplace.markDelivered')}
                </Button>
              )}

              {/* Buyer Actions */}
              {!isSeller && order.status === 'delivered' && (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleCompleteOrder(order.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t('marketplace.confirmReceipt')}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border-amber-500/20"
                    onClick={() => {
                      setRatingOrderData(order);
                      setShowRatingDialog(true);
                    }}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    {t('marketplace.rateSeller') || 'Noter le vendeur'}
                  </Button>
                </>
              )}

              {!isSeller && order.status === 'completed' && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border-amber-500/20"
                  onClick={() => {
                    setRatingOrderData(order);
                    setShowRatingDialog(true);
                  }}
                >
                  <Star className="h-4 w-4 mr-2" />
                  {t('marketplace.rateSeller') || 'Noter le vendeur'}
                </Button>
              )}

              {/* Cancel Order */}
              {order.status === 'pending' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setSelectedOrder(order.id);
                    setShowCancelDialog(true);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {t('marketplace.cancelOrder')}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('marketplace.myOrders')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">

      <Tabs defaultValue="purchases" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="purchases">
            {t('marketplace.myPurchases')} ({buyerOrders.length})
          </TabsTrigger>
          <TabsTrigger value="sales">
            {t('marketplace.mySales')} ({sellerOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="purchases" className="space-y-4">
          {buyerOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {t('marketplace.noPurchases')}
              </h3>
              <p className="text-muted-foreground">
                {t('marketplace.startShopping')}
              </p>
            </div>
          ) : (
            buyerOrders.map((order) => (
              <OrderCard key={order.id} order={order} isSeller={false} />
            ))
          )}
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          {sellerOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {t('marketplace.noSales')}
              </h3>
              <p className="text-muted-foreground">
                {t('marketplace.startSelling')}
              </p>
            </div>
          ) : (
            sellerOrders.map((order) => (
              <OrderCard key={order.id} order={order} isSeller={true} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Cancel Order Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('marketplace.cancelOrder')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">{t('marketplace.cancelReason')}</Label>
              <Textarea
                id="reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={t('marketplace.cancelReasonPlaceholder')}
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                {t('common.cancel')}
              </Button>
              <Button variant="destructive" onClick={handleCancelOrder}>
                {t('marketplace.confirmCancel')}
              </Button>
            </div>
          </div>
          </DialogContent>
        </Dialog>

        {/* Rating Dialog */}
        {ratingOrderData && (
          <RatingDialog
            open={showRatingDialog}
            onOpenChange={setShowRatingDialog}
            ratedUserId={ratingOrderData.seller_id}
            ratedUserName={ratingOrderData.seller?.display_name || 'Vendeur'}
            ratedUserType="seller"
            orderId={ratingOrderData.id}
            orderType="marketplace"
            onSuccess={() => {
              toast({
                title: t('marketplace.ratingSuccess') || '⭐ Merci pour votre avis !',
                description: t('marketplace.ratingSuccessDesc') || 'Votre évaluation a été enregistrée',
              });
              setShowRatingDialog(false);
              setRatingOrderData(null);
            }}
          />
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
