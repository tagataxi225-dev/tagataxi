import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ModernTaxiInterface from '@/components/transport/ModernTaxiInterface';
import AdvancedTaxiTracker from '@/components/transport/AdvancedTaxiTracker';
import { TransportErrorBoundary } from '@/components/transport/TransportErrorBoundary';
import type { LocationData } from '@/types/location';

interface NavigationState {
  prefilledAddress?: {
    address: string;
    name?: string;
    lat: number;
    lng: number;
  };
  addressType?: 'destination' | 'pickup';
}

const TransportPage = () => {
  const location = useLocation();
  const [activeView, setActiveView] = useState<'create' | 'track'>('create');
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [initialDestination, setInitialDestination] = useState<LocationData | null>(null);

  useEffect(() => {
    const state = location.state as NavigationState | null;
    if (state?.prefilledAddress && state?.addressType === 'destination') {
      setInitialDestination({
        address: state.prefilledAddress.address,
        name: state.prefilledAddress.name,
        lat: state.prefilledAddress.lat,
        lng: state.prefilledAddress.lng,
        type: 'database'
      });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleBookingCreated = (data: any) => {
    if (data.bookingId) {
      setActiveBookingId(data.bookingId);
      setActiveView('track');
    }
  };

  const handleBackToCreate = () => {
    setActiveView('create');
    setActiveBookingId(null);
  };

  if (activeView === 'track' && activeBookingId) {
    return (
      <TransportErrorBoundary>
        <AdvancedTaxiTracker
          bookingId={activeBookingId}
          onBack={handleBackToCreate}
        />
      </TransportErrorBoundary>
    );
  }

  return (
    <TransportErrorBoundary>
      <div className="min-h-screen bg-background">
        <ModernTaxiInterface
          initialDestination={initialDestination}
          onSubmit={handleBookingCreated}
          onCancel={handleBackToCreate}
          onTrackDriver={(bookingId) => {
            setActiveBookingId(bookingId);
            setActiveView('track');
          }}
        />
      </div>
    </TransportErrorBoundary>
  );
};

export default TransportPage;
