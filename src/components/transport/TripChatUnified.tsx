import React, { useCallback } from 'react';
import { UniversalChatInterface } from '@/components/chat/UniversalChatInterface';
import { MapPin, Phone, Navigation, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useUniversalChat } from '@/hooks/useUniversalChat';

interface TripChatUnifiedProps {
  bookingId: string;
  driverName?: string;
  driverPhone?: string;
  userType: 'client' | 'driver';
  onClose?: () => void;
  className?: string;
}

export const TripChatUnified: React.FC<TripChatUnifiedProps> = ({
  bookingId,
  driverName = 'Chauffeur',
  driverPhone,
  userType,
  onClose,
  className = ''
}) => {
  const { sendMessage, createOrFindConversation } = useUniversalChat();

  // Fonction pour envoyer un message rapide
  const sendQuickMessage = useCallback(async (message: string) => {
    try {
      // Trouver ou créer la conversation
      const conversation = await createOrFindConversation('transport', undefined, bookingId);
      if (conversation) {
        await sendMessage(conversation.id, message);
        toast.success('Message envoyé');
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
      toast.error('Erreur lors de l\'envoi');
    }
  }, [bookingId, sendMessage, createOrFindConversation]);

  // Actions rapides pour le client
  const clientQuickActions = [
    { 
      label: "Où êtes-vous ?", 
      action: () => sendQuickMessage("Bonjour, où êtes-vous exactement ?"),
      icon: MapPin
    },
    { 
      label: "J'arrive dans 5 min", 
      action: () => sendQuickMessage("Je serai au point de rendez-vous dans 5 minutes.") 
    },
    { 
      label: "Je vous attends", 
      action: () => sendQuickMessage("Je suis au point de rendez-vous, je vous attends."),
      icon: Clock
    }
  ];

  // Actions rapides pour le chauffeur
  const driverQuickActions = [
    { 
      label: "J'arrive", 
      action: () => sendQuickMessage("J'arrive dans quelques minutes, préparez-vous."),
      icon: Navigation
    },
    { 
      label: "Je suis là", 
      action: () => sendQuickMessage("Je suis arrivé au point de rendez-vous."),
      icon: MapPin
    },
    { 
      label: "Embouteillage", 
      action: () => sendQuickMessage("Je suis bloqué dans les embouteillages, +5-10 minutes de retard."),
      icon: AlertTriangle
    }
  ];

  return (
    <div className={className}>
      <UniversalChatInterface
        contextType="transport"
        contextId={bookingId}
        title={`Course avec ${driverName}`}
        onClose={onClose}
        isFloating={false}
        partnerPhone={driverPhone}
        partnerName={driverName}
        partnerType={userType === 'client' ? 'chauffeur' : 'client'}
        quickActions={userType === 'client' ? clientQuickActions : driverQuickActions}
      />
    </div>
  );
};
