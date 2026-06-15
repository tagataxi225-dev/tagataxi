// Types pour le système de cadeaux partenaires

export type PrizeType = 'physical_gift' | 'voucher' | 'experience' | 'subscription';
export type RarityTier = 'rare' | 'epic' | 'legendary';
export type ClaimStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface PartnerPrize {
  id: string;
  partner_name: string;
  partner_logo_url: string | null;
  name: string;
  description: string | null;
  prize_type: PrizeType;
  estimated_value: number | null;
  currency: string;
  stock_quantity: number;
  stock_unlimited: boolean;
  rarity_tier: RarityTier;
  distribution_probability: number;
  is_active: boolean;
  requires_delivery: boolean;
  delivery_instructions: string | null;
  claim_instructions: string | null;
  image_url: string | null;
  gallery_urls: string[];
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface PartnerPrizeClaim {
  id: string;
  lottery_win_id: string;
  partner_prize_id: string;
  user_id: string;
  status: ClaimStatus;
  delivery_address: string | null;
  delivery_phone: string | null;
  delivery_notes: string | null;
  tracking_number: string | null;
  claimed_at: string;
  processed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  processed_by: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  partner_prize?: PartnerPrize;
}

export const PRIZE_TYPE_CONFIG: Record<PrizeType, { icon: string; label: string; color: string }> = {
  physical_gift: { icon: '📱', label: 'Cadeau physique', color: 'text-purple-600' },
  voucher: { icon: '🎫', label: 'Bon d\'achat', color: 'text-green-600' },
  experience: { icon: '✈️', label: 'Expérience', color: 'text-blue-600' },
  subscription: { icon: '📺', label: 'Abonnement', color: 'text-rose-600' }
};

export const RARITY_CONFIG: Record<RarityTier, { icon: string; label: string; stars: number; color: string; bgColor: string }> = {
  rare: { icon: '⭐', label: 'Rare', stars: 1, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  epic: { icon: '⭐⭐', label: 'Épique', stars: 2, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  legendary: { icon: '⭐⭐⭐', label: 'Légendaire', stars: 3, color: 'text-amber-600', bgColor: 'bg-amber-50' }
};

export const CLAIM_STATUS_CONFIG: Record<ClaimStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'En attente', color: 'text-yellow-700', bgColor: 'bg-yellow-50' },
  processing: { label: 'En traitement', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  shipped: { label: 'Expédié', color: 'text-purple-700', bgColor: 'bg-purple-50' },
  delivered: { label: 'Livré', color: 'text-green-700', bgColor: 'bg-green-50' },
  cancelled: { label: 'Annulé', color: 'text-red-700', bgColor: 'bg-red-50' }
};
