import { motion } from 'framer-motion';
import { Check, Package, MapPin, Clock, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';
import type { Restaurant } from '@/types/food';

interface OrderSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderNumber: string;
  restaurant: Restaurant;
  deliveryAddress: string;
  estimatedTime: number;
  onTrackOrder?: () => void;
}

export const OrderSuccessModal = ({
  open,
  onOpenChange,
  orderNumber,
  restaurant,
  deliveryAddress,
  estimatedTime,
  onTrackOrder
}: OrderSuccessModalProps) => {
  
  useEffect(() => {
    if (open) {
      // Trigger confetti animation
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ['#FFA500', '#FF6347', '#FFD700']
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ['#FFA500', '#FF6347', '#FFD700']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <div className="text-center space-y-6 py-4">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="mx-auto w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
            >
              <Check className="w-10 h-10 text-green-600" />
            </motion.div>
          </motion.div>

          {/* Title */}
          <div>
            <h2 className="text-2xl font-bold text-foreground">Commande confirmée !</h2>
            <p className="text-muted-foreground mt-2">
              Votre commande a été envoyée au restaurant
            </p>
          </div>

          {/* Order Number */}
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-1">
              <Package className="w-4 h-4" />
              Numéro de commande
            </div>
            <div className="text-2xl font-bold text-primary">#{orderNumber}</div>
          </div>

          <Separator />

          {/* Order Details */}
          <div className="space-y-3 text-left">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">{restaurant.restaurant_name}</div>
                <div className="text-sm text-muted-foreground">{restaurant.address}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Adresse de livraison</div>
                <div className="text-sm text-muted-foreground">{deliveryAddress}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Temps de préparation estimé</div>
                <div className="text-sm text-muted-foreground">{estimatedTime} minutes</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Statut</div>
                <div className="text-sm text-muted-foreground">Recherche d'un livreur en cours...</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Fermer
            </Button>
            {onTrackOrder && (
              <Button
                onClick={onTrackOrder}
                className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              >
                Suivre ma commande
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
