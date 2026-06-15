import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, MapPin, Clock, Phone, Bike, Truck } from 'lucide-react';

interface DeliveryConfirmationProps {
  orderData: {
    orderId: string;
    mode: 'flash' | 'cargo';
    pickup: { address: string; coordinates: [number, number] };
    destination: { address: string; coordinates: [number, number] };
    price: number;
    estimatedTime: string;
    vehicleSize?: string;
    hasAssistance?: boolean;
  };
  onClose: () => void;
  onTrackOrder: () => void;
}

const DeliveryConfirmation = ({ orderData, onClose, onTrackOrder }: DeliveryConfirmationProps) => {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getVehicleIcon = () => {
    return orderData.mode === 'flash' ? 
      <Bike className="w-8 h-8" /> : 
      <Truck className="w-8 h-8" />;
  };

  const getVehicleName = () => {
    if (orderData.mode === 'flash') return 'Moto Flash';
    if (orderData.vehicleSize === 'tricycle') return 'Tricycle';
    if (orderData.vehicleSize === 'size-s') return 'Véhicule Taille S';
    if (orderData.vehicleSize === 'size-m') return 'Véhicule Taille M';
    if (orderData.vehicleSize === 'size-l') return 'Véhicule Taille L';
    if (orderData.vehicleSize === 'size-xl') return 'Véhicule Taille XL';
    return 'Véhicule Cargo';
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-8 text-white text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-heading-lg font-bold">Commande confirmée !</h1>
            <p className="text-white/90 text-body-md mt-2">
              Votre livraison {orderData.mode === 'flash' ? 'Flash' : 'Cargo'} a été enregistrée
            </p>
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div className="flex-1 px-6 py-6 space-y-6">
        {/* Order ID */}
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="text-center">
            <p className="text-muted-foreground text-body-sm">Numéro de commande</p>
            <p className="text-heading-md font-bold text-green-700 mt-1">
              #{orderData.orderId.slice(-8).toUpperCase()}
            </p>
          </div>
        </Card>

        {/* Vehicle Info */}
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              orderData.mode === 'flash' 
                ? 'bg-gradient-to-br from-secondary to-secondary-light text-white'
                : 'bg-gradient-to-br from-primary to-primary-glow text-white'
            }`}>
              {getVehicleIcon()}
            </div>
            <div className="flex-1">
              <h3 className="text-heading-sm font-semibold">{getVehicleName()}</h3>
              <div className="flex items-center gap-4 mt-2 text-body-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{orderData.estimatedTime}</span>
                </div>
                {orderData.hasAssistance && (
                  <span className="text-green-600 font-medium">+ Aide au chargement</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-heading-lg font-bold text-foreground">
                {orderData.price.toLocaleString()} CDF
              </p>
              <p className="text-caption text-muted-foreground">Prix total</p>
            </div>
          </div>
        </Card>

        {/* Route Info */}
        <Card className="p-5">
          <h3 className="text-heading-sm font-semibold mb-4">Itinéraire</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 bg-secondary rounded-full mt-1 flex-shrink-0"></div>
              <div className="flex-1">
                <p className="text-body-sm font-medium">Prise en charge</p>
                <p className="text-body-sm text-muted-foreground mt-1">
                  {orderData.pickup.address}
                </p>
              </div>
            </div>
            <div className="ml-2 w-px h-6 bg-border"></div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-body-sm font-medium">Livraison</p>
                <p className="text-body-sm text-muted-foreground mt-1">
                  {orderData.destination.address}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Status */}
        <Card className="p-5 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <div>
              <p className="text-body-md font-medium text-blue-900">
                Recherche d'un livreur en cours...
              </p>
              <p className="text-body-sm text-blue-700 mt-1">
                Vous recevrez une notification dès qu'un livreur accepte votre commande
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="p-6 space-y-3 bg-white border-t border-border/50">
        <Button
          onClick={onTrackOrder}
          className="w-full h-14 bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary text-white font-semibold text-body-lg rounded-xl shadow-lg transition-all duration-300"
          style={{ boxShadow: 'var(--shadow-elegant)' }}
        >
          <Phone className="w-5 h-5 mr-2" />
          Suivre ma commande
        </Button>
        <Button
          variant="ghost"
          onClick={onClose}
          className="w-full text-muted-foreground hover:text-foreground text-body-md"
          disabled={countdown > 0}
        >
          {countdown > 0 ? `Retour à l'accueil (${countdown}s)` : 'Retour à l\'accueil'}
        </Button>
      </div>
    </div>
  );
};

export default DeliveryConfirmation;