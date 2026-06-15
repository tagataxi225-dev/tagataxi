import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Activity, Clock, DollarSign, Package, Car, ShoppingBag, Filter } from 'lucide-react';
import { useUserActivity } from '@/hooks/useUserActivity';

export const ActivityHistorySection = () => {
  const { 
    activities, 
    getActivitiesByType, 
    getRecentActivities,
    getActivityIcon,
    getActivityTypeLabel,
    formatActivityDate,
    isLoading 
  } = useUserActivity();

  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const getFilteredActivities = () => {
    switch (selectedFilter) {
      case 'recent':
        return getRecentActivities(24);
      case 'transport':
        return getActivitiesByType('transport_booking');
      case 'delivery':
        return getActivitiesByType('delivery_order');
      case 'marketplace':
        return getActivitiesByType('marketplace_order');
      case 'payments':
        return getActivitiesByType('payment');
      default:
        return activities;
    }
  };

  const filteredActivities = getFilteredActivities();

  const ActivityItem = ({ activity }: { activity: any }) => (
    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="text-lg mt-1">
        {getActivityIcon(activity.activity_type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium truncate">
            {activity.description}
          </p>
          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
            {formatActivityDate(activity.created_at)}
          </span>
        </div>
        <div className="flex items-center space-x-2 mt-1">
          <Badge variant="outline" className="text-xs">
            {getActivityTypeLabel(activity.activity_type)}
          </Badge>
          {activity.metadata?.amount && (
            <span className="text-xs text-green-600 font-medium">
              {activity.metadata.amount} CDF
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Historique des Activités</CardTitle>
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </Button>
          </div>
          <CardDescription>
            Consultez toutes vos activités récentes et historiques
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all" onClick={() => setSelectedFilter('all')}>
                Tout
              </TabsTrigger>
              <TabsTrigger value="recent" onClick={() => setSelectedFilter('recent')}>
                Récent
              </TabsTrigger>
              <TabsTrigger value="transport" onClick={() => setSelectedFilter('transport')}>
                <Car className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="delivery" onClick={() => setSelectedFilter('delivery')}>
                <Package className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="marketplace" onClick={() => setSelectedFilter('marketplace')}>
                <ShoppingBag className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <ScrollArea className="h-[400px]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : filteredActivities.length > 0 ? (
                  <div className="space-y-1">
                    {filteredActivities.map((activity, index) => (
                      <React.Fragment key={activity.id}>
                        <ActivityItem activity={activity} />
                        {index < filteredActivities.length - 1 && <Separator />}
                      </React.Fragment>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Aucune activité trouvée</p>
                    <p className="text-xs">Vos activités apparaîtront ici</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Autres onglets similaires */}
            <TabsContent value="recent" className="mt-4">
              <ScrollArea className="h-[400px]">
                {getRecentActivities(24).length > 0 ? (
                  <div className="space-y-1">
                    {getRecentActivities(24).map((activity, index) => (
                      <React.Fragment key={activity.id}>
                        <ActivityItem activity={activity} />
                        {index < getRecentActivities(24).length - 1 && <Separator />}
                      </React.Fragment>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Aucune activité récente</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Statistiques Rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Car className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Courses</p>
                <p className="text-2xl font-bold">{getActivitiesByType('transport_booking').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Livraisons</p>
                <p className="text-2xl font-bold">{getActivitiesByType('delivery_order').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Paiements</p>
                <p className="text-2xl font-bold">{getActivitiesByType('payment').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};