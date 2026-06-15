import React from 'react';
import { motion } from 'framer-motion';
import { Car, Wallet, Gift, Shield } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const BenefitsSection = () => {
  const { t } = useLanguage();
  
  const benefits = [
    {
      icon: Car,
      title: t('campaign.benefit_immediate_transport'),
      description: t('campaign.benefit_immediate_transport_desc')
    },
    {
      icon: Wallet,
      title: t('campaign.benefit_guaranteed_savings'),
      description: t('campaign.benefit_guaranteed_savings_desc')
    },
    {
      icon: Gift,
      title: t('campaign.benefit_free_lottery'),
      description: t('campaign.benefit_free_lottery_desc')
    },
    {
      icon: Shield,
      title: t('campaign.benefit_100_secure'),
      description: t('campaign.benefit_100_secure_desc')
    }
  ];

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-shadow"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <benefit.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
              <p className="text-muted-foreground">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
