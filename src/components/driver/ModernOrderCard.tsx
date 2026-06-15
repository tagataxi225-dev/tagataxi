import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, DollarSign, Clock, Package, Car } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ModernOrderCardProps {
  order: {
    id: string;
    type: 'taxi' | 'delivery' | 'marketplace';
    pickup: string;
    destination: string;
    price: number;
    distance?: number;
    status?: string;
    urgency?: 'low' | 'medium' | 'high';
  };
  onNavigate?: () => void;
  onComplete?: () => void;
  className?: string;
}

export const ModernOrderCard: React.FC<ModernOrderCardProps> = ({
  order,
  onNavigate,
  onComplete,
  className
}) => {
  const getServiceIcon = () => {
    switch (order.type) {
      case 'taxi': return Car;
      case 'delivery': return Package;
      case 'marketplace': return Package;
    }
  };

  const getServiceColor = () => {
    switch (order.type) {
      case 'taxi': return 'text-orange-600 bg-orange-50 dark:bg-orange-950/20';
      case 'delivery': return 'text-blue-600 bg-blue-50 dark:bg-blue-950/20';
      case 'marketplace': return 'text-purple-600 bg-purple-50 dark:bg-purple-950/20';
    }
  };

  const getServiceLabel = () => {
    switch (order.type) {
      case 'taxi': return 'VTC';
      case 'delivery': return 'Livraison';
      case 'marketplace': return 'Marketplace';
    }
  };

  const getUrgencyBadge = () => {
    if (!order.urgency || order.urgency === 'low') return null;
    
    const colors = {
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      high: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
    };

    return (
      <Badge className={cn('gap-1', colors[order.urgency])}>
        <Clock className="h-3 w-3" />
        {order.urgency === 'high' ? 'Urgent' : 'Prioritaire'}
      </Badge>
    );
  };

  const Icon = getServiceIcon();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn(
        "relative overflow-hidden hover:shadow-lg transition-shadow",
        className
      )}>
        {/* Decorative gradient bar */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-1",
          order.type === 'taxi' ? 'bg-gradient-to-r from-orange-500 to-orange-400' :
          order.type === 'delivery' ? 'bg-gradient-to-r from-blue-500 to-blue-400' :
          'bg-gradient-to-r from-purple-500 to-purple-400'
        )} />

        <div className="p-4 pt-5">
          {/* Header: Service Type + Badges */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={cn('p-2 rounded-lg', getServiceColor())}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <Badge variant="outline" className="font-medium">
                  {getServiceLabel()}
                </Badge>
              </div>
            </div>
            {getUrgencyBadge()}
          </div>

          {/* Locations */}
          <div className="space-y-2 mb-4">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Départ</p>
                <p className="text-sm font-medium line-clamp-1">{order.pickup}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Destination</p>
                <p className="text-sm font-medium line-clamp-1">{order.destination}</p>
              </div>
            </div>
          </div>

          {/* Info badges */}
          <div className="flex items-center gap-3 mb-4 text-sm">
            <div className="flex items-center gap-1 font-semibold text-primary">
              <DollarSign className="h-4 w-4" />
              {order.price.toLocaleString()} CDF
            </div>
            {order.distance && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Navigation className="h-3 w-3" />
                {order.distance.toFixed(1)} km
              </div>
            )}
            {order.status && (
              <Badge variant="secondary" className="text-xs">
                {order.status}
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {onNavigate && (
              <Button
                onClick={onNavigate}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Navigation className="h-4 w-4 mr-2" />
                GPS
              </Button>
            )}
            {onComplete && (
              <Button
                onClick={onComplete}
                size="sm"
                className="flex-1"
              >
                Terminer
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
