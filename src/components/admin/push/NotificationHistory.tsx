import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNotificationCampaigns } from '@/hooks/useNotificationCampaigns';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, CheckCircle2, Eye, MousePointerClick, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const NotificationHistory: React.FC = () => {
  const { campaigns, loading } = useNotificationCampaigns();

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          <p>Aucune notification envoyée pour le moment</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {campaigns.map((campaign) => {
        const deliveryRate = campaign.sent_count > 0 
          ? (campaign.delivered_count / campaign.sent_count * 100).toFixed(1) 
          : '0';
        const openRate = campaign.delivered_count > 0 
          ? (campaign.opened_count / campaign.delivered_count * 100).toFixed(1) 
          : '0';
        const clickRate = campaign.opened_count > 0 
          ? (campaign.clicked_count / campaign.opened_count * 100).toFixed(1) 
          : '0';

        return (
          <Card key={campaign.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{campaign.campaign_title}</h3>
                    <Badge variant={campaign.status === 'sent' ? 'default' : campaign.status === 'pending' ? 'secondary' : 'destructive'}>
                      {campaign.status === 'sent' ? 'Envoyée' : campaign.status === 'pending' ? 'En attente' : 'Échec'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {campaign.priority.charAt(0).toUpperCase() + campaign.priority.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {campaign.message_content}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true, locale: fr })}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Users className="w-3 h-3" />
                    Envoyées
                  </div>
                  <div className="text-2xl font-bold">{campaign.sent_count}</div>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Livrées
                  </div>
                  <div className="text-2xl font-bold">{campaign.delivered_count}</div>
                  <div className="text-xs text-muted-foreground">{deliveryRate}%</div>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Eye className="w-3 h-3" />
                    Ouvertes
                  </div>
                  <div className="text-2xl font-bold">{campaign.opened_count}</div>
                  <div className="text-xs text-muted-foreground">{openRate}%</div>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <MousePointerClick className="w-3 h-3" />
                    Clics
                  </div>
                  <div className="text-2xl font-bold">{campaign.clicked_count}</div>
                  <div className="text-xs text-muted-foreground">{clickRate}%</div>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">
                    Destinataires
                  </div>
                  <div className="text-sm font-medium">{campaign.target_type.replace(/_/g, ' ')}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
