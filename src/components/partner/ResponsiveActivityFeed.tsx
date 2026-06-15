import React from 'react';
import { Car, UserPlus, CreditCard, Receipt, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
}

interface ResponsiveActivityFeedProps {
  activities: ActivityItem[];
  loading?: boolean;
}

export const ResponsiveActivityFeed: React.FC<ResponsiveActivityFeedProps> = ({
  activities,
  loading = false
}) => {
  const isMobile = useIsMobile();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Car': return Car;
      case 'UserPlus': return UserPlus;
      case 'CreditCard': return CreditCard;
      case 'Package': return Receipt;
      default: return Activity;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date().getTime();
    const activityTime = new Date(timestamp).getTime();
    const diffInMinutes = Math.floor((now - activityTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
    return `Il y a ${Math.floor(diffInMinutes / 1440)} jour(s)`;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="card-floating p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-grey-200 rounded-xl animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 bg-grey-200 rounded mb-2 animate-pulse"></div>
                <div className="h-3 bg-grey-200 rounded w-2/3 animate-pulse"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="card-floating p-6 text-center">
        <p className="text-muted-foreground">Aucune activité récente</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {activities.slice(0, 5).map((activity) => {
        const IconComponent = getIcon(activity.icon);
        
        return (
          <Card 
            key={activity.id} 
            className="card-floating hover:shadow-lg transition-all duration-200"
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${activity.color} rounded-xl flex items-center justify-center shadow-sm flex-shrink-0`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-card-foreground ${isMobile ? 'text-sm' : 'text-body-md'}`}>
                    {activity.title}
                  </p>
                  <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-body-sm'} ${isMobile ? 'line-clamp-2' : ''}`}>
                    {activity.description}
                  </p>
                </div>
                
                <span className={`text-muted-foreground bg-grey-100 px-2 py-1 rounded-md flex-shrink-0 ${isMobile ? 'text-xs' : 'text-caption'}`}>
                  {getTimeAgo(activity.timestamp)}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};