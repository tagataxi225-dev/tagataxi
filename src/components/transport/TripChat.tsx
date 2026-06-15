import React from 'react';
import { UniversalChatInterface } from '@/components/chat/UniversalChatInterface';
import { MapPin, Phone } from 'lucide-react';
import { toast } from 'sonner';

interface TripChatProps {
  bookingId: string;
  driverInfo?: {
    name: string;
    phone: string;
    rating: number;
    vehicle: string;
  };
  userType: 'client' | 'driver';
  onClose?: () => void;
}

const TripChat: React.FC<TripChatProps> = ({
  bookingId,
  driverInfo,
  userType,
  onClose
}) => {
  const handleCall = () => {
    if (driverInfo?.phone) {
      window.open(`tel:${driverInfo.phone}`, '_self');
    } else {
      toast.error('Numéro de téléphone non disponible');
    }
  };

  return (
    <UniversalChatInterface
      contextType="transport"
      contextId={bookingId}
      title={driverInfo ? `Course avec ${driverInfo.name}` : 'Chat de course'}
      onClose={onClose}
      isFloating={false}
      quickActions={
        userType === 'client'
          ? [
              { 
                label: "Où êtes-vous ?", 
                action: () => {},
                icon: MapPin
              },
              { 
                label: "J'arrive dans 5 min", 
                action: () => {} 
              },
              { 
                label: "Appeler", 
                action: handleCall,
                icon: Phone
              }
            ]
          : [
              { 
                label: "J'arrive", 
                action: () => {} 
              },
              { 
                label: "Je suis arrivé", 
                action: () => {} 
              },
              { 
                label: "Problème de circulation", 
                action: () => {} 
              }
            ]
      }
    />
  );
};

export default TripChat;