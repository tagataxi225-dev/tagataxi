/**
 * 🔥 Système de Streaks de Grattage Quotidien
 * Récompenses croissantes pour les jours consécutifs
 */

export interface StreakReward {
  day: number;
  type: 'xp_bonus' | 'card_upgrade' | 'mega_ticket' | 'badge' | 'credits';
  value: number | string;
  label: string;
  labelFr: string;
  icon: string;
  color: string;
}

export const STREAK_REWARDS: StreakReward[] = [
  { 
    day: 3, 
    type: 'xp_bonus', 
    value: 50, 
    label: '+50 XP', 
    labelFr: '3 jours = +50 XP bonus',
    icon: '⚡',
    color: 'text-blue-500'
  },
  { 
    day: 5, 
    type: 'card_upgrade', 
    value: 'active', 
    label: 'Carte Verte', 
    labelFr: '5 jours = Carte Verte garantie',
    icon: '💚',
    color: 'text-green-500'
  },
  { 
    day: 7, 
    type: 'xp_bonus', 
    value: 100, 
    label: '+100 XP', 
    labelFr: '7 jours = +100 XP bonus',
    icon: '🔥',
    color: 'text-orange-500'
  },
  { 
    day: 10, 
    type: 'card_upgrade', 
    value: 'rare', 
    label: 'Carte Rare', 
    labelFr: '10 jours = Carte Rare garantie',
    icon: '💜',
    color: 'text-purple-500'
  },
  { 
    day: 14, 
    type: 'mega_ticket', 
    value: 1, 
    label: 'Ticket Méga', 
    labelFr: '14 jours = Ticket Méga Loterie',
    icon: '🎟️',
    color: 'text-yellow-500'
  },
  { 
    day: 21, 
    type: 'credits', 
    value: 1000, 
    label: '1000 CDF', 
    labelFr: '21 jours = 1000 CDF crédités',
    icon: '💰',
    color: 'text-green-600'
  },
  { 
    day: 30, 
    type: 'badge', 
    value: 'mois_de_feu', 
    label: 'Badge 🌋', 
    labelFr: '30 jours = Badge Mois de Feu',
    icon: '🌋',
    color: 'text-red-500'
  }
];

export const getNextReward = (currentStreak: number): StreakReward | null => {
  return STREAK_REWARDS.find(r => r.day > currentStreak) || null;
};

export const getEarnedRewards = (currentStreak: number): StreakReward[] => {
  return STREAK_REWARDS.filter(r => r.day <= currentStreak);
};

export const getRewardForDay = (day: number): StreakReward | undefined => {
  return STREAK_REWARDS.find(r => r.day === day);
};

export const STREAK_MILESTONES = STREAK_REWARDS.map(r => r.day);

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastScratchDate: string | null;
  streakStartDate: string | null;
  todayScratched: boolean;
}
