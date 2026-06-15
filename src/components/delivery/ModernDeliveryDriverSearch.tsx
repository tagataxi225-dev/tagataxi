/**
 * Composant de recherche de livreur moderne adapté pour la livraison
 * Basé sur ModernDriverSearch mais optimisé pour le service de livraison
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Clock, 
  Star, 
  Phone, 
  MessageCircle, 
  Package,
  Navigation2,
  Zap,
  Search,
  Timer,
  ChevronRight,
  Truck,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import EnhancedDriverFilters from './EnhancedDriverFilters';
import DeliveryDriverChatModal from './DeliveryDriverChatModal';

interface DeliveryDriverProfile {
  user_id: string;
  vehicle_type: string;
  vehicle_plate: string;
  vehicle_color: string;
  rating_average: number;
  rating_count: number;
  total_rides?: number;
  display_name?: string;
  phone_number?: string;
}

interface DeliveryDriver {
  driver_id: string;
  distance: number;
  estimated_arrival: number;
  driver_profile: DeliveryDriverProfile;
  vehicle_type: 'moto' | 'car' | 'truck';
}

interface ModernDeliveryDriverSearchProps {
  orderId: string;
  deliveryMode: 'flash' | 'flex' | 'maxicharge';
  estimatedPrice: number;
  onDriverAssigned: (driverId: string, driverData: DeliveryDriver) => void;
  onCancel: () => void;
  onBackToForm: () => void;
}

const getVehicleIcon = (type: string) => {
  switch (type) {
    case 'moto': return '🏍️';
    case 'car': return '🚗';
    case 'truck': return '🚛';
    default: return '🚗';
  }
};

const getDeliveryModeLabel = (mode: string) => {
  switch (mode) {
    case 'flash': return 'Flash ⚡';
    case 'flex': return 'Flex 🚗';
    case 'maxicharge': return 'MaxiCharge 🚛';
    default: return 'Livraison';
  }
};

export const ModernDeliveryDriverSearch: React.FC<ModernDeliveryDriverSearchProps> = ({
  orderId,
  deliveryMode,
  estimatedPrice,
  onDriverAssigned,
  onCancel,
  onBackToForm
}) => {
  const [searchState, setSearchState] = useState<'searching' | 'found' | 'none'>('searching');
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<DeliveryDriver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<DeliveryDriver | null>(null);
  const [searchDuration, setSearchDuration] = useState(0);
  const [searchRadius, setSearchRadius] = useState(5);
  const [showFilters, setShowFilters] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [filters, setFilters] = useState({
    vehicleTypes: [] as string[],
    minRating: 0,
    maxDistance: 20,
    maxPrice: 50000,
    onlyVerified: false
  });

  // Recherche initiale de livreurs
  useEffect(() => {
    if (orderId) {
      findDeliveryDrivers();
    }
  }, [orderId]);

  // Timer de recherche
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (searchState === 'searching') {
      interval = setInterval(() => {
        setSearchDuration(prev => prev + 1);
      }, 1000);
    } else {
      setSearchDuration(0);
    }
    return () => clearInterval(interval);
  }, [searchState]);

  // Auto-sélection du livreur le plus proche et application des filtres
  useEffect(() => {
    if (searchState === 'found' && drivers.length > 0) {
      // Appliquer les filtres
      const filtered = drivers.filter(driver => {
        // Filtre par type de véhicule
        if (filters.vehicleTypes.length > 0 && !filters.vehicleTypes.includes(driver.vehicle_type)) {
          return false;
        }
        
        // Filtre par rating
        if (driver.driver_profile.rating_average < filters.minRating) {
          return false;
        }
        
        // Filtre par distance
        if (driver.distance > filters.maxDistance) {
          return false;
        }
        
        return true;
      });
      
      setFilteredDrivers(filtered);
      
      // Auto-sélection du premier livreur filtré
      if (filtered.length > 0 && !selectedDriver) {
        setSelectedDriver(filtered[0]);
      }
    }
  }, [searchState, drivers, selectedDriver, filters]);

  const findDeliveryDrivers = async (manualSearch = false) => {
    try {
      setSearchState('searching');
      
      if (manualSearch) {
        toast.info('Recherche manuelle en cours...');
      }
      
      const { data, error } = await supabase.functions.invoke('delivery-dispatcher', {
        body: {
          action: 'find_drivers',
          orderId: orderId,
          mode: deliveryMode,
          radiusKm: searchRadius,
          maxDrivers: 10
        }
      });

      if (error) {
        console.error('Erreur recherche livreurs:', error);
        toast.error('Erreur lors de la recherche de livreurs');
        setSearchState('none');
        return;
      }

      // Utiliser les vraies données ou fallback sur mock
      const realDrivers = data?.drivers || [];
      
      if (realDrivers.length > 0) {
        console.log(`Trouvé ${realDrivers.length} livreurs réels`);
        setDrivers(realDrivers);
        setSearchState('found');
        toast.success(`${realDrivers.length} livreur${realDrivers.length > 1 ? 's' : ''} trouvé${realDrivers.length > 1 ? 's' : ''}`);
      } else {
        // Fallback avec données simulées pour la démo
        console.log('Aucun livreur réel, utilisation de données simulées');
        
        setTimeout(() => {
          const mockDrivers: DeliveryDriver[] = [
            {
              driver_id: 'demo_driver_1',
              distance: 0.8,
              estimated_arrival: 5,
              vehicle_type: deliveryMode === 'flash' ? 'moto' : deliveryMode === 'maxicharge' ? 'truck' : 'car',
              driver_profile: {
                user_id: 'demo_user_1',
                vehicle_type: deliveryMode === 'flash' ? 'Moto Honda' : deliveryMode === 'maxicharge' ? 'Camion Isuzu' : 'Toyota Corolla',
                vehicle_plate: 'KIN-1234',
                vehicle_color: 'Bleu',
                rating_average: 4.8,
                rating_count: 152,
                total_rides: 320,
                display_name: 'Jean-Paul K.',
                phone_number: '+243900000001'
              }
            },
            {
              driver_id: 'demo_driver_2',
              distance: 1.2,
              estimated_arrival: 8,
              vehicle_type: deliveryMode === 'flash' ? 'moto' : deliveryMode === 'maxicharge' ? 'truck' : 'car',
              driver_profile: {
                user_id: 'demo_user_2',
                vehicle_type: deliveryMode === 'flash' ? 'Moto Yamaha' : deliveryMode === 'maxicharge' ? 'Camion Toyota' : 'Nissan Almera',
                vehicle_plate: 'KIN-5678',
                vehicle_color: 'Rouge',
                rating_average: 4.6,
                rating_count: 89,
                total_rides: 156,
                display_name: 'Marie T.',
                phone_number: '+243900000002'
              }
            }
          ];

          setDrivers(mockDrivers);
          setSearchState('found');
          toast.success(`${mockDrivers.length} livreurs trouvés (démo)`);
        }, 2500);
      }

    } catch (error) {
      console.error('Erreur invocation delivery-dispatcher:', error);
      toast.error('Erreur de connexion');
      setSearchState('none');
    }
  };

  const handleDriverSelect = (driver: DeliveryDriver) => {
    setSelectedDriver(driver);
  };

  const handleConfirmDriver = async () => {
    if (!selectedDriver) return;

    try {
      // Utiliser la fonction d'assignation de l'edge function
      const { data, error } = await supabase.functions.invoke('delivery-dispatcher', {
        body: {
          action: 'assign_driver',
          orderId: orderId,
          driverId: selectedDriver.driver_id
        }
      });

      if (error || !data?.success) {
        console.error('Erreur assignation livreur:', error);
        toast.error(data?.error || 'Erreur lors de l\'assignation du livreur');
        return;
      }

      toast.success(`Livreur assigné: ${selectedDriver.driver_profile.display_name}`);
      onDriverAssigned(selectedDriver.driver_id, selectedDriver);
      
    } catch (error) {
      console.error('Erreur confirmation livreur:', error);
      toast.error('Erreur de connexion');
    }
  };

  const handleExpandSearch = () => {
    setSearchRadius(prev => prev + 5);
    findDeliveryDrivers(true);
  };

  const handleManualSearch = () => {
    findDeliveryDrivers(true);
  };

  const handleApplyFilters = () => {
    // Les filtres sont appliqués automatiquement via useEffect
    toast.success('Filtres appliqués');
  };

  const handleContactDriver = () => {
    if (selectedDriver) {
      setShowChat(true);
    }
  };

  // État recherche en cours
  if (searchState === 'searching') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header moderne avec gradient subtil */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary to-primary/80" />
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
          
          <div className="relative p-6 text-primary-foreground">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">Recherche de livreur</h1>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-white/20 text-white border-0">
                    {getDeliveryModeLabel(deliveryMode)}
                  </Badge>
                  <span className="text-sm opacity-90">Recherche optimisée</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToForm}
                className="text-primary-foreground hover:bg-white/20 backdrop-blur-sm"
              >
                ← Retour
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="w-full max-w-md backdrop-blur-sm bg-card/80 border-border/50 shadow-2xl">
              <CardContent className="p-8">
                <div className="text-center space-y-8">
                  {/* Animation radar modernisée */}
                  <div className="relative w-40 h-40 mx-auto">
                    {/* Cercles de fond avec gradient */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20"></div>
                    
                    {/* Animations radar avec gradient */}
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: 'conic-gradient(from 0deg, transparent 0deg, hsl(var(--primary)) 90deg, transparent 180deg)',
                        maskImage: 'radial-gradient(circle, transparent 50%, black 51%, black 52%, transparent 53%)'
                      }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                    
                    <motion.div
                      className="absolute inset-2 rounded-full border-2 border-primary/40"
                      animate={{
                        scale: [1, 1.5, 2],
                        opacity: [0.6, 0.3, 0]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeOut"
                      }}
                    />
                    
                    <motion.div
                      className="absolute inset-6 rounded-full border-2 border-accent"
                      animate={{
                        scale: [1, 1.3, 1.8],
                        opacity: [0.5, 0.2, 0]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: 0.7,
                        ease: "easeOut"
                      }}
                    />
                    
                    {/* Icône centrale avec animation */}
                    <motion.div 
                      className="absolute inset-0 flex items-center justify-center"
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0] 
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                    >
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                        <Package className="w-8 h-8 text-primary-foreground" />
                      </div>
                    </motion.div>
                  </div>

                  <div className="space-y-4">
                    <motion.h3 
                      className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text"
                      animate={{ opacity: [0.8, 1, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Recherche en cours...
                    </motion.h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Intelligence artificielle en action pour trouver le livreur optimal dans votre zone
                    </p>
                    
                    {/* Indicateurs de progression avec style moderne */}
                    <div className="flex items-center justify-center space-x-4 p-4 bg-muted/30 rounded-xl backdrop-blur-sm">
                      <div className="flex items-center space-x-2 text-sm">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Timer className="w-4 h-4 text-primary" />
                        </motion.div>
                        <span className="font-medium">{searchDuration}s</span>
                      </div>
                      <div className="w-px h-4 bg-border"></div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Navigation2 className="w-4 h-4 text-accent" />
                        <span className="font-medium">{searchRadius} km</span>
                      </div>
                    </div>
                  </div>

                  {/* Prix avec design élégant */}
                  <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl p-6 border border-primary/10">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-medium">Prix estimé</span>
                      <span className="font-bold text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        {formatCurrency(estimatedPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Boutons d'action avec design moderne */}
                  <div className="space-y-3">
                    <Button 
                      onClick={handleManualSearch}
                      variant="outline"
                      size="lg"
                      className="w-full h-12 bg-background/50 backdrop-blur-sm hover:bg-accent/20 border-border/50"
                    >
                      <Search className="w-5 h-5 mr-3" />
                      Recherche manuelle
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      onClick={onCancel}
                      className="w-full text-muted-foreground hover:bg-muted/50"
                    >
                      Annuler la recherche
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Aucun livreur trouvé
  if (searchState === 'none') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header moderne */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-destructive/90 via-destructive to-destructive/80" />
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
          
          <div className="relative p-6 text-destructive-foreground">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">Recherche de livreur</h1>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-white/20 text-white border-0">
                    Aucun résultat
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToForm}
                className="text-destructive-foreground hover:bg-white/20 backdrop-blur-sm"
              >
                ← Retour
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="w-full max-w-md backdrop-blur-sm bg-card/80 border-border/50 shadow-2xl">
              <CardContent className="p-8">
                <div className="text-center space-y-8">
                  {/* Icône d'état vide avec animation */}
                  <motion.div 
                    className="relative w-32 h-32 mx-auto"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, type: "spring" }}
                  >
                    <div className="w-full h-full bg-gradient-to-br from-muted/30 to-muted/50 rounded-full flex items-center justify-center backdrop-blur-sm border border-border/30">
                      <motion.div
                        animate={{ y: [-2, 2, -2] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <MapPin className="w-16 h-16 text-muted-foreground/60" />
                      </motion.div>
                    </div>
                    
                    {/* Cercles d'onde pour indiquer la recherche */}
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-muted-foreground/20"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>
                  
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-foreground">
                      Zone temporairement indisponible
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Aucun livreur n'est disponible dans un rayon de <span className="font-semibold text-foreground">{searchRadius} km</span> en ce moment. 
                      Voulez-vous étendre la zone de recherche ?
                    </p>
                  </div>

                  {/* Suggestions d'actions avec design moderne */}
                  <div className="space-y-4">
                    <Button 
                      onClick={handleExpandSearch}
                      size="lg"
                      className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg"
                    >
                      <Navigation2 className="w-5 h-5 mr-3" />
                      Élargir à {searchRadius + 5} km
                    </Button>
                    
                    <Button 
                      onClick={handleManualSearch}
                      variant="outline"
                      size="lg"
                      className="w-full h-12 bg-background/50 backdrop-blur-sm hover:bg-accent/20 border-border/50"
                    >
                      <Search className="w-5 h-5 mr-3" />
                      Nouvelle recherche
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      onClick={onBackToForm}
                      className="w-full text-muted-foreground hover:bg-muted/50"
                    >
                      Modifier ma commande
                    </Button>
                  </div>

                  {/* Suggestion alternative */}
                  <div className="bg-gradient-to-r from-accent/5 to-primary/5 rounded-xl p-4 border border-accent/20">
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Conseil :</strong> Réessayez dans quelques minutes ou élargissez votre zone de livraison.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Livreurs trouvés - affichage des résultats
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header moderne avec succès */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/90 via-emerald-600 to-emerald-500/80" />
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
        
        <div className="relative p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, type: "spring" }}
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"
                >
                  <Package className="w-5 h-5" />
                </motion.div>
                <h1 className="text-2xl font-bold tracking-tight">Livreurs disponibles</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  {filteredDrivers.length} sur {drivers.length} livreur{drivers.length > 1 ? 's' : ''}
                </Badge>
                <span className="text-sm opacity-90">Correspondances trouvées</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToForm}
              className="text-white hover:bg-white/20 backdrop-blur-sm"
            >
              ← Retour
            </Button>
          </div>
        </div>
      </div>
        
      {/* Barre d'actions */}
        <div className="px-4 py-2 bg-background/80 backdrop-blur border-b">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(true)}
              className="flex-1"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtrer
              {(filters.vehicleTypes.length > 0 || filters.minRating > 0 || filters.onlyVerified) && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {[
                    filters.vehicleTypes.length > 0,
                    filters.minRating > 0,
                    filters.onlyVerified
                  ].filter(Boolean).length}
                </Badge>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualSearch}
            >
              <Search className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>

      <div className="flex-1 p-4 space-y-4 pb-24">
        {/* Message si filtres actifs */}
        {filteredDrivers.length < drivers.length && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              {drivers.length - filteredDrivers.length} livreur{drivers.length - filteredDrivers.length > 1 ? 's' : ''} masqué{drivers.length - filteredDrivers.length > 1 ? 's' : ''} par les filtres
            </p>
          </div>
        )}

        {/* Liste des livreurs */}
        <AnimatePresence>
          {filteredDrivers.map((driver, index) => {
            const isSelected = selectedDriver?.driver_id === driver.driver_id;
            const isClosest = index === 0;
            
            return (
              <motion.div
                key={driver.driver_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`cursor-pointer transition-all duration-300 ${
                    isSelected 
                      ? 'ring-2 ring-primary bg-primary/5 shadow-lg' 
                      : 'hover:shadow-md hover:scale-[1.02]'
                  }`}
                  onClick={() => handleDriverSelect(driver)}
                >
                  {isClosest && (
                    <div className="absolute top-2 right-2 z-10">
                      <Badge className="bg-secondary text-secondary-foreground text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        Plus proche
                      </Badge>
                    </div>
                  )}
                  
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      {/* Avatar livreur */}
                      <div className="relative">
                        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-2xl">
                          {getVehicleIcon(driver.vehicle_type)}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      </div>
                      
                      {/* Infos livreur */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-foreground truncate">
                            {driver.driver_profile.display_name || 'Livreur'}
                          </h4>
                          <div className="text-right">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="w-3 h-3 mr-1" />
                              {driver.estimated_arrival} min
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {driver.driver_profile.vehicle_type} • {driver.driver_profile.vehicle_plate} • {driver.driver_profile.vehicle_color}
                        </p>
                        
                        <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center">
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              <span className="text-sm ml-1 font-medium">
                                {driver.driver_profile.rating_average.toFixed(1)}
                              </span>
                              <span className="text-xs text-muted-foreground ml-1">
                                ({driver.driver_profile.rating_count})
                              </span>
                            </div>
                            
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Package className="w-3 h-3 mr-1" />
                              {driver.driver_profile.total_rides || 0} courses
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="w-3 h-3 mr-1" />
                              {driver.distance.toFixed(1)} km
                            </div>
                          </div>
                          
                          {isSelected && (
                            <ChevronRight className="w-4 h-4 text-primary" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions rapides quand sélectionné */}
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 pt-4 border-t border-border"
                      >
                        <div className="flex space-x-2">
                          <Button 
                            className="flex-1"
                            onClick={handleConfirmDriver}
                          >
                            <Package className="w-4 h-4 mr-2" />
                            Confirmer - {formatCurrency(estimatedPrice)}
                          </Button>
                          {driver.driver_profile.phone_number && (
                            <Button variant="outline" size="icon" asChild>
                              <a href={`tel:${driver.driver_profile.phone_number}`}>
                                <Phone className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                          <Button variant="outline" size="icon">
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      
      {/* Bouton annuler */}
      <div className="p-4 border-t bg-background">
        <Button 
          variant="outline" 
          onClick={onCancel} 
          className="w-full"
        >
          Annuler la commande
        </Button>
      </div>
    </div>
  );
};

export default ModernDeliveryDriverSearch;