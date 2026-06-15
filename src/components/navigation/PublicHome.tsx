import { useState, useEffect } from 'react';
import { useAppReady } from '@/contexts/AppReadyContext';
import { InvisibleLoadingBar } from '@/components/loading/InvisibleLoadingBar';
import { Navigate } from 'react-router-dom';
import Index from '@/pages/Index';
import { isMobileApp, isPWA } from '@/services/platformDetection';

export const PublicHome = () => {
  const { user, sessionReady, userRole, contentReady } = useAppReady();
  const [timedOut, setTimedOut] = useState(false);

  // Safety timeout: après 3s, forcer l'affichage au lieu de rester bloqué
  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (isMobileApp() || isPWA()) {
    return <Navigate to="/app" replace />;
  }

  const isReady = (sessionReady && contentReady) || timedOut;

  if (!isReady) {
    return <InvisibleLoadingBar />;
  }

  if (!user) {
    return <Index />;
  }

  const redirectPath = userRole === 'admin' ? '/operatorx/admin'
    : userRole === 'partner' ? '/app/partenaire'
    : userRole === 'driver' ? '/app/chauffeur'
    : userRole === 'restaurant' ? '/app/restaurant'
    : '/app/client';

  return <Navigate to={redirectPath} replace />;
};
