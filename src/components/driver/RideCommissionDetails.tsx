import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Receipt, TrendingDown, Wallet, Car, Truck, Building2, Percent } from 'lucide-react';
import { RideCommission } from '@/hooks/useRideCommissionHistory';

interface RideCommissionDetailsProps {
  commission: RideCommission;
}

export const RideCommissionDetails = ({ commission }: RideCommissionDetailsProps) => {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(Math.round(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Détails de la course
          </CardTitle>
          <Badge variant={commission.ride_type === 'transport' ? 'default' : 'secondary'}>
            {commission.ride_type === 'transport' ? (
              <><Car className="h-3 w-3 mr-1" /> Transport</>
            ) : (
              <><Truck className="h-3 w-3 mr-1" /> Livraison</>
            )}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatDate(commission.created_at)}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Montant client */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Montant client</span>
          </div>
          <span className="font-semibold text-lg">
            {formatAmount(commission.ride_amount)} CDF
          </span>
        </div>

        <Separator />

        {/* Déductions */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Commissions prélevées
          </p>

          {/* Commission Tembea */}
          <div className="flex items-center justify-between pl-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-sm">TAGA ({commission.kwenda_rate}%)</span>
            </div>
            <span className="text-sm font-medium text-destructive">
              -{formatAmount(commission.kwenda_commission)} CDF
            </span>
          </div>

          {/* Commission Partenaire */}
          {commission.partner_rate > 0 && (
            <div className="flex items-center justify-between pl-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-sm flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  Partenaire ({commission.partner_rate}%)
                </span>
              </div>
              <span className="text-sm font-medium text-destructive">
                -{formatAmount(commission.partner_commission)} CDF
              </span>
            </div>
          )}

          {/* Total commissions */}
          <div className="flex items-center justify-between pl-6 pt-2 border-t border-dashed">
            <span className="text-sm text-muted-foreground">Total prélevé</span>
            <span className="text-sm font-medium text-destructive">
              -{formatAmount(commission.kwenda_commission + commission.partner_commission)} CDF
            </span>
          </div>
        </div>

        <Separator />

        {/* Gain net */}
        <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
          <div>
            <p className="text-sm text-muted-foreground">Votre gain net</p>
            <p className="text-xs text-muted-foreground">
              ({100 - commission.kwenda_rate - commission.partner_rate}% du montant)
            </p>
          </div>
          <span className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatAmount(commission.driver_net_amount)} CDF
          </span>
        </div>

        {/* Status */}
        <div className="flex items-center justify-center pt-2">
          <Badge 
            variant={commission.payment_status === 'paid' ? 'default' : 'secondary'}
            className={commission.payment_status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
          >
            {commission.payment_status === 'paid' ? '✓ Payé' : 
             commission.payment_status === 'pending' ? '⏳ En attente' : '✗ Échoué'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
