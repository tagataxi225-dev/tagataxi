import { useUniversalChat } from './useUniversalChat';
import { useChat } from '@/components/chat/ChatProvider';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

/**
 * Hook helper pour ouvrir facilement le chat depuis un booking
 */
export const useBookingChat = () => {
  const { user } = useAuth();
  const { createOrFindConversation } = useUniversalChat();
  const { openChat } = useChat();

  /**
   * Crée ou récupère une conversation depuis un booking et ouvre le chat
   */
  const openChatFromBooking = async (
    bookingId: string,
    bookingType: 'transport' | 'delivery',
    participantName?: string
  ) => {
    if (!user) {
      toast.error('Vous devez être connecté pour accéder au chat');
      return;
    }

    try {
      // Récupérer les infos du booking pour identifier l'autre participant
      const tableName = bookingType === 'transport' ? 'transport_bookings' : 'delivery_orders';
      const { data: booking, error: bookingError } = await supabase
        .from(tableName)
        .select('user_id, driver_id')
        .eq('id', bookingId)
        .single();

      if (bookingError || !booking) {
        toast.error('Impossible de récupérer les informations du booking');
        console.error('Booking error:', bookingError);
        return;
      }

      // Déterminer l'autre participant
      const otherParticipantId = user.id === booking.user_id 
        ? booking.driver_id 
        : booking.user_id;

      if (!otherParticipantId) {
        toast.error('Aucun participant trouvé pour ce booking');
        return;
      }

      // Créer ou récupérer la conversation
      const conversation = await createOrFindConversation(
        bookingType,
        otherParticipantId,
        bookingId,
        participantName 
          ? `${bookingType === 'transport' ? 'Course' : 'Livraison'} avec ${participantName}`
          : `${bookingType === 'transport' ? 'Course' : 'Livraison'} #${bookingId.slice(0, 8)}`
      );

      if (!conversation) {
        toast.error('Impossible de créer la conversation');
        return;
      }

      // Définir les actions rapides selon le type de booking
      const quickActions = bookingType === 'transport' 
        ? [
            { label: "J'arrive dans 5 min", action: () => {} },
            { label: "Où êtes-vous ?", action: () => {} },
            { label: "Merci !", action: () => {} }
          ]
        : [
            { label: "Colis récupéré", action: () => {} },
            { label: "En route", action: () => {} },
            { label: "Livraison terminée", action: () => {} }
          ];

      // Ouvrir le chat avec le contexte approprié
      openChat({
        contextType: bookingType,
        contextId: bookingId,
        participantId: otherParticipantId,
        title: participantName 
          ? `${bookingType === 'transport' ? 'Course' : 'Livraison'} avec ${participantName}`
          : `${bookingType === 'transport' ? 'Course' : 'Livraison'} #${bookingId.slice(0, 8)}`,
        quickActions
      });
    } catch (error) {
      console.error('Error opening chat from booking:', error);
      toast.error('Erreur lors de l\'ouverture du chat');
    }
  };

  /**
   * Ouvre un chat de support général
   */
  const openSupportChat = async (subject?: string) => {
    if (!user) {
      toast.error('Vous devez être connecté pour accéder au support');
      return;
    }

    try {
      // ID fictif pour le support (pourrait être un admin assigné automatiquement)
      const supportParticipantId = '00000000-0000-0000-0000-000000000000';
      
      const conversation = await createOrFindConversation(
        'support',
        supportParticipantId,
        undefined,
        subject || 'Support TAGA'
      );

      if (!conversation) {
        toast.error('Impossible de créer la conversation de support');
        return;
      }

      openChat({
        contextType: 'support',
        participantId: supportParticipantId,
        title: subject || 'Support TAGA',
        quickActions: [
          { label: "J'ai un problème avec ma course", action: () => {} },
          { label: "Question sur mon compte", action: () => {} },
          { label: "Problème de paiement", action: () => {} }
        ]
      });
    } catch (error) {
      console.error('Error opening support chat:', error);
      toast.error('Erreur lors de l\'ouverture du support');
    }
  };

  return { 
    openChatFromBooking,
    openSupportChat
  };
};
