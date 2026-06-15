import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import type { CarouselApi } from "@/components/ui/carousel";
import { OnboardingSlide } from "@/components/onboarding/OnboardingSlide";
import { onboardingContent, type OnboardingContext } from "@/constants/onboardingContent";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import kwendaLogoK from "@/assets/kwenda-logo.png";

const useOnboardingContext = (): OnboardingContext => {
  const [params] = useSearchParams();
  const fromParam = (params.get("context") || "").toLowerCase();
  const allowed = ["client", "chauffeur", "partenaire", "marketplace", "admin"];
  if (allowed.includes(fromParam)) return fromParam as OnboardingContext;
  const fromLocal = (localStorage.getItem("last_context") || "client").toLowerCase();
  return allowed.includes(fromLocal) ? (fromLocal as OnboardingContext) : "client";
};

// Dots minimalistes
const ProgressDots: React.FC<{ total: number; index: number }> = ({ total, index }) => (
  <div className="flex justify-center gap-2">
    {Array.from({ length: total }).map((_, i) => (
      <motion.div
        key={i}
        animate={{ 
          width: i === index ? 24 : 8,
          opacity: i === index ? 1 : 0.4
        }}
        transition={{ duration: 0.3 }}
        className={`h-2 rounded-full ${i === index ? 'bg-primary' : 'bg-muted-foreground'}`}
      />
    ))}
  </div>
);

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const ctx = useOnboardingContext();
  const slides = useMemo(() => onboardingContent[ctx], [ctx]);
  const [index, setIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi | null>(null);
  const { triggerHaptic, triggerSuccess } = useHapticFeedback();

  useEffect(() => {
    document.title = `Onboarding — Tembea`;
  }, []);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      const newIndex = api.selectedScrollSnap();
      setIndex(newIndex);
      triggerHaptic('light');
    };
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, triggerHaptic]);

  const finish = () => {
    triggerSuccess();
    try { 
      // Sauvegarder avec contexte ET clé générique (fallback pour MobileAppEntry)
      localStorage.setItem(`onboarding_seen::${ctx}`, "1"); 
      localStorage.setItem("onboarding_seen", "1"); // Fallback générique
      localStorage.setItem(`onboarding_completed_at::${ctx}`, new Date().toISOString());
      localStorage.setItem('onboarding_just_completed', 'true');
    } catch (e) {
      console.error('Onboarding save error:', e);
    }
    
    const redirectMap: Record<OnboardingContext, string> = {
      client: "/app/auth",
      chauffeur: "/app/auth",
      marketplace: "/app/auth",
      admin: "/operatorx/admin/auth",
      partenaire: "/partner/auth",
    };
    
    navigate(redirectMap[ctx] || "/app/auth", { replace: true });
  };

  const onNext = () => {
    triggerHaptic('medium');
    if (api) api.scrollNext();
  };

  const isLastSlide = index === slides.length - 1;

  return (
    <div className="h-dvh flex flex-col bg-background pt-safe-top">
      {/* Header compact */}
      <header className="flex items-center justify-between px-4 py-3 shrink-0 pt-safe-top">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center p-0.5">
            <img src={kwendaLogoK} alt="Tembea" className="w-full h-full rounded-md object-cover" />
          </div>
          <span className="font-semibold text-foreground">Tembea</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={finish}
          className="text-muted-foreground hover:text-foreground"
        >
          Passer
        </Button>
      </header>

      {/* Slide Area - prend l'espace restant */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <Carousel 
          setApi={setApi} 
          opts={{ loop: false, align: "center" }}
          className="w-full max-w-md"
        >
          <CarouselContent>
            {slides.map((slide, i) => (
              <CarouselItem key={i}>
                <OnboardingSlide
                  icon={slide.icon}
                  title={slide.title}
                  tagline={slide.tagline}
                  benefits={slide.benefits}
                  index={i}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Footer fixe avec dots + bouton */}
      <footer className="px-6 py-6 pb-safe space-y-5 shrink-0">
        {/* Progress Dots */}
        <ProgressDots total={slides.length} index={index} />
        
        {/* Bouton pleine largeur */}
        <Button 
          onClick={isLastSlide ? finish : onNext}
          className="w-full h-12 text-base font-semibold"
          size="lg"
        >
          {isLastSlide ? 'Commencer' : 'Continuer'}
        </Button>
      </footer>
    </div>
  );
};

export default Onboarding;
