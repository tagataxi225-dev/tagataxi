import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCampaignData } from '@/utils/campaignUtils';
import { useCampaignTracking } from '@/hooks/useCampaignTracking';
import { HeroSection } from '@/components/campaign/HeroSection';
import { TrustBar } from '@/components/campaign/TrustBar';
import { OfferSection } from '@/components/campaign/OfferSection';
import { BenefitsSection } from '@/components/campaign/BenefitsSection';
import { TestimonialsCarousel } from '@/components/campaign/TestimonialsCarousel';
import { HowItWorks } from '@/components/campaign/HowItWorks';
import { FAQAccordion } from '@/components/campaign/FAQAccordion';
import { LiveActivityFeed } from '@/components/campaign/LiveActivityFeed';
import { StickyBottomCTA } from '@/components/campaign/StickyBottomCTA';
import { getExpiryDate } from '@/utils/campaignUtils';

const CampaignLanding = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const campaign = campaignId ? getCampaignData(campaignId) : null;
  const { trackEvent } = useCampaignTracking(campaignId || '');

  useEffect(() => {
    if (!campaign) {
      // Campagne invalide : rediriger vers landing publique
      navigate('/landing', { replace: true });
      return;
    }

    // Apply campaign-specific colors
    document.documentElement.style.setProperty('--campaign-primary', campaign.colors.primary);
    document.documentElement.style.setProperty('--campaign-accent', campaign.colors.accent);

    return () => {
      document.documentElement.style.removeProperty('--campaign-primary');
      document.documentElement.style.removeProperty('--campaign-accent');
    };
  }, [campaign, navigate]);

  if (!campaign) {
    return null;
  }

  const handleCtaClick = () => {
    trackEvent('cta_click', { location: 'main_cta' });
    
    // Navigate based on campaign target
    switch (campaign.target) {
      case 'drivers':
        navigate('/driver/auth?mode=signup');
        break;
      case 'partners':
        navigate('/partner/auth?mode=signup');
        break;
      default:
        navigate('/auth?mode=signup');
    }
  };

  const expiryDate = getExpiryDate(campaign.offer.expiry);

  return (
    <div className="min-h-screen bg-background">
      <HeroSection campaign={campaign} onCtaClick={handleCtaClick} />
      
      <TrustBar />
      
      <OfferSection campaign={campaign} onCtaClick={handleCtaClick} />
      
      <BenefitsSection />
      
      <LiveActivityFeed />
      
      <TestimonialsCarousel />
      
      <HowItWorks />
      
      <FAQAccordion />

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-br from-background via-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Prêt à commencer ?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Rejoins des milliers d'utilisateurs satisfaits
          </p>
          <button
            onClick={handleCtaClick}
            className="h-14 px-8 text-lg font-bold rounded-lg hover:scale-105 transition-transform text-white"
            style={{
              background: `linear-gradient(135deg, ${campaign.colors.primary}, ${campaign.colors.accent})`
            }}
          >
            {campaign.cta_primary}
          </button>
        </div>
      </section>

      {/* Sticky Bottom CTA for mobile */}
      <StickyBottomCTA
        targetDate={expiryDate}
        onCtaClick={handleCtaClick}
        ctaText={campaign.cta_primary}
        campaignColors={campaign.colors}
      />

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            🇨🇩 TAGA Taxi • Made with ❤️ in RDC
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            🔒 Sécurisé • 📞 Support 24/7
          </p>
        </div>
      </footer>
    </div>
  );
};

export default CampaignLanding;
