/**
 * Analytics avancées pour les notifications
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  Clock,
  Users,
  Mail,
  MessageSquare,
  Smartphone,
  Eye,
  MousePointer,
  XCircle,
  CheckCircle
} from 'lucide-react';

interface AnalyticsMetrics {
  period: string;
  total_sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
  unsubscribed: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
}

interface ChannelStats {
  channel: string;
  icon: React.ReactNode;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
}

interface TopTemplate {
  name: string;
  type: string;
  sent: number;
  open_rate: number;
  click_rate: number;
  trend: 'up' | 'down' | 'stable';
}

export const NotificationAnalytics: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('open_rate');

  // Mock data - remplacer par vraies données
  const metrics: AnalyticsMetrics = {
    period: '7 derniers jours',
    total_sent: 12450,
    delivered: 11890,
    opened: 7534,
    clicked: 2310,
    failed: 560,
    unsubscribed: 23,
    delivery_rate: 95.5,
    open_rate: 63.4,
    click_rate: 30.7,
    bounce_rate: 4.5
  };

  const channelStats: ChannelStats[] = [
    {
      channel: 'Email',
      icon: <Mail className="h-4 w-4" />,
      sent: 5200,
      delivered: 4980,
      opened: 3150,
      clicked: 945,
      delivery_rate: 95.8,
      open_rate: 63.3,
      click_rate: 30.0
    },
    {
      channel: 'Push',
      icon: <Smartphone className="h-4 w-4" />,
      sent: 4850,
      delivered: 4620,
      opened: 2890,
      clicked: 867,
      delivery_rate: 95.3,
      open_rate: 62.6,
      click_rate: 30.0
    },
    {
      channel: 'SMS',
      icon: <MessageSquare className="h-4 w-4" />,
      sent: 2400,
      delivered: 2290,
      opened: 1494,
      clicked: 498,
      delivery_rate: 95.4,
      open_rate: 65.2,
      click_rate: 33.3
    }
  ];

  const topTemplates: TopTemplate[] = [
    {
      name: 'welcome_email',
      type: 'Email',
      sent: 1200,
      open_rate: 68.5,
      click_rate: 34.2,
      trend: 'up'
    },
    {
      name: 'booking_reminder',
      type: 'Push',
      sent: 950,
      open_rate: 72.1,
      click_rate: 41.5,
      trend: 'up'
    },
    {
      name: 'promo_flash',
      type: 'SMS',
      sent: 750,
      open_rate: 84.2,
      click_rate: 52.3,
      trend: 'stable'
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <div className="h-4 w-4" />;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Contrôles */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Analytics des Notifications</h3>
          <p className="text-sm text-muted-foreground">
            Analyse des performances et engagement
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">24h</SelectItem>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-1" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Envoyées</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(metrics.total_sent)}</p>
            <p className="text-xs text-muted-foreground">{metrics.period}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Livrées</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(metrics.delivered)}</p>
            <p className="text-xs text-green-600">{metrics.delivery_rate}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Ouvertes</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(metrics.opened)}</p>
            <p className="text-xs text-purple-600">{metrics.open_rate}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MousePointer className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Clics</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(metrics.clicked)}</p>
            <p className="text-xs text-orange-600">{metrics.click_rate}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Échecs</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(metrics.failed)}</p>
            <p className="text-xs text-red-600">{metrics.bounce_rate}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Désabonnés</span>
            </div>
            <p className="text-2xl font-bold">{metrics.unsubscribed}</p>
            <p className="text-xs text-gray-600">0.18%</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="channels" className="space-y-4">
        <TabsList>
          <TabsTrigger value="channels">
            <PieChart className="h-4 w-4 mr-1" />
            Par Canal
          </TabsTrigger>
          <TabsTrigger value="templates">
            <BarChart3 className="h-4 w-4 mr-1" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="trends">
            <TrendingUp className="h-4 w-4 mr-1" />
            Tendances
          </TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance par Canal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {channelStats.map((channel) => (
                  <div key={channel.channel} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {channel.icon}
                        <span className="font-medium">{channel.channel}</span>
                      </div>
                      <Badge variant="outline">
                        {formatNumber(channel.sent)} envoyées
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Livraison</p>
                        <div className="flex items-center gap-2">
                          <Progress value={channel.delivery_rate} className="flex-1" />
                          <span className="font-medium">{channel.delivery_rate}%</span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground">Ouverture</p>
                        <div className="flex items-center gap-2">
                          <Progress value={channel.open_rate} className="flex-1" />
                          <span className="font-medium">{channel.open_rate}%</span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground">Clic</p>
                        <div className="flex items-center gap-2">
                          <Progress value={channel.click_rate} className="flex-1" />
                          <span className="font-medium">{channel.click_rate}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Templates Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topTemplates.map((template, index) => (
                  <div key={template.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs">{template.type}</Badge>
                          <span>•</span>
                          <span>{formatNumber(template.sent)} envois</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <p className="font-medium">{template.open_rate}%</p>
                        <p className="text-muted-foreground">ouverture</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{template.click_rate}%</p>
                        <p className="text-muted-foreground">clic</p>
                      </div>
                      {getTrendIcon(template.trend)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Évolution des Métriques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Graphique des tendances</p>
                  <p className="text-sm text-muted-foreground">À implémenter avec Chart.js ou Recharts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};