// Nouvelle structure simplifiée pour invitation soft
export interface FoodWelcomeOffer {
  id: string;
  title: string;
  subtitle: string;
  hero_image: string;
  description: string;
  background_gradient: string;
  cta_text: string;
}

export const foodWelcomeMessage: FoodWelcomeOffer = {
  id: 'welcome_food_v1',
  title: 'TAGA Food',
  subtitle: 'Vos restaurants préférés, livrés chez vous',
  hero_image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=800&fit=crop&q=85',
  description: 'Découvrez les meilleurs plats de Kinshasa, Lubumbashi et Kolwezi. Commandez en quelques clics, profitez de chaque bouchée.',
  background_gradient: 'from-orange-400 via-amber-500 to-orange-600',
  cta_text: 'Découvrir le menu'
};
