import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, MapPin, Clock, Package, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface DeliveryStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  status: string;
  amount: number;
  estimatedTime?: string;
  driverName?: string;
  driverPhone?: string;
  onTrack: () => void;
  onContact: () => void;
}

const statusConfig = {
  pending: {
    label: 'En attente',
    color: 'bg-orange-500',
    description: 'Votre commande est en cours de traitement'
  },
  confirmed: {
    label: 'Confirmée',
    color: 'bg-blue-500',
    description: 'Commande confirmée, recherche de chauffeur'
  },
  driver_assigned: {
    label: 'Chauffeur assigné',
    color: 'bg-purple-500',
    description: 'Un chauffeur a été assigné à votre livraison'
  },
  picked_up: {
    label: 'Colis récupéré',
    color: 'bg-yellow-500',
    description: 'Le chauffeur a récupéré votre colis'
  },
  in_transit: {
    label: 'En cours de livraison',
    color: 'bg-indigo-500',
    description: 'Votre colis est en route vers sa destination'
  },
  delivered: {
    label: 'Livré',
    color: 'bg-green-500',
    description: 'Livraison terminée avec succès'
  },
  cancelled: {
    label: 'Annulé',
    color: 'bg-red-500',
    description: 'Commande annulée'
  }
};

export default function DeliveryStatusModal({
  isOpen,
  onClose,
  orderId,
  status,
  amount,
  estimatedTime,
  driverName,
  driverPhone,
  onTrack,
  onContact
}: DeliveryStatusModalProps) {
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  
  const currentStatus = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  const handleContact = () => {
    if (driverPhone) {
      window.open(`tel:${driverPhone}`, '_self');
    } else {
      onContact();
    }
  };

  const formatAmount = (amount: number) => {
    return `${amount.toLocaleString()} CDF`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-6 w-6"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
                <DialogTitle className="text-lg font-semibold">
                  Commande #{orderId.slice(-8)}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${currentStatus.color}`} />
                    <div>
                      <Badge variant="secondary" className="mb-1">
                        {currentStatus.label}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {currentStatus.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Amount and Time */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Montant</span>
                    </div>
                    <span className="font-semibold">{formatAmount(amount)}</span>
                  </div>

                  {estimatedTime && (
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Livraison estimée</span>
                      </div>
                      <span className="text-sm font-medium">{estimatedTime}</span>
                    </div>
                  )}

                  {driverName && (
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Chauffeur</span>
                      </div>
                      <span className="text-sm font-medium">{driverName}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 gap-3">
                  <Button 
                    onClick={onTrack}
                    className="w-full"
                    size="lg"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Suivre la livraison
                  </Button>
                  
                  {(driverPhone || driverName) && (
                    <Button 
                      onClick={handleContact}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Contacter {driverName ? 'le chauffeur' : 'le support'}
                    </Button>
                  )}
                </div>

                {/* Order ID for reference */}
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground text-center">
                    ID de commande: {orderId}
                  </p>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    {new Date().toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}