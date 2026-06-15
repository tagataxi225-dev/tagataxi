import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/hooks/useAuth";
import { PushNotificationManager } from "@/components/notifications/PushNotificationManager";
import { NativePushProvider } from "@/components/notifications/NativePushProvider";
// ModernToastProvider removed — dead import that loaded @capacitor/haptics at startup
const PremiumNotificationContainer = lazy(() => import("@/components/notifications/PremiumNotificationContainer").then(m => ({ default: m.PremiumNotificationContainer })));
const UnifiedConnectionAlert = lazy(() => import("@/components/connection/UnifiedConnectionAlert").then(m => ({ default: m.UnifiedConnectionAlert })));
import { ABTestProvider } from "@/contexts/ABTestContext";

import { FavoritesProvider } from "@/context/FavoritesContext";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import DynamicTheme from "@/components/theme/DynamicTheme";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SafetyNet } from "@/components/SafetyNet";
import { HealthStatusBar } from "@/components/HealthStatusBar";
import { RecoveryDialog } from "@/components/RecoveryDialog";
import { DegradedModeProvider } from "@/contexts/DegradedModeContext";
import { healthOrchestrator } from "@/services/HealthOrchestrator";
import { sessionRecovery } from "@/services/SessionRecovery";
import { APP_CONFIG } from "@/config/appConfig";
import { isMobileApp, isPWA } from "@/services/platformDetection";
import { PWASplashScreen } from "@/components/PWASplashScreen";
import { useState } from "react";
import { RouteLoadingFallback } from "@/components/loading/RouteLoadingFallback";
import { AppReadyProvider } from "@/contexts/AppReadyContext";
import { SmoothTransitionWrapper } from "@/components/loading/SmoothTransitionWrapper";
import { HelmetProvider } from 'react-helmet-async';
import { ChatProvider } from "@/components/chat/ChatProvider";
import { CartProvider } from '@/context/CartContext';
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { AppDownloadTopBanner } from "@/components/pwa/AppDownloadTopBanner";
import { AppUpdateBanner } from "@/components/AppUpdateBanner";

import { UpdateProgress } from "@/components/pwa/UpdateProgress";
import { OnboardingRedirect } from "@/components/onboarding/OnboardingRedirect";
import { ScrollToTop } from "@/components/navigation/ScrollToTop";
import { ThemeNotification } from "@/components/theme/ThemeNotification";
import { useAppServices } from "@/hooks/useAppServices";
import { DebugHelper } from "@/utils/debugHelper";
import { JobNotificationListener } from "@/hooks/useJobNotifications";
import { autoUpdateService } from "@/services/AutoUpdateService";
import { initVersionDebug } from "@/utils/versionDebug";
import { migrateToDefaultLightTheme } from "@/utils/themeMigration";
import { AppRatingPrompt } from "@/components/rating/AppRatingPrompt";
import { useAppRating } from "@/hooks/useAppRating";
import { soundGenerator } from "@/utils/soundGenerator";


// Critical imports
import Index from "./pages/Index";
import { SmartHome } from "./components/navigation/SmartHome";
import { PublicHome } from "./components/navigation/PublicHome";
import { NavigationGuard } from "./components/navigation/NavigationGuard";
import { MobileAppEntry } from "./components/navigation/MobileAppEntry";
import { NativeBackHandler } from "./components/navigation/NativeBackHandler";
import { HistoryBarrierManager } from "./components/navigation/HistoryBarrierManager";
import { SwipeBackGesture } from "./components/navigation/SwipeBackGesture";

// Route modules
import {
  ClientRoutes,
  DriverRoutes,
  PartnerRoutes,
  AdminRoutes,
  PublicRoutes,
  SharedRoutes
} from "./routes";

const NotFound = lazy(() => import("./pages/NotFound"));
const PaymentConfirmation = lazy(() => import("./pages/PaymentConfirmation").then(m => ({ default: m.PaymentConfirmation })));

const AppContent = () => {
  const [showSplash, setShowSplash] = useState(isPWA() || isMobileApp());
  const [preloadedSession, setPreloadedSession] = useState<any>(null);
  const [preloadedRole, setPreloadedRole] = useState<string | null>(null);
  
  useAppServices();
  const { incrementAppOpens } = useAppRating();
  
  useEffect(() => {
    migrateToDefaultLightTheme();
    healthOrchestrator.start();
    sessionRecovery.restoreSession();
    incrementAppOpens();
    return () => healthOrchestrator.stop();
  }, []);
  
  // ✅ FIX: Only run diagnostics when ?debug=1 is present — avoids boot burst
  useEffect(() => {
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('debug')) {
      setTimeout(() => DebugHelper.runFullDiagnostic(), 5000);
    }
  }, []);
  
  // Système de mise à jour automatique
  useEffect(() => {
    // Initialiser le service de mise à jour automatique
    autoUpdateService.initialize();
    
    // Initialiser les outils de debug
    if (import.meta.env.DEV) {
      initVersionDebug();
    }
    
    // Écouter les messages du Service Worker
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NEW_VERSION_ACTIVATED') {
        console.log('🎉 New version activated:', event.data.version);
        // Le rechargement se fait automatiquement via AutoUpdateService
      }
    };
    
    navigator.serviceWorker?.addEventListener('message', handleSWMessage);
    
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
      autoUpdateService.destroy();
    };
  }, []);

  useEffect(() => {
    const unlock = () => { soundGenerator.unlock(); };
    window.addEventListener('touchend', unlock, { once: true });
    window.addEventListener('click', unlock, { once: true });
    return () => {
      window.removeEventListener('touchend', unlock);
      window.removeEventListener('click', unlock);
    };
  }, []);

  const handleSplashComplete = (session?: any, userRole?: string | null) => {
    setPreloadedSession(session);
    setPreloadedRole(userRole);
    setShowSplash(false);
  };

  return (
    <>
      {showSplash && <PWASplashScreen onComplete={handleSplashComplete} />}
      
      <SmoothTransitionWrapper
        isLoading={showSplash}
        loadingComponent={<div />}
      >
        <HelmetProvider>
          <SafetyNet>
            <DegradedModeProvider>
              <AppReadyProvider initialSession={preloadedSession}>
                <HealthStatusBar />
                <RecoveryDialog />
                <UpdateProgress />
                <DynamicTheme>
                  <ThemeNotification />
                    <Toaster />
                    <Sonner />
                    <PushNotificationManager />
                    <InstallBanner />
                    <AppUpdateBanner />
                    <BrowserRouter>
                      <JobNotificationListener />
                      <NativeBackHandler />
                      <HistoryBarrierManager />
                      <SwipeBackGesture />
                      <NavigationGuard>
                        <ScrollToTop />
                        <AppDownloadTopBanner />
                        <OnboardingRedirect>
                          <Suspense fallback={<RouteLoadingFallback />}>
                            <Routes>
                              {/* Landing page - Mobile apps go direct to app, web shows marketing */}
                              {isMobileApp() ? (
                                <Route path="/" element={<MobileAppEntry />} />
                              ) : (
                                <>
                                  <Route path="/" element={<PublicHome />} />
                                  <Route path="/landing" element={<Index />} />
                                  <Route path="/app" element={<SmartHome />} />
                                </>
                              )}
                              
                              {/* Shared routes */}
                              {SharedRoutes()}
                              
                              {/* Role-specific routes */}
                              {ClientRoutes()}
                              {DriverRoutes()}
                              {PartnerRoutes()}
                              {AdminRoutes()}
                              {PublicRoutes()}
                              
                              {/* Payment confirmation */}
                              <Route path="/payment-confirmation" element={<PaymentConfirmation />} />
                              
                              {/* 404 - Must be last */}
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </Suspense>
                        </OnboardingRedirect>
                      </NavigationGuard>
                    </BrowserRouter>
                  
                  <UnifiedConnectionAlert />
                  <AppRatingPrompt />
                </DynamicTheme>
              </AppReadyProvider>
            </DegradedModeProvider>
          </SafetyNet>
        </HelmetProvider>
      </SmoothTransitionWrapper>
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NativePushProvider>
            <PremiumNotificationContainer>
              <CartProvider>
                <FavoritesProvider>
                  <LanguageProvider>
                    <ABTestProvider>
                      <TooltipProvider>
                        <ChatProvider>
                          <AppContent />
                        </ChatProvider>
                      </TooltipProvider>
                    </ABTestProvider>
                  </LanguageProvider>
                </FavoritesProvider>
              </CartProvider>
            </PremiumNotificationContainer>
          </NativePushProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
