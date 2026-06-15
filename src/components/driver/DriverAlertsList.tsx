/**
 * 📱 Composant d'Alertes de Livraison pour Chauffeurs
 * PHASE 2: Migré vers useDriverDispatch unifié
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, MapPin, Clock, DollarSign, Package, X, AlertCircle } from 'lucide-react';
import { useDriverDispatch } from '@/hooks/useDriverDispatch';

export default function DriverAlertsList() {
  const {
    pendingNotifications,
    loading,
    acceptOrder,
    rejectOrder
  } = useDriverDispatch();
  
  // Filtrer uniquement les alertes de livraison et marketplace
  const deliveryAlerts = useMemo(() => 
    pendingNotifications.filter(n => n.type === 'delivery' || n.type === 'marketplace'),
    [pendingNotifications]
  );
  
  const [timeRemaining, setTimeRemaining] = useState<Record<string, number>>({});

  // Calculer le temps restant
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeRemaining: Record<string, number> = {};
      
      deliveryAlerts.forEach(alert => {
        if (alert.expires_at) {
          const expiresAt = new Date(alert.expires_at).getTime();
          const now = Date.now();
          const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
          newTimeRemaining[alert.id] = remaining;
        }
      });
      
      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [deliveryAlerts]);

  if (deliveryAlerts.length === 0) {
    return null;
  }

  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 space-y-3 max-w-md mx-auto">
      {deliveryAlerts.map((alert) => {
        const remaining = timeRemaining[alert.id] || 0;
        const isExpired = remaining === 0;
        const isExpiringSoon = remaining > 0 && remaining <= 30;

        return (
          <Card 
            key={alert.id}
            className={`border-2 shadow-glow ${
              isExpired 
                ? 'bg-destructive/10 border-destructive' 
                : isExpiringSoon
                ? 'bg-warning/10 border-warning animate-pulse'
                : 'bg-gradient-to-r from-primary/10 to-secondary/10 border-primary animate-fade-in'
            }`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  {isExpired ? (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  ) : (
                    <Bell className={`h-4 w-4 text-primary ${!isExpiringSoon && 'animate-pulse'}`} />
                  )}
                  <span>
                    {isExpired ? 'Course expirée' : alert.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {alert.distance && (
                    <Badge variant="destructive" className="text-xs">
                      {alert.distance.toFixed(1)}km
                    </Badge>
                  )}
                  {!isExpired && (
                    <Badge variant={isExpiringSoon ? "destructive" : "default"} className="font-mono text-xs">
                      ⏱️ {formatTimeRemaining(remaining)}
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
          
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground line-clamp-1">
                  {alert.data?.pickup_location || alert.location}
                </span>
              </div>
              
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground line-clamp-1">
                  {alert.data?.delivery_location || alert.data?.destination || 'Destination'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  <span>~{alert.distance ? Math.ceil(alert.distance * 3) : 15} min</span>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold text-primary">
                  <DollarSign className="h-4 w-4" />
                  <span>{alert.estimatedPrice?.toLocaleString()} CDF</span>
                </div>
              </div>
            </div>

            {/* Boutons avec état d'expiration */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  acceptOrder(alert);
                }}
                disabled={loading || isExpired}
                className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
              >
                <Package className="h-4 w-4 mr-1" />
                {isExpired ? '❌ Expirée' : 'Accepter'}
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  rejectOrder(alert.id);
                }}
                variant="outline"
                disabled={isExpired}
              >
                <X className="h-4 w-4 mr-1" />
                Ignorer
              </Button>
            </div>
          </CardContent>
        </Card>
        );
      })}
    </div>
  );
}
