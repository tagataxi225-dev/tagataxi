import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Car, CreditCard, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { useUnifiedPartnerFinances } from '@/hooks/useUnifiedPartnerFinances';
import { formatCurrency as formatCurrencyUtil, type Currency } from '@/utils/formatCurrency';

interface PartnerEarningsCardProps {
  range?: '7d' | '30d' | 'all';
}

export const PartnerEarningsCard: React.FC<PartnerEarningsCardProps> = ({ range = '30d' }) => {
  const finances = useUnifiedPartnerFinances(range);

  const formatCurrency = (amount: number) => formatCurrencyUtil(amount, finances.walletCurrency as Currency);

  const getRangeLabel = () => {
    switch (range) {
      case '7d': return '7 derniers jours';
      case '30d': return '30 derniers jours';
      case 'all': return 'Depuis le début';
      default: return '';
    }
  };

  if (finances.loading) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardContent className="p-5">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalCommissions = finances.totalCommissions;
  const roiPercentage = finances.totalTopups > 0 
    ? ((totalCommissions - finances.totalTopups) / finances.totalTopups) * 100 
    : 0;
  const isPositiveROI = roiPercentage > 0;

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Revenus</h3>
          <Badge variant="secondary" className="text-xs font-normal">{getRangeLabel()}</Badge>
        </div>

        {/* Two commission sources */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-muted/30">
            <div className="flex items-center gap-2 mb-1.5">
              <Car className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Courses</span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {formatCurrency(finances.rideCommissions)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">0-3% par chauffeur</p>
          </div>
          
          <div className="p-3 rounded-xl bg-muted/30">
            <div className="flex items-center gap-2 mb-1.5">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Abonnements</span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {formatCurrency(finances.subscriptionCommissions)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">5% sur abonnements</p>
          </div>
        </div>

        {/* Total */}
        <div className="border-t border-border/50 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Total Commissions</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {formatCurrency(totalCommissions)}
            </p>
          </div>
        </div>

        {/* ROI - only when meaningful */}
        {finances.totalTopups > 0 && (
          <div className="border-t border-border/50 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">ROI</span>
              <div className="flex items-center gap-1.5">
                <TrendingUp className={`h-3.5 w-3.5 ${isPositiveROI ? 'text-emerald-500' : 'text-destructive'}`} />
                <span className={`text-sm font-semibold ${isPositiveROI ? 'text-emerald-500' : 'text-destructive'}`}>
                  {roiPercentage.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Rechargé / Retiré */}
        <div className="grid grid-cols-2 gap-3 border-t border-border/50 pt-3">
          <div className="flex items-center gap-2">
            <ArrowDownToLine className="h-3.5 w-3.5 text-muted-foreground" />
            <div>
              <p className="text-[10px] text-muted-foreground">Rechargé</p>
              <p className="text-sm font-semibold text-foreground">{formatCurrency(finances.totalTopups)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpFromLine className="h-3.5 w-3.5 text-muted-foreground" />
            <div>
              <p className="text-[10px] text-muted-foreground">Retiré</p>
              <p className="text-sm font-semibold text-foreground">{formatCurrency(finances.totalWithdrawn)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
