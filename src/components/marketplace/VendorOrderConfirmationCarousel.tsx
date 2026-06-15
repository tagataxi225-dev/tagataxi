import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useMarketplaceOrders } from "@/hooks/useMarketplaceOrders";
import { CheckCircle, XCircle, Clock, AlertTriangle, Package, User, MapPin, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface OrderForConfirmation {
  id: string;
  buyer_id: string;
  product_id: string;
  quantity: number;
  total_amount: number;
  delivery_method: string;
  delivery_address?: string;
  notes?: string;
  vendor_confirmation_status: string;
  status: string;
  created_at: string;
  // Relations
  profiles?: {
    display_name: string;
  };
  marketplace_products?: {
    title: string;
    price: number;
  };
}

interface Props {
  orders: OrderForConfirmation[];
  onOrderUpdate: () => void;
}

export default function VendorOrderConfirmationCarousel({ orders, onOrderUpdate }: Props) {
  const { updateOrderStatus } = useMarketplaceOrders();
  const { toast } = useToast();
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleConfirmOrder = async (orderId: string) => {
    setProcessing(orderId);
    try {
      await updateOrderStatus(orderId, 'confirmed', {
        vendor_confirmation_status: 'confirmed',
        vendor_confirmed_at: new Date().toISOString(),
      });
      
      toast({
        title: "Commande confirmée",
        description: "La commande a été confirmée avec succès. Le client a été notifié.",
      });
      
      onOrderUpdate();
      
      // Navigate to next order automatically
      if (currentIndex < pendingOrders.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    } catch (error) {
      console.error('Error confirming order:', error);
      toast({
        title: "Erreur",
        description: "Impossible de confirmer la commande. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Motif requis",
        description: "Veuillez indiquer le motif du refus.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(orderId);
    try {
      await updateOrderStatus(orderId, 'cancelled', {
        vendor_confirmation_status: 'rejected',
        vendor_rejection_reason: rejectionReason,
      });
      
      toast({
        title: "Commande refusée",
        description: "La commande a été refusée. Le client a été notifié.",
      });
      
      setRejectionReason('');
      setShowRejectionForm(null);
      onOrderUpdate();
      
      // Navigate to next order automatically
      if (currentIndex < pendingOrders.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    } catch (error) {
      console.error('Error rejecting order:', error);
      toast({
        title: "Erreur",
        description: "Impossible de refuser la commande. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const pendingOrders = orders.filter(order => 
    order.vendor_confirmation_status === 'awaiting_confirmation' &&
    order.status === 'pending'
  );

  if (pendingOrders.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-8 text-center"
      >
        <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-heading-sm mb-2 text-foreground">Aucune commande en attente</h3>
        <p className="text-muted-foreground text-body-sm">
          Toutes vos commandes ont été traitées.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with progress */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-heading-sm text-foreground">
              Commandes à confirmer
            </h3>
            <p className="text-caption text-muted-foreground">
              {currentIndex + 1} sur {pendingOrders.length} commandes
            </p>
          </div>
        </div>
        
        {/* Navigation dots */}
        <div className="flex items-center gap-2">
          {pendingOrders.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentIndex 
                  ? 'bg-primary w-4' 
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              aria-label={`Aller à la commande ${index + 1}`}
            />
          ))}
        </div>
      </motion.div>

      {/* Carousel */}
      <div className="relative">
        <Carousel 
          className="w-full"
          opts={{
            align: "start",
            loop: false,
            startIndex: currentIndex
          }}
        >
          <CarouselContent>
            {pendingOrders.map((order, index) => (
              <CarouselItem key={order.id} className="w-full">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                   className="glass rounded-xl overflow-hidden border border-primary/20 shadow-elegant hover:shadow-glow transition-all duration-300"
                 >
                   {/* Header avec status */}
                   <div className="bg-gradient-primary/10 px-3 py-2 border-b border-primary/20">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         <div className="w-6 h-6 bg-primary/20 rounded-lg flex items-center justify-center">
                           <Package className="h-3 w-3 text-primary" />
                         </div>
                         <div>
                           <h4 className="text-body-md font-medium text-foreground">Nouvelle commande</h4>
                           <p className="text-xs text-muted-foreground">
                             {new Date(order.created_at).toLocaleString('fr-FR', {
                               day: '2-digit',
                               month: '2-digit',
                               hour: '2-digit',
                               minute: '2-digit'
                             })}
                           </p>
                         </div>
                       </div>
                      <Badge 
                        variant="destructive" 
                        className="bg-destructive/10 text-destructive border-destructive/20 animate-pulse"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        En attente
                      </Badge>
                    </div>
                  </div>

                  <div className="p-3 space-y-3">
                     {/* Informations principales */}
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                       {/* Produit */}
                       <div className="space-y-2">
                         <div className="flex items-center gap-1 text-muted-foreground text-xs font-medium">
                           <Package className="h-3 w-3" />
                           PRODUIT
                         </div>
                         <div className="bg-muted/50 rounded-lg p-2">
                           <h5 className="text-sm font-semibold text-foreground mb-1">
                             {order.marketplace_products?.title || 'Produit inconnu'}
                           </h5>
                           <p className="text-xs text-muted-foreground">
                             {order.quantity} × {Number(order.marketplace_products?.price || 0).toLocaleString()} FC
                           </p>
                         </div>
                       </div>

                       {/* Client */}
                       <div className="space-y-2">
                         <div className="flex items-center gap-1 text-muted-foreground text-xs font-medium">
                           <User className="h-3 w-3" />
                           CLIENT
                         </div>
                         <div className="bg-muted/50 rounded-lg p-2">
                           <h5 className="text-sm font-semibold text-foreground mb-1">
                             {order.profiles?.display_name || 'Client anonyme'}
                           </h5>
                           <div className="flex items-center gap-1 text-xs text-muted-foreground">
                             <Calendar className="h-2 w-2" />
                             {new Date(order.created_at).toLocaleDateString('fr-FR')}
                           </div>
                         </div>
                       </div>
                     </div>

                    {/* Détails de livraison */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-muted-foreground text-caption font-medium">
                        <MapPin className="h-4 w-4" />
                        LIVRAISON
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-body-sm text-foreground font-medium">
                            {order.delivery_method === 'delivery' ? 'Livraison à domicile' : 'Retrait en magasin'}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {order.delivery_method === 'delivery' ? 'Livraison' : 'Retrait'}
                          </Badge>
                        </div>
                        {order.delivery_address && (
                          <p className="text-body-sm text-muted-foreground">
                            📍 {order.delivery_address}
                          </p>
                        )}
                        {order.notes && (
                          <div className="mt-3 p-3 bg-background/50 rounded-lg border border-border/50">
                            <p className="text-body-sm text-foreground italic">
                              💬 {order.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Total prominent */}
                    <div className="bg-gradient-card rounded-xl p-6 border border-primary/20">
                      <div className="text-center">
                        <p className="text-caption text-muted-foreground mb-1">TOTAL À PERCEVOIR</p>
                        <p className="text-display-sm font-bold bg-gradient-primary bg-clip-text text-transparent">
                          {Number(order.total_amount).toLocaleString()} FC
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-4">
                      {showRejectionForm === order.id ? (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4"
                        >
                          <div className="bg-destructive/5 rounded-lg p-4 border border-destructive/20">
                            <label className="text-body-sm font-medium text-foreground mb-2 block">
                              Motif du refus *
                            </label>
                            <Textarea
                              placeholder="Expliquez pourquoi vous refusez cette commande..."
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              rows={3}
                              className="w-full min-touch-target"
                            />
                          </div>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                              variant="destructive"
                              onClick={() => handleRejectOrder(order.id)}
                              disabled={processing === order.id || !rejectionReason.trim()}
                              className="flex-1 min-touch-target bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              {processing === order.id ? 'Refus en cours...' : 'Confirmer le refus'}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowRejectionForm(null);
                                setRejectionReason('');
                              }}
                              className="flex-1 min-touch-target"
                            >
                              Annuler
                            </Button>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button
                            onClick={() => handleConfirmOrder(order.id)}
                            disabled={processing === order.id}
                            className="flex-1 min-touch-target bg-gradient-primary hover:shadow-glow transition-all duration-300 text-white font-semibold py-4 text-body-md"
                          >
                            <CheckCircle className="h-5 w-5 mr-2" />
                            {processing === order.id ? (
                              <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Confirmation...
                              </span>
                            ) : (
                              'Confirmer la commande'
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowRejectionForm(order.id)}
                            disabled={processing === order.id}
                            className="sm:w-auto w-full min-touch-target border-destructive/30 text-destructive hover:bg-destructive/10 py-4"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Refuser
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {/* Navigation arrows */}
          {pendingOrders.length > 1 && (
            <>
              <CarouselPrevious 
                className="absolute -left-12 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-primary/10"
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              />
              <CarouselNext 
                className="absolute -right-12 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-primary/10"
                onClick={() => setCurrentIndex(Math.min(pendingOrders.length - 1, currentIndex + 1))}
              />
            </>
          )}
        </Carousel>

        {/* Quick navigation */}
        {pendingOrders.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Précédente
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentIndex(Math.min(pendingOrders.length - 1, currentIndex + 1))}
              disabled={currentIndex === pendingOrders.length - 1}
              className="flex items-center gap-2"
            >
              Suivante
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}