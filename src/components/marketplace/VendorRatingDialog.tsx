import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useVendorRating } from '@/hooks/useVendorRating';
import { Star, Sparkles, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface VendorRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId: string;
  vendorName: string;
  vendorLogo?: string;
  onSuccess?: () => void;
}

const ratingEmojis: Record<number, string> = {
  1: '😞',
  2: '😕',
  3: '😐',
  4: '😊',
  5: '😍'
};

const ratingLabels: Record<number, string> = {
  1: 'Très mauvais',
  2: 'Mauvais',
  3: 'Moyen',
  4: 'Bon',
  5: 'Excellent'
};

export const VendorRatingDialog: React.FC<VendorRatingDialogProps> = ({
  open,
  onOpenChange,
  vendorId,
  vendorName,
  vendorLogo,
  onSuccess
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const { submitVendorRating, loading } = useVendorRating();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Veuillez sélectionner une note');
      return;
    }

    try {
      const success = await submitVendorRating(
        vendorId,
        rating,
        comment.trim() || undefined
      );

      if (success) {
        // Trigger confetti
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#FF6347', '#9333EA']
        });

        // Reset form
        setRating(0);
        setComment('');

        // Call success callback
        if (onSuccess) onSuccess();

        // Close dialog
        onOpenChange(false);
      }
    } catch (error) {
      // Error already handled by useRating hook
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {vendorLogo ? (
              <img 
                src={vendorLogo} 
                alt={vendorName}
                className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                {vendorName[0]}
              </div>
            )}
            <div>
              <DialogTitle className="text-xl">Noter la boutique</DialogTitle>
              <p className="text-sm text-muted-foreground">{vendorName}</p>
            </div>
          </div>
          <DialogDescription>
            Votre avis aide les autres utilisateurs à mieux choisir
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Stars rating with emojis */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <motion.button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoveredRating(value)}
                  onMouseLeave={() => setHoveredRating(0)}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  className="focus:outline-none"
                >
                  <Star
                    className={cn(
                      'w-10 h-10 transition-all duration-200',
                      value <= displayRating
                        ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]'
                        : 'text-muted fill-muted-foreground/20'
                    )}
                  />
                </motion.button>
              ))}
            </div>

            {/* Emoji and label animation */}
            <AnimatePresence mode="wait">
              {displayRating > 0 && (
                <motion.div
                  key={displayRating}
                  initial={{ scale: 0, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0, y: -10 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className="text-center"
                >
                  <div className="text-6xl mb-2">{ratingEmojis[displayRating]}</div>
                  <p className="text-lg font-semibold text-foreground">
                    {ratingLabels[displayRating]}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Comment textarea */}
          {rating > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Partagez votre expérience (optionnel)
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                placeholder="Qu'avez-vous pensé de cette boutique ?"
                className="min-h-[100px] resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {comment.length}/500 caractères
              </p>
            </motion.div>
          )}

          {/* Submit button with shimmer effect */}
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || loading}
            className="w-full relative overflow-hidden group"
            size="lg"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
            <span className="relative flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Envoyer mon avis
                </>
              )}
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
