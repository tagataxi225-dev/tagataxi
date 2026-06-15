import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface OrderCompletionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onComplete: () => void;
}

export const OrderCompletionDialog = ({ 
  isOpen, 
  onClose, 
  order,
  onComplete 
}: OrderCompletionDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);

    try {
      // Appeler l'edge function complete-marketplace-order
      const { error: functionError } = await supabase.functions.invoke('complete-marketplace-order', {
        body: {
          orderId: order.id,
          rating,
          feedback: feedback.trim() || undefined
        }
      });

      if (functionError) throw functionError;

      toast({
        title: '✅ Commande complétée',
        description: 'Le paiement a été libéré au vendeur. Merci pour votre retour !',
      });

      onComplete();
    } catch (error: any) {
      console.error('❌ Error completing order:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de finaliser la commande',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmer la réception</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info produit */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium">{order.product?.title || 'Produit'}</p>
            <p className="text-xs text-muted-foreground">
              {order.vendor_info?.shop_name || order.seller?.display_name || 'Vendeur'}
            </p>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Note globale</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= rating 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm font-semibold">{rating}/5</span>
            </div>
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Votre avis (optionnel)</label>
            <Textarea
              placeholder="Partagez votre expérience avec ce vendeur..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {feedback.length}/500
            </p>
          </div>

          {/* Info importante */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              💰 En confirmant, le paiement sera <strong>immédiatement libéré</strong> au vendeur (95% du montant, commission Tembea de 5%).
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                'Confirmer'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
