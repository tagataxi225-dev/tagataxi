// Types pour le système Tembea Gratta 🇨🇩

export type CardType = 'standard' | 'active' | 'rare' | 'mega';

export type RewardCategory = 
  | 'xp_points'       // Points XP
  | 'boost_2x'        // 2x points prochaine course
  | 'boost_3x'        // 3x points
  | 'badge'           // Badge rare
  | 'discount_5'      // Remise 5%
  | 'discount_10'     // Remise 10%
  | 'flash_discount'  // Livraison Flash -50%
  | 'free_delivery'   // Livraison gratuite
  | 'mega_ticket'     // Ticket Méga Carte
  | 'internal_credit' // Crédit interne (non retirable)
  | 'cash';           // Compatibilité legacy

export type ActivityLevel = 'new' | 'inactive' | 'casual' | 'active' | 'vip';

export interface CardTypeConfig {
  color: string;
  colorClass: string;
  emoji: string;
  label: string;
  labelFr: string;
  bgPattern: string;
  bgGradient: string;
  maxValue: number;
  glowColor: string;
  borderColor: string;
}

export const CARD_TYPE_CONFIG: Record<CardType, CardTypeConfig> = {
  standard: {
    color: 'hsl(217, 91%, 60%)',
    colorClass: 'blue',
    emoji: '🔵',
    label: 'Standard',
    labelFr: 'Carte Bleue',
    bgPattern: 'wax-blue',
    bgGradient: 'from-blue-500/20 via-cyan-500/10 to-blue-600/20',
    maxValue: 50,
    glowColor: 'rgba(59, 130, 246, 0.5)',
    borderColor: 'border-blue-500/30'
  },
  active: {
    color: 'hsl(142, 71%, 45%)',
    colorClass: 'green',
    emoji: '🟢',
    label: 'Active',
    labelFr: 'Carte Verte',
    bgPattern: 'wax-green',
    bgGradient: 'from-green-500/20 via-emerald-500/10 to-green-600/20',
    maxValue: 200,
    glowColor: 'rgba(34, 197, 94, 0.5)',
    borderColor: 'border-green-500/30'
  },
  rare: {
    color: 'hsl(271, 91%, 65%)',
    colorClass: 'purple',
    emoji: '🟣',
    label: 'Rare',
    labelFr: 'Carte Violette',
    bgPattern: 'wax-purple',
    bgGradient: 'from-purple-500/20 via-violet-500/10 to-purple-600/20',
    maxValue: 500,
    glowColor: 'rgba(168, 85, 247, 0.5)',
    borderColor: 'border-purple-500/30'
  },
  mega: {
    color: 'hsl(43, 96%, 56%)',
    colorClass: 'gold',
    emoji: '🟡',
    label: 'Méga',
    labelFr: 'Méga Carte Or',
    bgPattern: 'wax-gold',
    bgGradient: 'from-yellow-500/30 via-orange-500/20 to-amber-500/30',
    maxValue: 1000,
    glowColor: 'rgba(234, 179, 8, 0.6)',
    borderColor: 'border-yellow-500/40'
  }
};

export interface RewardConfig {
  icon: string;
  label: string;
  description: string;
  colorClass: string;
}

export const REWARD_CONFIG: Record<RewardCategory, RewardConfig> = {
  xp_points: {
    icon: '⭐',
    label: 'Points XP',
    description: 'Points ajoutés à votre compte',
    colorClass: 'text-yellow-500'
  },
  boost_2x: {
    icon: '🚀',
    label: 'Boost 2x',
    description: 'Double points sur la prochaine course',
    colorClass: 'text-blue-500'
  },
  boost_3x: {
    icon: '🔥',
    label: 'Boost 3x',
    description: 'Triple points sur la prochaine course',
    colorClass: 'text-orange-500'
  },
  badge: {
    icon: '🏅',
    label: 'Badge Rare',
    description: 'Badge exclusif pour votre profil',
    colorClass: 'text-purple-500'
  },
  discount_5: {
    icon: '💰',
    label: 'Remise 5%',
    description: 'Sur votre prochaine course',
    colorClass: 'text-green-500'
  },
  discount_10: {
    icon: '💎',
    label: 'Remise 10%',
    description: 'Sur votre prochaine course',
    colorClass: 'text-cyan-500'
  },
  flash_discount: {
    icon: '⚡',
    label: 'Flash -50%',
    description: 'Livraison Flash à moitié prix',
    colorClass: 'text-amber-500'
  },
  free_delivery: {
    icon: '📦',
    label: 'Livraison Gratuite',
    description: 'Une livraison offerte',
    colorClass: 'text-emerald-500'
  },
  mega_ticket: {
    icon: '🎫',
    label: 'Méga Ticket',
    description: 'Accès à la Méga Carte du week-end',
    colorClass: 'text-pink-500'
  },
  internal_credit: {
    icon: '💵',
    label: 'Crédit Tembea',
    description: 'Crédit utilisable dans l\'app',
    colorClass: 'text-green-600'
  },
  cash: {
    icon: '💰',
    label: 'Gains',
    description: 'Points convertibles',
    colorClass: 'text-primary'
  }
};

export interface UserActivityScore {
  userId: string;
  totalRides: number;
  totalDeliveries: number;
  totalPurchases: number;
  totalTopups: number;
  lastActivityAt: string | null;
  consecutiveDays: number;
  activityLevel: ActivityLevel;
  lastCardAt: string | null;
}

export interface TembeaGrattaWin {
  id: string;
  win_id: string;
  cardType: CardType;
  rewardCategory: RewardCategory;
  name: string;
  value: number;
  currency: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isDailyCard: boolean;
  boostDetails?: {
    multiplier?: number;
    discount?: number;
    expiresAt?: string;
  };
  scratchPercentage: number;
  scratchRevealedAt?: string;
  createdAt: string;
  expiresInHours?: number;
}

// Couleurs RDC officielles
export const RDC_COLORS = {
  blue: '#007FFF',    // Bleu RDC
  yellow: '#F7D000',  // Jaune RDC  
  red: '#CE1126',     // Rouge RDC
  green: '#007A5E',   // Vert complémentaire
};

// Fonction pour calculer le niveau d'activité
export const calculateActivityLevel = (score: Partial<UserActivityScore>): ActivityLevel => {
  const { totalRides = 0, totalDeliveries = 0, totalPurchases = 0, totalTopups = 0, consecutiveDays = 0 } = score;
  
  const activityScore = 
    totalRides * 10 + 
    totalDeliveries * 8 + 
    totalPurchases * 15 + 
    totalTopups * 5 + 
    consecutiveDays * 20;
    
  if (activityScore > 500) return 'vip';
  if (activityScore > 200) return 'active';
  if (activityScore > 50) return 'casual';
  if (activityScore > 0) return 'new';
  return 'inactive';
};

// Fonction pour déterminer le type de carte basé sur le niveau d'activité
export const determineCardType = (activityLevel: ActivityLevel): CardType => {
  const roll = Math.random();
  
  switch (activityLevel) {
    case 'vip':
      // VIP: 30% Or, 40% Violette, 30% Verte
      if (roll < 0.3) return 'mega';
      if (roll < 0.7) return 'rare';
      return 'active';
      
    case 'active':
      // Actif: 10% Or, 30% Violette, 40% Verte, 20% Bleue
      if (roll < 0.1) return 'mega';
      if (roll < 0.4) return 'rare';
      if (roll < 0.8) return 'active';
      return 'standard';
      
    case 'casual':
      // Casual: 5% Violette, 25% Verte, 70% Bleue
      if (roll < 0.05) return 'rare';
      if (roll < 0.3) return 'active';
      return 'standard';
      
    case 'new':
      // Nouveau: 10% Verte (encouragement), 90% Bleue
      if (roll < 0.1) return 'active';
      return 'standard';
      
    case 'inactive':
    default:
      // Inactif: Cartes "déclic" - 20% Verte, 80% Bleue
      if (roll < 0.2) return 'active';
      return 'standard';
  }
};

// Générer une récompense basée sur le type de carte
export const generateReward = (cardType: CardType): { category: RewardCategory; value: number; boostDetails?: any } => {
  const config = CARD_TYPE_CONFIG[cardType];
  const roll = Math.random();
  
  switch (cardType) {
    case 'mega':
      // Méga: Grosses récompenses
      if (roll < 0.2) return { category: 'boost_3x', value: 3, boostDetails: { multiplier: 3 } };
      if (roll < 0.4) return { category: 'discount_10', value: 10, boostDetails: { discount: 10 } };
      if (roll < 0.6) return { category: 'free_delivery', value: 1 };
      if (roll < 0.8) return { category: 'xp_points', value: 500 + Math.floor(Math.random() * 500) };
      return { category: 'badge', value: 1 };
      
    case 'rare':
      // Rare: Bonnes récompenses
      if (roll < 0.25) return { category: 'boost_2x', value: 2, boostDetails: { multiplier: 2 } };
      if (roll < 0.45) return { category: 'flash_discount', value: 50, boostDetails: { discount: 50 } };
      if (roll < 0.65) return { category: 'mega_ticket', value: 1 };
      if (roll < 0.85) return { category: 'xp_points', value: 200 + Math.floor(Math.random() * 300) };
      return { category: 'discount_5', value: 5, boostDetails: { discount: 5 } };
      
    case 'active':
      // Active: Récompenses moyennes
      if (roll < 0.3) return { category: 'boost_2x', value: 2, boostDetails: { multiplier: 2 } };
      if (roll < 0.5) return { category: 'discount_5', value: 5, boostDetails: { discount: 5 } };
      if (roll < 0.8) return { category: 'xp_points', value: 100 + Math.floor(Math.random() * 100) };
      return { category: 'internal_credit', value: 50 };
      
    case 'standard':
    default:
      // Standard: Petites récompenses mais motivantes
      if (roll < 0.6) return { category: 'xp_points', value: 10 + Math.floor(Math.random() * 40) };
      if (roll < 0.8) return { category: 'boost_2x', value: 2, boostDetails: { multiplier: 2 } };
      return { category: 'internal_credit', value: 20 };
  }
};
