/**
 * 🔔 PHASE 2: Popup moderne pour nouvelle course
 * Slide-in avec animation, son et vibration
 */

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { RideCountdownTimer } from '../RideCountdownTimer';
import { MapPin, Navigation, DollarSign, CheckCircle, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface NewRidePopupProps {
  open: boolean;
  notification: any;
  serviceType: 'taxi' | 'delivery';
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
}

export const NewRidePopup: React.FC<NewRidePopupProps> = ({
  open,
  notification,
  serviceType,
  onAccept,
  onReject,
  onClose
}) => {
  const { triggerHaptic } = useHapticFeedback();
  const [timeLeft, setTimeLeft] = useState(30); // 30 secondes pour accepter

  useEffect(() => {
    if (open) {
      // Vibration au moment de l'affichage
      triggerHaptic('heavy');
      
      // Countdown
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            onReject();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [open]);

  const handleAccept = () => {
    triggerHaptic('medium');
    onAccept();
  };

  const handleReject = () => {
    triggerHaptic('light');
    onReject();
  };

  const urgencyColor = notification.urgency === 'high' ? 'red' : 'orange';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0 bg-transparent border-0">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ y: 100, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 100, opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <Card className={cn(
                "border-4 shadow-2xl overflow-hidden",
                serviceType === 'taxi' ? "border-orange-500 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/40 dark:to-yellow-950/40" 
                : "border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40"
              )}>
                {/* Header avec countdown */}
                <div className={cn(
                  "p-4 text-white",
                  serviceType === 'taxi' ? "bg-gradient-to-r from-orange-600 to-red-600" : "bg-gradient-to-r from-blue-600 to-cyan-600"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-3 h-3 bg-white rounded-full"
                      />
                      <span className="font-bold text-lg">
                        {serviceType === 'taxi' ? '🚗 Nouvelle Course' : '📦 Nouvelle Livraison'}
                      </span>
                    </div>
                    <RideCountdownTimer seconds={timeLeft} />
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-6 space-y-4">
                  {/* Badge urgence */}
                  {notification.urgency === 'high' && (
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <Badge className="bg-red-600 text-white px-3 py-1">
                        🔥 Course Urgente
                      </Badge>
                    </motion.div>
                  )}

                  {/* Point de départ */}
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-xl bg-green-100 dark:bg-green-950">
                      <MapPin className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-medium mb-1">Point de départ</p>
                      <p className="text-base font-bold">{notification.location}</p>
                    </div>
                  </div>

                  {/* Infos clés */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-background/80 border-2 border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <Navigation className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Distance</span>
                      </div>
                      <p className="text-lg font-bold">{notification.distance} km</p>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-green-100 dark:bg-green-950 border-2 border-green-500">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-xs text-green-600 font-medium">Gain estimé</span>
                      </div>
                      <p className="text-lg font-bold text-green-600">
                        {notification.estimatedPrice?.toLocaleString()} CDF
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-2">
                    <Button
                      onClick={handleAccept}
                      size="lg"
                      className={cn(
                        "w-full h-14 text-lg font-bold shadow-lg",
                        serviceType === 'taxi' 
                          ? "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700" 
                          : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                      )}
                    >
                      <CheckCircle className="h-6 w-6 mr-2" />
                      Accepter la course
                    </Button>
                    
                    <Button
                      onClick={handleReject}
                      variant="outline"
                      size="lg"
                      className="w-full h-12 border-2"
                    >
                      <X className="h-5 w-5 mr-2" />
                      Refuser
                    </Button>
                  </div>

                  {/* Timer warning */}
                  {timeLeft <= 10 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center"
                    >
                      <p className="text-sm text-red-600 font-bold">
                        ⏰ Expiration dans {timeLeft} secondes
                      </p>
                    </motion.div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
