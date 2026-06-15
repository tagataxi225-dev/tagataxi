import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, TrendingDown, Wallet, Truck, Building2 } from 'lucide-react';

interface DeliveryCommissionDetailsProps {
  deliveryAmount: number;
  kwendaCommission: number;
  kwendaRate: number;
  partnerCommission: number;
  partnerRate: number;
  driverNetAmount: number;
  billingMode: 'subscription' | 'commission';
  ridesRemaining?: number;
  deliveryType?: string;
}

export const DeliveryCommissionDetails = ({
  deliveryAmount,
  kwendaCommission,
  kwendaRate,
  partnerCommission,
  partnerRate,
  driverNetAmount,
  billingMode,
  ridesRemaining,
  deliveryType = 'flash'
}: DeliveryCommissionDetailsProps) => {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(Math.round(amount));
  };

  // Mode abonnement - pas de commission
  if (billingMode === 'subscription') {
    return (
      <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/30 dark:border-green-900">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              Mode Abonnement
            </CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400">
              <Truck className="h-3 w-3 mr-1" /> {deliveryType}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Montant livraison */}
          <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Montant livraison</span>
            </div>
            <span className="font-semibold text-lg">
              {formatAmount(deliveryAmount)} CDF
            </span>
          </div>

          <Separator />

          {/* Gain net - 100% en mode abonnement */}
          <div className="flex items-center justify-between p-4 bg-green-100 dark:bg-green-900/40 rounded-lg border border-green-300 dark:border-green-800">
            <div>
              <p className="text-sm text-muted-foreground">Votre gain (0% commission)</p>
              <p className="text-xs text-green-600 dark:text-green-400">
                Courses restantes: {ridesRemaining}
              </p>
            </div>
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatAmount(deliveryAmount)} CDF
            </span>
          </div>

          <div className="flex items-center justify-center pt-2">
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              ✓ Abonnement actif
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mode commission - prélèvement Tembea + Partenaire
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            Détails Commission Livraison
          </CardTitle>
          <Badge variant="secondary">
            <Truck className="h-3 w-3 mr-1" /> {deliveryType}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Montant client */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Montant client</span>
          </div>
          <span className="font-semibold text-lg">
            {formatAmount(deliveryAmount)} CDF
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
              <span className="text-sm">Tembea ({kwendaRate}%)</span>
            </div>
            <span className="text-sm font-medium text-destructive">
              -{formatAmount(kwendaCommission)} CDF
            </span>
          </div>

          {/* Commission Partenaire */}
          {partnerCommission > 0 && (
            <div className="flex items-center justify-between pl-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-sm flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  Partenaire ({partnerRate}%)
                </span>
              </div>
              <span className="text-sm font-medium text-destructive">
                -{formatAmount(partnerCommission)} CDF
              </span>
            </div>
          )}

          {/* Total commissions */}
          <div className="flex items-center justify-between pl-6 pt-2 border-t border-dashed">
            <span className="text-sm text-muted-foreground">Total prélevé</span>
            <span className="text-sm font-medium text-destructive">
              -{formatAmount(kwendaCommission + partnerCommission)} CDF
            </span>
          </div>
        </div>

        <Separator />

        {/* Gain net */}
        <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
          <div>
            <p className="text-sm text-muted-foreground">Votre gain net</p>
            <p className="text-xs text-muted-foreground">
              ({100 - kwendaRate - partnerRate}% du montant)
            </p>
          </div>
          <span className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatAmount(driverNetAmount)} CDF
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
