import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Camera,
  Navigation,
  Phone,
  MessageSquare
} from 'lucide-react';
import { useDriverDeliveryActions } from '@/hooks/useDriverDeliveryActions';
import { secureLocation, isValidLocation } from '@/utils/locationValidation';
import { toast } from 'sonner';
import { NavigationModal } from './NavigationModal';

interface DeliveryOrder {
  id: string;
  status: string;
  pickup_location: string;
  delivery_location: string;
  pickup_coordinates: any;
  delivery_coordinates: any;
  delivery_type: string;
  estimated_price: number;
  user_id: string;
  sender_name?: string;
  sender_phone?: string;
  recipient_name?: string;
  recipient_phone?: string;
}

interface DriverDeliveryActionsProps {
  order: DeliveryOrder;
  onStatusUpdate: () => void;
}

const DriverDeliveryActions: React.FC<DriverDeliveryActionsProps> = ({ order, onStatusUpdate }) => {
  const [notes, setNotes] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [deliveryPhoto, setDeliveryPhoto] = useState<File | null>(null);
  const [navigationOpen, setNavigationOpen] = useState(false);

  // Debug log pour vérifier les données reçues
  console.log('DriverDeliveryActions order:', order);
  
  // Utiliser le hook optimisé pour les actions livreur
  const {
    loading,
    confirmPickup,
    startDelivery,
    completeDelivery,
    getStatusLabel
  } = useDriverDeliveryActions();

  // Actions simplifiées utilisant le hook optimisé
  const handlePickupConfirm = async () => {
    const success = await confirmPickup(order.id, notes);
    if (success) {
      onStatusUpdate();
      setNotes('');
      toast.success('Colis récupéré avec succès! 📦');
    }
  };

  const handleStartDelivery = async () => {
    const success = await startDelivery(order.id);
    if (success) {
      onStatusUpdate();
      toast.success('Livraison démarrée! 🚗');
    }
  };

  const handleDeliveryComplete = async () => {
    if (!recipientName.trim()) {
      toast.error('Veuillez entrer le nom du destinataire');
      return;
    }

    const success = await completeDelivery(
      order.id,
      recipientName,
      deliveryPhoto || undefined,
      notes
    );
    
    if (success) {
      onStatusUpdate();
      setNotes('');
      setRecipientName('');
      setDeliveryPhoto(null);
      toast.success('Livraison terminée! Excellent travail! 🎉');
    }
  };

  const renderActionButtons = () => {
    switch (order.status) {
      case 'confirmed':
      case 'driver_assigned':
        return (
          <div className="space-y-3">
            {/* Bouton d'appel rapide - Expéditeur */}
            {order.sender_phone && (
              <a 
                href={`tel:${order.sender_phone}`}
                className="flex items-center justify-center gap-2 w-full p-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg transition-colors"
              >
                <Phone className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  Appeler {order.sender_name || 'l\'expéditeur'}
                </span>
              </a>
            )}
            
            <Button 
              onClick={handlePickupConfirm}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              <Package className="w-4 h-4 mr-2" />
              {loading ? 'Confirmation...' : 'Confirmer la récupération'}
            </Button>
          </div>
        );

      case 'picked_up':
        return (
          <div className="space-y-3">
            {/* Bouton d'appel rapide - Destinataire */}
            {order.recipient_phone && (
              <a 
                href={`tel:${order.recipient_phone}`}
                className="flex items-center justify-center gap-2 w-full p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors"
              >
                <Phone className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-700">
                  Appeler {order.recipient_name || 'le destinataire'}
                </span>
              </a>
            )}
            
            <Button 
              onClick={handleStartDelivery}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              <Navigation className="w-4 h-4 mr-2" />
              {loading ? 'Démarrage...' : 'Démarrer la livraison'}
            </Button>
          </div>
        );

      case 'in_transit':
        return (
          <div className="space-y-4">
            {/* Bouton d'appel rapide - Destinataire */}
            {order.recipient_phone && (
              <a 
                href={`tel:${order.recipient_phone}`}
                className="flex items-center justify-center gap-2 w-full p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors"
              >
                <Phone className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-700">
                  Appeler {order.recipient_name || 'le destinataire'}
                </span>
              </a>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="recipient">Nom du destinataire *</Label>
                <Input
                  id="recipient"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Nom complet"
                />
              </div>
              <div>
                <Label htmlFor="photo">Photo de livraison</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => setDeliveryPhoto(e.target.files?.[0] || null)}
                    className="text-sm"
                  />
                  <Camera className="w-4 h-4 text-grey-500" />
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleDeliveryComplete}
              disabled={loading || !recipientName.trim()}
              className="w-full bg-primary hover:bg-primary/90"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {loading ? 'Finalisation...' : 'Confirmer la livraison'}
            </Button>
          </div>
        );

      case 'delivered':
        return (
          <div className="space-y-3">
            <div className="text-center py-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
              <p className="text-lg font-semibold text-green-700">Livraison terminée !</p>
              <p className="text-sm text-grey-600">Excellent travail 👏</p>
            </div>
            
            {/* Bouton preuve de livraison */}
            <Button 
              variant="outline"
              onClick={() => toast.info('Preuve de livraison disponible dans l\'historique')}
              className="w-full"
            >
              <Camera className="w-4 h-4 mr-2" />
              Voir la preuve de livraison
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  const openNavigation = () => {
    const coords = order.status === 'confirmed' || order.status === 'driver_assigned' 
      ? order.pickup_coordinates 
      : order.delivery_coordinates;
    
    // Sécuriser les coordonnées avant navigation
    const secureCoords = coords ? secureLocation(coords) : null;
    
    if (secureCoords && isValidLocation(secureCoords)) {
      setNavigationOpen(true);
    } else {
      toast.error('Coordonnées invalides pour la navigation');
    }
  };

  // Si pas de données de commande, afficher un état de chargement
  if (!order.id || !order.status) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Chargement des détails de livraison...</p>
        </CardContent>
      </Card>
    );
  }

  // Préparer les coordonnées pour la navigation
  const isGoingToPickup = order.status === 'confirmed' || order.status === 'driver_assigned';
  const navPickup = isGoingToPickup 
    ? { 
        lat: order.pickup_coordinates?.lat || 0, 
        lng: order.pickup_coordinates?.lng || 0,
        address: order.pickup_location 
      }
    : { 
        lat: order.delivery_coordinates?.lat || 0, 
        lng: order.delivery_coordinates?.lng || 0,
        address: order.delivery_location 
      };

  const navDestination = { 
    lat: order.delivery_coordinates?.lat || 0, 
    lng: order.delivery_coordinates?.lng || 0,
    address: order.delivery_location 
  };

  return (
    <>
      <Card className="border-gray-200 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Livraison {(order.delivery_type || 'FLEX').toUpperCase()}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Informations de livraison */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Point de retrait</p>
                <p className="text-sm text-grey-600">{order.pickup_location}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Destination</p>
                <p className="text-sm text-grey-600">{order.delivery_location}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-grey-500" />
              <div>
                <span className="font-medium text-sm">Prix: </span>
                <span className="text-primary font-semibold">{order.estimated_price?.toLocaleString()} FC</span>
              </div>
            </div>
          </div>

          {/* Notes du chauffeur */}
          <div>
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Commentaires sur la livraison..."
              rows={2}
              className="text-sm"
            />
          </div>

          {/* Actions principales */}
          {renderActionButtons()}

          {/* Actions secondaires */}
          <div className="flex gap-2 pt-2">
            {['in_transit', 'picked_up'].includes(order.status) && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={openNavigation}
                className="flex-1"
              >
                <Navigation className="w-4 h-4 mr-1" />
                Navigation GPS
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              className="w-10 h-8 p-0"
            >
              <Phone className="w-4 h-4" />
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              className="w-10 h-8 p-0"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de navigation GPS intégrée */}
      {navigationOpen && (
        <NavigationModal
          open={navigationOpen}
          onClose={() => setNavigationOpen(false)}
          orderId={order.id}
          orderType="delivery"
          pickup={navPickup}
          destination={navDestination}
          customerPhone={order.recipient_phone}
        />
      )}
    </>
  );
};

export default DriverDeliveryActions;