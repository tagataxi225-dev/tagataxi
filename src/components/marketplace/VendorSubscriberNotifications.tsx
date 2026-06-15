import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BellOff } from 'lucide-react';

export const VendorSubscriberNotifications: React.FC = () => {
  // Composant simplifié pour éviter les erreurs de build
  // La table vendor_notifications sera configurée dans une prochaine migration
  
  return (
    <div className="text-center py-8">
      <BellOff className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
      <p className="text-muted-foreground text-sm">Notifications des abonnements à venir</p>
    </div>
  );
};
