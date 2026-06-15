import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  vehicleId: string;
  vehicleName: string;
  onReviewSubmitted?: () => void;
}

export const ReviewDialog = ({
  open,
  onOpenChange,
  bookingId,
  vehicleId,
  vehicleName,
  onReviewSubmitted,
}: ReviewDialogProps) => {
  const { toast } = useToast();
  const [vehicleRating, setVehicleRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [cleanlinessRating, setCleanlinessRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (vehicleRating === 0 || serviceRating === 0 || cleanlinessRating === 0) {
      toast({
        title: "Évaluation incomplète",
        description: "Veuillez noter tous les aspects",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Non connecté');

      // ✅ Insérer dans rental_reviews avec toutes les colonnes requises
      const { error } = await supabase
        .from('rental_reviews')
        .insert({
          booking_id: bookingId,
          vehicle_id: vehicleId,
          reviewer_id: user.user.id,
          reviewer_type: 'client',
          vehicle_rating: vehicleRating,
          service_rating: serviceRating,
          cleanliness_rating: cleanlinessRating,
          comment: comment.trim() || null,
          moderation_status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Merci pour votre avis !",
        description: "Votre évaluation sera visible après modération",
      });

      onOpenChange(false);
      onReviewSubmitted?.();
      
      // Reset form
      setVehicleRating(0);
      setServiceRating(0);
      setCleanlinessRating(0);
      setComment('');
    } catch (error: any) {
      console.error('Error submitting review:', error);
      
      if (error.message?.includes('unique_booking_review')) {
        toast({
          title: "Déjà évalué",
          description: "Vous avez déjà évalué cette réservation",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible d'enregistrer votre avis",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ 
    value, 
    onChange, 
    label 
  }: { 
    value: number; 
    onChange: (value: number) => void; 
    label: string;
  }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <Star
              className={`h-8 w-8 transition-colors ${
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </motion.button>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Évaluer votre location</DialogTitle>
          <DialogDescription>
            Partagez votre expérience avec {vehicleName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <StarRating
            label="État du véhicule"
            value={vehicleRating}
            onChange={setVehicleRating}
          />

          <StarRating
            label="Qualité du service"
            value={serviceRating}
            onChange={setServiceRating}
          />

          <StarRating
            label="Propreté"
            value={cleanlinessRating}
            onChange={setCleanlinessRating}
          />

          <div>
            <label className="text-sm font-medium mb-2 block">
              Commentaire (optionnel)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partagez plus de détails sur votre expérience..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {comment.length}/500 caractères
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Envoi...' : 'Envoyer mon avis'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
