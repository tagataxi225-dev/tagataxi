import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RateOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    seller_id: string;
    product_id: string;
    product?: {
      title: string;
      seller: {
        display_name: string;
      };
    };
  };
  onSuccess?: () => void;
}

export const RateOrderDialog: React.FC<RateOrderDialogProps> = ({ 
  isOpen, 
  onClose, 
  order,
  onSuccess 
}) => {
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une note',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // ✅ PHASE 3: Insertion directe dans marketplace_ratings (table créée par migration)
      const { error } = await supabase
        .from('marketplace_ratings')
        .insert({
          order_id: order.id,
          buyer_id: user.id,
          seller_id: order.seller_id,
          product_id: order.product_id,
          rating,
          comment: comment.trim() || null
        });

      if (error) throw error;

      toast({
        title: 'Merci pour votre avis !',
        description: 'Votre évaluation a été enregistrée avec succès.'
      });

      // Reset form
      setRating(5);
      setComment('');
      onClose();
      
      if (onSuccess) {
        onSuccess();
      }

    } catch (error: any) {
      console.error('Error submitting rating:', error);
      
      if (error.code === '23505') {
        toast({
          title: 'Déjà noté',
          description: 'Vous avez déjà noté cette commande.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Erreur',
          description: 'Impossible de soumettre votre avis. Réessayez.',
          variant: 'destructive'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Noter votre commande</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Produit: <span className="font-medium text-foreground">
                {order.product?.title || 'Produit'}
              </span>
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Vendeur: <span className="font-medium text-foreground">
                {order.product?.seller?.display_name || 'Vendeur'}
              </span>
            </p>
          </div>

          {/* Rating Stars */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Note (1-5 étoiles)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded"
                >
                  <Star 
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {rating === 1 && 'Très mauvais'}
              {rating === 2 && 'Mauvais'}
              {rating === 3 && 'Moyen'}
              {rating === 4 && 'Bon'}
              {rating === 5 && 'Excellent'}
            </p>
          </div>

          {/* Comment */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Commentaire (optionnel)
            </label>
            <Textarea
              placeholder="Partagez votre expérience avec ce vendeur..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {comment.length}/500 caractères
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Envoi...' : 'Envoyer l\'avis'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
