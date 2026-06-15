import React from 'react';
import { Shield, Award, CreditCard, HeadphonesIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const TrustBar = () => {
  const { t } = useLanguage();
  
  const trustItems = [
    { icon: Award, text: t('campaign.trust_leader_drc') },
    { icon: Shield, text: t('campaign.trust_secure') },
    { icon: CreditCard, text: t('campaign.trust_mobile_money') },
    { icon: HeadphonesIcon, text: t('campaign.trust_support_24_7') }
  ];

  return (
    <div className="bg-muted/30 border-y border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8">
          {trustItems.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <item.icon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
