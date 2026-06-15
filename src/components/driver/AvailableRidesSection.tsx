/**
 * 🚗 PHASE 1: Section dédiée aux courses disponibles
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Car, Package, MapPin, DollarSign, Navigation, CheckCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AvailableRidesSectionProps {
  notifications: any[];
  serviceType: 'taxi' | 'delivery';
  onAccept: (notification: any) => void;
  onReject: (notificationId: string) => void;
}

export const AvailableRidesSection: React.FC<AvailableRidesSectionProps> = ({
  notifications,
  serviceType,
  onAccept,
  onReject
}) => {
  if (notifications.length === 0) return null;

  const Icon = serviceType === 'taxi' ? Car : Package;
  const color = serviceType === 'taxi' ? 'orange' : 'blue';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn(
        "border-2 shadow-lg",
        serviceType === 'taxi' ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/20" : "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className={cn(
              "flex items-center gap-2 text-base",
              serviceType === 'taxi' ? "text-orange-700 dark:text-orange-400" : "text-blue-700 dark:text-blue-400"
            )}>
              <Icon className="h-5 w-5" />
              Courses Disponibles
            </CardTitle>
            <Badge className={cn(
              "text-white font-bold text-base px-3 py-1",
              serviceType === 'taxi' ? "bg-orange-600" : "bg-blue-600"
            )}>
              {notifications.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.slice(0, 3).map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={cn(
                "border-2 hover:shadow-md transition-all",
                serviceType === 'taxi' ? "border-orange-300 hover:border-orange-500" : "border-blue-300 hover:border-blue-500"
              )}>
                <CardContent className="p-4 space-y-3">
                  {/* Infos course */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Départ</p>
                        <p className="text-sm font-medium line-clamp-1">{notification.location}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Navigation className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{notification.distance} km</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-green-600" />
                        <span className="font-bold text-green-600">{notification.estimatedPrice?.toLocaleString()} CDF</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => onAccept(notification)}
                      className={cn(
                        "flex-1 font-bold",
                        serviceType === 'taxi' ? "bg-orange-600 hover:bg-orange-700" : "bg-blue-600 hover:bg-blue-700"
                      )}
                      size="lg"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accepter
                    </Button>
                    <Button
                      onClick={() => onReject(notification.id)}
                      variant="outline"
                      size="lg"
                      className="border-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          
          {notifications.length > 3 && (
            <p className="text-center text-sm text-muted-foreground">
              + {notifications.length - 3} autres courses
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
