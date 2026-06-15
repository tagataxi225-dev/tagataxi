import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Clock, Star, Phone, Truck, Search, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DriverOffer {
  driver_id: string;
  driver_name: string;
  rating: number;
  distance_km: number;
  estimated_arrival: number;
  vehicle_type: string;
  phone_number?: string;
  proposed_price?: number;
}

interface DriverRequestManagerProps {
  orderId: string;
  orderStatus: string;
  pickupCoordinates: { lat: number; lng: number };
  estimatedPrice: number;
  onDriverAssigned?: (driverId: string) => void;
}

export default function DriverRequestManager({ 
  orderId, 
  orderStatus, 
  pickupCoordinates,
  estimatedPrice,
  onDriverAssigned 
}: DriverRequestManagerProps) {
  const [searching, setSearching] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState<DriverOffer[]>([]);
  const [searchProgress, setSearchProgress] = useState(0);
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(true);
  const { toast } = useToast();

  // Auto-assigner si en attente
  useEffect(() => {
    if (orderStatus === 'pending' && autoAssignEnabled) {
      handleAutoAssign();
    }
  }, [orderStatus, autoAssignEnabled]);

  const handleAutoAssign = async () => {
    try {
      setSearching(true);
      setSearchProgress(10);
      
      console.log('🚀 Démarrage auto-assignation pour commande:', orderId);
      
      // Appeler l'edge function d'auto-assignation
      const { data, error } = await supabase.functions.invoke('auto-assign-driver', {
        body: { action: 'auto_assign_pending' }
      });

      setSearchProgress(70);

      if (error) throw error;

      setSearchProgress(100);
      
      if (data?.assigned_count > 0) {
        toast({
          title: "🚗 Livreur trouvé !",
          description: "Un chauffeur a été automatiquement assigné à votre commande",
        });
        onDriverAssigned?.(data.assignments[0]?.driver_id);
      } else {
        // Si pas d'assignation auto, chercher manuellement
        await searchNearbyDrivers();
      }

    } catch (error: any) {
      console.error('❌ Erreur auto-assignation:', error);
      // Fallback sur recherche manuelle
      await searchNearbyDrivers();
    } finally {
      setSearching(false);
      setSearchProgress(0);
    }
  };

  const searchNearbyDrivers = async () => {
    try {
      setSearching(true);
      setSearchProgress(20);

      // Chercher chauffeurs disponibles via l'edge function
      const { data, error } = await supabase.functions.invoke('auto-assign-driver', {
        body: { 
          action: 'find_drivers_for_order',
          orderId: orderId
        }
      });

      setSearchProgress(60);

      if (error) throw error;

      setSearchProgress(90);

      // Formater les données des chauffeurs
      if (data?.drivers && data.drivers.length > 0) {
        const formattedDrivers = await Promise.all(
          data.drivers.map(async (driver: any) => {
            // Récupérer infos détaillées du chauffeur
            const { data: chauffeurData } = await supabase
              .from('chauffeurs')
              .select('display_name, phone_number, rating_average, vehicle_type')
              .eq('user_id', driver.driver_id)
              .single();

            return {
              driver_id: driver.driver_id,
              driver_name: chauffeurData?.display_name || 'Chauffeur',
              rating: chauffeurData?.rating_average || 4.5,
              distance_km: driver.distance_km,
              estimated_arrival: driver.estimated_arrival_minutes,
              vehicle_type: chauffeurData?.vehicle_type || driver.vehicle_class,
              phone_number: chauffeurData?.phone_number,
              proposed_price: estimatedPrice // Prix de base
            };
          })
        );

        setAvailableDrivers(formattedDrivers);
        setSearchProgress(100);

        toast({
          title: `🔍 ${formattedDrivers.length} chauffeurs trouvés`,
          description: "Choisissez votre chauffeur ou acceptez l'assignation automatique",
        });
      } else {
        toast({
          title: "😔 Aucun chauffeur disponible",
          description: "Élargissement de la zone de recherche...",
          variant: "destructive"
        });
        setAvailableDrivers([]);
      }

    } catch (error: any) {
      console.error('❌ Erreur recherche chauffeurs:', error);
      toast({
        title: "Erreur de recherche",
        description: "Impossible de trouver des chauffeurs disponibles",
        variant: "destructive"
      });
    } finally {
      setSearching(false);
      setTimeout(() => setSearchProgress(0), 1000);
    }
  };

  const assignSpecificDriver = async (driverId: string) => {
    try {
      // Assigner le chauffeur spécifique
      const { error } = await supabase
        .from('delivery_orders')
        .update({
          driver_id: driverId,
          status: 'driver_assigned',
          driver_assigned_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // Marquer le chauffeur comme indisponible
      await supabase
        .from('driver_locations')
        .update({ is_available: false })
        .eq('driver_id', driverId);

      toast({
        title: "✅ Chauffeur assigné !",
        description: "Le chauffeur choisi a été assigné à votre commande",
      });

      onDriverAssigned?.(driverId);

    } catch (error: any) {
      console.error('❌ Erreur assignation chauffeur:', error);
      toast({
        title: "Erreur d'assignation",
        description: "Impossible d'assigner ce chauffeur",
        variant: "destructive"
      });
    }
  };

  // Si commande déjà assignée, ne pas afficher
  if (['driver_assigned', 'picked_up', 'in_transit', 'delivered'].includes(orderStatus)) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Statut de recherche */}
      {searching && (
        <Card>
          <CardContent className="p-4">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Search className="w-5 h-5 animate-pulse" />
                <span className="font-medium">Recherche de chauffeurs...</span>
              </div>
              <Progress value={searchProgress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                Analyse des chauffeurs disponibles dans votre zone
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bouton de recherche manuelle */}
      {!searching && orderStatus === 'pending' && availableDrivers.length === 0 && (
        <Card>
          <CardContent className="p-4 text-center">
            <Button 
              onClick={searchNearbyDrivers}
              size="lg"
              className="w-full"
            >
              <Search className="w-4 h-4 mr-2" />
              Rechercher un livreur maintenant
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Trouvez un chauffeur disponible dans votre zone
            </p>
          </CardContent>
        </Card>
      )}

      {/* Liste des chauffeurs disponibles */}
      {availableDrivers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              {availableDrivers.length} chauffeurs disponibles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {availableDrivers.map((driver) => (
              <div key={driver.driver_id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {driver.driver_name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{driver.driver_name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {driver.rating.toFixed(1)}
                        <span>•</span>
                        <MapPin className="w-3 h-3" />
                        {driver.distance_km.toFixed(1)} km
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        ~{driver.estimated_arrival} min
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant="outline">{driver.vehicle_type}</Badge>
                    <div className="text-sm font-medium">
                      {driver.proposed_price?.toLocaleString()} CDF
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 flex gap-2">
                  <Button 
                    onClick={() => assignSpecificDriver(driver.driver_id)}
                    size="sm"
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Choisir ce chauffeur
                  </Button>
                  {driver.phone_number && (
                    <Button 
                      asChild
                      size="sm"
                      variant="outline"
                    >
                      <a href={`tel:${driver.phone_number}`}>
                        <Phone className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}