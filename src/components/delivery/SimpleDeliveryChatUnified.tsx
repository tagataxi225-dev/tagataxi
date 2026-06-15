import React, { useCallback } from 'react';
import { UniversalChatInterface } from '@/components/chat/UniversalChatInterface';
import { Package, MapPin, Phone, Truck, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useUniversalChat } from '@/hooks/useUniversalChat';

interface SimpleDeliveryChatUnifiedProps {
  orderId: string;
  userType: 'client' | 'driver';
  userId: string;
  partnerName?: string;
  partnerPhone?: string;
  onCall?: () => void;
}

const SimpleDeliveryChatUnified: React.FC<SimpleDeliveryChatUnifiedProps> = ({
  orderId,
  userType,
  userId,
  partnerName = 'Livreur',
  partnerPhone,
  onCall
}) => {
  const { sendMessage, createOrFindConversation } = useUniversalChat();

  // Fonction pour envoyer un message rapide
  const sendQuickMessage = useCallback(async (message: string) => {
    try {
      const conversation = await createOrFindConversation('delivery', undefined, orderId);
      if (conversation) {
        await sendMessage(conversation.id, message);
        toast.success('Message envoyé');
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
      toast.error('Erreur lors de l\'envoi');
    }
  }, [orderId, sendMessage, createOrFindConversation]);

  // Actions rapides pour le livreur
  const driverQuickActions = [
    { 
      label: "Colis récupéré", 
      action: () => sendQuickMessage("✅ J'ai récupéré votre colis, je suis en route."),
      icon: Package
    },
    { 
      label: "En route", 
      action: () => sendQuickMessage("🚚 Je suis en route vers votre adresse."),
      icon: Truck
    },
    { 
      label: "J'arrive dans 5 min", 
      action: () => sendQuickMessage("⏱️ J'arrive dans environ 5 minutes, préparez-vous."),
      icon: Clock
    },
    {
      label: "Je suis arrivé",
      action: () => sendQuickMessage("📍 Je suis arrivé à destination."),
      icon: MapPin
    }
  ];

  // Actions rapides pour le client
  const clientQuickActions = [
    { 
      label: "Où êtes-vous ?", 
      action: () => sendQuickMessage("Bonjour, où en êtes-vous avec ma livraison ?"),
      icon: MapPin
    },
    { 
      label: "Je vous attends", 
      action: () => sendQuickMessage("Je suis à l'adresse indiquée, je vous attends."),
      icon: Clock
    },
    { 
      label: "Combien de temps ?", 
      action: () => sendQuickMessage("Dans combien de temps arriverez-vous ?"),
      icon: Truck
    }
  ];

  return (
    <UniversalChatInterface
      contextType="delivery"
      contextId={orderId}
      title={`Livraison avec ${partnerName}`}
      isFloating={false}
      partnerPhone={partnerPhone}
      partnerName={partnerName}
      partnerType={userType === 'driver' ? 'client' : 'livreur'}
      quickActions={userType === 'driver' ? driverQuickActions : clientQuickActions}
    />
  );
};

export default SimpleDeliveryChatUnified;
