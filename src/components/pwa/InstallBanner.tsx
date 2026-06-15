import { useState, useEffect } from "react";
import { X, Smartphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { isMobileApp } from "@/services/platformDetection";
import { StoreButtons } from "@/components/store/StoreButtons";

const BANNER_DISMISSED_KEY = 'kwenda-install-banner-dismissed';
const BANNER_DISMISS_DAYS = 7;

export const InstallBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Ne pas afficher dans l'app Capacitor native
    if (isMobileApp()) return;

    // Ne plus afficher sur la landing page "/" (géré par AppDownloadTopBanner)
    if (window.location.pathname === '/' || window.location.pathname === '/landing') return;

    // Ne pas afficher sur les routes /app/* (utilisateur déjà dans l'app)
    if (window.location.pathname.startsWith('/app')) return;

    // Vérifier si le banner a été fermé récemment
    const dismissedUntil = localStorage.getItem(BANNER_DISMISSED_KEY);
    if (dismissedUntil) {
      const dismissDate = new Date(dismissedUntil);
      if (dismissDate > new Date()) {
        return;
      }
    }

    // Afficher après 3 secondes pour ne pas être intrusif
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    // Enregistrer la fermeture pour 7 jours
    const dismissUntil = new Date();
    dismissUntil.setDate(dismissUntil.getDate() + BANNER_DISMISS_DAYS);
    localStorage.setItem(BANNER_DISMISSED_KEY, dismissUntil.toISOString());
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[9999] isolate pointer-events-auto animate-slide-up transition-all duration-300 will-change-transform">
      <Card className="shadow-xl border border-border/50 bg-card/95 backdrop-blur-xl">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2.5 rounded-xl">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">
                Téléchargez Tembea
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Disponible sur Play Store & App Store
              </p>
              <StoreButtons size="sm" />
            </div>
            <button 
              onClick={handleDismiss}
              className="p-1 rounded-full hover:bg-muted/50 transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
