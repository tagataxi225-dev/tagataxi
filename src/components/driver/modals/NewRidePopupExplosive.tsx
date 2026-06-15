/**
 * 💥 PHASE 5: Popup Explosive Nouvelle Course
 * Design plein écran dramatique IMPOSSIBLE À RATER
 * Son fort + vibration intense + timer géant
 */

import React, { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CircularTimer } from '../CircularTimer';
import { Car, MapPin, Navigation, DollarSign, CheckCircle, X, Clock, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { driverHaptics } from '@/utils/driverHaptics';

interface NewRidePopupExplosiveProps {
  open: boolean;
  notification: any;
  serviceType: 'taxi' | 'delivery';
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
}

export const NewRidePopupExplosive: React.FC<NewRidePopupExplosiveProps> = ({
  open,
  notification,
  serviceType,
  onAccept,
  onReject,
  onClose
}) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ⚡ EFFET DRAMATIQUE AU MONTAGE
  useEffect(() => {
    if (open) {
      // 🔊 SON FORT (si fichier existe)
      try {
        const audio = new Audio('/sounds/new_ride.mp3');
        audio.volume = 1.0;
        audio.loop = true;
        audio.play().catch(err => console.log('Audio play failed:', err));
        audioRef.current = audio;
      } catch (err) {
        console.log('Audio not available');
      }

      // 📳 VIBRATION INTENSE ET LONGUE
      driverHaptics.onNewRide();

      // ⏱️ COUNTDOWN 30 SECONDES
      setTimeLeft(30);
      timeoutRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeout();
            return 0;
          }
          // Vibration toutes les 5 secondes
          if (prev % 5 === 0 && prev <= 15) {
            if ('vibrate' in navigator) {
              navigator.vibrate(200);
            }
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        cleanup();
      };
    }
  }, [open]);

  const cleanup = () => {
    // Arrêter le son
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    // Arrêter le timer
    if (timeoutRef.current) {
      clearInterval(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleTimeout = () => {
    cleanup();
    onReject();
  };

  const handleAccept = () => {
    cleanup();
    driverHaptics.onRideAccepted();
    onAccept();
  };

  const handleReject = () => {
    cleanup();
    driverHaptics.onRideRejected();
    onReject();
  };

  const estimatedPrice = notification.estimatedPrice || 0;
  const distance = notification.distance || 0;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-full h-screen p-0 bg-gradient-to-br from-amber-500 to-orange-600 border-0"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="flex flex-col h-full p-6 text-white"
            >
              {/* 🎯 HEADER DRAMATIQUE */}
              <motion.div 
                className="text-center mb-6"
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                {serviceType === 'taxi' ? (
                  <Car className="h-24 w-24 mx-auto mb-4 text-white drop-shadow-2xl" />
                ) : (
                  <Package className="h-24 w-24 mx-auto mb-4 text-white drop-shadow-2xl" />
                )}
                <motion.h1 
                  className="text-5xl font-black mb-2 drop-shadow-lg"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  {serviceType === 'taxi' ? '🚗 NOUVELLE COURSE !' : '📦 NOUVELLE LIVRAISON !'}
                </motion.h1>
                <p className="text-3xl font-bold drop-shadow-md">
                  {estimatedPrice.toLocaleString()} CDF
                </p>
              </motion.div>

              {/* ⏱️ TIMER GÉANT */}
              <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-6 mb-6 shadow-2xl">
                <CircularTimer 
                  seconds={timeLeft} 
                  totalSeconds={30}
                  size={140}
                  strokeWidth={12}
                  className="mx-auto"
                />
                <motion.p 
                  className="text-center text-2xl font-bold mt-4"
                  animate={{ opacity: timeLeft <= 10 ? [1, 0.5, 1] : 1 }}
                  transition={{ duration: 0.5, repeat: timeLeft <= 10 ? Infinity : 0 }}
                >
                  {timeLeft <= 10 ? '⚠️ TEMPS LIMITÉ !' : 'Décidez maintenant'}
                </motion.p>
              </div>

              {/* 📍 DÉTAILS COURSE */}
              <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-6 mb-6 space-y-4 shadow-xl flex-1 overflow-y-auto">
                {/* Point de départ */}
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-500 rounded-xl shadow-lg">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white/80 mb-1">POINT DE DÉPART</p>
                    <p className="text-xl font-bold">{notification.location}</p>
                  </div>
                </div>

                {/* Stats clés */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-white/30 backdrop-blur-sm rounded-xl p-4 text-center shadow-lg">
                    <Navigation className="h-6 w-6 mx-auto mb-2 text-white" />
                    <p className="text-sm text-white/80 font-medium">Distance</p>
                    <p className="text-2xl font-black">{distance.toFixed(1)} km</p>
                  </div>
                  
                  <div className="bg-white/30 backdrop-blur-sm rounded-xl p-4 text-center shadow-lg">
                    <Clock className="h-6 w-6 mx-auto mb-2 text-white" />
                    <p className="text-sm text-white/80 font-medium">Durée estimée</p>
                    <p className="text-2xl font-black">{Math.ceil(distance * 3)} min</p>
                  </div>
                </div>

                {/* Prix mis en avant */}
                <div className="bg-green-500 rounded-2xl p-6 text-center shadow-2xl mt-4">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-white" />
                  <p className="text-sm font-semibold text-white/90 mb-1">VOUS GAGNEZ</p>
                  <p className="text-4xl font-black text-white drop-shadow-lg">
                    {estimatedPrice.toLocaleString()} CDF
                  </p>
                </div>
              </div>

              {/* 🎯 BOUTONS GÉANTS */}
              <div className="space-y-3">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    size="lg"
                    onClick={handleAccept}
                    className="w-full h-20 text-2xl font-black bg-green-500 hover:bg-green-600 shadow-2xl border-4 border-white"
                  >
                    <CheckCircle className="h-8 w-8 mr-3" />
                    ✅ ACCEPTER LA COURSE
                  </Button>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={handleReject}
                    className="w-full h-16 text-xl text-white/90 hover:bg-white/10 border-2 border-white/50"
                  >
                    <X className="h-6 w-6 mr-2" />
                    Refuser
                  </Button>
                </motion.div>
              </div>

              {/* ⚠️ WARNING TIMEOUT */}
              {timeLeft <= 10 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mt-4 bg-red-500/80 backdrop-blur-sm rounded-xl p-4"
                >
                  <p className="text-xl font-black text-white">
                    🚨 REFUS AUTOMATIQUE DANS {timeLeft}s !
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
