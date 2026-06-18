import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUniversalChat } from '@/hooks/useUniversalChat';
import { useChat } from '@/components/chat/ChatProvider';
import { useToast } from '@/hooks/use-toast';
import { useDynamicDeliveryPricing } from '@/hooks/useDynamicDeliveryPricing';
import { 
  MessageSquare, Package, MapPin, Truck, Bike, 
  CheckCircle2, Loader2, ArrowRight
} from 'lucide-react';
import { DeliveryMapModal } from './DeliveryMapModal';
import { VendorDeliveryDrawer } from './VendorDeliveryDrawer';
import { motion } from 'framer-motion';

interface VendorOrderValidationPanelProps {
  orders: any[];
  onRefresh: () => void;
}

export const VendorOrderValidationPanel = ({ orders, onRefresh }: VendorOrderValidationPanelProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { createOrFindConversation, sendMessage } = useUniversalChat();
  const { openChat } = useChat();
  const { calculatePrice, formatPrice } = useDynamicDeliveryPricing();
  
  const [validatingOrder, setValidatingOrder] = useState<string | null>(null);
  const [openingChat, setOpeningChat] = useState<string | null>(null);
  const [deliveryFees, setDeliveryFees] = useState<Record<string, number>>({});
  const [deliveryMethods, setDeliveryMethods] = useState<Record<string, 'kwenda' | 'self'>>({});
  const [estimatedPrices, setEstimatedPrices] = useState<Record<string, number>>({});
  const [vendorProfile, setVendorProfile] = useState<any>(null);
  const [deliveryDrawerOrder, setDeliveryDrawerOrder] = useState<any>(null);
  const [mapModalData, setMapModalData] = useState<{
    orderId: string;
    deliveryCoordinates: { lat: number; lng: number };
    deliveryAddress?: string;
    pickupCoordinates?: { lat: number; lng: number };
  } | null>(null);

  // Charger le profil vendeur
  useEffect(() => {
    const loadVendorProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (data) setVendorProfile(data);
    };
    loadVendorProfile();
  }, [user]);

  // Filtrer les commandes en attente
  const pendingOrders = orders.filter(order => 
    order.vendor_confirmation_status === 'awaiting_confirmation' || 
    order.status === 'pending'
  );

  // Calculer la distance
  const calculateDistance = (coords1: any, coords2: any) => {
    if (!coords1 || !coords2) return 0;
    const R = 6371;
    const dLat = (coords2.lat - coords1.lat) * Math.PI / 180;
    const dLon = (coords2.lng - coords1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(coords1.lat * Math.PI / 180) * Math.cos(coords2.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Estimer les prix à l'ouverture
  useEffect(() => {
    const estimatePrices = async () => {
      const newPrices: Record<string, number> = {};
      
      for (const order of pendingOrders) {
        if (order.delivery_coordinates && vendorProfile?.coordinates) {
          const distance = calculateDistance(vendorProfile.coordinates, order.delivery_coordinates);
          const result = await calculatePrice('flex', distance);
          if (result) {
            newPrices[order.id] = result.calculated_price;
          }
        }
      }
      
      setEstimatedPrices(newPrices);
    };
    
    if (vendorProfile && pendingOrders.length > 0) {
      estimatePrices();
    }
  }, [vendorProfile, pendingOrders.length]);

  // Valider la commande
  const handleValidateOrder = async (orderId: string) => {
    if (!user) return;

    const deliveryFee = deliveryFees[orderId];
    const deliveryMethod = deliveryMethods[orderId] || 'kwenda';

    if (!deliveryFee || deliveryFee <= 0) {
      toast({ 
        title: "Frais requis", 
        description: "Veuillez sélectionner un mode de livraison", 
        variant: "destructive" 
      });
      return;
    }

    setValidatingOrder(orderId);

    try {
      const { error } = await supabase.functions.invoke('vendor-validate-order', {
        body: {
          orderId,
          vendorId: user.id,
          deliveryFee,
          deliveryMethod,
          selfDelivery: deliveryMethod === 'self'
        }
      });

      if (error) throw error;

      toast({ 
        title: "✅ Commande validée", 
        description: `Frais de livraison: ${formatPrice(deliveryFee)} • Le client a reçu votre proposition`
      });
      onRefresh();
    } catch (error: any) {
      console.error('Error validating order:', error);
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setValidatingOrder(null);
    }
  };

  // Envoyer un message rapide
  const sendQuickMessage = async (conversationId: string, message: string) => {
    try {
      await sendMessage(conversationId, message);
      toast({
        title: "✅ Message envoyé",
        description: message.substring(0, 50) + (message.length > 50 ? "..." : "")
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive"
      });
    }
  };

  // Ouvrir le chat
  const handleOpenChat = async (order: any) => {
    if (order.buyer_id === user?.id) {
      toast({
        title: "❌ Action impossible",
        description: "Vous ne pouvez pas discuter avec vous-même",
        variant: "destructive"
      });
      return;
    }

    setOpeningChat(order.id);

    try {
      const conversation = await createOrFindConversation(
        'marketplace',
        order.buyer_id,
        order.product_id,
        `Commande ${order.product?.title || 'Marketplace'}`,
        { order_id: order.id, product_id: order.product_id }
      );
      
      if (conversation) {
        openChat({
          contextType: 'marketplace',
          contextId: order.product_id,
          participantId: order.buyer_id,
          title: `💬 Chat avec ${order.buyer?.display_name || order.buyer?.phone_number || 'le client'}`,
          quickActions: [
            { 
              label: "✅ Commande prête", 
              action: () => sendQuickMessage(conversation.id, "Bonjour ! Votre commande est prête pour la livraison. 📦")
            },
            { 
              label: "⏰ Retard préparation", 
              action: () => sendQuickMessage(conversation.id, "Bonjour, il y a un léger retard dans la préparation de votre commande. Merci de votre patience. 🙏")
            },
            { 
              label: "📍 Confirmer adresse", 
              action: () => sendQuickMessage(conversation.id, "Pouvez-vous me confirmer votre adresse de livraison exacte ? 📍")
            }
          ]
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ouvrir le chat",
        variant: "destructive",
      });
    } finally {
      setOpeningChat(null);
    }
  };

  // Sélectionner le mode de livraison
  const handleSelectDeliveryMethod = (orderId: string, method: 'kwenda' | 'self', fee?: number) => {
    setDeliveryMethods(prev => ({ ...prev, [orderId]: method }));
    if (fee) {
      setDeliveryFees(prev => ({ ...prev, [orderId]: fee }));
    }
  };

  // Callback quand livraison créée
  const handleDeliveryCreated = (orderId: string, fee: number, deliveryOrderId?: string) => {
    setDeliveryFees(prev => ({ ...prev, [orderId]: fee }));
    setDeliveryMethods(prev => ({ ...prev, [orderId]: 'kwenda' }));
    setDeliveryDrawerOrder(null);
  };

  if (pendingOrders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Aucune commande en attente de validation</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {pendingOrders.map((order) => {
        const selectedMethod = deliveryMethods[order.id] || null;
        const currentFee = deliveryFees[order.id] || 0;
        const estimatedFee = estimatedPrices[order.id] || 0;

        return (
          <Card key={order.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {order.product?.title || 'Produit inconnu'}
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                      Nouvelle
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Client: {order.buyer?.display_name || order.buyer?.phone_number || order.buyer_contact || 'Client'} • Qté: {order.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">{(order.unit_price * order.quantity).toLocaleString()} CDF</p>
                  <p className="text-xs text-muted-foreground">Montant produit</p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Adresse de livraison */}
              {(order.delivery_address || order.delivery_coordinates) && (
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-4 w-4 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Adresse de livraison</p>
                    {order.delivery_address ? (
                      <p className="text-sm font-medium truncate">{order.delivery_address}</p>
                    ) : order.delivery_coordinates ? (
                      <div>
                        <p className="text-sm">
                          📍 {order.delivery_coordinates.lat?.toFixed(4)}, {order.delivery_coordinates.lng?.toFixed(4)}
                        </p>
                        <button
                          onClick={() => setMapModalData({
                            orderId: order.id,
                            deliveryCoordinates: order.delivery_coordinates,
                            deliveryAddress: order.delivery_address,
                            pickupCoordinates: vendorProfile?.coordinates
                          })}
                          className="text-primary text-xs hover:underline mt-1"
                        >
                          🗺️ Voir sur la carte →
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Notes client */}
              {order.notes && (
                <div className="p-3 bg-muted/30 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">Notes du client</p>
                  <p className="text-sm">{order.notes}</p>
                </div>
              )}

              {/* Section Livraison Moderne */}
              <div className="pt-3 border-t border-border/40">
                <p className="text-sm font-semibold mb-3">Mode de livraison</p>
                
                <div className="grid gap-3">
                  {/* Option Tembea Delivery */}
                  <motion.div whileTap={{ scale: 0.98 }}>
                    <Card 
                      onClick={() => setDeliveryDrawerOrder(order)}
                      className={`p-4 cursor-pointer transition-all duration-300 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-2 ${
                        selectedMethod === 'kwenda' 
                          ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' 
                          : 'border-border/40 hover:border-primary/50 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                            <Truck className="h-6 w-6 text-red-500" />
                          </div>
                          <div>
                            <p className="font-semibold flex items-center gap-2">
                              Livreur TAGA
                              {selectedMethod === 'kwenda' && (
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {currentFee > 0 && selectedMethod === 'kwenda'
                                ? `${formatPrice(currentFee)} • Confirmé ✓`
                                : estimatedFee > 0 
                                  ? `~${formatPrice(estimatedFee)} • Cliquez pour commander`
                                  : 'Cliquez pour commander un livreur'
                              }
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </Card>
                  </motion.div>

                  {/* Option Self Delivery */}
                  <motion.div whileTap={{ scale: 0.98 }}>
                    <Card 
                      onClick={() => {
                        const selfFee = Math.round(estimatedFee * 0.7) || 5000;
                        handleSelectDeliveryMethod(order.id, 'self', selfFee);
                      }}
                      className={`p-4 cursor-pointer transition-all duration-300 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-2 ${
                        selectedMethod === 'self' 
                          ? 'border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/10' 
                          : 'border-border/40 hover:border-emerald-500/50 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                            <Bike className="h-6 w-6 text-emerald-500" />
                          </div>
                          <div>
                            <p className="font-semibold flex items-center gap-2">
                              Je livre moi-même
                              {selectedMethod === 'self' && (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {selectedMethod === 'self' && currentFee > 0
                                ? `${formatPrice(currentFee)} • Vous assurez la livraison`
                                : 'Économisez sur les frais'
                              }
                            </p>
                          </div>
                        </div>
                        {selectedMethod === 'self' && (
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
                            -{30}%
                          </Badge>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                </div>
              </div>

              {/* Total commande */}
              {currentFee > 0 && (
                <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Total commande</p>
                      <p className="text-2xl font-bold text-primary">
                        {((order.unit_price * order.quantity) + currentFee).toLocaleString()} CDF
                      </p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>Produit: {(order.unit_price * order.quantity).toLocaleString()} CDF</p>
                      <p>Livraison: {currentFee.toLocaleString()} CDF</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1 bg-amber-400 hover:bg-amber-500 text-black border-amber-500 font-semibold rounded-xl h-12 shadow-md hover:shadow-lg transition-all"
                  onClick={() => handleOpenChat(order)}
                  disabled={openingChat === order.id}
                >
                  {openingChat === order.id ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <MessageSquare className="h-5 w-5 mr-2" />
                  )}
                  Discuter
                </Button>
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl h-12 shadow-md hover:shadow-lg transition-all"
                  onClick={() => handleValidateOrder(order.id)}
                  disabled={validatingOrder === order.id || !currentFee}
                >
                  {validatingOrder === order.id ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Validation...
                    </>
                  ) : (
                    'Valider et envoyer'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Drawer Tembea Delivery */}
      {deliveryDrawerOrder && (
        <VendorDeliveryDrawer
          isOpen={!!deliveryDrawerOrder}
          onClose={() => setDeliveryDrawerOrder(null)}
          order={deliveryDrawerOrder}
          vendorProfile={vendorProfile}
          onDeliveryCreated={(fee, deliveryId) => 
            handleDeliveryCreated(deliveryDrawerOrder.id, fee, deliveryId)
          }
        />
      )}

      {/* Modal carte */}
      {mapModalData && (
        <DeliveryMapModal
          open={!!mapModalData}
          onClose={() => setMapModalData(null)}
          deliveryCoordinates={mapModalData.deliveryCoordinates}
          deliveryAddress={mapModalData.deliveryAddress}
          pickupCoordinates={mapModalData.pickupCoordinates}
        />
      )}
    </div>
  );
};
