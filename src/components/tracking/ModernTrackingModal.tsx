import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  X, 
  Phone, 
  MessageCircle, 
  MapPin, 
  Navigation, 
  Clock, 
  Star,
  Car,
  Package,
  User,
  Truck
} from 'lucide-react';
import { useUnifiedTracking } from '@/hooks/useUnifiedTracking';
import GoogleMapsKwenda from '@/components/maps/GoogleMapsKwenda';
import { FluidPositionMarker } from './FluidPositionMarker';

interface ModernTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackingId: string;
  trackingType: 'delivery' | 'taxi';
}

export const ModernTrackingModal: React.FC<ModernTrackingModalProps> = ({
  isOpen,
  onClose,
  trackingId,
  trackingType
}) => {
  const [showMap, setShowMap] = useState(false);
  
  const {
    trackingData,
    loading,
    error,
    connectionStatus,
    statusLabel,
    estimatedArrival,
    isCompleted,
    hasDriver,
    contactDriver,
    contactSupport,
    refreshTracking
  } = useUnifiedTracking({
    trackingId,
    trackingType,
    autoRefresh: true,
    enableNotifications: true
  });

  if (loading && !trackingData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md mx-auto">
          <div className="flex items-center justify-center p-8">
            <motion.div
              className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <span className="ml-3 text-muted-foreground">Chargement...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !trackingData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md mx-auto">
          <div className="text-center p-6">
            <div className="text-destructive mb-2">Erreur de chargement</div>
            <Button onClick={refreshTracking} variant="outline">
              Réessayer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-blue-500',
      driver_assigned: 'bg-purple-500',
      picked_up: 'bg-orange-500',
      in_transit: 'bg-green-500',
      delivered: 'bg-emerald-600',
      completed: 'bg-emerald-600',
      cancelled: 'bg-red-500'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  const getServiceIcon = () => {
    if (trackingType === 'delivery') {
      return <Package className="w-5 h-5" />;
    }
    return <Car className="w-5 h-5" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto p-0 gap-0 max-h-[90vh] overflow-hidden">
        {/* Header avec statut */}
        <motion.div 
          className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 relative"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 text-primary-foreground hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              {getServiceIcon()}
            </div>
            <div>
              <h2 className="font-bold text-lg">
                {trackingType === 'delivery' ? 'Livraison' : 'Course'} #{trackingId.slice(-6)}
              </h2>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(trackingData.status)}`} />
                <span className="text-sm opacity-90">{statusLabel}</span>
              </div>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs opacity-75">
              <span>Progression</span>
              <span>{trackingData.progress}%</span>
            </div>
            <Progress value={trackingData.progress} className="h-2 bg-white/20" />
          </div>

          {/* Statut de connexion */}
          <div className="flex items-center gap-1 mt-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-400' : 
              connectionStatus === 'reconnecting' ? 'bg-yellow-400' : 'bg-red-400'
            }`} />
            <span className="text-xs opacity-75">
              {connectionStatus === 'connected' ? 'Temps réel' : 
               connectionStatus === 'reconnecting' ? 'Reconnexion...' : 'Hors ligne'}
            </span>
          </div>
        </motion.div>

        <div className="flex-1 overflow-y-auto">
          {/* Prix et timing */}
          <motion.div 
            className="p-4 border-b"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="text-2xl font-bold">
                  {trackingData.pricing.amount.toLocaleString()} {trackingData.pricing.currency}
                </div>
                {estimatedArrival && (
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Arrivée prévue: {estimatedArrival}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">
                  {new Date(trackingData.timing.createdAt).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                {isCompleted && trackingData.timing.completedAt && (
                  <div className="text-xs text-green-600 font-medium">
                    Terminé à {new Date(trackingData.timing.completedAt).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Chauffeur */}
          {hasDriver && trackingData.driver && (
            <motion.div 
              className="p-4 border-b"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={trackingData.driver.avatar} />
                    <AvatarFallback>
                      <User className="w-6 h-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{trackingData.driver.name}</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {trackingData.driver.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{trackingData.driver.rating.toFixed(1)}</span>
                        </div>
                      )}
                      {trackingData.driver.vehicle && (
                        <div className="flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          <span>{trackingData.driver.vehicle}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={contactDriver}
                    className="p-2"
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="p-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Itinéraire */}
          <motion.div 
            className="p-4 space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="font-semibold flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              Itinéraire
            </h3>
            
            <div className="space-y-3">
              {/* Point de départ */}
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-muted-foreground">Départ</div>
                  <div className="font-medium text-sm break-words">
                    {trackingData.route.pickup.address}
                  </div>
                </div>
              </div>

              {/* Ligne de connexion */}
              <div className="ml-1.5 w-0.5 h-6 bg-border" />

              {/* Point d'arrivée */}
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-muted-foreground">
                    {trackingType === 'delivery' ? 'Livraison' : 'Destination'}
                  </div>
                  <div className="font-medium text-sm break-words">
                    {trackingData.route.destination.address}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Carte si position du chauffeur disponible */}
          {trackingData.driverLocation && (
            <motion.div 
              className="p-4 border-t"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Position en temps réel</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMap(!showMap)}
                >
                  {showMap ? 'Masquer' : 'Afficher'} carte
                </Button>
              </div>
              
              <AnimatePresence>
                {showMap && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 200, opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden rounded-lg"
                  >
                    <GoogleMapsKwenda
                      pickup={trackingData.route.pickup}
                      destination={trackingData.route.destination}
                      showRoute={true}
                      height="200px"
                      driverLocation={trackingData.driverLocation}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {trackingData.driverLocation && (
                <div className="text-xs text-muted-foreground mt-2">
                  Dernière mise à jour: {new Date(trackingData.driverLocation.lastUpdate).toLocaleTimeString('fr-FR')}
                </div>
              )}
            </motion.div>
          )}

          {/* Actions */}
          <motion.div 
            className="p-4 border-t bg-muted/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline"
                onClick={contactSupport}
                className="w-full"
              >
                Support
              </Button>
              <Button 
                onClick={refreshTracking}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Actualisation...' : 'Actualiser'}
              </Button>
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};