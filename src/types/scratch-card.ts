export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface RarityConfig {
  probability: number;
  color: string;
  bgGradient: string;
  sparkles: number;
  confetti: number;
  label: string;
  glowColor: string;
}

export const RARITY_CONFIG: Record<Rarity, RarityConfig> = {
  common: {
    probability: 0.70,
    color: 'hsl(var(--muted-foreground))',
    bgGradient: 'from-muted-foreground/20 to-muted/20',
    sparkles: 5,
    confetti: 0,
    label: 'Commun',
    glowColor: 'hsl(var(--muted-foreground) / 0.3)'
  },
  rare: {
    probability: 0.20,
    color: 'hsl(217, 91%, 60%)', // Blue
    bgGradient: 'from-blue-500/20 to-blue-600/20',
    sparkles: 15,
    confetti: 15,
    label: 'Rare',
    glowColor: 'hsl(217, 91%, 60% / 0.5)'
  },
  epic: {
    probability: 0.08,
    color: 'hsl(271, 91%, 65%)', // Purple
    bgGradient: 'from-purple-500/20 to-purple-600/20',
    sparkles: 30,
    confetti: 50,
    label: 'Épique',
    glowColor: 'hsl(271, 91%, 65% / 0.5)'
  },
  legendary: {
    probability: 0.02,
    color: 'hsl(43, 96%, 56%)', // Gold
    bgGradient: 'from-yellow-500/30 to-orange-500/30',
    sparkles: 50,
    confetti: 200,
    label: 'Légendaire',
    glowColor: 'hsl(43, 96%, 56% / 0.6)'
  }
};

export interface ScratchCardPrize {
  id: string;
  name: string;
  value: number;
  currency: string;
  rarity: Rarity;
  image_url?: string;
  reward_type: 'cash' | 'points' | 'physical_gift' | 'voucher';
}

export interface ScratchCardWin extends ScratchCardPrize {
  win_id: string;
  scratch_percentage: number;
  scratch_revealed_at?: string;
  created_at: string;
}
