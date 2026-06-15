/**
 * 🎯 COMPOSANT UNIVERSEL DE TRACKING
 * 
 * Remplace tous les anciens trackers :
 * - EnhancedDeliveryTracker
 * - SimpleDeliveryTracker
 * - ModernTaxiTracker
 * - ModernTracker
 * 
 * Supporte 2 modes :
 * - Mode complet : Affichage pleine page avec carte, chat, etc.
 * - Mode compact : Intégration dans d'autres pages (Escrow, Dashboard)
 */

import React, { useState } from 'react';
import ModernTrackingMap from '@/components/tracking/ModernTrackingMap';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Phone, 
  MessageCircle, 
  Clock, 
  Star,
  Package,
  RefreshCw,
  ChevronLeft,
  Info,
  User,
  Navigation,
  Truck,
  ShoppingBag
} from 'lucide-react';
import { useUniversalTracking } from '@/hooks/useUniversalTracking';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useBookingChat } from '@/hooks/useBookingChat';
import { cn } from '@/lib/utils';

interface UniversalTrackerProps {
  orderId: string;
  orderType?: 'delivery' | 'marketplace' | 'taxi';
  compact?: boolean; // Mode compact pour intégration
  showMap?: boolean;
  showChat?: boolean;
  onBack?: () => void;
}

export default function UniversalTracker({ 
  orderId, 
  orderType,
  compact = false,
  showMap = true,
  showChat = true,
  onBack 
}: UniversalTrackerProps) {
  const [messageText, setMessageText] = useState('');
  const { openChatFromBooking } = useBookingChat();
  
  const {
    trackingData,
    loading,
    error,
    connectionStatus,
    orderType: detectedType,
    callDriver,
    callSeller,
    refreshTracking,
    getStatusLabel
  } = useUniversalTracking({
    orderId,
    orderType,
    enableTracking: true
  });

  // ==================== ÉTATS DE CHARGEMENT ====================
  
  if (loading && !trackingData) {
    return (
      <div className={cn(
        compact ? "space-y-3" : "min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-4"
      )}>
        <div className={cn(compact ? "" : "max-w-md mx-auto space-y-4")}>
          {!compact && (
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-muted rounded-lg animate-pulse" />
              <div className="w-24 h-6 bg-muted rounded animate-pulse" />
            </div>
          )}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 space-y-4">
              <div className="w-32 h-8 bg-muted rounded animate-pulse" />
              <div className="w-full h-2 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    const isNotFoundError = error.includes('non trouv') || error.includes('introuvable') || error.includes('non detect');
    
    return (
      <div className={cn(
        compact ? "" : "min-h-screen bg-background p-4"
      )}>
        <div className={cn(compact ? "" : "max-w-md mx-auto space-y-4")}>
          {/* Bouton retour */}
          {!compact && onBack && (
            <Button variant="ghost" onClick={onBack} className="mb-2">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          )}
          
          <Card className="border border-border/40 shadow-lg bg-card">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/30 rounded-full flex items-center justify-center mx-auto">
                <Package className="w-8 h-8 text-amber-500" />
              </div>
              
              <div>
                <h3 className="font-semibold text-lg text-foreground">
                  {isNotFoundError ? 'Commande introuvable' : 'Erreur de connexion'}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {isNotFoundError 
                    ? 'Cette commande a peut-être été annulée ou n\'existe plus.'
                    : 'Impossible de charger les données. Vérifiez votre connexion.'
                  }
                </p>
              </div>
              
              <div className="space-y-2">
                {!isNotFoundError && (
                  <Button onClick={refreshTracking} className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Réessayer
                  </Button>
                )}
                {onBack && (
                  <Button variant="outline" onClick={onBack} className="w-full">
                    Retour à l'activité
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!trackingData) return null;

  const getStatusColor = (status: string) => {
    if (status === 'delivered' || status === 'completed') return 'default';
    if (status === 'cancelled') return 'destructive';
    if (trackingData.driver) return 'default';
    return 'secondary';
  };

  const getTypeIcon = () => {
    switch (detectedType) {
      case 'delivery': return <Package className="w-5 h-5" />;
      case 'taxi': return <Navigation className="w-5 h-5" />;
      case 'marketplace': return <ShoppingBag className="w-5 h-5" />;
      default: return <Truck className="w-5 h-5" />;
    }
  };

  const getTypeLabel = () => {
    switch (detectedType) {
      case 'delivery': return 'Livraison';
      case 'taxi': return 'Taxi';
      case 'marketplace': return 'Commande';
      default: return 'Suivi';
    }
  };

  // ==================== MODE COMPACT ====================
  
  if (compact) {
    return (
      <div className="space-y-3">
        {/* Status Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getTypeIcon()}
            <span className="text-sm font-medium">{getStatusLabel(trackingData.status)}</span>
          </div>
          <Badge variant={getStatusColor(trackingData.status) as any} className="text-xs">
            #{trackingData.orderId.slice(-8).toUpperCase()}
          </Badge>
        </div>

        <Progress value={trackingData.status === 'completed' || trackingData.status === 'delivered' ? 100 : 50} className="h-1.5" />

        {/* ETA si disponible */}
        {trackingData.eta && (
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Arrivée dans {trackingData.eta} min</span>
          </div>
        )}

        {/* Driver info si disponible */}
        {trackingData.driver && (
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium">{trackingData.driver.display_name}</p>
                {trackingData.driver.vehicle_model && (
                  <p className="text-xs text-muted-foreground">{trackingData.driver.vehicle_model}</p>
                )}
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={callDriver}>
              <Phone className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Seller info si marketplace */}
        {detectedType === 'marketplace' && trackingData.seller && (
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium">{trackingData.seller.display_name}</p>
                <p className="text-xs text-muted-foreground">Vendeur</p>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={callSeller}>
              <Phone className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Route */}
        <div className="space-y-2">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5" />
            <div className="flex-1">
              <p className="text-xs font-medium">Départ</p>
              <p className="text-xs text-muted-foreground truncate">{trackingData.pickupLocation}</p>
            </div>
          </div>
          <div className="ml-1 border-l border-dashed border-muted-foreground/30 h-4" />
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5" />
            <div className="flex-1">
              <p className="text-xs font-medium">Arrivée</p>
              <p className="text-xs text-muted-foreground truncate">{trackingData.deliveryLocation}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== MODE COMPLET ====================
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      {/* Header */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="sticky top-0 bg-gradient-to-br from-white/95 via-white/90 to-transparent 
          dark:from-gray-950/95 dark:via-gray-950/90 dark:to-transparent 
          backdrop-blur-2xl border-b border-white/20 p-4 z-50 shadow-lg"
      >
        <div className="flex items-center justify-between max-w-md mx-auto">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="touch-manipulation">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          
          <div className="flex items-center space-x-2">
            {getTypeIcon()}
            <span className="font-medium">{getTypeLabel()}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'connecting' ? 'bg-orange-500 animate-pulse' : 
              'bg-red-500'
            )} />
            <Button variant="ghost" size="icon" onClick={refreshTracking} className="touch-manipulation">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="p-4 space-y-4 max-w-md mx-auto pb-20">
        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{getStatusLabel(trackingData.status)}</h2>
                    <p className="text-sm text-muted-foreground">
                      #{trackingData.orderId.slice(-8).toUpperCase()}
                    </p>
                  </div>
                  <Badge variant={getStatusColor(trackingData.status) as any} className="px-3 py-1">
                    {trackingData.deliveryType?.toUpperCase() || 'STANDARD'}
                  </Badge>
                </div>
                
                <Progress value={trackingData.status === 'completed' || trackingData.status === 'delivered' ? 100 : 50} className="h-2" />
                
                {trackingData.eta && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>Arrivée dans {trackingData.eta} min</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Driver Card */}
        {trackingData.driver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white/60 to-white/40 
              dark:from-gray-900/60 dark:to-gray-900/40 backdrop-blur-lg rounded-2xl">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      {trackingData.driver.profile_photo_url ? (
                        <img 
                          src={trackingData.driver.profile_photo_url} 
                          alt={trackingData.driver.display_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{trackingData.driver.display_name}</h3>
                      {trackingData.driver.vehicle_model && (
                        <p className="text-sm text-muted-foreground">
                          {trackingData.driver.vehicle_model}
                          {trackingData.driver.vehicle_plate && ` • ${trackingData.driver.vehicle_plate}`}
                        </p>
                      )}
                      {trackingData.driver.rating_average && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-muted-foreground">
                            {trackingData.driver.rating_average.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      onClick={callDriver} 
                      className="flex-1 h-12 touch-manipulation"
                      disabled={!trackingData.driver.phone_number}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Appeler
                    </Button>
                    {showChat && (
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-12 w-12 touch-manipulation"
                        onClick={() => openChatFromBooking(orderId, detectedType === 'taxi' ? 'transport' : 'delivery', trackingData.driver!.display_name)}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Carte temps réel */}
        {showMap && trackingData.pickupCoords && trackingData.deliveryCoords && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden shadow-xl"
          >
            <ModernTrackingMap
              pickup={trackingData.pickupCoords}
              destination={trackingData.deliveryCoords}
              driverLocation={trackingData.driverLocation ? { lat: trackingData.driverLocation.lat, lng: trackingData.driverLocation.lng } : undefined}
              driverHeading={trackingData.driverLocation?.heading ?? undefined}
              driver={trackingData.driver ? {
                name: trackingData.driver.display_name,
                phone: trackingData.driver.phone_number,
                vehicle: trackingData.driver.vehicle_model ? { type: trackingData.driver.vehicle_model, plate: trackingData.driver.vehicle_plate } : undefined,
                rating: trackingData.driver.rating_average
              } : undefined}
              eta={trackingData.eta ? `${trackingData.eta} min` : undefined}
              distance={trackingData.distance ? `${trackingData.distance.toFixed(1)} km` : undefined}
              status={trackingData.status}
              trackingType={detectedType || 'taxi'}
              className="h-[320px]"
              showControls={true}
              autoFollow={true}
            />
          </motion.div>
        )}

        {/* Seller Card (Marketplace uniquement) */}
        {detectedType === 'marketplace' && trackingData.seller && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Vendeur</h3>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-secondary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{trackingData.seller.display_name}</h3>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={callSeller} 
                    className="w-full h-12 touch-manipulation"
                    variant="outline"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Contacter le vendeur
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Route Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="space-y-4">
                <h3 className="font-medium">Itinéraire</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Départ</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {trackingData.pickupLocation}
                      </p>
                    </div>
                  </div>
                  
                  <div className="ml-1.5 border-l border-dashed border-muted-foreground/30 h-6" />
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Arrivée</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {trackingData.deliveryLocation}
                      </p>
                    </div>
                  </div>
                </div>
                
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}
