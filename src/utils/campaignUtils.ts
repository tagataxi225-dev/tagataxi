export interface CampaignOffer {
  bonus_credits?: number;
  first_ride_discount?: number;
  lottery_tickets?: number;
  expiry?: string;
  signup_bonus?: number;
  first_week_guarantee?: number;
  free_training?: boolean;
  zero_commission_period?: number;
  global_discount?: number;
  marketplace_voucher?: number;
  free_delivery?: boolean;
  referral_bonus?: number;
  referee_bonus?: number;
  milestone_rewards?: Array<{ count: number; reward: number }>;
}

export interface CampaignColors {
  primary: string;
  accent: string;
}

export interface CampaignData {
  id: string;
  target: 'clients' | 'drivers' | 'partners' | 'all';
  city: string;
  headline: string;
  subheadline: string;
  hero_image?: string;
  hero_video?: string;
  offer: CampaignOffer;
  cta_primary: string;
  cta_secondary?: string;
  colors: CampaignColors;
  countdown?: boolean;
  scarcity?: {
    enabled: boolean;
    message: string;
  };
  testimonials?: 'clients' | 'drivers' | 'partners';
  share_buttons?: string[];
}

export const CAMPAIGN_TEMPLATES: Record<string, CampaignData> = {
  'kinshasa-launch': {
    id: 'kinshasa-launch',
    target: 'clients',
    city: 'Kinshasa',
    headline: '🔥 Kinshasa : -50% sur ta première course !',
    subheadline: 'Rejoins 12,000+ Kinois qui utilisent déjà Tembea',
    hero_image: '/campaigns/kwenda-hero.png',
    offer: {
      bonus_credits: 2000,
      first_ride_discount: 50,
      lottery_tickets: 5,
      expiry: '2025-12-31'
    },
    cta_primary: 'Profiter de -50%',
    cta_secondary: 'Voir comment ça marche',
    colors: {
      primary: '#DC2626',
      accent: '#F59E0B'
    }
  },
  'driver-recruitment': {
    id: 'driver-recruitment',
    target: 'drivers',
    city: 'all',
    headline: '💰 Deviens chauffeur Tembea et gagne jusqu\'à 200,000 CDF/mois',
    subheadline: 'Formation gratuite • Flexibilité totale • Revenus réguliers',
    hero_image: '/campaigns/kwenda-hero.png',
    offer: {
      signup_bonus: 5000,
      first_week_guarantee: 15000,
      free_training: true,
      zero_commission_period: 14
    },
    cta_primary: 'Devenir chauffeur',
    testimonials: 'drivers',
    colors: {
      primary: '#F59E0B',
      accent: '#DC2626'
    }
  },
  'lubumbashi-expansion': {
    id: 'lubumbashi-expansion',
    target: 'clients',
    city: 'Lubumbashi',
    headline: '🎉 Tembea arrive à Lubumbashi !',
    subheadline: 'Profite de l\'offre de lancement exclusive',
    hero_image: '/campaigns/kwenda-hero.png',
    offer: {
      bonus_credits: 3000,
      first_ride_discount: 50,
      lottery_tickets: 10,
      expiry: '2025-12-31'
    },
    cta_primary: 'Découvrir l\'offre',
    countdown: true,
    colors: {
      primary: '#DC2626',
      accent: '#F59E0B'
    }
  },
  'referral-boost': {
    id: 'referral-boost',
    target: 'clients',
    city: 'all',
    headline: '👥 Parraine 5 amis = 10,000 CDF GRATUITS',
    subheadline: 'Plus tu parraines, plus tu gagnes. Illimité !',
    hero_image: '/campaigns/kwenda-hero.png',
    offer: {
      referral_bonus: 2000,
      referee_bonus: 2000,
      milestone_rewards: [
        { count: 5, reward: 10000 },
        { count: 10, reward: 25000 },
        { count: 20, reward: 60000 }
      ]
    },
    cta_primary: 'Commencer à parrainer',
    share_buttons: ['whatsapp', 'facebook', 'sms', 'copy'],
    colors: {
      primary: '#10B981',
      accent: '#3B82F6'
    }
  }
};

export const getCampaignData = (campaignId: string): CampaignData | null => {
  return CAMPAIGN_TEMPLATES[campaignId] || null;
};

export const formatCurrency = (amount: number): string => {
  return `${amount.toLocaleString('fr-FR')} CDF`;
};

export const getExpiryDate = (expiry?: string): Date | null => {
  if (!expiry) return null;
  return new Date(expiry);
};

export const isExpired = (expiry?: string): boolean => {
  if (!expiry) return false;
  const expiryDate = getExpiryDate(expiry);
  return expiryDate ? expiryDate < new Date() : false;
};
