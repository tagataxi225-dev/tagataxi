import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { CampaignData } from '@/utils/campaignUtils';

interface HeroSectionProps {
  campaign: CampaignData;
  onCtaClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ campaign, onCtaClick }) => {
  return (
    <section 
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${campaign.colors.primary}15, ${campaign.colors.accent}15)`
      }}
    >
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-64 h-64 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: campaign.colors.primary }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: campaign.colors.accent }}
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ duration: 8, repeat: Infinity, delay: 1 }}
        />
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <Badge 
              className="text-base px-4 py-2"
              style={{ 
                backgroundColor: `${campaign.colors.primary}20`,
                color: campaign.colors.primary,
                borderColor: campaign.colors.primary
              }}
            >
              {campaign.city !== 'all' ? `🔥 ${campaign.city.toUpperCase()}` : '🎯 OFFRE SPÉCIALE'}
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-4xl md:text-6xl font-bold mb-6"
            style={{
              background: `linear-gradient(135deg, ${campaign.colors.primary}, ${campaign.colors.accent})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {campaign.headline}
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-xl md:text-2xl text-muted-foreground mb-8"
          >
            {campaign.subheadline}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          >
            <Button
              size="lg"
              onClick={onCtaClick}
              className="h-14 px-8 text-lg font-bold hover:scale-105 transition-transform"
              style={{
                background: `linear-gradient(135deg, ${campaign.colors.primary}, ${campaign.colors.accent})`,
                border: 'none'
              }}
            >
              {campaign.cta_primary}
            </Button>
            {campaign.cta_secondary && (
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="h-14 px-8 text-lg font-bold"
              >
                {campaign.cta_secondary}
              </Button>
            )}
          </motion.div>

          {/* Hero Image */}
          {campaign.hero_image && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="mt-8 mb-8"
            >
              <img
                src={campaign.hero_image}
                alt={campaign.headline}
                className="w-full max-w-3xl mx-auto rounded-2xl shadow-2xl"
              />
            </motion.div>
          )}

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="flex items-center justify-center gap-2 text-muted-foreground"
          >
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="font-semibold">4.8/5</span>
            <span>•</span>
            <span>12,450+ utilisateurs</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
