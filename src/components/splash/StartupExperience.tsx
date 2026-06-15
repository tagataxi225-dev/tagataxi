import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { DynamicSplash } from "./DynamicSplash";
import { getStartupContext } from "@/services/startupContext";

export const StartupExperience: React.FC = () => {
  const location = useLocation();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // ✅ NE PAS afficher le splash sur les pages d'auth
    if (location.pathname.includes('/auth') || location.pathname === '/splash') {
      setVisible(false);
      return;
    }

    // ✅ Ne pas afficher si l'app est déjà chargée
    const isAppLoaded = localStorage.getItem('app_loaded');
    if (isAppLoaded) {
      setVisible(false);
      return;
    }

    const ctx = getStartupContext(location.pathname);
    try {
      localStorage.setItem("last_context", ctx);
      localStorage.setItem("app_loaded", "true");
    } catch {}

    const timer = setTimeout(() => setVisible(false), 200); // ⚡ Optimisé pour FCP

    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!visible) return null;
  return <DynamicSplash />;
};

export default StartupExperience;
