import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MapPin, Clock, DollarSign, CheckCircle, X, Zap } from 'lucide-react';

interface RideNotification {
  id: string;
  title: string;
  message: string;
  distance?: number;
  estimatedTime?: number;
  pickupAddress?: string;
  destinationAddress?: string;
  estimatedPrice?: number;
  vehicleClass?: string;
  priority?: 'normal' | 'high' | 'urgent';
  expiresAt?: string;
}

interface RideNotificationCardProps {
  notification: RideNotification;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  className?: string;
}

export const RideNotificationCard: React.FC<RideNotificationCardProps> = ({
  notification,
  onAccept,
  onDecline,
  className = ''
}) => {
  const [timeRemaining, setTimeRemaining] = useState(120);

  useEffect(() => {
    if (notification.expiresAt) {
      const calculateRemaining = () => {
        const now = new Date().getTime();
        const expires = new Date(notification.expiresAt!).getTime();
        const remaining = Math.max(0, Math.floor((expires - now) / 1000));
        setTimeRemaining(remaining);

        if (remaining === 0) {
          onDecline(notification.id);
        }
      };

      calculateRemaining();
      const interval = setInterval(calculateRemaining, 1000);

      return () => clearInterval(interval);
    }
  }, [notification.expiresAt, notification.id, onDecline]);

  return (
    <motion.div
      initial={{ x: 300, opacity: 0, scale: 0.9 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: -300, opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={className}
    >
      <Card className="border-2 border-primary shadow-2xl overflow-hidden">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-lg">{notification.title}</h4>
                {notification.priority === 'urgent' && (
                  <Zap className="w-5 h-5 text-orange-500 fill-orange-500 animate-pulse" />
                )}
                {notification.priority === 'high' && (
                  <Badge variant="destructive" className="text-xs">Prioritaire</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {notification.vehicleClass || notification.message}
              </p>
            </div>
            
            {notification.estimatedPrice && (
              <Badge className="bg-green-500 text-white font-bold text-base px-3 py-1">
                {notification.estimatedPrice.toLocaleString()} CDF
              </Badge>
            )}
          </div>

          {/* Route Info */}
          {(notification.pickupAddress || notification.destinationAddress) && (
            <div className="space-y-2 mb-4 bg-muted/50 rounded-lg p-3">
              {notification.pickupAddress && (
                <div className="flex items-start gap-2 text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">Départ</p>
                    <p className="text-muted-foreground truncate">
                      {notification.pickupAddress}
                    </p>
                  </div>
                </div>
              )}
              {notification.pickupAddress && notification.destinationAddress && (
                <div className="ml-1 border-l-2 border-dashed border-muted-foreground/30 h-3" />
              )}
              {notification.destinationAddress && (
                <div className="flex items-start gap-2 text-xs">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">Arrivée</p>
                    <p className="text-muted-foreground truncate">
                      {notification.destinationAddress}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          {(notification.distance || notification.estimatedTime) && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {notification.distance !== undefined && (
                <div className="bg-background rounded-lg p-2 text-center">
                  <MapPin className="h-4 w-4 mx-auto mb-1 text-primary" />
                  <p className="text-xs text-muted-foreground">Distance</p>
                  <p className="font-semibold">{notification.distance.toFixed(1)} km</p>
                </div>
              )}
              {notification.estimatedTime !== undefined && (
                <div className="bg-background rounded-lg p-2 text-center">
                  <Clock className="h-4 w-4 mx-auto mb-1 text-primary" />
                  <p className="text-xs text-muted-foreground">Temps</p>
                  <p className="font-semibold">~{notification.estimatedTime} min</p>
                </div>
              )}
            </div>
          )}

          {/* Timer */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Expire dans
              </span>
              <span className="font-mono font-semibold">{timeRemaining}s</span>
            </div>
            <Progress 
              value={(timeRemaining / 120) * 100} 
              className="h-2"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              size="lg"
              variant="outline"
              className="flex-1 h-12 border-2"
              onClick={() => onDecline(notification.id)}
            >
              <X className="h-4 w-4 mr-2" />
              Refuser
            </Button>
            <Button
              size="lg"
              className="flex-1 h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold shadow-lg"
              onClick={() => onAccept(notification.id)}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Accepter
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RideNotificationCard;
