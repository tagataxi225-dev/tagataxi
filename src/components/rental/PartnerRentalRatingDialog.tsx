import { useState, useEffect } from 'react';
import { Star, Loader2, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerHandle,
  DrawerClose
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { usePartnerRentalRating } from '@/hooks/usePartnerRentalRating';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PartnerRentalRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string;
  partnerName: string;
  onSuccess?: () => void;
}

const RATING_DATA = [
  { 
    value: 1, 
    label: 'Très mauvais', 
    emoji: '😞',
    color: 'from-red-500 to-red-600',
    textColor: 'text-red-600',
    bgColor: 'bg-red-500'
  },
  { 
    value: 2, 
    label: 'Mauvais', 
    emoji: '😕',
    color: 'from-orange-500 to-orange-600',
    textColor: 'text-orange-600',
    bgColor: 'bg-orange-500'
  },
  { 
    value: 3, 
    label: 'Correct', 
    emoji: '😐',
    color: 'from-yellow-500 to-yellow-600',
    textColor: 'text-yellow-600',
    bgColor: 'bg-yellow-500'
  },
  { 
    value: 4, 
    label: 'Bon', 
    emoji: '😊',
    color: 'from-blue-500 to-blue-600',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-500'
  },
  { 
    value: 5, 
    label: 'Excellent', 
    emoji: '😍',
    color: 'from-green-500 to-green-600',
    textColor: 'text-green-600',
    bgColor: 'bg-green-500'
  }
];

export const PartnerRentalRatingDialog: React.FC<PartnerRentalRatingDialogProps> = ({
  open,
  onOpenChange,
  partnerId,
  partnerName,
  onSuccess
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const { submitPartnerRating, loading } = usePartnerRentalRating();

  const currentRating = hoveredRating || rating;
  const currentData = RATING_DATA.find(r => r.value === currentRating);

  useEffect(() => {
    if (!open) {
      // Reset form when closed
      setTimeout(() => {
        setRating(0);
        setComment('');
        setHoveredRating(0);
      }, 300);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Veuillez sélectionner une note');
      return;
    }

    const success = await submitPartnerRating(
      partnerId,
      rating,
      comment.trim() || undefined
    );

    if (success) {
      // Confetti pour 5 étoiles
      if (rating === 5) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#FF69B4']
        });
      }

      toast.success(
        rating === 5 ? '🎉 Merci pour les 5 étoiles !' : '✅ Merci pour votre avis !',
        {
          description: 'Votre note aidera d\'autres clients'
        }
      );

      onSuccess?.();
      onOpenChange(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHandle />
        
        {/* Header avec gradient dynamique */}
        <motion.div 
          className={cn(
            "relative overflow-hidden rounded-t-[2rem] py-6 px-4",
            "bg-gradient-to-br",
            currentData ? currentData.color : "from-primary to-primary/80"
          )}
          animate={{
            background: currentData 
              ? `linear-gradient(135deg, var(--${currentData.bgColor.replace('bg-', '')}), var(--${currentData.bgColor.replace('bg-', '')}))`
              : undefined
          }}
        >
          <DrawerClose className="absolute right-4 top-4 rounded-full bg-white/20 p-2 backdrop-blur-sm hover:bg-white/30 transition-colors">
            <X className="h-5 w-5 text-white" />
          </DrawerClose>

          <div className="text-center space-y-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
            >
              <Star className="h-10 w-10 mx-auto text-white fill-white" />
            </motion.div>
            <DrawerTitle className="text-2xl font-bold text-white">
              Noter {partnerName}
            </DrawerTitle>
            <DrawerDescription className="text-white/90 text-sm">
              Votre avis compte ! Aidez les futurs clients
            </DrawerDescription>
          </div>
        </motion.div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6 overflow-y-auto">
          {/* Étoiles - VERSION MOBILE OPTIMISÉE */}
          <div className="space-y-4">
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = star <= currentRating;
                
                return (
                  <motion.button
                    key={star}
                    type="button"
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(star)}
                    className={cn(
                      "relative flex items-center justify-center transition-all duration-200",
                      "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl",
                      isActive 
                        ? "bg-gradient-to-br from-yellow-400 to-amber-500 shadow-xl shadow-yellow-500/60 ring-2 ring-yellow-300" 
                        : "bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600"
                    )}
                  >
                    <Star
                      className={cn(
                        "w-8 h-8 sm:w-10 sm:h-10 transition-all duration-200",
                        isActive
                          ? "fill-white text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.5)]"
                          : "fill-none text-gray-400 dark:text-gray-500"
                      )}
                    />
                    
                    {/* Glow effect */}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-2xl bg-yellow-300/30"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 0.8, 0.5]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Emoji et label géant */}
            <AnimatePresence mode="wait">
              {currentData && (
                <motion.div
                  key={currentData.value}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.8 }}
                  className="text-center space-y-2"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                      duration: 0.5,
                      ease: "easeInOut"
                    }}
                    className="text-7xl"
                  >
                    {currentData.emoji}
                  </motion.div>
                  <p className={cn("text-2xl font-bold", currentData.textColor)}>
                    {currentData.label}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Message d'encouragement */}
          {rating === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-4 space-y-2"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Sparkles className="h-8 w-8 mx-auto text-primary" />
              </motion.div>
              <p className="text-foreground font-medium">
                Cliquez sur les étoiles pour noter
              </p>
              <p className="text-sm text-muted-foreground">
                Votre avis aide la communauté 💛
              </p>
            </motion.div>
          )}

          {/* Commentaire */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Votre commentaire (optionnel)
            </label>
            <Textarea
              placeholder="Partagez votre expérience : qualité des véhicules, service client, tarifs..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
              className="resize-none border-2 focus:border-primary transition-colors"
            />
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">
                Maximum 500 caractères
              </span>
              <span className={cn(
                "font-medium",
                comment.length > 450 ? "text-orange-600" : "text-muted-foreground"
              )}>
                {comment.length}/500
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DrawerFooter className="border-t bg-muted/30">
          <div className="space-y-3 w-full">
            <Button 
              onClick={handleSubmit} 
              disabled={rating === 0 || loading}
              size="lg"
              className="w-full text-lg h-14 shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Star className="w-5 h-5 mr-2 fill-current" />
                  {rating > 0 ? `Envoyer ${rating} étoile${rating > 1 ? 's' : ''}` : 'Sélectionnez une note'}
                </>
              )}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground px-4">
              Votre note sera visible publiquement et aidera les futurs clients à faire leur choix
            </p>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
