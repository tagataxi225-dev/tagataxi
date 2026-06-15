import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Package, MapPin, Calendar, DollarSign, Star } from 'lucide-react';
import { RatingDialog } from '../rating/RatingDialog';

export const DeliveryHistory = () => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingDialog, setRatingDialog] = useState<{
    ratedUserId: string;
    ratedUserName: string;
    orderId: string;
  } | null>(null);

  const loadDeliveries = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('delivery_orders')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'delivered')
        .order('delivered_at', { ascending: false });

      if (error) throw error;
      setDeliveries(data || []);
    } catch (error) {
      console.error('Error loading deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveries();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (deliveries.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune livraison</h3>
          <p className="text-muted-foreground text-center">
            Vos livraisons terminées apparaîtront ici
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {deliveries.map((delivery) => (
        <Card key={delivery.id} className="hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  Livrée
                </Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(delivery.delivered_at || delivery.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>

              {/* Delivery Type */}
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                <span className="font-medium">
                  {delivery.delivery_type === 'flash' ? 'Flash - Livraison Express' :
                   delivery.delivery_type === 'flex' ? 'Flex - Camionnette' :
                   'MaxiCharge - Gros Colis'}
                </span>
              </div>

              {/* Locations */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Récupération</p>
                    <p className="text-sm text-muted-foreground">{delivery.pickup_location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-destructive mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Livraison</p>
                    <p className="text-sm text-muted-foreground">{delivery.delivery_location}</p>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center gap-2 text-lg font-semibold">
                <DollarSign className="w-5 h-5" />
                {delivery.actual_price?.toLocaleString() || delivery.estimated_price?.toLocaleString()} CDF
              </div>

              {/* Actions */}
              <Separator />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => setRatingDialog({
                    ratedUserId: delivery.driver_id || '',
                    ratedUserName: 'Livreur',
                    orderId: delivery.id
                  })}
                  disabled={!delivery.driver_id}
                >
                  <Star className="w-4 h-4" />
                  Noter le livreur
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Rating Dialog */}
      {ratingDialog && (
        <RatingDialog
          open={!!ratingDialog}
          onOpenChange={(open) => !open && setRatingDialog(null)}
          ratedUserId={ratingDialog.ratedUserId}
          ratedUserName={ratingDialog.ratedUserName}
          ratedUserType="delivery_driver"
          orderId={ratingDialog.orderId}
          orderType="delivery"
          onSuccess={() => {
            loadDeliveries();
            setRatingDialog(null);
          }}
        />
      )}
    </div>
  );
};
