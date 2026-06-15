import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface EarningsData {
  date: string;
  earnings: number;
}

export const EarningsChart: React.FC = () => {
  const { user } = useAuth();

  const { data: earningsData } = useQuery({
    queryKey: ['driver-earnings-chart', user?.id],
    queryFn: async () => {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d;
      });

      const earningsByDate: EarningsData[] = await Promise.all(
        last7Days.map(async (date) => {
          const startOfDay = new Date(date);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(date);
          endOfDay.setHours(23, 59, 59, 999);

          const { data: transportBookings } = await supabase
            .from('transport_bookings')
            .select('actual_price')
            .eq('driver_id', user?.id)
            .eq('status', 'completed')
            .gte('created_at', startOfDay.toISOString())
            .lte('created_at', endOfDay.toISOString());

          const { data: deliveryOrders } = await supabase
            .from('delivery_orders')
            .select('actual_price')
            .eq('driver_id', user?.id)
            .eq('status', 'delivered')
            .gte('created_at', startOfDay.toISOString())
            .lte('created_at', endOfDay.toISOString());

          const transportTotal = transportBookings?.reduce((sum, b) => sum + (b.actual_price || 0), 0) || 0;
          const deliveryTotal = deliveryOrders?.reduce((sum, o) => sum + (o.actual_price || 0), 0) || 0;

          return {
            date: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
            earnings: Math.round(transportTotal + deliveryTotal),
          };
        })
      );

      return earningsByDate;
    },
    enabled: !!user?.id,
  });

  const totalEarnings = earningsData?.reduce((sum, d) => sum + d.earnings, 0) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Évolution des gains (7 derniers jours)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-2xl font-bold">{totalEarnings.toLocaleString()} CDF</p>
          <p className="text-sm text-muted-foreground">Total cette semaine</p>
        </div>
        
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={earningsData || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" style={{ fontSize: '12px' }} />
            <YAxis style={{ fontSize: '12px' }} />
            <Tooltip 
              formatter={(value: number) => [`${value.toLocaleString()} CDF`, 'Gains']}
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
            />
            <Line 
              type="monotone" 
              dataKey="earnings" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default EarningsChart;
