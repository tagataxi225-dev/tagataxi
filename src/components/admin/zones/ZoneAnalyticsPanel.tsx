import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Users,
  Clock,
  Star,
  AlertTriangle,
  Download,
  RefreshCw,
} from 'lucide-react';
import { Zone, ZoneStatistics } from '@/hooks/useZoneManagement';
import { formatCurrency } from '@/lib/utils';

interface ZoneAnalyticsPanelProps {
  zone: Zone;
  statistics: ZoneStatistics;
  onRefreshStats: () => void;
  className?: string;
}

// Données simulées pour les graphiques temporels
const generateTimeSeriesData = (days: number = 7) => {
  const data = [];
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
      rides: Math.floor(Math.random() * 50) + 20,
      deliveries: Math.floor(Math.random() * 30) + 10,
      revenue: Math.floor(Math.random() * 100000) + 50000,
      activeDrivers: Math.floor(Math.random() * 20) + 5,
      waitTime: Math.floor(Math.random() * 10) + 3,
      satisfaction: 4.0 + Math.random() * 1,
    });
  }
  return data;
};

const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
  hour: `${hour}h`,
  demand: Math.floor(Math.random() * 100) + 20,
  surge: 1 + Math.random() * 2,
}));

const vehicleTypeData = [
  { name: 'Standard', value: 45, color: '#3b82f6' },
  { name: 'Premium', value: 25, color: '#10b981' },
  { name: 'Économique', value: 20, color: '#f59e0b' },
  { name: 'Moto', value: 10, color: '#ef4444' },
];

export const ZoneAnalyticsPanel: React.FC<ZoneAnalyticsPanelProps> = ({
  zone,
  statistics,
  onRefreshStats,
  className,
}) => {
  const [timeRange, setTimeRange] = useState('7d');
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    setTimeSeriesData(generateTimeSeriesData(days));
  }, [timeRange]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await onRefreshStats();
      // Régénérer les données de série temporelle
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      setTimeSeriesData(generateTimeSeriesData(days));
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    const data = {
      zone: zone.name,
      statistics,
      timeSeriesData,
      hourlyData,
      vehicleTypeData,
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zone-analytics-${zone.name}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const kpiCards = [
    {
      title: 'Total courses',
      value: statistics.total_rides + statistics.total_deliveries,
      change: '+12%',
      changeType: 'positive' as const,
      icon: Activity,
    },
    {
      title: 'Revenus totaux',
      value: formatCurrency(statistics.total_revenue),
      change: '+8%',
      changeType: 'positive' as const,
      icon: DollarSign,
    },
    {
      title: 'Chauffeurs actifs',
      value: statistics.active_drivers,
      change: '-2',
      changeType: 'negative' as const,
      icon: Users,
    },
    {
      title: 'Temps d\'attente moyen',
      value: `${Math.round(statistics.average_wait_time)}min`,
      change: '-1min',
      changeType: 'positive' as const,
      icon: Clock,
    },
    {
      title: 'Satisfaction client',
      value: `${statistics.customer_satisfaction_avg.toFixed(1)}/5`,
      change: '+0.2',
      changeType: 'positive' as const,
      icon: Star,
    },
    {
      title: 'Taux d\'annulation',
      value: `${statistics.cancellation_rate.toFixed(1)}%`,
      change: '-0.5%',
      changeType: 'positive' as const,
      icon: AlertTriangle,
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête avec actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Analytics - {zone.name}
            </CardTitle>
            
            <div className="flex items-center gap-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 jours</SelectItem>
                  <SelectItem value="30d">30 jours</SelectItem>
                  <SelectItem value="90d">90 jours</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={exportData}
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((kpi, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {kpi.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold">{kpi.value}</span>
                    <Badge 
                      variant={kpi.changeType === 'positive' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {kpi.changeType === 'positive' ? 
                        <TrendingUp className="h-3 w-3 mr-1" /> : 
                        <TrendingDown className="h-3 w-3 mr-1" />
                      }
                      {kpi.change}
                    </Badge>
                  </div>
                </div>
                <kpi.icon className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Graphiques détaillés */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Tendances</TabsTrigger>
          <TabsTrigger value="demand">Demande</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="distribution">Répartition</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Revenus et courses</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="rides"
                      stroke="#10b981"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Chauffeurs et satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="activeDrivers"
                      stroke="#f59e0b"
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="satisfaction"
                      stroke="#ef4444"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="demand" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Demande par heure</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="demand" fill="#3b82f6" />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="surge"
                    stroke="#ef4444"
                    strokeWidth={2}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Temps d'attente</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="waitTime"
                      stroke="#10b981"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Métriques de performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Taux de completion</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-secondary rounded-full h-2">
                        <div 
                          className="bg-success h-2 rounded-full" 
                          style={{ width: `${statistics.completion_rate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{statistics.completion_rate.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Taux d'annulation</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-secondary rounded-full h-2">
                        <div 
                          className="bg-destructive h-2 rounded-full" 
                          style={{ width: `${statistics.cancellation_rate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{statistics.cancellation_rate.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Satisfaction moyenne</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-secondary rounded-full h-2">
                        <div 
                          className="bg-warning h-2 rounded-full" 
                          style={{ width: `${(statistics.customer_satisfaction_avg / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{statistics.customer_satisfaction_avg.toFixed(1)}/5</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Répartition par type de véhicule</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={vehicleTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {vehicleTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="mt-4 space-y-2">
                  {vehicleTypeData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Services par type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <div>
                      <div className="font-medium">Transport</div>
                      <div className="text-sm text-muted-foreground">
                        {statistics.total_rides} courses
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {Math.round((statistics.total_rides / (statistics.total_rides + statistics.total_deliveries)) * 100)}%
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <div>
                      <div className="font-medium">Livraisons</div>
                      <div className="text-sm text-muted-foreground">
                        {statistics.total_deliveries} livraisons
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-secondary">
                      {Math.round((statistics.total_deliveries / (statistics.total_rides + statistics.total_deliveries)) * 100)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};