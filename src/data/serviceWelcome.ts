import { UtensilsCrossed, ShoppingBag, Car, Ticket, LucideIcon } from 'lucide-react';

export interface ServiceSlide {
  id: string;
  service: 'food' | 'marketplace' | 'transport' | 'lottery';
  title: string;
  subtitle: string;
  description: string;
  lucideIcon: LucideIcon;
  gradient: string;
  ctaText: string;
  ctaPath: string;
}

export const serviceWelcomeSlides: ServiceSlide[] = [
  {
    id: 'welcome_food',
    service: 'food',
    title: 'TAGA Food',
    subtitle: 'Vos restaurants préférés livrés chez vous',
    description: 'Découvrez les meilleurs plats de Kinshasa, Lubumbashi et Kolwezi.',
    lucideIcon: UtensilsCrossed,
    gradient: 'from-muted/30 to-background',
    ctaText: 'Commander maintenant',
    ctaPath: '/food'
  },
  {
    id: 'welcome_shop',
    service: 'marketplace',
    title: 'TAGA Shop',
    subtitle: 'Marketplace pour acheter et vendre',
    description: 'Rejoignez des milliers de vendeurs et acheteurs sur TAGA Shop.',
    lucideIcon: ShoppingBag,
    gradient: 'from-muted/30 to-background',
    ctaText: 'Explorer la marketplace',
    ctaPath: '/marketplace'
  },
  {
    id: 'welcome_transport',
    service: 'transport',
    title: 'Services de Transport',
    subtitle: 'Déplacements rapides dans votre ville',
    description: 'Taxi-bus, moto-taxi, VTC privé... Choisissez le transport adapté à vos besoins.',
    lucideIcon: Car,
    gradient: 'from-muted/30 to-background',
    ctaText: 'Réserver une course',
    ctaPath: '/transport'
  },
  {
    id: 'welcome_lottery',
    service: 'lottery',
    title: 'Tombola TAGA',
    subtitle: 'Gagnez des récompenses gratuitement',
    description: 'Recevez des tickets gratuits à chaque course, livraison ou parrainage.',
    lucideIcon: Ticket,
    gradient: 'from-muted/30 to-background',
    ctaText: 'Voir mes tickets',
    ctaPath: '/lottery'
  }
];
