import React from 'react';
import { UniversalChatInterface } from '@/components/chat/UniversalChatInterface';
import { Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface SimpleDeliveryChatProps {
  orderId: string;
  userType: 'client' | 'driver';
  userId: string;
  partnerName?: string;
  partnerPhone?: string;
  onCall?: () => void;
}

export default function SimpleDeliveryChat({
  orderId,
  userType,
  partnerName = 'Partenaire',
  partnerPhone,
  onCall
}: SimpleDeliveryChatProps) {
  const handleCall = () => {
    if (onCall) {
      onCall();
    } else if (partnerPhone) {
      window.open(`tel:${partnerPhone}`, '_self');
    } else {
      toast.error('Numéro de téléphone non disponible');
    }
  };

  return (
    <UniversalChatInterface
      contextType="delivery"
      contextId={orderId}
      title={`Livraison avec ${partnerName}`}
      isFloating={false}
      quickActions={
        userType === 'driver'
          ? [
              { 
                label: "Colis récupéré", 
                action: () => {} 
              },
              { 
                label: "En route vers destination", 
                action: () => {} 
              },
              { 
                label: "Livraison terminée", 
                action: () => {} 
              },
              { 
                label: "Partager position", 
                action: () => {},
                icon: MapPin 
              }
            ]
          : [
              { 
                label: "Où êtes-vous ?", 
                action: () => {} 
              },
              { 
                label: "Combien de temps ?", 
                action: () => {} 
              },
              { 
                label: "Je vous attends", 
                action: () => {} 
              },
              { 
                label: "Appeler", 
                action: handleCall,
                icon: Phone 
              }
            ]
      }
    />
  );
}