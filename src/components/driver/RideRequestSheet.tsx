/**
 * 🚗 Roll-up moderne pour demandes de courses
 * Bottom sheet style Uber/Bolt avec countdown et animations
 */

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, User, Phone, X, Check, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RideRequest {
  id: string;
  pickupLocation: string;
  destination: string;
  passengerName?: string;
  passengerPhone?: string;
  estimatedPrice: number;
  estimatedDistance?: number;
  estimatedDuration?: number;
}

interface RideRequestSheetProps {
  request: RideRequest | null;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  timeoutSeconds?: number;
}

export const RideRequestSheet = ({
  request,
  onAccept,
  onReject,
  timeoutSeconds = 30
}: RideRequestSheetProps) => {
  const [countdown, setCountdown] = useState(timeoutSeconds);
  const [isVisible, setIsVisible] = useState(false);

  // Reset countdown when new request arrives
  useEffect(() => {
    if (request) {
      setCountdown(timeoutSeconds);
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [request, timeoutSeconds]);

  // Countdown timer
  useEffect(() => {
    if (!isVisible || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Auto-reject on timeout
          if (request) {
            onReject(request.id);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, countdown, request, onReject]);

  const handleAccept = useCallback(() => {
    if (request) {
      onAccept(request.id);
    }
  }, [request, onAccept]);

  const handleReject = useCallback(() => {
    if (request) {
      onReject(request.id);
    }
  }, [request, onReject]);

  // Progress percentage for circular countdown
  const progress = (countdown / timeoutSeconds) * 100;
  const circumference = 2 * Math.PI * 28; // radius = 28
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <AnimatePresence>
      {isVisible && request && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={handleReject}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50',
              'bg-background rounded-t-3xl shadow-2xl',
              'border-t border-border/50',
              'pb-safe'
            )}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 rounded-full bg-muted" />
            </div>

            <div className="px-5 pb-6">
              {/* Header with Countdown */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    Nouvelle course
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Répondez avant expiration
                  </p>
                </div>

                {/* Circular Countdown */}
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 -rotate-90">
                    {/* Background circle */}
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-muted/30"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeLinecap="round"
                      className={cn(
                        'transition-all duration-1000',
                        countdown > 10 ? 'text-orange-500' : 'text-red-500'
                      )}
                      style={{
                        strokeDasharray: circumference,
                        strokeDashoffset
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={cn(
                      'text-lg font-bold',
                      countdown > 10 ? 'text-foreground' : 'text-red-500'
                    )}>
                      {countdown}s
                    </span>
                  </div>
                </div>
              </div>

              {/* Price Badge */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex justify-center mb-5"
              >
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-2xl shadow-lg">
                  <p className="text-xs font-medium opacity-90">Prix estimé</p>
                  <p className="text-2xl font-bold">
                    {request.estimatedPrice.toLocaleString()} CDF
                  </p>
                </div>
              </motion.div>

              {/* Route Details */}
              <div className="space-y-3 mb-6">
                {/* Pickup */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20"
                >
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-green-600 dark:text-green-400">
                      Point de départ
                    </p>
                    <p className="text-sm font-medium text-foreground truncate">
                      {request.pickupLocation}
                    </p>
                  </div>
                </motion.div>

                {/* Connection Line */}
                <div className="flex justify-start pl-6">
                  <div className="w-0.5 h-4 bg-border rounded-full" />
                </div>

                {/* Destination */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                >
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-red-600 dark:text-red-400">
                      Destination
                    </p>
                    <p className="text-sm font-medium text-foreground truncate">
                      {request.destination}
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Trip Info */}
              {(request.estimatedDistance || request.estimatedDuration) && (
                <div className="flex items-center justify-center gap-6 mb-6 text-sm text-muted-foreground">
                  {request.estimatedDistance && (
                    <div className="flex items-center gap-1.5">
                      <Navigation className="w-4 h-4" />
                      <span>{request.estimatedDistance} km</span>
                    </div>
                  )}
                  {request.estimatedDuration && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>{request.estimatedDuration} min</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                >
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleReject}
                    className="w-full h-14 text-base font-semibold gap-2 border-2"
                  >
                    <X className="w-5 h-5" />
                    Refuser
                  </Button>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button
                    size="lg"
                    onClick={handleAccept}
                    className={cn(
                      'w-full h-14 text-base font-semibold gap-2',
                      'bg-gradient-to-r from-green-500 to-green-600',
                      'hover:from-green-600 hover:to-green-700',
                      'shadow-lg shadow-green-500/30'
                    )}
                  >
                    <Check className="w-5 h-5" />
                    Accepter
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
