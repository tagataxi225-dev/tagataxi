import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Gift, CheckCircle2 } from 'lucide-react';
import { CampaignData, formatCurrency, getExpiryDate } from '@/utils/campaignUtils';
import { CountdownTimer } from './CountdownTimer';

interface OfferSectionProps {
  campaign: CampaignData;
  onCtaClick: () => void;
}

export const OfferSection: React.FC<OfferSectionProps> = ({ campaign, onCtaClick }) => {
  const { offer } = campaign;
  const expiryDate = getExpiryDate(offer.expiry);

  const benefits = [];
  if (offer.bonus_credits) benefits.push(`${formatCurrency(offer.bonus_credits)} de crédit gratuit`);
  if (offer.first_ride_discount) benefits.push(`1ère course -${offer.first_ride_discount}%`);
  if (offer.lottery_tickets) benefits.push(`${offer.lottery_tickets} tickets tombola gratuits`);
  if (offer.signup_bonus) benefits.push(`${formatCurrency(offer.signup_bonus)} bonus d'inscription`);
  if (offer.first_week_guarantee) benefits.push(`${formatCurrency(offer.first_week_guarantee)} garantis la 1ère semaine`);
  if (offer.free_training) benefits.push('Formation gratuite incluse');
  if (offer.zero_commission_period) benefits.push(`${offer.zero_commission_period} jours sans commission`);
  if (offer.global_discount) benefits.push(`-${offer.global_discount}% sur TOUT`);
  if (offer.marketplace_voucher) benefits.push(`${formatCurrency(offer.marketplace_voucher)} de bon d'achat`);
  if (offer.free_delivery) benefits.push('Livraison gratuite');

  return (
    <section className="py-16 bg-gradient-to-br from-background via-primary/5 to-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div 
            className="relative rounded-3xl p-8 md:p-12 overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${campaign.colors.primary}10, ${campaign.colors.accent}10)`,
              border: `2px solid ${campaign.colors.primary}30`
            }}
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-accent/20 to-transparent rounded-full blur-3xl" />

            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-8">
                <Gift className="h-16 w-16 mx-auto mb-4" style={{ color: campaign.colors.primary }} />
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  🎁 OFFRE SPÉCIALE LANCEMENT
                </h2>
                <p className="text-lg text-muted-foreground">
                  Inscription aujourd'hui = {benefits.length} BONUS IMMÉDIATS
                </p>
              </div>

              {/* Benefits list */}
              <div className="grid gap-4 mb-8">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 bg-card/50 rounded-lg p-4"
                  >
                    <CheckCircle2 className="h-6 w-6 flex-shrink-0" style={{ color: campaign.colors.primary }} />
                    <span className="text-lg font-medium">{benefit}</span>
                  </motion.div>
                ))}
              </div>

              {/* Countdown */}
              {campaign.countdown && expiryDate && (
                <div className="mb-8">
                  <p className="text-center text-sm text-muted-foreground mb-4">⏰ L'offre expire dans :</p>
                  <CountdownTimer targetDate={expiryDate} />
                </div>
              )}

              {/* CTA */}
              <div className="text-center">
                <Button
                  size="lg"
                  onClick={onCtaClick}
                  className="h-14 px-8 text-lg font-bold hover:scale-105 transition-transform"
                  style={{
                    background: `linear-gradient(135deg, ${campaign.colors.primary}, ${campaign.colors.accent})`,
                    border: 'none'
                  }}
                >
                  Réclamer mes bonus maintenant
                </Button>
                <p className="text-sm text-muted-foreground mt-4">
                  Aucun frais caché • Transfert instantané • Support 24/7
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
