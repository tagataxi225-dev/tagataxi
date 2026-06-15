/**
 * 📊 Graphique des gains contextualisé
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface EarningsChartProps {
  serviceType: 'taxi' | 'delivery';
}

export const EarningsChart = ({ serviceType }: EarningsChartProps) => {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEarningsData();
  }, [user, serviceType]);

  const loadEarningsData = async () => {
    if (!user) return;

    try {
      // Charger les gains des 7 derniers jours
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: transactions } = await supabase
        .from('wallet_transactions')
        .select('amount, created_at, transaction_type')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString())
        .eq('transaction_type', 'credit')
        .order('created_at', { ascending: true });

      if (transactions) {
        // Regrouper par jour
        const groupedByDay = transactions.reduce((acc: any, transaction) => {
          const date = new Date(transaction.created_at).toLocaleDateString('fr-FR', { 
            day: '2-digit', 
            month: 'short' 
          });
          
          if (!acc[date]) {
            acc[date] = 0;
          }
          acc[date] += transaction.amount;
          return acc;
        }, {});

        const formattedData = Object.entries(groupedByDay).map(([date, amount]) => ({
          date,
          gains: amount
        }));

        setChartData(formattedData);
      }
    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-48 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  const serviceColor = serviceType === 'taxi' ? '#3B82F6' : '#10B981';

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {serviceType === 'taxi' ? 'Gains courses' : 'Gains livraisons'}
          </h3>
          <p className="text-sm text-muted-foreground">7 derniers jours</p>
        </div>
        <div className="flex items-center gap-2 text-green-500">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-medium">+12%</span>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-muted-foreground">
          <p className="text-sm">Aucune donnée pour les 7 derniers jours</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              formatter={(value: number) => [`${value.toLocaleString()} CDF`, 'Gains']}
            />
            <Line 
              type="monotone" 
              dataKey="gains" 
              stroke={serviceColor}
              strokeWidth={2}
              dot={{ fill: serviceColor, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Breakdown par type */}
      {serviceType === 'delivery' && (
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Flash ⚡</p>
            <p className="text-lg font-bold text-red-500">40%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Flex 📦</p>
            <p className="text-lg font-bold text-green-500">45%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Maxi 🚚</p>
            <p className="text-lg font-bold text-purple-500">15%</p>
          </div>
        </div>
      )}
    </Card>
  );
};
