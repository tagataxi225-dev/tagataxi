import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useClientBookings } from '@/hooks/useClientBookings';
import { MapPin, Calendar, DollarSign, Star, Receipt } from 'lucide-react';
import { RatingDialog } from '../rating/RatingDialog';

export const TransportHistory = () => {
  const { bookingHistory, loadBookingHistory } = useClientBookings();
  const [ratingDialog, setRatingDialog] = useState<{
    ratedUserId: string;
    ratedUserName: string;
    orderId: string;
  } | null>(null);

  if (!bookingHistory || bookingHistory.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Receipt className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun historique</h3>
          <p className="text-muted-foreground text-center">
            Vos courses terminées apparaîtront ici
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {bookingHistory.map((booking) => (
        <Card key={booking.id} className="hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  Terminée
                </Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(booking.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>

              {/* Locations */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Départ</p>
                    <p className="text-sm text-muted-foreground">{booking.pickup_location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-destructive mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Arrivée</p>
                    <p className="text-sm text-muted-foreground">{booking.destination}</p>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center gap-2 text-lg font-semibold">
                <DollarSign className="w-5 h-5" />
                {booking.actual_price?.toLocaleString() || booking.estimated_price?.toLocaleString()} CDF
              </div>

              {/* Actions */}
              <Separator />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => setRatingDialog({
                    ratedUserId: booking.driver_id || '',
                    ratedUserName: booking.driver_name || 'Chauffeur',
                    orderId: booking.id
                  })}
                >
                  <Star className="w-4 h-4" />
                  Noter le chauffeur
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
          ratedUserType="driver"
          orderId={ratingDialog.orderId}
          orderType="transport"
          onSuccess={() => {
            loadBookingHistory();
            setRatingDialog(null);
          }}
        />
      )}
    </div>
  );
};
