import React from 'react';
import UniversalTracker from '@/components/tracking/UniversalTracker';

interface ModernTaxiTrackerProps {
  bookingId: string;
  onBack?: () => void;
}

export default function ModernTaxiTracker({ bookingId, onBack }: ModernTaxiTrackerProps) {
  return (
    <UniversalTracker 
      orderId={bookingId}
      orderType="taxi"
      onBack={onBack}
      showMap={true}
      showChat={true}
    />
  );
}