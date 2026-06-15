import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Percent, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface EarningsStatsData {
  total_gross_earnings: number;
  total_commission_deducted: number;
  total_net_earnings: number;
  available_balance: number;
  pending_withdrawal: number;
  currency: string;
}

interface VendorEarningsStatsProps {
  vendorId: string;
}

export const VendorEarningsStats: React.FC<VendorEarningsStatsProps> = ({ vendorId }) => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['vendor-earnings-stats', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_vendor_earnings_stats', {
        p_vendor_id: vendorId
      });

      if (error) throw error;
      if (!data || typeof data !== 'object') return null;
      return data as unknown as EarningsStatsData;
    },
    enabled: !!vendorId
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const commissionPercentage = stats.total_gross_earnings > 0
    ? ((stats.total_commission_deducted / stats.total_gross_earnings) * 100).toFixed(2)
    : '0.00';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total brut */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Revenus bruts totaux
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats.total_gross_earnings)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Avant déduction de commission
          </p>
        </CardContent>
      </Card>

      {/* Commission déduite */}
      <Card className="border-orange-500/30 bg-orange-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Percent className="w-4 h-4" />
            Commission plateforme
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            - {formatCurrency(stats.total_commission_deducted)}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {commissionPercentage}% en moyenne
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Revenus nets */}
      <Card className="border-green-500/30 bg-green-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Revenus nets totaux
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.total_net_earnings)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Après commission
          </p>
        </CardContent>
      </Card>

      {/* Solde disponible */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Disponible pour retrait
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(stats.available_balance)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.pending_withdrawal > 0 && (
              <span className="text-orange-600">
                {formatCurrency(stats.pending_withdrawal)} en traitement
              </span>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
