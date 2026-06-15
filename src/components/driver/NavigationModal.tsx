/**
 * 🗺️ Modal de Navigation GPS Full-Screen pour Chauffeurs
 */

import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DriverNavigationHub } from './DriverNavigationHub';

interface NavigationModalProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  orderType: 'transport' | 'delivery';
  pickup: { lat: number; lng: number; address: string };
  destination: { lat: number; lng: number; address: string };
  customerPhone?: string;
}

export const NavigationModal: React.FC<NavigationModalProps> = ({
  open,
  onClose,
  orderId,
  orderType,
  pickup,
  destination,
  customerPhone
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-full max-h-full h-screen w-screen p-0 gap-0">
        <DriverNavigationHub
          orderId={orderId}
          orderType={orderType as 'taxi' | 'delivery' | 'marketplace'}
          pickup={pickup}
          destination={destination}
          customerPhone={customerPhone || ''}
          onConfirmArrival={() => {
            console.log('🎯 Driver arrived at pickup');
          }}
          onComplete={() => {
            console.log('✅ Navigation completed');
            onClose();
          }}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};
