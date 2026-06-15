import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Send } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRestaurantRating } from '@/hooks/useRestaurantRating';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface RestaurantRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantId: string;
  restaurantName: string;
  restaurantLogo?: string;
  onSuccess: () => void;
}

const EMOJIS = ['😞', '😕', '😐', '😊', '😍'];
const LABELS = ['Très mauvais', 'Mauvais', 'Moyen', 'Bon', 'Excellent'];

export const RestaurantRatingDialog: React.FC<RestaurantRatingDialogProps> = ({
  open,
  onOpenChange,
  restaurantId,
  restaurantName,
  restaurantLogo,
  onSuccess,
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const { submitRestaurantRating, loading } = useRestaurantRating();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Veuillez sélectionner une note');
      return;
    }

    const success = await submitRestaurantRating(restaurantId, rating, comment);
    
    if (success) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      
      onSuccess();
      onOpenChange(false);
      setRating(0);
      setComment('');
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Noter le restaurant</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Restaurant Info */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-secondary/5">
            <Avatar className="w-12 h-12">
              <AvatarImage src={restaurantLogo} />
              <AvatarFallback>{restaurantName[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-semibold">{restaurantName}</div>
              <div className="text-sm text-muted-foreground">Votre expérience ?</div>
            </div>
          </div>

          {/* Stars */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <motion.button
                  key={value}
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoveredRating(value)}
                  onMouseLeave={() => setHoveredRating(0)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-10 h-10 transition-all ${
                      value <= displayRating
                        ? 'fill-yellow-500 text-yellow-500'
                        : 'text-muted-foreground'
                    }`}
                  />
                </motion.button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {displayRating > 0 && (
                <motion.div
                  key={displayRating}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="space-y-2"
                >
                  <div className="text-6xl">{EMOJIS[displayRating - 1]}</div>
                  <div className="text-lg font-semibold">{LABELS[displayRating - 1]}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Commentaire (optionnel)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 500))}
              placeholder="Partagez votre expérience..."
              className="resize-none"
              rows={4}
            />
            <div className="text-xs text-muted-foreground text-right">
              {comment.length}/500
            </div>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={loading || rating === 0}
            className="w-full relative overflow-hidden group"
            size="lg"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
            <span className="relative flex items-center justify-center gap-2">
              {loading ? (
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
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
