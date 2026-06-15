/**
 * 🚛 DASHBOARD CHAUFFEUR POUR LIVRAISONS ACTIVES
 * 
 * Interface complète pour les chauffeurs :
 * - Livraisons en cours
 * - Actions de changement de statut
 * - Communication client
 * - Navigation GPS
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Camera,
  Navigation,
  Phone,
  MessageSquare,
  User,
  ArrowRight,
  Truck,
  Star,
  AlertTriangle,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useRealTimeDeliveryTracking } from '@/hooks/useRealTimeDeliveryTracking';
import { useUnifiedDeliveryQueue } from '@/hooks/useUnifiedDeliveryQueue';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useBookingChat } from '@/hooks/useBookingChat';
import { CancellationDialog } from '@/components/shared/CancellationDialog';

interface ActiveDelivery {
  id: string;
  status: string;
  pickup_location: string;
  delivery_location: string;
  pickup_coordinates: any;
  delivery_coordinates: any;
  delivery_type: string;
  estimated_price: number;
  user_id: string;
  created_at: string;
  recipient_name?: string;
  recipient_phone?: string;
  sender_name?: string;
  sender_phone?: string;
}

interface DriverDeliveryDashboardProps {
  onSelectDelivery?: (deliveryId: string) => void;
}

export default function DriverDeliveryDashboard({ onSelectDelivery }: DriverDeliveryDashboardProps) {
  const { user } = useAuth();
  const { updateDeliveryStatus: updateUnifiedStatus } = useUnifiedDeliveryQueue();
  const [activeDeliveries, setActiveDeliveries] = useState<ActiveDelivery[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { openChatFromBooking } = useBookingChat();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  
  // États pour les actions
  const [notes, setNotes] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [deliveryPhoto, setDeliveryPhoto] = useState<File | null>(null);

  // Hook de tracking pour la livraison sélectionnée
  const trackingHook = useRealTimeDeliveryTracking({
    orderId: selectedDelivery || '',
    enableDriverTracking: true,
    enableChat: true
  });

  // ==================== CHARGEMENT DES LIVRAISONS ====================
  
  const loadActiveDeliveries = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('delivery_orders')
        .select(`
          id, status, pickup_location, delivery_location,
          pickup_coordinates, delivery_coordinates, delivery_type,
          estimated_price, user_id, created_at,
          recipient_name, recipient_phone, sender_name, sender_phone
        `)
        .eq('driver_id', user.id)
        .in('status', ['confirmed', 'driver_assigned', 'picked_up', 'in_transit'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setActiveDeliveries(data || []);
      
      // Sélectionner automatiquement la première livraison
      if (data && data.length > 0 && !selectedDelivery) {
        setSelectedDelivery(data[0].id);
      }
      
    } catch (err) {
      console.error('❌ Erreur chargement livraisons:', err);
      toast.error('Erreur de chargement des livraisons');
    } finally {
      setLoading(false);
    }
  };

  // ==================== ACTIONS CHAUFFEUR ====================
  
  const confirmPickup = async () => {
    if (!selectedDelivery) return;
    
    try {
      setActionLoading(true);
      
      const { error } = await supabase
        .from('delivery_orders')
        .update({
          status: 'picked_up',
          picked_up_at: new Date().toISOString(),
          driver_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedDelivery);

      if (error) throw error;
      
      // Log dans l'historique
      await supabase
        .from('delivery_status_history')
        .insert({
          delivery_order_id: selectedDelivery,
          status: 'picked_up',
          changed_by: user?.id,
          notes: notes || 'Colis récupéré',
          changed_at: new Date().toISOString()
        });

      setNotes('');
      loadActiveDeliveries();
      toast.success('Colis récupéré avec succès! 📦');
      
    } catch (err) {
      console.error('❌ Erreur confirmation pickup:', err);
      toast.error('Erreur lors de la confirmation');
    } finally {
      setActionLoading(false);
    }
  };

  const startDelivery = async () => {
    if (!selectedDelivery) return;
    
    try {
      setActionLoading(true);
      
      const { error } = await supabase
        .from('delivery_orders')
        .update({
          status: 'in_transit',
          in_transit_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedDelivery);

      if (error) throw error;
      
      await supabase
        .from('delivery_status_history')
        .insert({
          delivery_order_id: selectedDelivery,
          status: 'in_transit',
          changed_by: user?.id,
          notes: 'Livraison en cours',
          changed_at: new Date().toISOString()
        });

      loadActiveDeliveries();
      toast.success('Livraison démarrée! 🚗');
      
    } catch (err) {
      console.error('❌ Erreur démarrage livraison:', err);
      toast.error('Erreur lors du démarrage');
    } finally {
      setActionLoading(false);
    }
  };

  const completeDelivery = async () => {
    if (!selectedDelivery || !recipientName.trim()) {
      toast.error('Veuillez entrer le nom du destinataire');
      return;
    }
    
    try {
      setActionLoading(true);
      
      // Uploader la photo si présente
      let photoUrl = null;
      if (deliveryPhoto) {
        const fileName = `delivery-${selectedDelivery}-${Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('delivery-photos')
          .upload(fileName, deliveryPhoto);
          
        if (!uploadError && uploadData) {
          photoUrl = uploadData.path;
        }
      }

      // ✅ Utiliser le hook unifié pour garantir la commission
      // Appel UNIQUE à complete-ride-with-commission via updateUnifiedStatus
      const success = await updateUnifiedStatus('delivered', {
        recipientName,
        notes,
        photoUrl
      });

      if (!success) {
        throw new Error('Échec de la finalisation');
      }

      // Reset des états
      setNotes('');
      setRecipientName('');
      setDeliveryPhoto(null);
      setSelectedDelivery(null);
      
      loadActiveDeliveries();
      toast.success('Livraison terminée! Excellent travail! 🎉');
      
    } catch (err) {
      console.error('❌ Erreur finalisation livraison:', err);
      toast.error('Erreur lors de la finalisation');
    } finally {
      setActionLoading(false);
    }
  };

  // ==================== NAVIGATION ET COMMUNICATION ====================
  
  const openNavigation = (coordinates: any, address: string) => {
    if (!coordinates) {
      toast.error('Coordonnées non disponibles');
      return;
    }
    
    try {
      const lat = coordinates.lat || parseFloat(coordinates.lat);
      const lng = coordinates.lng || parseFloat(coordinates.lng);
      
      if (!lat || !lng) {
        throw new Error('Coordonnées invalides');
      }
      
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(url, '_blank');
      toast.success(`Navigation vers ${address}`);
      
    } catch (err) {
      console.error('❌ Erreur navigation:', err);
      toast.error('Impossible d\'ouvrir la navigation');
    }
  };

  const callClient = () => {
    if (!trackingHook.trackingData.clientProfile?.phone_number) {
      toast.error('Numéro de téléphone non disponible');
      return;
    }
    
    trackingHook.callClient();
  };

  const handleCancelDelivery = async (reason: string) => {
    if (!selectedDelivery) return;
    
    try {
      setActionLoading(true);
      
      const { error } = await supabase
        .from('delivery_orders')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: user?.id,
          cancellation_reason: reason,
          cancellation_type: 'driver',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedDelivery);

      if (error) throw error;

      // Log cancellation
      await supabase
        .from('cancellation_history')
        .insert({
          reference_id: selectedDelivery,
          reference_type: 'delivery',
          cancelled_by: user?.id,
          cancellation_type: 'driver',
          reason,
          status_at_cancellation: currentDelivery?.status || 'unknown'
        });

      // Log status history
      await supabase
        .from('delivery_status_history')
        .insert({
          delivery_order_id: selectedDelivery,
          status: 'cancelled',
          changed_by: user?.id,
          notes: `Annulé par le chauffeur: ${reason}`,
          changed_at: new Date().toISOString()
        });

      setSelectedDelivery(null);
      loadActiveDeliveries();
      toast.success('Livraison annulée');
      
    } catch (err) {
      console.error('❌ Erreur annulation:', err);
      toast.error('Erreur lors de l\'annulation');
    } finally {
      setActionLoading(false);
      setShowCancelDialog(false);
    }
  };

  // ==================== EFFETS ====================
  
  useEffect(() => {
    if (user) {
      loadActiveDeliveries();
    }
  }, [user]);

  // Mise à jour automatique toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && !actionLoading) {
        loadActiveDeliveries();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user, actionLoading]);

  // ==================== RENDU ====================
  
  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      'confirmed': 'Confirmée',
      'driver_assigned': 'Assignée',
      'picked_up': 'Récupérée',
      'in_transit': 'En livraison',
      'delivered': 'Livrée'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'confirmed': 'bg-blue-100 text-blue-800',
      'driver_assigned': 'bg-yellow-100 text-yellow-800',
      'picked_up': 'bg-purple-100 text-purple-800',
      'in_transit': 'bg-orange-100 text-orange-800',
      'delivered': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const renderActionButtons = (delivery: ActiveDelivery) => {
    switch (delivery.status) {
      case 'confirmed':
      case 'driver_assigned':
        return (
          <Button 
            onClick={confirmPickup}
            disabled={actionLoading}
            className="w-full"
          >
            <Package className="w-4 h-4 mr-2" />
            {actionLoading ? 'Confirmation...' : 'Confirmer récupération'}
          </Button>
        );

      case 'picked_up':
        return (
          <Button 
            onClick={startDelivery}
            disabled={actionLoading}
            className="w-full"
          >
            <Truck className="w-4 h-4 mr-2" />
            {actionLoading ? 'Démarrage...' : 'Démarrer livraison'}
          </Button>
        );

      case 'in_transit':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nom destinataire *</Label>
                <Input
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Nom complet"
                />
              </div>
              <div>
                <Label>Photo livraison</Label>
                <Input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => setDeliveryPhoto(e.target.files?.[0] || null)}
                  className="text-sm"
                />
              </div>
            </div>
            
            <Button 
              onClick={completeDelivery}
              disabled={actionLoading || !recipientName.trim()}
              className="w-full"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {actionLoading ? 'Finalisation...' : 'Confirmer livraison'}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto space-y-4">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6 space-y-3">
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeDeliveries.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <Package className="w-16 h-16 text-muted-foreground mx-auto" />
              <div>
                <h3 className="font-semibold">Aucune livraison active</h3>
                <p className="text-sm text-muted-foreground">
                  Vous n'avez actuellement aucune livraison en cours.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentDelivery = activeDeliveries.find(d => d.id === selectedDelivery);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-xl border-b p-4 z-50">
        <div className="max-w-md mx-auto">
          <h1 className="text-xl font-semibold flex items-center">
            <Truck className="w-6 h-6 mr-2 text-primary" />
            Mes Livraisons ({activeDeliveries.length})
          </h1>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto pb-24">
        {/* Liste des livraisons */}
        <div className="space-y-3">
          {activeDeliveries.map((delivery) => (
            <motion.div
              key={delivery.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card 
                className={`cursor-pointer transition-all ${
                  selectedDelivery === delivery.id 
                    ? 'ring-2 ring-primary border-primary' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedDelivery(delivery.id)}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(delivery.status)}>
                        {getStatusLabel(delivery.status)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {delivery.delivery_type.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground truncate">
                          {delivery.pickup_location}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground truncate">
                          {delivery.delivery_location}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm font-medium text-primary">
                        {delivery.estimated_price.toLocaleString()} CDF
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(delivery.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    {/* Téléphones client */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {delivery.sender_phone && (
                        <a 
                          href={`tel:${delivery.sender_phone}`} 
                          className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="w-3 h-3" />
                          Exp: {delivery.sender_phone}
                        </a>
                      )}
                      {delivery.recipient_phone && (
                        <a 
                          href={`tel:${delivery.recipient_phone}`} 
                          className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="w-3 h-3" />
                          Dest: {delivery.recipient_phone}
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Détails de la livraison sélectionnée */}
        {currentDelivery && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Actions de livraison
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Informations client */}
                {trackingHook.trackingData.clientProfile && (
                  <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {trackingHook.trackingData.clientProfile.display_name}
                      </p>
                      <p className="text-sm text-muted-foreground">Client</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="icon" onClick={callClient}>
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => selectedDelivery && openChatFromBooking(
                          selectedDelivery, 
                          'delivery', 
                          trackingHook.trackingData.clientProfile?.display_name
                        )}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => openNavigation(
                      currentDelivery.status === 'confirmed' || currentDelivery.status === 'driver_assigned'
                        ? currentDelivery.pickup_coordinates
                        : currentDelivery.delivery_coordinates,
                      currentDelivery.status === 'confirmed' || currentDelivery.status === 'driver_assigned'
                        ? currentDelivery.pickup_location
                        : currentDelivery.delivery_location
                    )}
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Navigation
                  </Button>
                  
                  <Button variant="outline">
                    <MapPin className="w-4 h-4 mr-2" />
                    Position
                  </Button>
                </div>

                {/* Notes */}
                <div>
                  <Label>Notes (optionnel)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Commentaires sur la livraison..."
                    rows={2}
                  />
                </div>

                <Separator />

                {/* Actions principales */}
                <div className="space-y-3">
                  {renderActionButtons(currentDelivery)}
                  
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCancelDialog(true)}
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Annuler la livraison
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <CancellationDialog
          isOpen={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
          onConfirm={handleCancelDelivery}
          userType="driver"
          bookingType="delivery"
        />
      </div>
    </div>
  );
}