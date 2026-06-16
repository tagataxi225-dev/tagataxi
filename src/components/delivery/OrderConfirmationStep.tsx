import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useEnhancedDeliveryOrders } from '@/hooks/useEnhancedDeliveryOrders';
import { formatCurrency } from '@/utils/formatCurrency';
import { 
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Navigation,
  User,
  Phone,
  Clock,
  DollarSign,
  Package,
  Loader2
} from 'lucide-react';
interface DeliveryLocation {
  address: string;
  coordinates: { lat: number; lng: number };
}

interface ContactInfo {
  name: string;
  phone: string;
}

interface DeliveryService {
  id: 'flash' | 'flex' | 'maxicharge';
  name: string;
  subtitle: string;
  description: string;
  icon: any;
  features: string[];
  estimatedTime: string;
}

interface DeliveryPricing {
  price: number;
  distance: number;
  duration: number;
}

interface OrderConfirmationStepProps {
  pickup: {
    location: DeliveryLocation;
    contact?: ContactInfo;
  };
  destination: {
    location: DeliveryLocation;
    contact?: ContactInfo;
  };
  service: DeliveryService;
  pricing: DeliveryPricing;
  city?: string;
  currency?: string;
  onBack: () => void;
  onConfirm: (orderId: string) => void;
}

export const OrderConfirmationStep: React.FC<OrderConfirmationStepProps> = ({
  pickup,
  destination,
  service,
  pricing,
  city = 'kinshasa',
  currency = 'XOF',
  onBack,
  onConfirm
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { createDeliveryOrder } = useEnhancedDeliveryOrders();

  const formatPrice = (price: number) => formatCurrency(price, currency as any);

  const handleConfirm = async () => {
    // ✅ ACTION 4: Logs détaillés bout-en-bout
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 [CONFIRMATION] Début handleConfirm');
    console.log('📋 [CONFIRMATION] Props reçues:', {
      pickup: {
        address: pickup?.location?.address,
        coordinates: pickup?.location?.coordinates,
        contact: pickup?.contact
      },
      destination: {
        address: destination?.location?.address,
        coordinates: destination?.location?.coordinates,
        contact: destination?.contact
      },
      service: {
        id: service?.id,
        name: service?.name
      },
      pricing
    });
    
    setIsCreating(true);
    
    try {
      // ✅ ACTION 3: VALIDATION STRICTE IMMÉDIATE
      
      // Validation des structures de données
      if (!pickup?.location || !destination?.location) {
        console.error('❌ Structures de localisation manquantes');
        toast({
          title: "Erreur de validation",
          description: "Données de localisation manquantes",
          variant: "destructive",
        });
        return;
      }
      
      // VALIDATION STRICTE DES CONTACTS - AVANT TOUTE AUTRE CHOSE
      const pickupPhone = pickup.contact?.phone?.trim();
      const destinationPhone = destination.contact?.phone?.trim();
      
      if (!pickupPhone) {
        console.error('❌ Numéro de téléphone expéditeur manquant');
        toast({
          title: "Numéro de téléphone requis",
          description: "Le numéro de téléphone de l'expéditeur est obligatoire pour créer la livraison",
          variant: "destructive",
        });
        return;
      }
      
      if (!destinationPhone) {
        console.error('❌ Numéro de téléphone destinataire manquant');
        toast({
          title: "Numéro de téléphone requis",
          description: "Le numéro de téléphone du destinataire est obligatoire pour créer la livraison",
          variant: "destructive",
        });
        return;
      }
      
      // Validation des adresses
      const pickupAddress = pickup.location.address?.trim();
      const destinationAddress = destination.location.address?.trim();
      
      if (!pickupAddress) {
        console.error('❌ Adresse de collecte manquante');
        toast({
          title: "Adresse de collecte requise",
          description: "Veuillez sélectionner une adresse de collecte valide",
          variant: "destructive",
        });
        return;
      }
      
      if (!destinationAddress) {
        console.error('❌ Adresse de destination manquante');
        toast({
          title: "Adresse de livraison requise", 
          description: "Veuillez sélectionner une adresse de livraison valide",
          variant: "destructive",
        });
        return;
      }
      
      // Validation des coordonnées
      const pickupCoords = pickup.location.coordinates;
      const destCoords = destination.location.coordinates;
      
      if (!pickupCoords?.lat || !pickupCoords?.lng || isNaN(Number(pickupCoords.lat)) || isNaN(Number(pickupCoords.lng))) {
        console.error('❌ Coordonnées de collecte invalides:', pickupCoords);
        toast({
          title: "Coordonnées de collecte invalides",
          description: "Veuillez sélectionner une position valide sur la carte",
          variant: "destructive",
        });
        return;
      }
      
      if (!destCoords?.lat || !destCoords?.lng || isNaN(Number(destCoords.lat)) || isNaN(Number(destCoords.lng))) {
        console.error('❌ Coordonnées de destination invalides:', destCoords);
        toast({
          title: "Coordonnées de livraison invalides",
          description: "Veuillez sélectionner une position valide sur la carte",
          variant: "destructive",
        });
        return;
      }
      
      // Préparer les données normalisées et validées avec MAPPING CORRECT ET GARANTIE
      const orderData = {
        pickup: {
          address: pickupAddress,
          lat: Number(pickupCoords.lat),
          lng: Number(pickupCoords.lng),
          contactName: pickup.contact?.name?.trim() || 'Expéditeur',
          contactPhone: pickupPhone // Déjà validé et trimé ci-dessus
        },
        destination: {
          address: destinationAddress,
          lat: Number(destCoords.lat),
          lng: Number(destCoords.lng),
          contactName: destination.contact?.name?.trim() || 'Destinataire',
          contactPhone: destinationPhone // Déjà validé et trimé ci-dessus
        },
        // MAPPING CORRIGÉ : Transformer contactName/contactPhone en senderName/senderPhone
        senderName: pickup.contact?.name?.trim() || 'Expéditeur',
        senderPhone: pickupPhone, // GARANTIE: Jamais vide
        recipientName: destination.contact?.name?.trim() || 'Destinataire',
        recipientPhone: destinationPhone, // GARANTIE: Jamais vide
        mode: service.id,
        city: city.charAt(0).toUpperCase() + city.slice(1),
        estimatedPrice: pricing.price,
        distance: pricing.distance,
        duration: pricing.duration
      };
      
      console.log('✅ [CONFIRMATION] Données finales avant envoi à createDeliveryOrder:');
      console.log('📦 [CONFIRMATION] orderData complet:', JSON.stringify(orderData, null, 2));
      console.log('📞 [CONFIRMATION] Garantie contacts non-vides:', {
        senderPhone: orderData.senderPhone,
        recipientPhone: orderData.recipientPhone
      });

      console.log('🚀 [CONFIRMATION] Appel createDeliveryOrder...');
      const orderId = await createDeliveryOrder(orderData);
      
      if (orderId) {
        console.log('✅ [CONFIRMATION] Commande créée avec succès, ID:', orderId);
        toast({
          title: "✅ Commande créée avec succès !",
          description: `Votre ${service.name} a été confirmée`,
        });
        onConfirm(orderId);
      } else {
        throw new Error('Erreur lors de la création de la commande');
      }
    } catch (error: any) {
      console.error('❌ [CONFIRMATION] Erreur lors de la création:', error);
      console.error('❌ [CONFIRMATION] Error stack:', error.stack);
      
      // ✅ ACTION 5: Messages d'erreur contextualisés et guidage utilisateur
      let userMessage = error.message || "Impossible de créer la commande";
      let userTitle = "❌ Erreur de création";
      
      // Détecter et traduire les erreurs PostgreSQL
      if (error.message?.includes('sender_phone') || error.message?.includes('Numéro de téléphone expéditeur') || error.message?.includes('senderPhone')) {
        userTitle = "❌ Contact expéditeur manquant";
        userMessage = "Le numéro de téléphone de l'expéditeur est obligatoire. Veuillez retourner à l'étape Contacts.";
      } else if (error.message?.includes('recipient_phone') || error.message?.includes('Numéro de téléphone destinataire') || error.message?.includes('recipientPhone')) {
        userTitle = "❌ Contact destinataire manquant";
        userMessage = "Le numéro de téléphone du destinataire est obligatoire. Veuillez retourner à l'étape Contacts.";
      } else if (error.message?.includes('coordinates') || error.message?.includes('coordonnées') || error.message?.includes('invalid')) {
        userTitle = "❌ Adresses invalides";
        userMessage = "Les coordonnées de livraison sont invalides. Veuillez resélectionner les adresses.";
      } else if (error.message?.includes('violates row-level security') || error.message?.includes('permission denied')) {
        userTitle = "❌ Authentification requise";
        userMessage = "Vous devez être connecté pour créer une commande.";
      } else if (error.message?.includes('trigger') || error.message?.includes('constraint')) {
        userTitle = "❌ Validation échouée";
        userMessage = "Les données de la commande ne respectent pas les contraintes requises. Veuillez vérifier toutes les informations.";
      }
      
      toast({
        title: userTitle,
        description: userMessage,
        variant: "destructive",
        duration: 6000
      });
    } finally {
      setIsCreating(false);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
  };

  // L'icon est une string emoji, pas un composant
  const serviceIconEmoji = typeof service.icon === 'string' ? service.icon : '📦';

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={onBack}
              disabled={isCreating}
              className="flex items-center gap-2 hover:bg-primary/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Confirmation
            </h1>
            <div className="w-16" />
          </div>
        </div>

        {/* Service Summary */}
        <Card className="bg-card border border-border shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <span className="text-2xl" role="img" aria-label={service.name}>
                  {serviceIconEmoji}
                </span>
              </div>
              <div>
                <h3 className="text-xl">{service.name}</h3>
                <p className="text-sm text-muted-foreground font-normal">{service.subtitle}</p>
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 p-3 bg-card/50 rounded-lg">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Délai</p>
                  <p className="font-medium">{service.estimatedTime}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-card/50 rounded-lg">
                <Package className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Distance</p>
                  <p className="font-medium">{pricing.distance.toFixed(1)} km</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                <DollarSign className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Prix</p>
                  <p className="font-bold text-primary">{formatPrice(pricing.price)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Details */}
        <Card className="bg-card border border-border shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              Détails de la livraison
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Pickup */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4 text-primary" />
                Point de collecte
              </div>
              <div className="pl-6 space-y-2">
                <p className="text-sm">{pickup.location.address}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {pickup.contact?.name || 'Expéditeur'}
                  </div>
                  {pickup.contact?.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {pickup.contact.phone}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Destination */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Navigation className="h-4 w-4 text-secondary" />
                Point de livraison
              </div>
              <div className="pl-6 space-y-2">
                <p className="text-sm">{destination.location.address}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {destination.contact?.name || 'Destinataire'}
                  </div>
                  {destination.contact?.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {destination.contact.phone}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Features */}
        <Card className="bg-card border border-border shadow-lg mb-6">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium mb-3">Services inclus :</p>
              <div className="flex flex-wrap gap-2">
                {service.features.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Confirm Button */}
        <Button
          onClick={handleConfirm}
          disabled={isCreating}
          className="w-full h-14 text-base font-medium rounded-xl
                    bg-gradient-to-r from-primary to-primary/90 
                    hover:from-primary/90 hover:to-primary
                    disabled:from-grey-300 disabled:to-grey-400
                    transition-all duration-300 transform
                    hover:scale-[1.02] active:scale-[0.98]
                    shadow-lg hover:shadow-xl"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Création en cours...
            </>
          ) : (
            <>
              Confirmer la commande • {formatPrice(pricing.price)}
              <CheckCircle2 className="h-5 w-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};