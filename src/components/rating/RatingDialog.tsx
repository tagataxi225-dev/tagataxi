import { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useRating } from '@/hooks/useRating';

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ratedUserId: string;
  ratedUserName: string;
  ratedUserType: 'driver' | 'delivery_driver' | 'seller';
  orderId: string;
  orderType: 'transport' | 'delivery' | 'marketplace';
  onSuccess?: () => void;
}

const RATING_LABELS = {
  1: 'Très mauvais',
  2: 'Mauvais',
  3: 'Moyen',
  4: 'Bon',
  5: 'Excellent'
};

const USER_TYPE_LABELS = {
  driver: 'le chauffeur',
  delivery_driver: 'le livreur',
  seller: 'le vendeur'
};

export const RatingDialog: React.FC<RatingDialogProps> = ({
  open,
  onOpenChange,
  ratedUserId,
  ratedUserName,
  ratedUserType,
  orderId,
  orderType,
  onSuccess
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const { submitRating, loading } = useRating();

  const handleSubmit = async () => {
    if (rating === 0) {
      return;
    }

    try {
      const ok = await submitRating({
        ratedUserId,
        rating,
        comment: comment.trim() || undefined,
        bookingId: orderType === 'transport' ? orderId : undefined,
        deliveryId: orderType === 'delivery' ? orderId : undefined,
      });
      if (!ok) return;
      onSuccess?.();
      onOpenChange(false);
      
      // Reset form
      setRating(0);
      setComment('');
      setHoveredRating(0);
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Évaluer {USER_TYPE_LABELS[ratedUserType]}
          </DialogTitle>
          <DialogDescription>
            Votre avis aide {ratedUserName} à améliorer son service
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Étoiles interactives */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                type="button"
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.88 }}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setRating(star); setHoveredRating(0); }}
                style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', cursor: 'pointer' }}
                className="focus:outline-none"
              >
                <Star
                  style={{
                    width: 46, height: 46,
                    fill: star <= (hoveredRating || rating) ? '#FBBF24' : 'none',
                    color: star <= (hoveredRating || rating) ? '#FBBF24' : '#D1D5DB',
                    transition: 'fill 0.12s ease, color 0.12s ease',
                    filter: star <= (hoveredRating || rating) ? 'drop-shadow(0 2px 6px rgba(251,191,36,0.6))' : 'none',
                    display: 'block',
                  }}
                />
              </motion.button>
            ))}
          </div>

          {/* Label qualitatif */}
          {rating > 0 && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-lg font-medium text-foreground"
            >
              {RATING_LABELS[rating as keyof typeof RATING_LABELS]}
            </motion.p>
          )}

          {/* Commentaire optionnel */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Commentaire (optionnel)
            </label>
            <Textarea
              placeholder="Partagez votre expérience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/500
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={rating === 0 || loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Envoi...
              </>
            ) : (
              'Envoyer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
