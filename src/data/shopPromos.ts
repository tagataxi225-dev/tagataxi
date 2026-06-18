export interface ShopWelcomeOffer {
  id: string;
  title: string;
  subtitle: string;
  hero_image: string;
  description: string;
  background_gradient: string;
  cta_text: string;
}

export const shopWelcomeMessage: ShopWelcomeOffer = {
  id: 'welcome_shop_v1',
  title: 'TAGA Shop',
  subtitle: 'Vendez et gagnez sur notre marketplace',
  hero_image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=800&fit=crop&q=85',
  description: 'Rejoignez des milliers de vendeurs sur TAGA Shop. Vendez vos produits en toute sécurité et développez votre business en quelques clics.',
  background_gradient: 'from-blue-500 via-indigo-500 to-purple-600',
  cta_text: 'Découvrir la marketplace'
};
