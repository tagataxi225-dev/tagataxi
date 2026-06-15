import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeTracking } from '@/hooks/useRealtimeTracking';
import { secureLocation, isValidLocation } from '@/utils/locationValidation';
import { toast } from 'sonner';
import { 
  MapPin, 
  Navigation2, 
  Phone, 
  MessageSquare, 
  Package, 
  Clock, 
  User,
  Route,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface UnifiedDeliveryTrackingProps {
  orderId: string;
  userType: 'client' | 'driver';
  onStatusUpdate?: () => void;
}

interface DeliveryOrder {
  id: string;
  status: string;
  pickup_location: string;
  delivery_location: string;
  pickup_coordinates: any;
  delivery_coordinates: any;
  delivery_type: string;
  estimated_price: number;
  actual_price?: number;
  user_id: string;
  driver_id?: string;
  created_at: string;
  driver_notes?: string;
  delivery_proof?: any;
}

interface UserProfile {
  display_name?: string;
  phone_number?: string;
  avatar_url?: string;
}

const statusTranslations = {
  'pending': { fr: 'En attente', icon: Clock, color: 'orange' },
  'confirmed': { fr: 'Confirmée', icon: CheckCircle2, color: 'blue' },
  'driver_assigned': { fr: 'Livreur assigné', icon: User, color: 'purple' },
  'picked_up': { fr: 'Colis récupéré', icon: Package, color: 'indigo' },
  'in_transit': { fr: 'En livraison', icon: Route, color: 'amber' },
  'delivered': { fr: 'Livré', icon: CheckCircle2, color: 'green' },
  'cancelled': { fr: 'Annulé', icon: AlertTriangle, color: 'red' }
};

export const UnifiedDeliveryTracking: React.FC<UnifiedDeliveryTrackingProps> = ({
  orderId,
  userType,
  onStatusUpdate
}) => {
  const { user } = useAuth();
  const [order, setOrder] = useState<DeliveryOrder | null>(null);
  const [driverProfile, setDriverProfile] = useState<UserProfile | null>(null);
  const [clientProfile, setClientProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Configuration tracking temps réel
  const {
    currentLocation,
    isTracking,
    error: trackingError,
    startTracking,
    stopTracking,
    getNearbyDrivers
  } = useRealtimeTracking();

  // Chargement initial des données
  useEffect(() => {
    const loadDeliveryData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Charger la commande
        const { data: orderData, error: orderError } = await supabase
          .from('delivery_orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (orderError) throw orderError;
        setOrder(orderData as DeliveryOrder);

        // Charger les profils
        if (orderData.driver_id) {
          const { data: driverData } = await supabase
            .from('profiles')
            .select('display_name, phone_number, avatar_url')
            .eq('user_id', orderData.driver_id)
            .single();
          setDriverProfile(driverData as UserProfile);
        }

        const { data: clientData } = await supabase
          .from('profiles')
          .select('display_name, phone_number, avatar_url')
          .eq('user_id', orderData.user_id)
          .single();
        setClientProfile(clientData as UserProfile);

      } catch (err: any) {
        console.error('Erreur de chargement:', err);
        setError(err.message || 'Erreur de chargement des données');
        toast.error('Erreur de chargement des données de livraison');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      loadDeliveryData();
    }
  }, [orderId]);

  // Écouter les mises à jour en temps réel de la commande
  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`delivery-order-${orderId}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'delivery_orders', 
          filter: `id=eq.${orderId}` 
        },
        (payload) => {
          setOrder(payload.new as DeliveryOrder);
          onStatusUpdate?.();
          
          // Notification de mise à jour
          const newStatus = payload.new.status;
          const statusInfo = statusTranslations[newStatus as keyof typeof statusTranslations];
          if (statusInfo) {
            toast.success(`Statut mis à jour: ${statusInfo.fr}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, onStatusUpdate]);

  // Démarrer le tracking si c'est un livreur
  useEffect(() => {
    if (userType === 'driver' && order && !isTracking) {
      startTracking({
        updateInterval: 30000,
        highAccuracy: true
      });
    }

    // Nettoyage au démontage
    return () => {
      if (userType === 'driver' && isTracking) {
        stopTracking();
      }
    };
  }, [userType, order, isTracking, startTracking, stopTracking]);

  // Note: Le tracking se fait automatiquement via useRealtimeTracking

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !order) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>{error || 'Commande non trouvée'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = statusTranslations[order.status as keyof typeof statusTranslations] || 
    { fr: order.status, icon: Package, color: 'gray' };

  const StatusIcon = statusInfo.icon;

  // Sécuriser les coordonnées pour éviter les erreurs
  const pickupCoords = order.pickup_coordinates ? 
    secureLocation(order.pickup_coordinates) : null;
  const deliveryCoords = order.delivery_coordinates ? 
    secureLocation(order.delivery_coordinates) : null;

  // Calculer ETA approximatif
  const eta = currentLocation && deliveryCoords ? 
    Math.ceil(Math.sqrt(
      Math.pow(currentLocation.lat - deliveryCoords.lat, 2) + 
      Math.pow(currentLocation.lng - deliveryCoords.lng, 2)
    ) * 100) : null;

  const openNavigation = (coordinates: any) => {
    if (!coordinates || !isValidLocation(coordinates)) {
      toast.error('Coordonnées invalides pour la navigation');
      return;
    }

    const url = `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`;
    window.open(url, '_blank');
  };

  const callContact = (phoneNumber?: string) => {
    if (!phoneNumber) {
      toast.error('Numéro de téléphone non disponible');
      return;
    }
    window.location.href = `tel:${phoneNumber}`;
  };

  return (
    <div className="space-y-4">
      {/* Statut principal */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <StatusIcon className={`h-5 w-5 text-${statusInfo.color}-600`} />
              Livraison {order.delivery_type.toUpperCase()}
            </CardTitle>
            <Badge variant="outline" className={`text-${statusInfo.color}-600 border-${statusInfo.color}-200`}>
              {statusInfo.fr}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Statut de connexion tracking */}
          {userType === 'driver' && (
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-muted-foreground">
                Tracking: {isTracking ? 'Actif' : 'Inactif'}
              </span>
            </div>
          )}

          {/* Informations de base */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-sm">Point de collecte</p>
                <p className="text-sm text-muted-foreground">{order.pickup_location}</p>
              </div>
              {pickupCoords && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openNavigation(pickupCoords)}
                >
                  <Navigation2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-sm">Destination</p>
                <p className="text-sm text-muted-foreground">{order.delivery_location}</p>
              </div>
              {deliveryCoords && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openNavigation(deliveryCoords)}
                >
                  <Navigation2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Prix: {(order.actual_price || order.estimated_price)?.toLocaleString()} CDF
                </span>
              </div>
              {eta && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>ETA: {eta} min</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations de contact */}
      {userType === 'client' && driverProfile && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Votre livreur</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{driverProfile.display_name || 'Livreur'}</p>
                  <p className="text-sm text-muted-foreground">Service {order.delivery_type}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => callContact(driverProfile.phone_number)}
                >
                  <Phone className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {userType === 'driver' && clientProfile && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Client</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{clientProfile.display_name || 'Client'}</p>
                  <p className="text-sm text-muted-foreground">Commande #{order.id.slice(-8)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => callContact(clientProfile.phone_number)}
                >
                  <Phone className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Position du livreur en temps réel */}
      {currentLocation && userType === 'driver' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Position en temps réel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Latitude:</span>
                <span>{currentLocation.lat?.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Longitude:</span>
                <span>{currentLocation.lng?.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Statut:</span>
                <Badge variant="outline">En course</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Précision:</span>
                <span>GPS</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UnifiedDeliveryTracking;