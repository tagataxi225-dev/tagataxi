/**
 * 📦 Dashboard Delivery - Interface moderne pour livreurs
 */

import { useEffect } from 'react';
import { Package, MapPin, Clock, TrendingUp, Zap } from 'lucide-react';
import { useDriverStatus } from '@/hooks/useDriverStatus';
import { useDriverDispatch } from '@/hooks/useDriverDispatch';
import { useDriverNotifications } from '@/hooks/useDriverNotifications';
import { useDriverDailyStats } from '@/hooks/useDriverDailyStats';
import { ModernDriverHeader } from '../ModernDriverHeader';
import { DeliveryFloatingStats } from './DeliveryFloatingStats';
import { RideActionPanel } from '@/components/driver/RideActionPanel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

export const DeliveryDriverDashboard = () => {
  const { status, goOnline, goOffline } = useDriverStatus();
  const { pendingNotifications, activeOrders, acceptOrder, rejectOrder } = useDriverDispatch();
  const { notifications, unreadCount } = useDriverNotifications();
  const { stats: dailyStats } = useDriverDailyStats('delivery');

  const handleToggle = async () => {
    if (status.isOnline) {
      await goOffline();
    } else {
      await goOnline();
    }
  };

  useEffect(() => {
    // Appliquer le thème delivery
    document.documentElement.setAttribute('data-service-type', 'delivery');
    
    return () => {
      document.documentElement.removeAttribute('data-service-type');
    };
  }, []);

  const getDeliveryTypeBadge = (type: string) => {
    const badges = {
      flash: { icon: '⚡', label: 'Flash', class: 'delivery-flash' },
      flex: { icon: '📦', label: 'Flex', class: 'delivery-flex' },
      maxicharge: { icon: '🚚', label: 'Maxicharge', class: 'delivery-maxicharge' }
    };
    return badges[type as keyof typeof badges] || badges.flex;
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      {/* 🔔 RideActionPanel - Gestion des livraisons assignées */}
      <RideActionPanel />

      {/* Header moderne cohérent avec taxi */}
      <ModernDriverHeader
        serviceType="delivery"
        isOnline={status.isOnline}
        onToggleOnline={handleToggle}
      />

      {/* Stats flottantes */}
      <DeliveryFloatingStats
        deliveriesCount={dailyStats.todayCourses}
        earnings={dailyStats.todayEarnings}
        packagesCount={dailyStats.activeOrders}
      />

      {/* Livraison active */}
      {activeOrders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="p-6 service-card border-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Livraison en cours</h3>
                  <p className="text-sm text-muted-foreground">Colis récupéré</p>
                </div>
              </div>
              {activeOrders[0].delivery_type && (
                <span className={`${getDeliveryTypeBadge(activeOrders[0].delivery_type).class} px-3 py-1 rounded-full text-sm font-semibold`}>
                  {getDeliveryTypeBadge(activeOrders[0].delivery_type).icon} {getDeliveryTypeBadge(activeOrders[0].delivery_type).label}
                </span>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Adresse de livraison</p>
                  <p className="text-sm font-medium text-foreground">
                    {activeOrders[0].delivery_location || 'Chargement...'}
                  </p>
                </div>
              </div>
              
              <Button className="w-full bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600">
                Naviguer vers livraison
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Nouvelles livraisons disponibles */}
      {pendingNotifications.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Nouvelles livraisons disponibles
          </h2>
          
          {pendingNotifications.map((notif) => {
            const deliveryType = notif.data?.delivery_type || 'flex';
            const badge = getDeliveryTypeBadge(deliveryType);
            
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="service-card border-2 rounded-xl p-5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{notif.title}</h3>
                      <span className={`${badge.class} px-2 py-0.5 rounded text-xs font-semibold`}>
                        {badge.icon} {badge.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{notif.message}</p>
                  </div>
                  <span className="text-lg font-bold text-green-500">
                    {notif.estimatedPrice} CDF
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Expire dans 90s</span>
                  {deliveryType === 'flash' && (
                    <span className="flex items-center gap-1 text-red-500 font-medium">
                      <Zap className="w-4 h-4" /> Urgent
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => rejectOrder(notif.id)}
                    className="w-full"
                  >
                    Refuser
                  </Button>
                  <Button
                    onClick={() => acceptOrder(notif)}
                    className="w-full bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600"
                  >
                    Accepter
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* État vide */}
      {status.isOnline && pendingNotifications.length === 0 && activeOrders.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">En attente de livraisons</h3>
          <p className="text-sm text-muted-foreground">
            Vous recevrez une notification dès qu'une livraison sera disponible
          </p>
        </motion.div>
      )}

      {!status.isOnline && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Vous êtes hors ligne</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Activez votre statut pour recevoir des livraisons
          </p>
          <Button
            onClick={handleToggle}
            className="bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600"
          >
            Passer en ligne
          </Button>
        </motion.div>
      )}
    </div>
  );
};
