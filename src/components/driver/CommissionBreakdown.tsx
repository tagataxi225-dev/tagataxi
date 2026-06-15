import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PieChart, DollarSign, TrendingDown, Loader2 } from 'lucide-react';

export const CommissionBreakdown: React.FC = () => {
  const { user } = useAuth();

  const { data: commissionData, isLoading } = useQuery({
    queryKey: ['driver-commissions', user?.id],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // 1. Récupérer les vrais taux depuis commission_settings
      const { data: commissionSettings } = await supabase
        .from('commission_settings')
        .select('platform_rate, driver_rate, service_type')
        .eq('is_active', true)
        .eq('service_type', 'transport')
        .maybeSingle();

      // 2. Vérifier si le chauffeur a un abonnement actif (taux réduit via subscription_plans)
      const { data: activeSubscription } = await supabase
        .from('driver_subscriptions')
        .select('plan_id, subscription_plans(commission_rate)')
        .eq('driver_id', user?.id)
        .eq('status', 'active')
        .maybeSingle();

      const subCommissionRate = (activeSubscription?.subscription_plans as any)?.commission_rate;

      // Taux plateforme : abonnement réduit ou standard
      const platformRate = subCommissionRate
        ?? commissionSettings?.platform_rate 
        ?? 12;

      // 3. Vérifier la commission partenaire (max 3%)
      const { data: partnerDriver } = await supabase
        .from('partner_drivers')
        .select('partner_id, commission_rate')
        .eq('driver_id', user?.id)
        .maybeSingle();

      const hasPartner = !!partnerDriver?.partner_id;
      const partnerRate = hasPartner ? (partnerDriver?.commission_rate ?? 0) : 0;

      // 4. Récupérer les courses du mois
      const { data: bookings } = await supabase
        .from('transport_bookings')
        .select('actual_price, estimated_price')
        .eq('driver_id', user?.id)
        .eq('status', 'completed')
        .gte('created_at', startOfMonth.toISOString());

      const { data: deliveries } = await supabase
        .from('delivery_orders')
        .select('actual_price, estimated_price')
        .eq('driver_id', user?.id)
        .eq('status', 'delivered')
        .gte('created_at', startOfMonth.toISOString());

      const totalRevenue = [
        ...(bookings || []),
        ...(deliveries || [])
      ].reduce((sum, order) => sum + (order.actual_price || order.estimated_price || 0), 0);

      const platformCommission = totalRevenue * (platformRate / 100);
      const partnerCommission = hasPartner ? totalRevenue * (partnerRate / 100) : 0;
      const netEarnings = totalRevenue - platformCommission - partnerCommission;

      return {
        totalRevenue: Math.round(totalRevenue),
        platformCommission: Math.round(platformCommission),
        partnerCommission: Math.round(partnerCommission),
        netEarnings: Math.round(netEarnings),
        platformRate,
        partnerRate,
        hasPartner,
        hasSubscription: !!activeSubscription,
      };
    },
    enabled: !!user?.id,
  });

  const netPercentage = commissionData?.totalRevenue
    ? ((commissionData.netEarnings / commissionData.totalRevenue) * 100).toFixed(0)
    : '0';

  const breakdown = [
    {
      label: 'Gains nets',
      amount: commissionData?.netEarnings || 0,
      percentage: netPercentage,
      color: 'text-green-600',
      icon: DollarSign,
    },
    {
      label: commissionData?.hasSubscription ? 'Frais plateforme (abo)' : 'Frais plateforme',
      amount: commissionData?.platformCommission || 0,
      percentage: String(commissionData?.platformRate ?? 12),
      color: 'text-orange-600',
      icon: TrendingDown,
    },
    ...(commissionData?.hasPartner ? [{
      label: 'Commission partenaire',
      amount: commissionData?.partnerCommission || 0,
      percentage: String(commissionData?.partnerRate ?? 0),
      color: 'text-blue-600',
      icon: PieChart,
    }] : []),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Répartition des gains (ce mois)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-muted">
          <p className="text-sm text-muted-foreground">Chiffre d'affaires total</p>
          <p className="text-2xl font-bold">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin inline" /> : `${commissionData?.totalRevenue?.toLocaleString() || 0} CDF`}
          </p>
        </div>

        {breakdown.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${item.color}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{item.amount.toLocaleString()} CDF</p>
                  <p className="text-xs text-muted-foreground">{item.percentage}%</p>
                </div>
              </div>
              <Progress value={parseInt(item.percentage)} className="h-2" />
            </div>
          );
        })}

        {commissionData?.hasSubscription && (
          <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
            <p className="text-sm text-green-700">
              ✅ Votre abonnement actif vous donne un taux réduit de {commissionData.platformRate}%.
            </p>
          </div>
        )}

        {commissionData?.hasPartner && (
          <div className="mt-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-700">
              💡 Vous êtes rattaché à un partenaire ({commissionData.partnerRate}% de commission).
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CommissionBreakdown;
