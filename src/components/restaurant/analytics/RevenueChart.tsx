import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface RevenueChartProps {
  data: {
    date: string;
    revenue: number;
    orders: number;
  }[];
}

export const RevenueChart = ({ data }: RevenueChartProps) => {
  const total = data.reduce((sum, d) => sum + d.revenue, 0);
  const average = data.length > 0 ? Math.round(total / data.length) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Évolution des revenus</CardTitle>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-muted-foreground">Moy: {average.toLocaleString()} FC/jour</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
            />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              labelFormatter={(value) => new Date(value).toLocaleDateString('fr-FR')}
              formatter={(value: any) => [`${value.toLocaleString()} FC`, 'Revenus']}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', r: 4 }}
              activeDot={{ r: 6 }}
              name="Revenus (FC)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

interface TopDishesChartProps {
  data: {
    name: string;
    orders: number;
    revenue: number;
  }[];
}

export const TopDishesChart = ({ data }: TopDishesChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 5 Plats</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" className="text-xs" />
            <YAxis dataKey="name" type="category" width={100} className="text-xs" />
            <Tooltip
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              formatter={(value: any, name: string) => {
                if (name === 'orders') return [value, 'Commandes'];
                return [`${value.toLocaleString()} FC`, 'Revenus'];
              }}
            />
            <Legend />
            <Bar dataKey="orders" fill="#f97316" name="Commandes" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
