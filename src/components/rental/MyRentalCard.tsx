import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, MapPin, Clock, Car, AlertCircle, Wallet, CheckCircle2, Loader2, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RentalBooking {
  id: string;
  start_date: string;
  end_date: string;
  total_price?: number;
  total_amount?: number;
  deposit_amount?: number;
  deposit_paid?: boolean;
  deposit_paid_at?: string;
  deposit_percentage?: number;
  remaining_amount?: number;
  status: 'pending' | 'approved_by_partner' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rejected' | 'no_show';
  payment_status: 'pending' | 'paid' | 'refunded';
  pickup_location?: string;
  dropoff_location?: string;
  return_location?: string;
  special_requests?: string;
  created_at: string;
  rental_vehicles?: {
    id: string;
    brand: string;
    model: string;
    year: number;
    daily_rate: number;
    images?: string[];
  };
}

interface MyRentalCardProps {
  booking: RentalBooking;
  onCancel?: (bookingId: string) => void;
  onPayDeposit?: (booking: RentalBooking) => void;
  onPay?: (booking: RentalBooking) => void;
  isPaying?: boolean;
  currency?: string;
}

const getStatusColor = (status: string, depositPaid?: boolean) => {
  if (status === 'approved_by_partner' && !depositPaid) {
    return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
  }
  switch (status) {
    case 'confirmed': return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'approved_by_partner': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    case 'pending': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    case 'cancelled': return 'bg-red-500/10 text-red-600 border-red-500/20';
    case 'rejected': return 'bg-red-500/10 text-red-600 border-red-500/20';
    case 'completed': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    case 'in_progress': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

const getStatusLabel = (status: string, depositPaid?: boolean) => {
  if (status === 'approved_by_partner' && !depositPaid) {
    return 'Acompte à payer';
  }
  if (status === 'approved_by_partner' && depositPaid) {
    return 'Acompte payé ✓';
  }
  switch (status) {
    case 'confirmed': return 'Confirmée';
    case 'pending': return 'En attente partenaire';
    case 'cancelled': return 'Annulée';
    case 'rejected': return 'Rejetée';
    case 'completed': return 'Terminée';
    case 'in_progress': return 'En cours';
    default: return status;
  }
};

export const MyRentalCard: React.FC<MyRentalCardProps> = memo(({ 
  booking, 
  onCancel, 
  onPayDeposit,
  onPay,
  isPaying = false,
  currency = 'XOF'
}) => {
  const vehicle = booking.rental_vehicles;
  const startDate = new Date(booking.start_date);
  const endDate = new Date(booking.end_date);
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const canCancel = booking.status === 'pending' || (booking.status === 'approved_by_partner' && !booking.deposit_paid);
  const isUpcoming = startDate > new Date();
  
  // Système d'acompte
  const totalPrice = booking.total_price || booking.total_amount || 0;
  const depositPercentage = booking.deposit_percentage || 30;
  const depositAmount = booking.deposit_amount || Math.round(totalPrice * (depositPercentage / 100));
  const remainingAmount = booking.remaining_amount || totalPrice - depositAmount;
  const depositPaid = booking.deposit_paid || false;
  
  // Le client peut payer l'acompte après validation partenaire
  const needsDepositPayment = booking.status === 'approved_by_partner' && !depositPaid;
  const isWaitingPartner = booking.status === 'pending';
  const isFullyPaid = booking.payment_status === 'paid';
  
  const returnLocation = booking.dropoff_location || booking.return_location;
  const vehicleImage = vehicle?.images?.[0];

  // Calculer la progression du paiement
  const paymentProgress = isFullyPaid ? 100 : depositPaid ? depositPercentage : 0;

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 bg-card/80 backdrop-blur-sm border-border/50">
      {/* Image du véhicule */}
      {vehicleImage && (
        <div className="relative h-32 bg-gradient-to-br from-primary/10 to-primary/5">
          <img 
            src={vehicleImage} 
            alt={`${vehicle?.brand} ${vehicle?.model}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <div className="absolute top-3 right-3 flex gap-2">
            <Badge className={`${getStatusColor(booking.status, depositPaid)} border backdrop-blur-sm`}>
              {getStatusLabel(booking.status, depositPaid)}
            </Badge>
          </div>
        </div>
      )}

      <CardContent className="p-4">
        {/* En-tête avec véhicule */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Car className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-base">
                {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Véhicule'}
              </h3>
              {vehicle && (
                <p className="text-sm text-muted-foreground">Année {vehicle.year}</p>
              )}
            </div>
          </div>
          {!vehicleImage && (
            <Badge className={`${getStatusColor(booking.status, depositPaid)} border`}>
              {getStatusLabel(booking.status, depositPaid)}
            </Badge>
          )}
        </div>

        {/* Dates */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Du:</span>
            <span className="font-medium">
              {format(startDate, 'dd MMM yyyy', { locale: fr })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Au:</span>
            <span className="font-medium">
              {format(endDate, 'dd MMM yyyy', { locale: fr })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{daysDiff} jour{daysDiff > 1 ? 's' : ''} de location</span>
          </div>
        </div>

        {/* Lieux */}
        {(booking.pickup_location || returnLocation) && (
          <div className="space-y-1 mb-4 text-sm">
            {booking.pickup_location && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground line-clamp-1">
                  {booking.pickup_location}
                </span>
              </div>
            )}
            {returnLocation && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground line-clamp-1">
                  {returnLocation}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Progression du paiement */}
        {(depositPaid || isFullyPaid) && !['cancelled', 'rejected'].includes(booking.status) && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Paiement</span>
              <span>{paymentProgress}%</span>
            </div>
            <Progress value={paymentProgress} className="h-2" />
            <div className="flex justify-between text-xs mt-2">
              <span className="text-green-600 font-medium">
                {depositPaid && !isFullyPaid ? `Acompte: ${depositAmount.toLocaleString()} ${currency}` : ''}
                {isFullyPaid ? 'Payé intégralement' : ''}
              </span>
              {depositPaid && !isFullyPaid && (
                <span className="text-muted-foreground">
                  Reste: {remainingAmount.toLocaleString()} {currency}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Prix et actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div>
            <p className="text-2xl font-bold text-primary">
              {totalPrice.toLocaleString()} {currency}
            </p>
            {vehicle && (
              <p className="text-xs text-muted-foreground">
                {vehicle.daily_rate.toLocaleString()} {currency}/jour
              </p>
            )}
          </div>
          
          {canCancel && isUpcoming && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onCancel?.(booking.id)}
              className="text-destructive hover:bg-destructive/10 border-destructive/30"
            >
              <AlertCircle className="h-4 w-4 mr-1" />
              Annuler
            </Button>
          )}
        </div>

        {/* Section en attente partenaire */}
        {isWaitingPartner && (
          <div className="mt-4 p-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  En attente de validation
                </p>
                <p className="text-xs text-muted-foreground">
                  Le partenaire doit confirmer la disponibilité du véhicule
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Section paiement acompte - après validation partenaire */}
        {needsDepositPayment && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/10 border border-blue-500/30 rounded-xl">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                    Véhicule disponible !
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Payez l'acompte ({depositPercentage}%) pour confirmer
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between bg-white/50 dark:bg-black/20 rounded-lg p-2.5">
                <div>
                  <p className="text-xs text-muted-foreground">Acompte à payer</p>
                  <p className="text-lg font-bold text-blue-600">{depositAmount.toLocaleString()} {currency}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Reste au partenaire</p>
                  <p className="text-sm font-medium">{remainingAmount.toLocaleString()} {currency}</p>
                </div>
              </div>

              <Button 
                onClick={() => onPayDeposit?.(booking)}
                disabled={isPaying}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
              >
                {isPaying ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                Payer l'acompte: {depositAmount.toLocaleString()} {currency}
              </Button>
            </div>
          </div>
        )}

        {/* Section acompte payé - reste à payer au partenaire */}
        {depositPaid && !isFullyPaid && booking.status !== 'completed' && (
          <div className="mt-4 p-4 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 border border-green-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  Acompte payé ✓
                </p>
                <p className="text-xs text-muted-foreground">
                  Reste à payer au partenaire: <span className="font-medium">{remainingAmount.toLocaleString()} {currency}</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

MyRentalCard.displayName = 'MyRentalCard';
