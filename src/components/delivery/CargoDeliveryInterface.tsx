import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import GoogleMapsKwenda from '@/components/maps/GoogleMapsKwenda';
import VehicleSizeSelector, { VehicleSize } from './VehicleSizeSelector';
import LoadingAssistanceToggle from './LoadingAssistanceToggle';
import { GeocodingService } from '@/services/geocoding';
import { useSimpleLocation } from '@/hooks/useSimpleLocation';
import { ModernLocationPicker } from '@/components/delivery/ModernLocationPicker';
import { LocationData } from '@/services/simpleLocationService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Truck,
  Target,
  Package,
  Search,
  History
} from 'lucide-react';

// Plus besoin d'interface Location séparée, on utilise LocationData

interface CargoDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const CargoDeliveryInterface = ({ onSubmit, onCancel }: CargoDeliveryInterfaceProps) => {
  const [pickup, setPickup] = useState<LocationData | null>(null);
  const [destination, setDestination] = useState<LocationData | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('size-s');
  const [hasAssistance, setHasAssistance] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { calculateDistance, formatDistance } = useSimpleLocation();
  const { toast } = useToast();

  const vehicleSizes: VehicleSize[] = [
    {
      id: 'tricycle',
      name: 'Tricycle',
      description: 'Petit volume',
      dimensions: '60x40x30 cm',
      maxWeight: '20 kg',
      price: 800,
      examples: ['Cartons moyens', 'Appareils ménagers']
    },
    {
      id: 'size-s',
      name: 'Taille S',
      description: 'Coffre standard',
      dimensions: '80x60x40 cm',
      maxWeight: '40 kg',
      price: 1500,
      examples: ['Télévision', 'Micro-ondes', 'Caisses']
    },
    {
      id: 'size-m',
      name: 'Taille M',
      description: 'Pick-up compact',
      dimensions: '120x80x60 cm',
      maxWeight: '80 kg',
      price: 2500,
      examples: ['Réfrigérateur', 'Lave-linge', 'Matelas']
    },
    {
      id: 'size-l',
      name: 'Taille L',
      description: 'Camionnette',
      dimensions: '200x120x100 cm',
      maxWeight: '150 kg',
      price: 4000,
      examples: ['Gazinière', 'Armoire', 'Canapé']
    },
    {
      id: 'size-xl',
      name: 'Taille XL',
      description: 'Grand camion',
      dimensions: '300x150x150 cm',
      maxWeight: '300 kg',
      price: 6500,
      examples: ['Déménagement', 'Mobilier complet', 'Gros électroménager']
    }
  ];

  const selectedVehicle = vehicleSizes.find(v => v.id === selectedSize);
  
  const calculatePrice = () => {
    if (!pickup || !destination) return selectedVehicle?.price || 0;
    
    // Utiliser le service unifié pour calculer la distance
    const distance = calculateDistance(
      { lat: pickup.lat, lng: pickup.lng },
      { lat: destination.lat, lng: destination.lng }
    );
    
    const basePrice = selectedVehicle?.price || 0;
    const assistancePrice = hasAssistance ? 500 : 0;
    const distancePrice = Math.round((distance / 1000) * 300); // 300 FC per km for cargo
    return Math.round(basePrice + assistancePrice + distancePrice);
  };

  const handleSubmit = async () => {
    if (!pickup || !destination || !selectedVehicle || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // Save the delivery order to Supabase
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast({
          title: "Authentification requise",
          description: "Vous devez être connecté pour effectuer une livraison",
          variant: "destructive"
        });
        return;
      }

      const orderData = {
        user_id: user.user.id,
        delivery_type: 'cargo',
        pickup_location: pickup.address,
        pickup_coordinates: { lat: pickup.lat, lng: pickup.lng },
        delivery_location: destination.address,
        delivery_coordinates: { lat: destination.lat, lng: destination.lng },
        estimated_price: calculatePrice(),
        vehicle_size: selectedSize,
        loading_assistance: hasAssistance,
        status: 'pending',
        sender_name: 'Expéditeur Cargo',
        sender_phone: '+243000000000',
        recipient_name: 'Destinataire Cargo',
        recipient_phone: '+243000000000'
      };

      const { data, error } = await supabase
        .from('delivery_orders')
        .insert(orderData)
        .select()
        .single();

      if (error) throw error;

      // Les locations récentes sont automatiquement gérées par MasterLocationService

      toast({
        title: "Commande créée",
        description: "Votre demande de livraison Cargo a été enregistrée"
      });

      onSubmit({
        orderId: data.id,
        mode: 'cargo',
        pickup,
        destination,
        vehicleSize: selectedSize,
        hasAssistance,
        price: calculatePrice(),
        estimatedTime: '30-60 min'
      });
    } catch (error) {
      console.error('Error creating delivery order:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la commande. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Plus besoin de gestion manuelle - le nouveau système est automatique

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header Cargo-style */}
      <div className="bg-gradient-to-r from-primary to-primary-glow px-6 py-4 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-heading-md text-white">Cargo Delivery</h1>
              <p className="text-white/80 text-body-sm">Moyens et gros colis • Tous véhicules</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-caption uppercase tracking-wider">Prix estimé</p>
            <p className="text-heading-lg text-white font-bold">{calculatePrice().toLocaleString()} CDF</p>
          </div>
        </div>
      </div>

      {/* Carte avec itinéraire */}
      <div className="px-6 py-4">
        <div className="relative">
          <GoogleMapsKwenda
            pickup={pickup ? { lat: pickup.lat, lng: pickup.lng } : undefined}
            destination={destination ? { lat: destination.lat, lng: destination.lng } : undefined}
            showRoute={!!(pickup && destination)}
            center={pickup ? { lat: pickup.lat, lng: pickup.lng } : { lat: 4.0383, lng: 21.7587 }}
            zoom={12}
            height="200px"
            deliveryMode="maxicharge"
          />
        </div>
      </div>

      {/* Sélecteurs de localisation modernes */}
      <div className="px-6 space-y-4 mb-4">
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            Point de récupération
          </label>
            <ModernLocationPicker
            value={pickup}
            onChange={setPickup}
            placeholder="D'où récupérer le colis ?"
            context="pickup"
          />
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <MapPin className="w-3 h-3 text-primary" />
            Point de livraison
          </label>
          <ModernLocationPicker
            value={destination}
            onChange={setDestination}
            placeholder="Où livrer le colis ?"
            context="delivery"
          />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Vehicle Size Selection */}
        <VehicleSizeSelector
          selectedSize={selectedSize}
          onSizeChange={setSelectedSize}
        />

        {/* Loading Assistance */}
        <LoadingAssistanceToggle
          hasAssistance={hasAssistance}
          onToggle={setHasAssistance}
        />
      </div>

      {/* CTA Button */}
      <div className="p-6 bg-white border-t border-border/50">
        <div className="flex items-center justify-between mb-4">
          <span className="text-muted-foreground text-body-md">Prix total</span>
          <span className="text-heading-lg font-bold text-primary">
            {calculatePrice().toLocaleString()} CDF
          </span>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!pickup || !destination || isSubmitting}
          className="w-full h-16 bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary text-white font-semibold text-body-lg rounded-2xl shadow-lg mb-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ boxShadow: 'var(--shadow-elegant)' }}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Création en cours...
            </div>
          ) : (
            'Confirmer la livraison Cargo'
          )}
        </Button>
        <Button
          variant="ghost"
          onClick={onCancel}
          className="w-full text-muted-foreground hover:text-foreground text-body-md"
        >
          Annuler
        </Button>
      </div>
    </div>
  );
};

export default CargoDeliveryInterface;