import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Car, 
  DollarSign, 
  TrendingUp, 
  ShoppingBag, 
  MapPin,
  Clock,
  Star
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface KPIData {
  title: string;
  value: string;
  trend: string;
  trendDirection: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

interface MobileKPIGridProps {
  realTimeStats: any;
}

export const MobileKPIGrid: React.FC<MobileKPIGridProps> = ({ realTimeStats }) => {
  const isMobile = useIsMobile();

  const kpiData: KPIData[] = [
    {
      title: 'Utilisateurs Total',
      value: (realTimeStats?.totalUsers || 0).toLocaleString(),
      trend: (realTimeStats?.totalUsers || 0) > 0 ? 'Actif' : 'Vide',
      trendDirection: (realTimeStats?.totalUsers || 0) > 0 ? 'up' as const : 'neutral' as const,
      icon: <Users className="h-5 w-5" />,
      color: 'bg-blue-500'
    },
    {
      title: 'Chauffeurs Total',
      value: (realTimeStats?.totalDrivers || 0).toLocaleString(),
      trend: (realTimeStats?.totalDrivers || 0) > 0 ? 'Inscrits' : 'Aucun',
      trendDirection: (realTimeStats?.totalDrivers || 0) > 0 ? 'up' as const : 'neutral' as const,
      icon: <Car className="h-5 w-5" />,
      color: 'bg-green-500'
    },
    {
      title: 'Revenus Total',
      value: `${(realTimeStats?.totalRevenue || 0).toLocaleString()} CDF`,
      trend: (realTimeStats?.totalRevenue || 0) > 0 ? 'Généré' : 'Aucun',
      trendDirection: (realTimeStats?.totalRevenue || 0) > 0 ? 'up' as const : 'neutral' as const,
      icon: <DollarSign className="h-5 w-5" />,
      color: 'bg-yellow-500'
    },
    {
      title: 'Courses Actives',
      value: (realTimeStats?.activeRides || 0).toLocaleString(),
      trend: (realTimeStats?.activeRides || 0) > 0 ? 'En cours' : 'Aucune',
      trendDirection: (realTimeStats?.activeRides || 0) > 0 ? 'up' as const : 'neutral' as const,
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'bg-purple-500'
    }
  ].filter((_, index) => index < 4); // Limite à 4 KPI principaux

  const gridCols = isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4';

  return (
    <div className={`grid ${gridCols} gap-3 md:gap-4 p-4`}>
      {kpiData.map((kpi, index) => (
        <Card 
          key={index} 
          className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-card/50 backdrop-blur"
        >
          <CardContent className="p-3 md:p-4">
            <div className="flex items-start justify-between mb-2">
              <div className={`p-2 rounded-lg ${kpi.color} text-white`}>
                {kpi.icon}
              </div>
              <Badge 
                variant={kpi.trendDirection === 'up' ? 'default' : 'secondary'}
                className="text-xs px-1.5 py-0.5"
              >
                {kpi.trend}
              </Badge>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs md:text-sm text-muted-foreground font-medium line-clamp-2">
                {kpi.title}
              </p>
              <p className="text-lg md:text-xl font-bold text-foreground">
                {kpi.value}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};