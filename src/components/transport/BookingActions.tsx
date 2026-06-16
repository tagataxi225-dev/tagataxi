import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertTriangle, 
  Edit, 
  Star, 
  Flag, 
  Phone, 
  MessageCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CancellationDialog } from '@/components/shared/CancellationDialog';

interface BookingActionsProps {
  booking: any;
  onBookingUpdate: (updates: any) => void;
  onBack: () => void;
}

const BookingActions: React.FC<BookingActionsProps> = ({ booking, onBookingUpdate, onBack }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [newDestination, setNewDestination] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const handleCancelBooking = async (reason: string) => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Get booking status for fee calculation
      const { data: bookingData, error: fetchError } = await supabase
        .from('transport_bookings')
        .select('status, estimated_price')
        .eq('id', booking.id)
        .single();

      if (fetchError) throw fetchError;

      const cancellationFee = (bookingData.status === 'accepted' || bookingData.status === 'driver_assigned')
        ? Math.round((bookingData.estimated_price || 0) * 0.1)
        : 0;

      // Update booking
      const { error } = await supabase
        .from('transport_bookings')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: user.id,
          cancellation_reason: reason,
          cancellation_type: 'client'
        })
        .eq('id', booking.id);

      if (error) throw error;

      // Log cancellation
      await supabase
        .from('cancellation_history')
        .insert({
          reference_id: booking.id,
          reference_type: 'transport_booking',
          cancelled_by: user.id,
          cancellation_type: 'client',
          reason,
          status_at_cancellation: bookingData.status,
          financial_impact: {
            cancellation_fee: cancellationFee,
            original_amount: bookingData.estimated_price,
            currency: 'XOF'
          }
        });

      if (cancellationFee > 0) {
        toast({
          title: "Course annulée",
          description: `Frais d'annulation appliqués: ${cancellationFee} CDF`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Course annulée",
          description: "Votre réservation a été annulée avec succès",
        });
      }

      // Redirection + notification encourageante
      setTimeout(() => {
        onBack();
        
        toast({
          title: "📍 Prêt pour une nouvelle aventure ?",
          description: "Nous sommes toujours là pour vous ! Où souhaitez-vous aller ?",
          duration: 4000,
        });
      }, 500);

    } catch (error) {
      console.error('Erreur annulation:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'annuler la réservation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRateDriver = async () => {
    if (rating === 0) {
      toast({
        title: "Note requise",
        description: "Veuillez sélectionner une note",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Insérer directement l'évaluation
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const { error: ratingError } = await supabase
        .from('driver_ratings')
        .insert({
          driver_id: booking.driver_id,
          user_id: userData.user.id,
          booking_id: booking.id,
          rating: rating,
          feedback: feedback || null
        });

      if (ratingError) throw ratingError;

      // Marquer la réservation comme évaluée
      const { error: updateError } = await supabase
        .from('transport_bookings')
        .update({ rated: true })
        .eq('id', booking.id);

      if (updateError) throw updateError;

      toast({
        title: "Évaluation enregistrée",
        description: "Merci pour votre retour !",
      });

      // Marquer la réservation comme évaluée
      onBookingUpdate({ rated: true });
    } catch (error) {
      console.error('Erreur évaluation:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer votre évaluation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDestination = async () => {
    if (!newDestination.trim()) {
      toast({
        title: "Destination requise",
        description: "Veuillez saisir une nouvelle destination",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('transport_bookings')
        .update({ 
          destination: newDestination,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (error) throw error;

      toast({
        title: "Destination mise à jour",
        description: "Le chauffeur a été notifié du changement",
      });

      onBookingUpdate({ destination: newDestination });
    } catch (error) {
      console.error('Erreur mise à jour destination:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier la destination",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReportIssue = async () => {
    if (!reportReason.trim()) {
      toast({
        title: "Motif requis",
        description: "Veuillez décrire le problème",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Créer un signalement
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('booking_reports')
        .insert({
          booking_id: booking.id,
          user_id: userData.user.id,
          driver_id: booking.driver_id,
          reason: reportReason,
          status: 'pending'
        });

      if (error) throw error;

      if (error) throw error;

      toast({
        title: "Signalement envoyé",
        description: "Notre équipe va examiner votre demande",
      });

      setReportReason('');
    } catch (error) {
      console.error('Erreur signalement:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le signalement",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const canCancel = ['pending', 'driver_assigned'].includes(booking.status);
  const canModifyDestination = ['pending', 'driver_assigned', 'driver_en_route'].includes(booking.status);
  const canRate = booking.status === 'completed' && booking.driver_id && !booking.rated;
  const canReport = booking.driver_id;

  return (
    <div className="space-y-6">
      {/* Actions rapides */}
      <Card className="glassmorphism">
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Contacter le chauffeur */}
          {booking.driver_id && (
            <div className="grid grid-cols-2 gap-3">
              {booking.driver_phone && (
                <Button 
                  variant="outline"
                  onClick={() => window.open(`tel:${booking.driver_phone}`)}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Appeler
                </Button>
              )}
              <Button variant="outline">
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat
              </Button>
            </div>
          )}

          {/* Actions selon le statut */}
          {canCancel && (
            <>
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => setShowCancelDialog(true)}
                disabled={loading}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Annuler la course
              </Button>

              <CancellationDialog
                isOpen={showCancelDialog}
                onClose={() => setShowCancelDialog(false)}
                onConfirm={handleCancelBooking}
                title="Annuler la course"
                userType="client"
                bookingDetails={{
                  id: booking.id,
                  status: booking.status,
                  price: booking.estimated_price
                }}
              />
            </>
          )}

          {booking.status === 'completed' && (
            <Button 
              className="w-full"
              onClick={onBack}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Nouvelle course
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Modifier la destination */}
      {canModifyDestination && (
        <Card className="glassmorphism">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Modifier la destination
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-destination">Nouvelle destination</Label>
              <Input
                id="new-destination"
                value={newDestination}
                onChange={(e) => setNewDestination(e.target.value)}
                placeholder={booking.destination}
              />
            </div>
            <Button 
              onClick={handleUpdateDestination}
              disabled={loading || !newDestination.trim()}
              className="w-full"
            >
              Modifier la destination
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Évaluer le chauffeur */}
      {canRate && (
        <Card className="glassmorphism">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Évaluer votre chauffeur
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Système d'étoiles */}
            <div className="space-y-2">
              <Label>Note (sur 5)</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1"
                  >
                    <Star 
                      className={`h-8 w-8 ${
                        star <= rating 
                          ? 'text-yellow-500 fill-current' 
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Commentaire optionnel */}
            <div className="space-y-2">
              <Label htmlFor="feedback">Commentaire (optionnel)</Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Partagez votre expérience..."
                rows={3}
              />
            </div>

            <Button 
              onClick={handleRateDriver}
              disabled={loading || rating === 0}
              className="w-full"
            >
              Envoyer l'évaluation
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Signaler un problème */}
      {canReport && (
        <Card className="glassmorphism">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Signaler un problème
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="report-reason">Décrivez le problème</Label>
              <Textarea
                id="report-reason"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Décrivez ce qui s'est passé..."
                rows={3}
              />
            </div>
            <Button 
              variant="outline"
              onClick={handleReportIssue}
              disabled={loading || !reportReason.trim()}
              className="w-full"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Envoyer le signalement
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Informations de statut */}
      <Card className="glassmorphism">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Statut actuel</span>
            <Badge variant="secondary">{booking.status}</Badge>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-muted-foreground">Créée le</span>
            <span className="text-sm">
              {new Date(booking.created_at).toLocaleDateString('fr-FR')} à {' '}
              {new Date(booking.created_at).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingActions;