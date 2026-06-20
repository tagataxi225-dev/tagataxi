import React, { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import ModernHeroSimplified from '@/components/landing/ModernHeroSimplified';
import InteractiveServicesGridLite from '@/components/landing/InteractiveServicesGridLite';
import SocialProofSection from '@/components/landing/SocialProofSection';
import ModernFooter from '@/components/landing/ModernFooter';
import { PromoPopupOverlay } from '@/components/popups/PromoPopupOverlay';

// Lazy load demo components — only used with ?query params
const DarkModeShowcase = lazy(() => import('@/components/demo/DarkModeShowcase').then(m => ({ default: m.DarkModeShowcase })));
const VoiceConversationInterface = lazy(() => import('@/components/ai/VoiceConversationInterface').then(m => ({ default: m.VoiceConversationInterface })));
const SmartAnalytics = lazy(() => import('@/components/ai/SmartAnalytics').then(m => ({ default: m.SmartAnalytics })));




const Index = () => {
  const showDarkModeDemo = window.location.search.includes('dark-mode-demo');
  const showAIDemo = window.location.search.includes('ai-demo');

  if (showDarkModeDemo) {
    return <Suspense fallback={null}><DarkModeShowcase /></Suspense>;
  }

  if (showAIDemo) {
    return (
      <Suspense fallback={null}>
        <div className="min-h-screen bg-background p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-primary mb-4">
                TAGA Taxi AI Assistant Demo
              </h1>
              <p className="text-lg text-muted-foreground">
                Assistant conversationnel avec GPT-4o Vision + ElevenLabs Turbo
              </p>
            </div>
            
            <div className="grid gap-8 lg:grid-cols-2">
              <VoiceConversationInterface context="transport" />
              <SmartAnalytics context="general" timeframe="daily" />
            </div>
          </div>
        </div>
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen w-full" style={{ paddingTop: 'var(--header-height-safe)' }}>
      <ModernHeroSimplified />
      <InteractiveServicesGridLite />
      <SocialProofSection />
      <ModernFooter />
      <PromoPopupOverlay />
    </div>
  );
};

export default Index;