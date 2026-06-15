import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotificationCampaigns } from '@/hooks/useNotificationCampaigns';
import { Send, CheckCircle2, Eye, MousePointerClick, TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const NotificationStatistics: React.FC = () => {
  const { stats, campaigns, loading } = useNotificationCampaigns();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  const recentCampaigns = campaigns.slice(0, 7);
  const totalSent = recentCampaigns.reduce((acc, c) => acc + c.sent_count, 0);
  const totalDelivered = recentCampaigns.reduce((acc, c) => acc + c.delivered_count, 0);
  const totalOpened = recentCampaigns.reduce((acc, c) => acc + c.opened_count, 0);
  const totalClicked = recentCampaigns.reduce((acc, c) => acc + c.clicked_count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Statistiques globales</h3>
        <p className="text-muted-foreground">
          Performance des 7 derniers jours
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Notifications envoyées
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSent}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.sent} campagnes
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Taux de livraison
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.avgDeliveryRate.toFixed(1)}%</div>
            <div className="flex items-center gap-1 text-xs mt-1">
              {stats.avgDeliveryRate > 90 ? (
                <TrendingUp className="w-3 h-3 text-green-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-orange-500" />
              )}
              <span className="text-muted-foreground">{totalDelivered}/{totalSent}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Taux d'ouverture
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.avgOpenRate.toFixed(1)}%</div>
            <div className="flex items-center gap-1 text-xs mt-1">
              {stats.avgOpenRate > 50 ? (
                <TrendingUp className="w-3 h-3 text-green-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-orange-500" />
              )}
              <span className="text-muted-foreground">{totalOpened}/{totalDelivered}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <MousePointerClick className="w-4 h-4" />
              Taux de clic
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {totalOpened > 0 ? ((totalClicked / totalOpened) * 100).toFixed(1) : '0'}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {totalClicked} clics
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance par type</CardTitle>
          <CardDescription>
            Analyse détaillée des campagnes envoyées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(
              campaigns.reduce((acc, campaign) => {
                if (!acc[campaign.target_type]) {
                  acc[campaign.target_type] = {
                    count: 0,
                    sent: 0,
                    delivered: 0,
                    opened: 0
                  };
                }
                acc[campaign.target_type].count++;
                acc[campaign.target_type].sent += campaign.sent_count;
                acc[campaign.target_type].delivered += campaign.delivered_count;
                acc[campaign.target_type].opened += campaign.opened_count;
                return acc;
              }, {} as Record<string, any>)
            ).map(([type, data]) => {
              const deliveryRate = data.sent > 0 ? (data.delivered / data.sent * 100) : 0;
              const openRate = data.delivered > 0 ? (data.opened / data.delivered * 100) : 0;
              
              return (
                <div key={type} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-medium">{type.replace(/_/g, ' ')}</div>
                    <div className="text-sm text-muted-foreground">
                      {data.count} campagnes • {data.sent} envoyées
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {deliveryRate.toFixed(0)}% livrées • {openRate.toFixed(0)}% ouvertes
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {campaigns.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucune donnée disponible
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
