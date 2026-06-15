import React, { ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { isMobileApp, isPWA } from "@/services/platformDetection";

interface Props { children: ReactNode }

export const OnboardingRedirect: React.FC<Props> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // ✅ CORRECTION 1: Vérifier si on vient de compléter l'onboarding
    const justCompleted = localStorage.getItem('onboarding_just_completed');
    if (justCompleted === 'true') {
      console.log('✅ [OnboardingRedirect] Just completed, removing flag and staying on current page');
      localStorage.removeItem('onboarding_just_completed');
      return; // Ne pas rediriger
    }

    // ✅ CORRECTION 2: Ne pas rediriger si on est sur une page d'auth
    const authPaths = ['/auth', '/app/auth', '/driver/auth', '/partner/auth', '/operatorx/admin/auth', '/restaurant/auth'];
    if (authPaths.some(path => location.pathname.startsWith(path))) {
      console.log('✅ [OnboardingRedirect] Already on auth page, skipping redirect');
      return;
    }

    // Ne pas rediriger si on est déjà sur l'onboarding ou le splash
    if (location.pathname === "/onboarding" || location.pathname === "/splash") {
      return;
    }

    const lastCtx = (localStorage.getItem("last_context") || "client").toLowerCase();
    const seen = localStorage.getItem(`onboarding_seen::${lastCtx}`) === "1";
    
    console.log('🔍 [OnboardingRedirect] Check', { 
      path: location.pathname, 
      context: lastCtx, 
      seen,
      isMobile: isMobileApp(),
      isPWAApp: isPWA()
    });
    
    // Pour mobile apps et PWA, forcer l'onboarding au premier lancement uniquement
    if ((isMobileApp() || isPWA()) && !seen) {
      console.log('🚀 [OnboardingRedirect] Redirecting to onboarding');
      navigate(`/onboarding?context=${encodeURIComponent(lastCtx)}`, { replace: true });
    }
  }, [navigate, location.pathname]);

  return <>{children}</>;
};
